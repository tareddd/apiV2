// ── CONFIGURE TES TÉLÉCHARGEMENTS ICI ────────────────────
// Ajoute, modifie ou supprime des entrées dans ce tableau
const DOWNLOADS = [
  {
    icon: "🖥️",
    name: "FN Private Launcher",
    version: "v1.0.0",
    desc: "Lance Fortnite Private en un clic. Validation de clé intégrée.",
    features: [
      "Lance FortniteLauncher + Shipping",
      "Validation de clé en temps réel",
      "Interface animée",
      "Windows x64"
    ],
    url: "https://cdn.discordapp.com/attachments/1497028441713807410/1497479685976887306/FNPrivateLauncher.exe?ex=69edac22&is=69ec5aa2&hm=6fe2e53094926ff712995e864e9c20e10a49c2f511f80249f5f01fe033f41466&",
    filename: "FNPrivateLauncher.exe",
    note: "Nécessite une clé générée depuis l'onglet Clé"
  }
  // Ajoute d'autres téléchargements ici :
  // {
  //   icon: "🎮",
  //   name: "Nom du fichier",
  //   version: "v1.0",
  //   desc: "Description",
  //   features: ["Feature 1", "Feature 2"],
  //   url: "https://lien-de-telechargement.com/fichier.exe",
  //   filename: "fichier.exe",
  //   note: "Note optionnelle"
  // }
];

// ── Génère les cartes de téléchargement ──────────────────
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("dl-grid");
  if (!grid) return;

  DOWNLOADS.forEach(d => {
    const card = document.createElement("div");
    card.className = "dl-card";
    card.innerHTML = `
      <div class="dl-ico">${d.icon}</div>
      <h2>${d.name}</h2>
      <p class="dl-ver">${d.version}</p>
      <p class="dl-desc">${d.desc}</p>
      <ul class="dl-list">
        ${d.features.map(f => `<li>✅ ${f}</li>`).join("")}
      </ul>
      <a href="${d.url}" class="btn-primary full" download="${d.filename}">⬇️ Télécharger</a>
      ${d.note ? `<p class="dl-note">${d.note}</p>` : ""}
    `;
    grid.appendChild(card);
  });
});
