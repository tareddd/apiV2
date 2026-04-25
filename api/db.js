const fs = require('fs');
const DB_FILE = './data.json';

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); } catch { return {}; }
}
function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = Object.assign({ banned:{}, ratelimited:{}, userKeys:{}, keys:{}, unlocked:{} }, load());

module.exports = {
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

  // ── UNLOCK (déblocage après paiement) ─────────────────────
  // Vérifie si un utilisateur existe (a une clé ou est dans la base)
  userExists(userId) {
    return !!db.userKeys[userId] || !!db.banned[userId] || !!db.ratelimited[userId];
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
  }
};
