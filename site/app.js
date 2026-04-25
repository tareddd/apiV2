// ── Stars canvas — palette bleue/cyan ────────────────────
(function(){
  const cv=document.getElementById("stars"),ctx=cv.getContext("2d");
  let stars=[];
  const COLORS=["#06b6d4","#2563eb","#22d3ee","#3b82f6","#ffffff"];
  function resize(){cv.width=innerWidth;cv.height=innerHeight;}
  function mk(){return{
    x:Math.random()*cv.width,y:Math.random()*cv.height,
    r:.2+Math.random()*1.4,a:Math.random(),
    da:.001+Math.random()*.004*(Math.random()<.5?1:-1),
    vx:(Math.random()-.5)*.05,vy:(Math.random()-.5)*.05,
    c:COLORS[Math.floor(Math.random()*COLORS.length)]
  };}
  function init(){resize();stars=Array.from({length:180},mk);}
  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    for(const s of stars){
      s.a+=s.da;if(s.a<=0||s.a>=1)s.da*=-1;
      s.x+=s.vx;s.y+=s.vy;
      if(s.x<0)s.x=cv.width;if(s.x>cv.width)s.x=0;
      if(s.y<0)s.y=cv.height;if(s.y>cv.height)s.y=0;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=s.c;ctx.globalAlpha=s.a*.7;ctx.fill();
    }
    ctx.globalAlpha=1;requestAnimationFrame(draw);
  }
  window.addEventListener("resize",resize);
  init();draw();
})();

// ── Navigation ────────────────────────────────────────────
function showPage(name){
  document.querySelectorAll(".page").forEach(p=>{p.classList.add("hidden");p.classList.remove("active");});
  document.querySelectorAll(".nav-link").forEach(l=>l.classList.remove("active"));
  const p=document.getElementById("page-"+name);
  if(p){p.classList.remove("hidden");p.classList.add("active");}
  const l=document.querySelector(`[onclick="showPage('${name}')"]`);
  if(l)l.classList.add("active");
}

// ── Filtrage par jeu ────────────────────────────────────────
let currentGameFilter = "";

function filterContent(){
  const select = document.getElementById("game-select");
  currentGameFilter = select.value;
  loadDownloads(); // Recharge les téléchargements avec le filtre
}

// Convertit les codes de jeu en noms lisibles
function getGameName(gameCode){
  const gameNames = {
    'zelda-botw': 'Zelda Breath of the Wild',
    'zelda-totk': 'Zelda Tears of the Kingdom',
    'gta-v': 'Grand Theft Auto V',
    'fortnite': 'Fortnite',
    'fortnite-og': 'Fortnite OG'
  };
  return gameNames[gameCode] || gameCode || 'Non défini';
}

// ── Génération clé ────────────────────────────────────────
let currentKey=null;

async function generateKey(){
  const btn=document.getElementById("gen-btn");
  const txt=document.getElementById("gen-txt");
  const spin=document.getElementById("gen-spin");
  btn.disabled=true;txt.classList.add("hidden");spin.classList.remove("hidden");

  try{
    const res=await fetch("/api/keys/generate",{method:"POST"});
    if(res.ok){
      const d=await res.json();
      if(d.key){
        currentKey=d.key;
        document.getElementById("key-ph").classList.add("hidden");
        document.getElementById("key-val").classList.remove("hidden");
        document.getElementById("key-val").textContent=d.key;
        document.getElementById("copy-btn").classList.remove("hidden");
        if(d.existing){
          txt.textContent="Clé déjà générée";
          btn.disabled=true;
          document.getElementById("gen-note").textContent="Ta clé est permanente. Pour la changer, demande /changekey à un admin.";
          spin.classList.add("hidden");
          return;
        }
        document.getElementById("gen-note").textContent="Clé générée ! Garde-la, elle est permanente.";
      }
    } else {
      document.getElementById("key-ph").textContent="Connecte ton Discord d'abord.";
    }
  }catch(_){
    document.getElementById("key-ph").textContent="Erreur de connexion.";
  }
  btn.disabled=false;txt.classList.remove("hidden");spin.classList.add("hidden");
}

