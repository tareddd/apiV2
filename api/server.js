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
    return res.status(403).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>This site can't be reached</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;background:#f1f3f4;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#202124}
  .container{max-width:560px;width:100%;padding:40px 20px}
  .icon{width:72px;height:72px;margin-bottom:24px}
  h1{font-size:1.6rem;font-weight:400;margin-bottom:12px;color:#202124}
  .error-code{font-size:.85rem;color:#70757a;margin-bottom:20px}
  p{font-size:.9rem;color:#70757a;line-height:1.6;margin-bottom:8px}
  details{margin-top:20px;font-size:.82rem;color:#70757a}
  summary{cursor:pointer;color:#1a73e8;font-size:.85rem;margin-bottom:8px}
  .detail-box{background:#fff;border:1px solid #dadce0;border-radius:4px;padding:12px 16px;font-family:monospace;font-size:.8rem;color:#5f6368;word-break:break-all}
  .reload-btn{margin-top:24px;background:#1a73e8;color:#fff;border:none;border-radius:4px;padding:10px 24px;font-size:.9rem;cursor:pointer}
  .reload-btn:hover{background:#1557b0}
</style>
</head>
<body>
<div class="container">
  <svg class="icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="36" cy="36" r="36" fill="#f1f3f4"/>
    <path d="M36 20a16 16 0 1 0 0 32 16 16 0 0 0 0-32zm0 4a12 12 0 1 1 0 24 12 12 0 0 1 0-24z" fill="#dadce0"/>
    <path d="M36 20v16l8 8" stroke="#dadce0" stroke-width="3" stroke-linecap="round"/>
    <line x1="20" y1="20" x2="52" y2="52" stroke="#ea4335" stroke-width="3" stroke-linecap="round"/>
  </svg>
  <h1>This site can't be reached</h1>
  <div class="error-code">ERR_INTERNAL_USER_DATA &nbsp;•&nbsp; 403</div>
  <p>The server rejected your connection. Your access to this resource has been restricted.</p>
  <p>This may be due to a violation of our terms of service.</p>
  <details>
    <summary>Technical details</summary>
    <div class="detail-box">
      Status: 403 Forbidden<br/>
      Code: ERR_INTERNAL_USER_DATA<br/>
      Message: Access denied by server policy.<br/>
      Remote: Connection closed by remote host.
    </div>
  </details>
  <button class="reload-btn" onclick="location.reload()">Reload</button>
</div>
</body>
</html>`);
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

    // Lier l'IP au compte Discord
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
    db.linkIpToDiscord(ip, user.username, user.id);

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
  // Lier l'IP au Discord à chaque visite connectée
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
  db.linkIpToDiscord(ip, u.username, u.id);
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
