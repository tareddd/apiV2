const fs = require('fs');
const DB_FILE = './data.json';

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); } catch { return {}; }
}
function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = Object.assign({ banned:{}, ratelimited:{}, userKeys:{}, keys:{} }, load());

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
  getUserKeys() { return db.userKeys; }
};
