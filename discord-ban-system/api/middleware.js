require("dotenv").config();

// Vérifie la clé API dans le header Authorization
function apiAuth(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || auth !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  next();
}

module.exports = { apiAuth };