async function copyKey(){
  if(!currentKey)return;
  await navigator.clipboard.writeText(currentKey).catch(()=>{});
  const btn=document.getElementById("copy-btn");
  btn.style.color="var(--ok)";
  setTimeout(()=>btn.style.color="",1500);
}

// ── Auth Discord ──────────────────────────────────────────
let currentRole = "member";
let currentUserId = null;

async function initAuth(){
  const main=document.getElementById("main-content");
  const login=document.getElementById("login-screen");
  const blocked=document.getElementById("blocked-screen");

  let data;
  try{
    const res=await fetch("/auth/me");
    data=await res.json();
  }catch(_){
    main.classList.remove("hidden");
    login.classList.add("hidden");
    blocked.classList.add("hidden");
    showPage("home");
    loadDownloads();
    return;
  }

  if(!data.loggedIn){
    login.classList.remove("hidden");
    main.classList.add("hidden");
    blocked.classList.add("hidden");
    return;
  }

  if(!data.access){
    blocked.classList.remove("hidden");
    main.classList.add("hidden");
    login.classList.add("hidden");
    if(data.banned){
      document.getElementById("blocked-icon").textContent="🔒";
      document.getElementById("blocked-title").textContent="Accès refusé";
      document.getElementById("blocked-msg").textContent="Ton compte a été banni de FN Private. Contacte un admin si tu penses que c'est une erreur.";
    } else if(data.ratelimited){
      const date=new Date(data.until).toLocaleString("fr-FR");
      document.getElementById("blocked-icon").textContent="⏳";
      document.getElementById("blocked-title").textContent="Accès temporairement suspendu";
      document.getElementById("blocked-msg").textContent=`Ton accès est suspendu jusqu'au ${date}.`;
    }
    return;
  }

  currentRole = data.role || "member";
  currentUserId = data.user ? data.user.id : null;

  // Accès OK
  main.classList.remove("hidden");
  login.classList.add("hidden");
  blocked.classList.add("hidden");

  const u=data.user;
  const avatar=u.avatar
    ?`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`
    :`https://cdn.discordapp.com/embed/avatars/0.png`;

  const roleBadge = currentRole === "owner"
    ? `<span class="role-badge role-owner">Owner</span>`
    : `<span class="role-badge role-member">Member</span>`;

  document.getElementById("nav-user").innerHTML=`
    <img class="user-avatar" src="${avatar}" alt=""/>
    <span class="user-name">${u.username}</span>
    ${roleBadge}
    <a href="/auth/logout" class="btn-logout">Déco</a>
  `;

  showPage("home");
  loadDownloads();
}

// ── Downloads ─────────────────────────────────────────────
async function loadDownloads(){
  const grid=document.getElementById("dl-grid");
  const fab=document.getElementById("fab-add");

  // Affiche toujours le FAB peu importe la page
  if(fab) fab.classList.remove("hidden");

  if(!grid) return;

  try{
    const res=await fetch("/api/downloads");
    const items=await res.json();
    
    // Debug: afficher les téléchargements reçus
    console.log("Téléchargements reçus:", items);
    console.log("Filtre actuel:", currentGameFilter);
    
    // Filtrer les téléchargements par jeu si un filtre est sélectionné
    const filteredItems = currentGameFilter 
      ? items.filter(item => item.game === currentGameFilter)
      : items.filter(item => !item.game); // N'afficher que les téléchargements SANS catégorie quand aucun filtre
    
    console.log("Téléchargements filtrés:", filteredItems);
    
    renderDownloads(filteredItems);
  }catch(_){
    console.error("Erreur lors du chargement des téléchargements:", _);
    grid.innerHTML=`<p style="color:var(--muted);text-align:center;padding:40px">Aucun téléchargement disponible.</p>`;
  }
}

