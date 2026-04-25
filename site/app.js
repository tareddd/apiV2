// ── Stars canvas ─────────────────────────────────────────
(function initStars() {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      da: (Math.random() * 0.003 + 0.001) * (Math.random() < .5 ? 1 : -1),
      vx: (Math.random() - .5) * 0.08,
      vy: (Math.random() - .5) * 0.08,
      color: Math.random() < .3 ? "#6c63ff" : Math.random() < .5 ? "#00d4ff" : "#ffffff"
    };
  }

  function init() {
    resize();
    stars = Array.from({ length: 160 }, mkStar);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.da;
      if (s.a <= 0 || s.a >= 1) s.da *= -1;
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.a;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => { resize(); });
  init(); draw();
})();

// ── i18n ─────────────────────────────────────────────────
const T = {
  fr: { lbl:"Clé d'accès", btn:"⚡ Générer une clé", note:"La clé est à usage unique. Garde-la précieusement.", ph:"Clique sur générer", s1:"Génère ta clé", s2:"Télécharge le launcher", s3:"Entre la clé" },
  en: { lbl:"Access Key",  btn:"⚡ Generate a key",  note:"Single-use key. Keep it safe.",                     ph:"Click generate",    s1:"Generate your key", s2:"Download launcher", s3:"Enter the key" }
};
let lang = "fr", currentKey = null;

function setLang(l, btn) {
  lang = l;
  document.querySelectorAll(".cat").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const t = T[l];
  document.getElementById("gen-lbl").textContent  = t.lbl;
  document.getElementById("gen-txt").textContent  = t.btn;
  document.getElementById("gen-note").textContent = t.note;
  document.getElementById("gen-ph").textContent   = t.ph;
  document.getElementById("s1").textContent = t.s1;
  document.getElementById("s2").textContent = t.s2;
  document.getElementById("s3").textContent = t.s3;
}

// ── Navigation ────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll(".page").forEach(p => { p.classList.add("hidden"); p.classList.remove("active"); });
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  const p = document.getElementById("page-" + name);
  if (p) { p.classList.remove("hidden"); p.classList.add("active"); }
  const l = document.querySelector(`[onclick="showPage('${name}')"]`);
  if (l) l.classList.add("active");
}

// ── Génération clé ────────────────────────────────────────
async function generateKey() {
  const btn = document.getElementById("gen-btn");
  const txt = document.getElementById("gen-txt");
  const spin = document.getElementById("gen-spin");
  btn.disabled = true; txt.classList.add("hidden"); spin.classList.remove("hidden");

  try {
    const res = await fetch("/api/keys/generate", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      if (d.key) {
        currentKey = d.key;
        document.getElementById("key-ph").classList.add("hidden");
        document.getElementById("key-val").classList.remove("hidden");
        document.getElementById("key-val").textContent = d.key;
        document.getElementById("copy-btn").classList.remove("hidden");
        // Si key existante, désactive le bouton générer
        if (d.existing) {
          btn.textContent = "✅ Clé déjà générée";
          btn.disabled = true;
          document.getElementById("gen-note").textContent = "Ta clé est permanente. Utilise /changekey sur Discord pour la réinitialiser.";
          return;
        }
        document.getElementById("gen-note").textContent = "Clé permanente générée ! Garde-la précieusement.";
      }
    } else {
      document.getElementById("key-ph").textContent = "Connecte ton Discord d'abord.";
    }
  } catch (_) {
    document.getElementById("key-ph").textContent = "Erreur — API inaccessible.";
  }

  btn.disabled = false; txt.classList.remove("hidden"); spin.classList.add("hidden");
}

function localKey() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({length:4}, () =>
    Array.from({length:4}, () => c[Math.floor(Math.random()*c.length)]).join("")
  ).join("-");
}

async function copyKey() {
  if (!currentKey) return;
  await navigator.clipboard.writeText(currentKey).catch(() => {});
  const btn = document.getElementById("copy-btn");
  btn.style.color = "#00e676";
  setTimeout(() => btn.style.color = "", 1500);
}

// ── Auth Discord ──────────────────────────────────────────
async function initAuth() {
  const main    = document.getElementById("main-content");
  const login   = document.getElementById("login-screen");
  const blocked = document.getElementById("blocked-screen");

  let data;
  try {
    const res = await fetch("/auth/me");
    data = await res.json();
  } catch (_) {
    // API injoignable (ouverture fichier direct) → affiche le site
    main.classList.remove("hidden");
    login.classList.add("hidden");
    blocked.classList.add("hidden");
    showPage("home");
    return;
  }

  if (!data.loggedIn) {
    // Pas connecté → écran login Discord
    login.classList.remove("hidden");
    main.classList.add("hidden");
    blocked.classList.add("hidden");
    return;
  }

  if (!data.access) {
    // Banni ou ratelimité
    blocked.classList.remove("hidden");
    main.classList.add("hidden");
    login.classList.add("hidden");
    document.getElementById("blocked-title").textContent =
      data.banned ? "Tu es banni" : "Accès temporairement bloqué";
    document.getElementById("blocked-msg").textContent =
      data.banned
        ? "Ton compte Discord a été banni de ce site."
        : `Tu es ratelimité jusqu'au ${new Date(data.until).toLocaleString("fr-FR")}.`;
    return;
  }

  // Accès OK → affiche le site
  main.classList.remove("hidden");
  login.classList.add("hidden");
  blocked.classList.add("hidden");

  // Affiche l'avatar + nom dans la nav
  const u = data.user;
  const avatarUrl = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
  document.getElementById("nav-user").innerHTML = `
    <img class="user-avatar" src="${avatarUrl}" alt="avatar"/>
    <span class="user-name">${u.username}</span>
    <a href="/auth/logout" class="btn-logout">Déconnexion</a>
  `;

  showPage("home");
}

initAuth();
