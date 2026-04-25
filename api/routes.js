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
    // Vérifier que l'utilisateur existe dans la base de données
    const userExists = db.userExists(id);
    if (!userExists) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Marquer l'utilisateur comme débloqué pour les téléchargements payants
    db.unlockUser(id);
    
    console.log(`✅ Utilisateur ${id} débloqué par ${by}`);
    
    res.json({ 
      success: true, 
      message: `Accès débloqué pour l'utilisateur ${id}` 
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

module.exports = router;