function renderDownloads(items){
  const grid=document.getElementById("dl-grid");
  if(!grid) return;
  if(!items.length){
    grid.innerHTML=`<p style="color:var(--muted);text-align:center;padding:40px;grid-column:1/-1">Aucun téléchargement pour l'instant.</p>`;
    return;
  }
  grid.innerHTML=items.map(d=>`
    <div class="dl-card" onclick="toggleDetails('${d.id}')" style="cursor: pointer;">
      ${d.image?`<img class="dl-card-img" src="${d.image}" alt="${d.name}" onerror="this.style.display='none'"/>`:""}
      <span class="dl-price ${d.price==="15"?"dl-price-paid-15":d.price==="Free"||!d.price||d.price==="0"||d.price===0?"dl-price-free":"dl-price-paid"}">${d.price==="15"?"PAYANT 15$":d.price==="Free"||!d.price?"Free":d.price+"$"}</span>
      <h2>${d.name}</h2>
      ${d.game?`<p class="dl-note">🎮 Catégorie: ${getGameName(d.game)}</p>`:'<p class="dl-note">⚠️ Pas de catégorie</p>'}
      
      <!-- Section détails (cachée par défaut) -->
      <div id="details-${d.id}" class="dl-details hidden">
        <h3 class="dl-details-title">${d.name}</h3>
        <p class="dl-details-text">${d.details || d.desc || "Aucune description détaillée disponible."}</p>
      </div>
      
      ${d.price && d.price !== "Free" && d.price !== "0" && d.price !== 0 ? 
  `<button class="btn-primary full" onclick="event.stopPropagation(); processPayment('${d.id}', '${d.name}', '${d.price}')">💳 Payer ${d.price}$</button>` :
  `<button class="btn-primary full" onclick="event.stopPropagation(); downloadWithKeyCheck('${d.url}', '${d.name}')">⬇️ Télécharger</button>`
}
      ${adminUnlocked?`
        <div style="display:flex;gap:8px;margin-top:8px;" onclick="event.stopPropagation();">
          <button class="dl-edit" onclick="editCategory('${d.id}', '${d.game || ''}')">Modifier catégorie</button>
          <button class="dl-delete" onclick="deleteDownload('${d.id}')">Supprimer</button>
        </div>
      `:""}
    </div>
  `).join("");
}

// Fonction pour afficher/cacher les détails d'un produit
function toggleDetails(id) {
  const detailsElement = document.getElementById(`details-${id}`);
  if (detailsElement) {
    detailsElement.classList.toggle('hidden');
  }
}

// Fonction de traitement de paiement PayPal
async function processPayment(productId, productName, price) {
  // Vérifier si l'utilisateur est connecté
  if (!currentKey) {
    alert("Vous devez d'abord générer votre clé d'accès !");
    showPage('generator');
    return;
  }

  // Créer le paiement PayPal
  try {
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: productId,
        productName: productName,
        price: price,
        userId: currentUserId // À définir lors de l'auth
      })
    });

    const paymentData = await response.json();
    
    if (paymentData.success) {
      // Rediriger vers PayPal
      window.open(paymentData.paymentUrl, '_blank');
      
      // Afficher un message d'instructions
      alert(`Paiement initié pour ${productName} (${price}$).\n\nAprès paiement, un ticket sera créé sur Discord. Attendez qu'un admin utilise /unlock ${currentUserId} pour débloquer votre accès.`);
    } else {
      alert('Erreur lors de la création du paiement: ' + paymentData.error);
    }
  } catch (error) {
    console.error('Erreur de paiement:', error);
    alert('Erreur de connexion au service de paiement.');
  }
}

async function deleteDownload(id){
  if(!confirm("Supprimer ce téléchargement ?")) return;
  await fetch(`/api/downloads/${id}`,{method:"DELETE"});
  loadDownloads();
}

