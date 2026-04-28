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
let isLoggedIn = false;
let userPurchases = [];

// Gestion du panier
function toggleCart() {
  const dropdown = document.getElementById('cart-dropdown');
  dropdown.classList.toggle('hidden');
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = userPurchases.length;
    if (userPurchases.length > 0) {
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;
  
  if (userPurchases.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Aucun achat pour le moment</p>';
    return;
  }
  
  cartItems.innerHTML = userPurchases.map(purchase => {
    const name = purchase.name || purchase.productName || 'Produit sans nom';
    const url = purchase.url || purchase.productUrl || '';
    const image = purchase.image || purchase.productImage || '';
    const date = purchase.date || purchase.purchaseDate || new Date().toISOString();
    
    return `
      <div class="cart-item">
        ${image ? `<img src="${image}" alt="${name}" class="cart-item-img"/>` : ''}
        <div class="cart-item-info">
          <h4>${name}</h4>
          <p class="cart-item-date">${new Date(date).toLocaleDateString()}</p>
          <button class="btn-download-cart" onclick="downloadPurchase('${url}', '${name}')">
            ⬇️ Télécharger
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function downloadPurchase(url, name) {
  if (!url || url === 'undefined' || url === 'null') {
    alert("Lien de téléchargement non disponible pour ce produit.");
    return;
  }
  console.log("Téléchargement de:", name, "URL:", url);
  window.open(url, '_blank');
}

async function loadUserPurchases() {
  if (!isLoggedIn || !currentUserId) return;
  
  try {
    const res = await fetch(`/api/purchases/${currentUserId}`);
    if (res.ok) {
      userPurchases = await res.json();
      updateCartBadge();
      renderCart();
    }
  } catch (e) {
    console.error("Erreur lors du chargement des achats:", e);
  }
}

async function savePurchase(productId, productName, productImage, productUrl) {
  if (!isLoggedIn || !currentUserId) {
    console.error("Utilisateur non connecté");
    return;
  }
  
  console.log("Sauvegarde de l'achat:", {
    userId: currentUserId,
    productId,
    productName,
    productImage,
    productUrl
  });
  
  try {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId: currentUserId,
        productId,
        name: productName,
        productName: productName,
        image: productImage,
        productImage: productImage,
        url: productUrl,
        productUrl: productUrl,
        date: new Date().toISOString(),
        purchaseDate: new Date().toISOString()
      })
    });
    
    if (res.ok) {
      console.log("Achat sauvegardé avec succès");
      await loadUserPurchases();
    } else {
      console.error("Erreur lors de la sauvegarde:", await res.text());
    }
  } catch (e) {
    console.error("Erreur lors de la sauvegarde de l'achat:", e);
  }
}

async function initAuth(){
  const main=document.getElementById("main-content");
  const login=document.getElementById("login-screen");
  const blocked=document.getElementById("blocked-screen");

  let data;
  try{
    const res=await fetch("/auth/me");
    data=await res.json();
  }catch(_){
    // Pas de connexion - afficher le site quand même
    main.classList.remove("hidden");
    login.classList.add("hidden");
    blocked.classList.add("hidden");
    showPage("home");
    loadDownloads();
    updateNavUser(null);
    return;
  }

  if(!data.loggedIn){
    // Pas connecté - afficher le site quand même
    main.classList.remove("hidden");
    login.classList.add("hidden");
    blocked.classList.add("hidden");
    showPage("home");
    loadDownloads();
    updateNavUser(null);
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

  isLoggedIn = true;
  currentRole = data.role || "member";
  currentUserId = data.user ? data.user.id : null;

  // Accès OK
  main.classList.remove("hidden");
  login.classList.add("hidden");
  blocked.classList.add("hidden");

  updateNavUser(data.user);
  showPage("home");
  loadDownloads();

  // Afficher le lien Admin si owner ou admin
  if (data.role === "owner" || data.isAdmin) {
    const adminLink = document.getElementById("nav-admin-link");
    if (adminLink) adminLink.style.display = "inline-block";
  }
}

function updateNavUser(user){
  const navUser = document.getElementById("nav-user");
  const btnConnexion = document.querySelector(".btn-connexion");
  const cartIcon = document.getElementById("cart-icon");
  
  if(!user){
    // Pas connecté - afficher le bouton Connexion
    if(navUser) navUser.classList.add("hidden");
    if(btnConnexion) btnConnexion.classList.remove("hidden");
    if(cartIcon) cartIcon.classList.add("hidden");
    return;
  }
  
  // Connecté - afficher l'utilisateur et le panier
  if(btnConnexion) btnConnexion.classList.add("hidden");
  if(cartIcon) cartIcon.classList.remove("hidden");
  
  if(navUser){
    const avatar=user.avatar
      ?`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      :`https://cdn.discordapp.com/embed/avatars/0.png`;

    const roleBadge = currentRole === "owner"
      ? `<span class="role-badge role-owner">Owner</span>`
      : `<span class="role-badge role-member">Member</span>`;

    navUser.innerHTML=`
      <img class="user-avatar" src="${avatar}" alt=""/>
      <span class="user-name">${user.username}</span>
      ${roleBadge}
      <a href="/auth/logout" class="btn-logout">Déco</a>
    `;
    navUser.classList.remove("hidden");
  }
  
  // Charger les achats de l'utilisateur
  loadUserPurchases();
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
    
    // Stocker tous les produits pour la page de détails
    allProducts = items;
    
    // Debug: afficher les téléchargements reçus
    console.log("Téléchargements reçus:", items);
    console.log("Filtre actuel:", currentGameFilter);
    
    // Filtrer les téléchargements par jeu si un filtre est sélectionné
    // Sinon afficher TOUS les produits
    const filteredItems = currentGameFilter 
      ? items.filter(item => item.game === currentGameFilter)
      : items; // Afficher TOUS les produits quand aucun filtre
    
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
    <div class="dl-card" onclick="showProductDetail('${d.id}')" style="cursor: pointer;">
      ${d.image?`<img class="dl-card-img" src="${d.image}" alt="${d.name}" onerror="this.style.display='none'"/>`:""}
      <div class="dl-rating">⭐ 5.0</div>
      <span class="dl-price ${d.price && d.price !== "Free" ? "dl-price-paid" : "dl-price-free"}">${d.price && d.price !== "Free" ? "€" + d.price : "Free"}</span>
      <h2>${d.name}</h2>
      ${d.desc?`<p class="dl-desc">${d.desc}</p>`:""}
      ${adminUnlocked?`
        <div style="display:flex;gap:8px;margin-top:8px;" onclick="event.stopPropagation();">
          <button class="dl-edit" onclick="openEditModal('${d.id}')">Modifier</button>
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

// Afficher la page de détails du produit
let allProducts = [];

async function showProductDetail(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  const detailContainer = document.getElementById('product-detail');
  const isOutOfStock = product.stock === 0;
  
  detailContainer.innerHTML = `
    <div class="product-header">
      <div class="product-left">
        <h1>${product.name}</h1>
        <div class="product-meta">
          <span class="product-sold">Product sold <strong>${product.sold || 73}</strong> times</span>
          <span class="product-rating">⭐⭐⭐⭐⭐ 5 (${product.reviews || 11} reviews)</span>
        </div>
        ${product.image ? `<img class="product-image" src="${product.image}" alt="${product.name}"/>` : ''}
        <div class="product-features">
          <h3>Features:</h3>
          <ul>
            <li>✓ Works on ERA</li>
            <li>✓ You get a free update every time ERA switches fortnite version (updated to 8.51).</li>
            <li>✓ Join my discord server to learn more: <a href="https://discord.gg/example" target="_blank">https://discord.gg/example</a></li>
            <li>✓ It is external.</li>
          </ul>
        </div>
        <p class="product-terms">By purchasing any product, you agree to the terms.</p>
        <p class="product-check">Check it out on my channel: <a href="#" target="_blank">CLICK HERE</a></p>
      </div>
      <div class="product-right">
        <div class="product-price-box">
          <div class="price-row">
            <span>Price</span>
            <span class="price-value">${product.price && product.price !== "Free" ? "€" + product.price : "Free"}</span>
          </div>
          <div class="price-row">
            <span>Delivery Time</span>
            <span class="delivery-instant">⚡ Instant</span>
          </div>
          <div class="price-row">
            <span>In Stock</span>
            <span class="stock-value ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">${isOutOfStock ? '✕ 0' : '✓ ∞'}</span>
          </div>
          <div class="price-row quantity-row">
            <span>Quantity</span>
            <div class="quantity-control">
              <button onclick="changeQuantity(-1)">-</button>
              <input type="number" id="quantity" value="1" min="1" readonly/>
              <button onclick="changeQuantity(1)">+</button>
            </div>
          </div>
          ${isOutOfStock ? 
            `<button class="btn-buy disabled" disabled>Out of Stock</button>` :
            product.status === 'down' ?
            `<button class="btn-buy disabled" disabled style="background:#374151;cursor:not-allowed;color:#9ca3af">Updating...</button>` :
            `<button class="btn-buy" onclick="buyProduct('${product.id}', '${product.name}', '${product.price}', '${product.url}')">Buy Now</button>`
          }
        </div>
      </div>
    </div>
    
    <div class="product-comments">
      <h2>Comments</h2>
      <div class="comment-form">
        <input type="text" id="comment-name" placeholder="Your name" />
        <textarea id="comment-text" placeholder="Add a comment..." rows="3"></textarea>
        <button class="btn-primary" onclick="addComment('${product.id}')">Post Comment</button>
      </div>
      <div class="comments-list" id="comments-${product.id}">
        ${(product.comments || []).map(c => `
          <div class="comment">
            <div class="comment-header">
              <strong>${c.name}</strong>
              <span class="comment-date">${new Date(c.date).toLocaleDateString()}</span>
            </div>
            <p>${c.text}</p>
          </div>
        `).join('') || '<p class="no-comments">No comments yet. Be the first!</p>'}
      </div>
    </div>
  `;
  
  showPage('product');
}

function changeQuantity(delta) {
  const input = document.getElementById('quantity');
  const current = parseInt(input.value) || 1;
  const newValue = Math.max(1, current + delta);
  input.value = newValue;
}

async function buyProduct(productId, productName, price, url) {
  const isFree = !price || price === "Free";
  
  // Trouver le produit pour obtenir toutes les infos
  const product = allProducts.find(p => p.id === productId);
  
  if (!product) {
    alert("Produit introuvable.");
    return;
  }
  
  const productImage = product.image || '';
  const productUrl = product.url || url;
  const finalProductName = product.name || productName;
  
  if (isFree) {
    // Pour les produits gratuits, demander juste l'email
    const email = prompt("Please enter your email address:");
    if (!email) return;
    
    if (!email.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    
    // Vérifier si l'utilisateur est connecté pour le téléchargement
    if (!isLoggedIn) {
      alert("Please login with Discord to download!");
      window.location.href = "/auth/discord";
      return;
    }
    
    // Sauvegarder l'achat avec toutes les infos
    await savePurchase(productId, finalProductName, productImage, productUrl);
    
    // Simuler le téléchargement
    alert("Thanks for your purchase!\n\nYour download will start shortly.");
    
    // Lancer le téléchargement
    if (productUrl) {
      window.open(productUrl, '_blank');
    } else {
      alert("Lien de téléchargement non disponible.");
    }
    
    // Retourner à la page services
    setTimeout(() => {
      showPage('services');
    }, 1000);
  } else {
    // Pour les produits payants, utiliser le système de paiement existant
    processPayment(productId, finalProductName, price);
  }
}

async function addComment(productId) {
  const name = document.getElementById('comment-name').value.trim();
  const text = document.getElementById('comment-text').value.trim();
  
  if (!name || !text) {
    alert("Please fill in both name and comment.");
    return;
  }
  
  try {
    const res = await fetch(`/api/downloads/${productId}/comment`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name, text})
    });
    
    if (res.ok) {
      // Recharger les produits et afficher à nouveau les détails
      await loadDownloads();
      showProductDetail(productId);
    } else {
      alert("Error posting comment.");
    }
  } catch (e) {
    alert("Error posting comment.");
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

// ── Modal modification produit ────────────────────────────
function openEditModal(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const gameOptions = [
    { value: '', text: 'Pas de catégorie' },
    { value: 'fortnite', text: 'Fortnite' },
    { value: 'fortnite-og', text: 'Fortnite OG' },
    { value: 'gta-v', text: 'GTA V' },
    { value: 'zelda-botw', text: 'Zelda BotW' },
    { value: 'zelda-totk', text: 'Zelda TotK' }
  ].map(o => `<option value="${o.value}" ${o.value === (product.game||'') ? 'selected':''}>${o.text}</option>`).join('');

  const isDown = product.status === 'down';

  const modalHTML = `
    <div class="modal-overlay" id="edit-modal-overlay" onclick="closeEditModal()">
      <div class="modal" style="max-width:480px" onclick="event.stopPropagation()">
        <h2>✏️ Modifier le produit</h2>
        <div class="modal-form">
          <label>Nom du produit</label>
          <input type="text" id="edit-name" value="${product.name || ''}"/>

          <label>Description</label>
          <input type="text" id="edit-desc" value="${product.desc || ''}"/>

          <label>Image (URL)</label>
          <input type="text" id="edit-image" value="${product.image || ''}"/>

          <label>Lien de téléchargement</label>
          <input type="text" id="edit-url" value="${product.url || ''}"/>

          <label>Prix</label>
          <input type="text" id="edit-price" value="${product.price || 'Free'}"/>

          <label>Catégorie</label>
          <select id="edit-game">${gameOptions}</select>

          <label>Statut du produit</label>
          <div style="display:flex;gap:10px;margin-top:4px">
            <button class="btn-edit-status ${!isDown ? 'active-status' : ''}" id="btn-status-up" onclick="setEditStatus('up')" type="button">
              ✅ Upload (disponible)
            </button>
            <button class="btn-edit-status ${isDown ? 'active-status down-status' : ''}" id="btn-status-down" onclick="setEditStatus('down')" type="button">
              🔴 Down (Updating...)
            </button>
          </div>
          <input type="hidden" id="edit-status" value="${product.status || 'up'}"/>
        </div>
        <div class="modal-btns">
          <button class="btn-ghost" onclick="closeEditModal()">Annuler</button>
          <button class="btn-primary" onclick="saveEditModal('${id}')">Sauvegarder</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function setEditStatus(status) {
  document.getElementById('edit-status').value = status;
  document.getElementById('btn-status-up').className = 'btn-edit-status' + (status === 'up' ? ' active-status' : '');
  document.getElementById('btn-status-down').className = 'btn-edit-status' + (status === 'down' ? ' active-status down-status' : '');
}

function closeEditModal(){
  const modal = document.getElementById('edit-modal-overlay');
  if(modal) modal.remove();
}

async function saveEditModal(id) {
  const name   = document.getElementById('edit-name').value.trim();
  const desc   = document.getElementById('edit-desc').value.trim();
  const image  = document.getElementById('edit-image').value.trim();
  const url    = document.getElementById('edit-url').value.trim();
  const price  = document.getElementById('edit-price').value.trim() || 'Free';
  const game   = document.getElementById('edit-game').value;
  const status = document.getElementById('edit-status').value;

  if (!name) { alert('Le nom est requis.'); return; }

  try {
    const res = await fetch(`/api/downloads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, desc, image, url, price, game, status })
    });
    if (res.ok) { closeEditModal(); loadDownloads(); }
    else alert('Erreur lors de la sauvegarde.');
  } catch(_) { alert('Erreur de connexion.'); }
}

// Ancienne fonction gardée pour compatibilité
async function editCategory(id) { openEditModal(id); }

// ── Téléchargement avec vérification de clé ────────────────────────
async function downloadWithKeyCheck(url, name){
  // Vérifier si l'utilisateur est connecté
  if(!isLoggedIn){
    alert("Veuillez vous connecter avec Discord pour télécharger !");
    window.location.href = "/auth/discord";
    return;
  }
  
  // Si aucune clé n'a été générée, rediriger vers la page de génération
  if(!currentKey){
    alert("Vous devez d'abord générer votre clé d'accès !");
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
  const url=document.getElementById("dl-url").value.trim();
  const price=document.getElementById("dl-price").value.trim()||"Free";
  
  // Validation
  if(!name||!url){
    alert("Nom et lien requis.");
    return;
  }
  
  const res=await fetch("/api/downloads",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name,desc,image,url,price})
  });
  const d=await res.json();
  if(d.success){
    closeModal();
    // Reset form
    ["dl-name","dl-desc","dl-image","dl-url","dl-price"].forEach(id=>document.getElementById(id).value="");
    loadDownloads();
  } else {
    alert(d.error||"Erreur lors de l'ajout du téléchargement.");
  }
}

initAuth();

// ── Admin IP Ban ──────────────────────────────────────────
async function loadAdminIpList() {
  // Charger le log des visites
  const visitList = document.getElementById("admin-visit-list");
  if (visitList) {
    try {
      const res = await fetch("/api/admin/visitlog");
      if (res.ok) {
        const data = await res.json();
        const visits = data.visits || [];
        if (visits.length === 0) {
          visitList.innerHTML = "<p style='color:var(--muted)'>Aucun visiteur enregistré.</p>";
        } else {
          visitList.innerHTML = visits.map(v => `
            <div class="admin-ip-row">
              <span class="admin-ip-addr">${v.ip}</span>
              ${v.discordUser ? `<span class="admin-ip-discord">🎮 ${v.discordUser}</span>` : `<span class="admin-ip-discord" style="color:var(--muted)">—</span>`}
              <span class="admin-ip-reason" style="color:var(--muted)">${v.visits} visite(s)</span>
              <span class="admin-ip-by">dernière: ${new Date(v.lastSeen).toLocaleString("fr-FR")}</span>
              ${v.banned
                ? `<span style="color:var(--err);font-size:.8rem">🚫 Banni</span>`
                : `<button class="btn-unban-ip" style="background:rgba(239,68,68,.15);color:var(--err)" onclick="adminBanIpDirect('${v.ip}')">Bannir</button>`
              }
            </div>
          `).join("");
        }
      }
    } catch(e) {
      visitList.innerHTML = "<p style='color:var(--muted)'>Erreur de chargement.</p>";
    }
  }

  // Charger les IPs bannies
  const list = document.getElementById("admin-ip-list");
  if (list) {
    try {
      const res2 = await fetch("/api/admin/bannedips");
      if (!res2.ok) { list.innerHTML = "<p>Erreur de chargement.</p>"; return; }
      const data = await res2.json();
      const ips = Object.entries(data.ips || {});
      if (ips.length === 0) {
        list.innerHTML = "<p style='color:var(--muted)'>Aucune IP bannie.</p>";
      } else {
        list.innerHTML = ips.map(([ip, info]) => `
          <div class="admin-ip-row">
            <span class="admin-ip-addr">${ip}</span>
            <span class="admin-ip-reason">${info.reason || 'N/A'}</span>
            <span class="admin-ip-by">par ${info.bannedBy}</span>
            <button class="btn-unban-ip" onclick="adminUnbanIp('${ip}')">Débannir</button>
          </div>
        `).join("");
      }
    } catch(e) {
      list.innerHTML = "<p style='color:var(--muted)'>Erreur de chargement.</p>";
    }
  }
}

async function adminBanIpDirect(ip) {
  const reason = prompt(`Raison du ban pour ${ip} :`) || "Abus / DDoS";
  try {
    const res = await fetch("/api/admin/banip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, reason })
    });
    const d = await res.json();
    if (d.success) loadAdminIpList();
    else alert(d.error || "Erreur.");
  } catch(e) { alert("Erreur de connexion."); }
}

async function adminBanIp() {
  const ip = document.getElementById("admin-ip-input").value.trim();
  const reason = document.getElementById("admin-ip-reason").value.trim() || "DDoS / Abus";
  if (!ip) { alert("Entre une adresse IP."); return; }
  try {
    const res = await fetch("/api/admin/banip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, reason })
    });
    const d = await res.json();
    if (d.success) {
      document.getElementById("admin-ip-input").value = "";
      document.getElementById("admin-ip-reason").value = "";
      loadAdminIpList();
    } else {
      alert(d.error || "Erreur.");
    }
  } catch(e) { alert("Erreur de connexion."); }
}

async function adminUnbanIp(ip) {
  if (!confirm(`Débannir l'IP ${ip} ?`)) return;
  try {
    const res = await fetch("/api/admin/unbanip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    });
    const d = await res.json();
    if (d.success) loadAdminIpList();
    else alert(d.error || "Erreur.");
  } catch(e) { alert("Erreur de connexion."); }
}

// Charger la liste IP quand on va sur la page admin
const _origShowPage = showPage;
window.showPage = function(name) {
  _origShowPage(name);
  if (name === "admin") { loadAdminIpList(); loadAdminHwidList(); }
};

// ── Admin HWID Ban ────────────────────────────────────────
async function loadAdminHwidList() {
  const list = document.getElementById("admin-hwid-list");
  if (!list) return;
  try {
    const res = await fetch("/api/admin/bannedips"); // réutilise la session auth
    const res2 = await fetch("/api/hwid/banned");
    if (!res2.ok) { list.innerHTML = "<p>Erreur de chargement.</p>"; return; }
    const data = await res2.json();
    const hwids = Object.entries(data.hwids || {});
    if (hwids.length === 0) {
      list.innerHTML = "<p style='color:var(--muted)'>Aucun HWID banni.</p>";
      return;
    }
    list.innerHTML = hwids.map(([uid, info]) => `
      <div class="admin-ip-row">
        <span class="admin-ip-addr">${uid}</span>
        <span class="admin-ip-discord" style="font-family:monospace;font-size:.75rem;color:var(--cyan)">${info.hwid || 'HWID non enregistré'}</span>
        <span class="admin-ip-reason">${info.reason || 'N/A'}</span>
        <span class="admin-ip-by">par ${info.bannedBy}</span>
        <button class="btn-unban-ip" onclick="adminUnbanHwid('${uid}')">Débannir</button>
      </div>
    `).join("");
  } catch(e) {
    list.innerHTML = "<p style='color:var(--muted)'>Erreur de chargement.</p>";
  }
}

async function adminBanHwid() {
  const id = document.getElementById("admin-hwid-input").value.trim();
  const reason = document.getElementById("admin-hwid-reason").value.trim() || "Abus / Triche";
  if (!id) { alert("Entre un ID Discord."); return; }
  try {
    const res = await fetch(`/api/admin/banhwid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, reason })
    });
    const d = await res.json();
    if (d.success) {
      document.getElementById("admin-hwid-input").value = "";
      document.getElementById("admin-hwid-reason").value = "";
      loadAdminHwidList();
    } else alert(d.error || "Erreur.");
  } catch(e) { alert("Erreur de connexion."); }
}

async function adminUnbanHwid(userId) {
  if (!confirm(`Débannir le HWID de ${userId} ?`)) return;
  try {
    const res = await fetch(`/api/admin/unbanhwid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const d = await res.json();
    if (d.success) loadAdminHwidList();
    else alert(d.error || "Erreur.");
  } catch(e) { alert("Erreur de connexion."); }
}
