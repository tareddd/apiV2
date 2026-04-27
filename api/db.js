const fs = require('fs');
const DB_FILE = './data.json';

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); } catch { return {}; }
}
function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = Object.assign({ banned:{}, ratelimited:{}, userKeys:{}, keys:{}, unlocked:{}, admins:{}, owners:{}, adminCredentials:{}, purchases:{}, bannedIps:{}, bannedHwids:{}, hwidMap:{} }, load());

module.exports = {
  // ── IP BAN ────────────────────────────────────────────
  banIp(ip, reason = "DDoS / Abus", bannedBy = "system") {
    db.bannedIps[ip] = { bannedAt: Date.now(), reason, bannedBy };
    save(db);
  },
  unbanIp(ip) { delete db.bannedIps[ip]; save(db); },
  isIpBanned(ip) { return !!db.bannedIps[ip]; },
  getBannedIps() { return db.bannedIps; },

  // ── IP LOGGER ─────────────────────────────────────────
  logVisit(ip) {
    if (!db.visitLog) db.visitLog = {};
    if (!db.visitLog[ip]) db.visitLog[ip] = { firstSeen: Date.now(), lastSeen: Date.now(), visits: 0, discordUser: null };
    db.visitLog[ip].lastSeen = Date.now();
    db.visitLog[ip].visits++;
    save(db);
  },
  linkIpToDiscord(ip, username, userId) {
    if (!db.visitLog) db.visitLog = {};
    if (!db.visitLog[ip]) db.visitLog[ip] = { firstSeen: Date.now(), lastSeen: Date.now(), visits: 0 };
    db.visitLog[ip].discordUser = username;
    db.visitLog[ip].discordId = userId;
    save(db);
  },
  getVisitLog() { return db.visitLog || {}; },

  // ── BAN ──────────────────────────────────────────────
  banUser(userId, bannedBy="system")  { db.banned[userId]={bannedAt:Date.now(),bannedBy};save(db); },
  unbanUser(userId)                   { delete db.banned[userId];save(db); },
  isBanned(userId)                    { return !!db.banned[userId]; },
  getBanned()                         { return db.banned; },

  // ── RATELIMIT (48h) ──────────────────────────────────
  ratelimitUser(userId, limitedBy="system") {
    db.ratelimited[userId]={until:Date.now()+48*3600*1000,limitedAt:Date.now(),limitedBy};save(db);
  },
  unratelimitUser(userId) { delete db.ratelimited[userId];save(db); },
  isRatelimited(userId) {
    const e=db.ratelimited[userId];
    if(!e) return false;
    if(Date.now()>e.until){delete db.ratelimited[userId];return false;}
    return true;
  },
  getRatelimitInfo(userId) { return db.ratelimited[userId]||null; },
  getRatelimited()         { return db.ratelimited; },

  // ── KEYS PERMANENTES ─────────────────────────────────
  // Génère et assigne une key à un userId (une seule par user)
  assignKey(userId, key) {
    db.userKeys[userId] = key;
    db.keys[key] = { userId, createdAt: Date.now(), active: true };
    save(db);
  },
  // Récupère la key d'un user
  getUserKey(userId) { return db.userKeys[userId] || null; },
  // Vérifie si un user a déjà une key
  hasKey(userId) { return !!db.userKeys[userId]; },
  // Valide une key → retourne le userId ou null
  validateKey(key) {
    const k = db.keys[key];
    if (!k || !k.active) return null;
    // Vérifie que le user n'est pas banni/ratelimité
    if (this.isBanned(k.userId)) return null;
    if (this.isRatelimited(k.userId)) return null;
    return k.userId;
  },
  // Réinitialise la key d'un user (changekey/repairkey)
  resetKey(userId) {
    const oldKey = db.userKeys[userId];
    if (oldKey && db.keys[oldKey]) db.keys[oldKey].active = false;
    delete db.userKeys[userId];
    save(db);
  },
  getKeys()     { return db.keys; },
  getUserKeys() { return db.userKeys; },

  // ── DOWNLOADS ──────────────────────────────────────────
  addDownload(item) {
    const id = Date.now().toString();
    const entry = { id, ...item, createdAt: Date.now() };
    if (!db.downloads) db.downloads = {};
    db.downloads[id] = entry;
    save(db);
    return entry;
  },
  updateDownload(id, updates) {
    if (!db.downloads || !db.downloads[id]) return false;
    db.downloads[id] = { ...db.downloads[id], ...updates, updatedAt: Date.now() };
    save(db);
    return db.downloads[id];
  },
  removeDownload(id) {
    if (db.downloads) delete db.downloads[id];
    save(db);
  },
  getDownloads() {
    return Object.values(db.downloads || {}).sort((a,b) => b.createdAt - a.createdAt);
  },

  // ── COMMENTS ──────────────────────────────────────────
  addComment(downloadId, comment) {
    if (!db.downloads || !db.downloads[downloadId]) return false;
    if (!db.downloads[downloadId].comments) {
      db.downloads[downloadId].comments = [];
    }
    db.downloads[downloadId].comments.push(comment);
    save(db);
    return true;
  },
  getComments(downloadId) {
    if (!db.downloads || !db.downloads[downloadId]) return [];
    return db.downloads[downloadId].comments || [];
  },

  // ── PURCHASES ──────────────────────────────────────────
  addPurchase(purchase) {
    if (!db.purchases) db.purchases = {};
    if (!db.purchases[purchase.userId]) {
      db.purchases[purchase.userId] = [];
    }
    db.purchases[purchase.userId].push(purchase);
    save(db);
    return true;
  },
  getUserPurchases(userId) {
    if (!db.purchases || !db.purchases[userId]) return [];
    return db.purchases[userId].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
  },

  // ── UNLOCK (déblocage après paiement) ─────────────────────
  // Vérifie si un utilisateur existe (a une clé ou est dans la base)
  userExists(userId) {
    // Vérifie dans toutes les sections où un utilisateur pourrait exister
    return !!db.userKeys[userId] || // a une clé assignée
           !!db.banned[userId] || // est banni
           !!db.ratelimited[userId] || // est ratelimité
           !!db.unlocked[userId] || // est déjà débloqué
           // Vérifie aussi dans les clés inversées
           Object.values(db.keys || {}).some(key => key.userId === userId);
  },
  // Crée un utilisateur s'il n'existe pas encore
  ensureUserExists(userId) {
    if (!this.userExists(userId)) {
      // Crée une entrée utilisateur minimale
      db.userKeys[userId] = null; // Pas encore de clé mais existe dans la base
      save(db);
      return true;
    }
    return false;
  },
  // Débloque un utilisateur pour les téléchargements payants
  unlockUser(userId) {
    db.unlocked[userId] = { unlockedAt: Date.now(), active: true };
    save(db);
  },
  // Vérifie si un utilisateur est débloqué
  isUserUnlocked(userId) {
    const unlock = db.unlocked[userId];
    return unlock && unlock.active;
  },
  // Obtient la liste des utilisateurs débloqués
  getUnlockedUsers() {
    return db.unlocked;
  },
  // Révoque le déblocage d'un utilisateur
  revokeUnlock(userId) {
    if (db.unlocked[userId]) {
      db.unlocked[userId].active = false;
      save(db);
    }
  },

  // ── OWNER PERMISSIONS ─────────────────────────────────────
  addOwner(userId, grantedBy = "system") {
    db.owners[userId] = { grantedAt: Date.now(), grantedBy, active: true };
    // Un owner est aussi admin
    db.admins[userId] = { grantedAt: Date.now(), grantedBy, active: true };
    save(db);
  },
  removeOwner(userId) {
    delete db.owners[userId];
    delete db.admins[userId];
    save(db);
  },
  isOwner(userId) {
    const o = db.owners[userId];
    return o && o.active;
  },
  getOwners() { return db.owners; },

  // ── HWID BAN ──────────────────────────────────────────────
  registerHwid(userId, hwid) {
    db.hwidMap[userId] = hwid;
    save(db);
  },
  banHwid(userId, reason = "Abus / Triche", bannedBy = "system") {
    const hwid = db.hwidMap[userId] || null;
    db.bannedHwids[userId] = { hwid, reason, bannedBy, bannedAt: Date.now() };
    save(db);
  },
  unbanHwid(userId) {
    delete db.bannedHwids[userId];
    save(db);
  },
  isHwidBanned(userId) { return !!db.bannedHwids[userId]; },
  getBannedHwids() { return db.bannedHwids; },

  // ── ADMIN PERMISSIONS ───────────────────────────────────
  // Ajoute un utilisateur comme admin
  addAdmin(userId, grantedBy = "system") {
    db.admins[userId] = { grantedAt: Date.now(), grantedBy, active: true };
    save(db);
  },
  // Retire les permissions admin d'un utilisateur
  removeAdmin(userId) {
    delete db.admins[userId];
    save(db);
  },
  // Vérifie si un utilisateur est admin
  isAdmin(userId) {
    const admin = db.admins[userId];
    return admin && admin.active;
  },
  // Obtient la liste des admins
  getAdmins() {
    return db.admins;
  },

  // ── ADMIN CREDENTIALS ─────────────────────────────────────
  // Définit les identifiants de connexion pour un admin
  setAdminCredentials(userId, username, password) {
    db.adminCredentials[userId] = { 
      username, 
      password, 
      createdAt: Date.now(),
      active: true 
    };
    save(db);
  },
  // Supprime les identifiants d'un admin
  removeAdminCredentials(userId) {
    delete db.adminCredentials[userId];
    save(db);
  },
  // Vérifie les identifiants d'un admin
  validateAdminCredentials(username, password) {
    for (const [userId, creds] of Object.entries(db.adminCredentials)) {
      if (creds.username === username && creds.password === password && creds.active) {
        return userId;
      }
    }
    return null;
  },
  // Obtient les identifiants d'un admin
  getAdminCredentials(userId) {
    return db.adminCredentials[userId];
  },
  // Obtient tous les identifiants admins
  getAllAdminCredentials() {
    return db.adminCredentials;
  }
};
