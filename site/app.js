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
async function initAuth(){
  const main=document.getElementById("main-content");
  const login=document.getElementById("login-screen");
  const blocked=document.getElementById("blocked-screen");

  let data;
  try{
    const res=await fetch("/auth/me");
    data=await res.json();
  }catch(_){
    // API inaccessible → affiche le site directement
    main.classList.remove("hidden");
    login.classList.add("hidden");
    blocked.classList.add("hidden");
    showPage("home");
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

  // Accès OK
  main.classList.remove("hidden");
  login.classList.add("hidden");
  blocked.classList.add("hidden");

  const u=data.user;
  const avatar=u.avatar
    ?`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`
    :`https://cdn.discordapp.com/embed/avatars/0.png`;
  document.getElementById("nav-user").innerHTML=`
    <img class="user-avatar" src="${avatar}" alt=""/>
    <span class="user-name">${u.username}</span>
    <a href="/auth/logout" class="btn-logout">Déco</a>
  `;

  showPage("home");
}

initAuth();