// ── Modification de catégorie ───────────────────────────────────
async function editCategory(id, currentGame){
  const gameOptions = [
    { value: '', text: 'Pas de catégorie' },
    { value: 'zelda-botw', text: 'Zelda Breath of the Wild' },
    { value: 'zelda-totk', text: 'Zelda Tears of the Kingdom' },
    { value: 'gta-v', text: 'Grand Theft Auto V' },
    { value: 'fortnite', text: 'Fortnite' },
    { value: 'fortnite-og', text: 'Fortnite OG' }
  ];
  
  const options = gameOptions.map(opt => 
    `<option value="${opt.value}" ${opt.value === currentGame ? 'selected' : ''}>${opt.text}</option>`
  ).join('');
  
  const modalHTML = `
    <div class="modal-overlay" id="edit-modal-overlay" onclick="closeEditModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <h2>Modifier la catégorie</h2>
        <div class="modal-form">
          <label>Nouvelle catégorie</label>
          <select id="edit-game-select">
            ${options}
          </select>
        </div>
        <div class="modal-btns">
          <button class="btn-ghost" onclick="closeEditModal()">Annuler</button>
          <button class="btn-primary" onclick="saveCategory('${id}')">Sauvegarder</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEditModal(){
  const modal = document.getElementById('edit-modal-overlay');
  if(modal) modal.remove();
}

async function saveCategory(id){
  const newGame = document.getElementById('edit-game-select').value;
  
  try{
    const res = await fetch(`/api/downloads/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({game: newGame})
    });
    
    if(res.ok){
      closeEditModal();
      loadDownloads();
    } else {
      alert('Erreur lors de la modification de la catégorie');
    }
  }catch(_){
    alert('Erreur de connexion');
  }
}

// ── Téléchargement avec vérification de clé ────────────────────────
async function downloadWithKeyCheck(url, name){
  // Si aucune clé n'a été générée, rediriger vers la page de génération
  if(!currentKey){
    alert("Vous devez d'abord générer votre clé d'accès !");
    showPage('generator');
    return;
  }
  
  // Demander la clé à l'utilisateur
  const enteredKey = prompt(`Veuillez entrer votre clé pour télécharger ${name}:`);
  if(!enteredKey) return;
  
  // Vérifier la clé
  if(enteredKey !== currentKey){
    alert("Clé incorrecte ! Veuillez générer une clé valide.");
    showPage('generator');
    return;
  }
  
  // Si la clé est correcte, lancer le téléchargement
  window.open(url, '_blank');
}

// ── Modal ajout ───────────────────────────────────────────
const ADMIN_CREDS = { user: "dmaowner", pass: "APIV2" };
let adminUnlocked = false;

function openAddModal(){
  if(!adminUnlocked){
    const user = prompt("Nom d'utilisateur :");
    if(!user) return;
    const pass = prompt("Mot de passe :");
    if(user === ADMIN_CREDS.user && pass === ADMIN_CREDS.pass){
      adminUnlocked = true;
    } else {
      alert("Identifiants incorrects.");
      return;
    }
  }
  document.getElementById("modal-overlay").classList.remove("hidden");
}
function closeModal(){
  document.getElementById("modal-overlay").classList.add("hidden");
}
async function submitDownload(){
  const name=document.getElementById("dl-name").value.trim();
  const desc=document.getElementById("dl-desc").value.trim();
  const image=document.getElementById("dl-image").value.trim();
  const game=document.getElementById("dl-game").value.trim();
  const url=document.getElementById("dl-url").value.trim();
  const price=document.getElementById("dl-price").value.trim()||"Free";
  
  // Validation améliorée
  if(!name||!url){
    alert("Nom et lien requis.");
    return;
  }
  if(!game){
    alert("Veuillez sélectionner une catégorie de jeu.");
    return;
  }
  
  // Debug: afficher les données envoyées
  console.log("Données envoyées:", {name,desc,image,game,url,price});
  
  const res=await fetch("/api/downloads",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name,desc,image,game,url,price})
  });
  const d=await res.json();
  if(d.success){
    closeModal();
    // Reset form
    ["dl-name","dl-desc","dl-image","dl-game","dl-url","dl-price"].forEach(id=>document.getElementById(id).value="");
    loadDownloads();
  } else {
    alert(d.error||"Erreur lors de l'ajout du téléchargement.");
  }
}

initAuth();
