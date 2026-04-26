const express = require("express");
const router  = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const { apiAuth } = require("./middleware");

// ── BAN ──────────────────────────────────────────────────
router.post("/ban/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  if (db.isBanned(id)) return res.status(409).json({ error: "Déjà banni" });
  db.banUser(id, req.body.by || "api");
  res.json({ success: true });
});
router.post("/unban/:id", apiAuth, (req, res) => {
  if (!db.isBanned(req.params.id)) return res.status(404).json({ error: "Pas banni" });
  db.unbanUser(req.params.id);
  res.json({ success: true });
});
router.get("/bans", apiAuth, (req, res) => res.json(db.getBanned()));

// ── RATELIMIT ────────────────────────────────────────────
router.post("/ratelimit/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  if (db.isRatelimited(id)) return res.status(409).json({ error: "Déjà ratelimité" });
  db.ratelimitUser(id, req.body.by || "api");
  const info = db.getRatelimitInfo(id);
  res.json({ success: true, until: new Date(info.until).toISOString() });
});
router.post("/unratelimit/:id", apiAuth, (req, res) => {
  if (!db.isRatelimited(req.params.id)) return res.status(404).json({ error: "Pas ratelimité" });
  db.unratelimitUser(req.params.id);
  res.json({ success: true });
});

// ── CHECK ACCÈS ──────────────────────────────────────────
router.get("/check/:id", (req, res) => {
  const { id } = req.params;
  if (db.isBanned(id)) return res.json({ access: false, reason: "banned" });
  if (db.isRatelimited(id)) {
    const info = db.getRatelimitInfo(id);
    return res.json({ access: false, reason: "ratelimited", until: new Date(info.until).toISOString() });
  }
  res.json({ access: true });
});

// ── KEYS PERMANENTES ─────────────────────────────────────

// Génère la key d'un user (appelé depuis le site après connexion Discord)
// Si le user a déjà une key, retourne la même
router.post("/keys/generate", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Non connecté" });
  }
  const userId = req.session.user.id;

  // Déjà une key → retourne la même
  if (db.hasKey(userId)) {
    return res.json({ success: true, key: db.getUserKey(userId), existing: true });
  }

  // Génère une nouvelle key
  const raw = uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase();
  const key = raw.match(/.{4}/g).join("-");
  db.assignKey(userId, key);
  res.json({ success: true, key, existing: false });
});

// Valide une key (appelé par le launcher)
router.post("/keys/validate", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ valid: false });
  const userId = db.validateKey(key);
  if (!userId) return res.json({ valid: false });
  res.json({ valid: true, userId });
});

// Reset key (admin via bot)
router.post("/keys/reset/:id", apiAuth, (req, res) => {
  db.resetKey(req.params.id);
  res.json({ success: true });
});

router.get("/keys", apiAuth, (req, res) => res.json(db.getKeys()));

// ── UNLOCK (déblocage après paiement) ───────────────────────
router.post("/unlock/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  const { by } = req.body;
  
  try {
    // Créer l'utilisateur s'il n'existe pas encore
    const wasCreated = db.ensureUserExists(id);
    
    // Marquer l'utilisateur comme débloqué pour les téléchargements payants
    db.unlockUser(id);
    
    const message = wasCreated ? 
      `Utilisateur ${id} créé et débloqué par ${by}` : 
      `Accès débloqué pour l'utilisateur ${id}`;
    
    console.log(`✅ Utilisateur ${id} débloqué par ${by}`);
    
    res.json({ 
      success: true, 
      message: message 
    });
    
  } catch (error) {
    console.error('❌ Erreur unlock:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du déblocage' 
    });
  }
});

// ── DOWNLOADS ─────────────────────────────────────────────
router.get("/downloads", (req, res) => res.json(db.getDownloads()));

router.post("/downloads", (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: "Non connecté" });
  const owners = (process.env.OWNERS || "").split(",").map(s => s.trim());
  if (!owners.includes(req.session.user.id)) return res.status(403).json({ error: "Pas owner" });
  const { name, desc, image, game, url, price } = req.body;
  if (!name || !url) return res.status(400).json({ error: "name et url requis" });
  const item = db.addDownload({ name, desc: desc||"", image: image||"", game: game||"", url, price: price||"Free" });
  res.json({ success: true, item });
});

router.put("/downloads/:id", (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: "Non connecté" });
  const owners = (process.env.OWNERS || "").split(",").map(s => s.trim());
  if (!owners.includes(req.session.user.id)) return res.status(403).json({ error: "Pas owner" });
  const { game } = req.body;
  const updated = db.updateDownload(req.params.id, { game });
  if (!updated) return res.status(404).json({ error: "Téléchargement non trouvé" });
  res.json({ success: true });
});

router.delete("/downloads/:id", (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: "Non connecté" });
  const owners = (process.env.OWNERS || "").split(",").map(s => s.trim());
  if (!owners.includes(req.session.user.id)) return res.status(403).json({ error: "Pas owner" });
  db.removeDownload(req.params.id);
  res.json({ success: true });
});

