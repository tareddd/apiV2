require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const fetch = require("node-fetch");
const crypto = require("crypto");
const routes = require("./routes");
const db = require("./db");

const app = express();
const PORT = process.env.API_PORT || 3000;

// Tokens launcher en attente : { token -> { userId, status: 'pending'|'ok'|'banned'|'ratelimited' } }
const launcherTokens = {};

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "fn_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 3600 * 1000 }
}));

// ── IP Ban middleware ─────────────────────────────────────
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
  // Logger la visite
  if (!req.path.startsWith("/api") && !req.path.includes(".")) {
    db.logVisit(ip);
  }
  if (db.isIpBanned(ip)) {
    return res.status(403).sendFile(path.join(__dirname, "../site/index.html"));
  }
  next();
});

// ── Discord OAuth2 ────────────────────────────────────────

app.get("/auth/discord", (req, res) => {
  // Si vient du launcher, on garde le launcher_token en session
  if (req.query.launcher_token) {
    req.session.launcher_token = req.query.launcher_token;
  }
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify"
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/?error=no_code");

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect("/?error=token_failed");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userRes.json();

    req.session.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar
    };

    // Si vient du launcher → résoudre le token
    const lt = req.session.launcher_token;
    if (lt && launcherTokens[lt]) {
      const banned   = db.isBanned(user.id);
      const limited  = db.isRatelimited(user.id);
      if (banned) {
        launcherTokens[lt] = { userId: user.id, status: "banned" };
        delete req.session.launcher_token;
        return res.redirect("/launcher-result.html?status=banned");
      }
      if (limited) {
        const info = db.getRatelimitInfo(user.id);
        launcherTokens[lt] = { userId: user.id, status: "ratelimited", until: info.until };
        delete req.session.launcher_token;
        return res.redirect("/launcher-result.html?status=ratelimited");
      }
      launcherTokens[lt] = { userId: user.id, status: "ok" };
      delete req.session.launcher_token;
      return res.redirect("/launcher-result.html?status=ok");
    }

    res.redirect("/");
  } catch (e) {
    console.error(e);
    res.redirect("/?error=auth_failed");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/auth/me", (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  const u = req.session.user;
  const banned  = db.isBanned(u.id);
  const limited = db.isRatelimited(u.id);
  const info    = db.getRatelimitInfo(u.id);
  const owners  = (process.env.OWNERS || "").split(",").map(s => s.trim());
  const role    = owners.includes(u.id) ? "owner" : "member";
  const isAdmin = db.isAdmin(u.id);
  res.json({
    loggedIn: true, user: u, role,
    isAdmin: isAdmin || role === "owner",
    access: !banned && !limited,
    banned, ratelimited: limited,
    until: info ? new Date(info.until).toISOString() : null
  });
});

// ── Launcher auth ─────────────────────────────────────────

// Le launcher appelle ça pour créer un token de vérification
app.post("/launcher/init", (req, res) => {
  const token = crypto.randomBytes(16).toString("hex");
  launcherTokens[token] = { status: "pending" };
  // Expire après 5 minutes
  setTimeout(() => { delete launcherTokens[token]; }, 5 * 60 * 1000);
  res.json({ token, url: `http://localhost:${PORT}/auth/discord?launcher_token=${token}` });
});

// Le launcher poll ça pour savoir si la vérif est terminée
app.get("/launcher/check/:token", (req, res) => {
  const entry = launcherTokens[req.params.token];
  if (!entry) return res.json({ status: "expired" });
  res.json(entry);
});

// ── API routes ────────────────────────────────────────────
app.use("/api", routes);

// ── Site statique ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../site")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../site/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Serveur : http://localhost:${PORT}`);
});