// ── PERMISSIONS ───────────────────────────────────────────
router.post("/permissions/admin/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  // Pour l'instant, on simule juste une réponse
  res.json({ success: true, message: `Admin ${action} pour ${id}` });
});

router.post("/permissions/mod/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  res.json({ success: true, message: `Mod ${action} pour ${id}` });
});

router.post("/permissions/vip/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  const { action, duration } = req.body;
  res.json({ success: true, message: `VIP ${action} pour ${id} (${duration || 30} jours)` });
});

// ── SEARCH ──────────────────────────────────────────────────
router.get("/search/user", apiAuth, (req, res) => {
  const { q } = req.query;
  // Simulation de recherche
  res.json({ success: true, results: [] });
});

router.get("/search/bykey", apiAuth, (req, res) => {
  const { key } = req.query;
  const userId = db.validateKey(key);
  res.json({ success: true, user: userId ? { id: userId } : null });
});

// ── STATUS ──────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ success: true, health: { status: "ok", uptime: Date.now() } });
});

router.get("/status", (req, res) => {
  res.json({ success: true, status: { api: "running", version: "1.0.0" } });
});

router.get("/ban/status/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, banned: db.isBanned(id) });
});

router.get("/ratelimit/status/:id", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, ratelimited: db.isRatelimited(id) });
});

router.get("/user/:id/activity", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, activity: { lastSeen: new Date().toISOString() } });
});

router.get("/user/:id/subscription", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, subscription: { status: "none" } });
});

router.get("/user/:id/usage", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, stats: { downloads: 0 } });
});

router.get("/user/:id/keyhistory", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, history: [] });
});

router.get("/user/:id/loginhistory", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, history: [] });
});

router.get("/user/:id/payments", apiAuth, (req, res) => {
  const { id } = req.params;
  res.json({ success: true, payments: [] });
});

// ── MASS OPERATIONS ──────────────────────────────────────────
router.post("/mass/ban", apiAuth, (req, res) => {
  const { ids } = req.body;
  let count = 0;
  ids.forEach(id => {
    if (!db.isBanned(id)) {
      db.banUser(id, req.body.by || "api");
      count++;
    }
  });
  res.json({ success: true, count });
});

router.post("/mass/unban", apiAuth, (req, res) => {
  const { ids } = req.body;
  let count = 0;
  ids.forEach(id => {
    if (db.isBanned(id)) {
      db.unbanUser(id);
      count++;
    }
  });
  res.json({ success: true, count });
});

router.post("/mass/keyreset", apiAuth, (req, res) => {
  const { ids } = req.body;
  let count = 0;
  ids.forEach(id => {
    if (db.hasKey(id)) {
      db.resetKey(id);
      count++;
    }
  });
  res.json({ success: true, count });
});

router.delete("/keys/expired", apiAuth, (req, res) => {
  res.json({ success: true, count: 0 });
});

router.delete("/keys/suspended", apiAuth, (req, res) => {
  res.json({ success: true, count: 0 });
});

router.post("/keys/backup", apiAuth, (req, res) => {
  const backupId = Date.now().toString();
  res.json({ success: true, backup_id: backupId });
});

router.post("/keys/restore", apiAuth, (req, res) => {
  res.json({ success: true, count: 0 });
});

router.get("/keys/export", apiAuth, (req, res) => {
  res.json({ success: true, download_url: "#" });
});

router.post("/keys/import", apiAuth, (req, res) => {
  res.json({ success: true, count: 0 });
});

// ── STATS ────────────────────────────────────────────────────
router.get("/stats/server", apiAuth, (req, res) => {
  res.json({ success: true, stats: { uptime: Date.now(), memory: "ok" } });
});

router.get("/stats/keys", apiAuth, (req, res) => {
  const keys = db.getKeys();
  const active = Object.values(keys).filter(k => k.active).length;
  res.json({ success: true, stats: { total: Object.keys(keys).length, active } });
});

router.get("/stats/bans", apiAuth, (req, res) => {
  const bans = db.getBanned();
  res.json({ success: true, stats: { total: Object.keys(bans).length } });
});

router.get("/stats/activity", apiAuth, (req, res) => {
  res.json({ success: true, stats: { active: 0 } });
});

router.get("/stats/daily", apiAuth, (req, res) => {
  res.json({ success: true, stats: { date: new Date().toISOString(), users: 0 } });
});

router.get("/stats/weekly", apiAuth, (req, res) => {
  res.json({ success: true, stats: { week: 1, users: 0 } });
});

router.get("/stats/monthly", apiAuth, (req, res) => {
  res.json({ success: true, stats: { month: 1, users: 0 } });
});

router.get("/stats/topusers", apiAuth, (req, res) => {
  const { limit = 10 } = req.query;
  res.json({ success: true, users: [] });
});

router.get("/stats/newusers", apiAuth, (req, res) => {
  const { days = 7 } = req.query;
  res.json({ success: true, users: [] });
});

router.get("/stats/expiringkeys", apiAuth, (req, res) => {
  const { days = 7 } = req.query;
  res.json({ success: true, keys: [] });
});

module.exports = router;
