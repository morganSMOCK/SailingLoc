import{A as c}from"./AuthService-hkblqokD.js";class d{constructor(){this.authService=new c,this.currentUser=null,this.isInitialized=!1,this.listeners=new Set}async initialize(){if(!this.isInitialized)try{this.authService.isAuthenticated()&&await this.loadCurrentUser(),this.isInitialized=!0,this.notifyListeners(),console.log("✅ AppStateService initialisé")}catch(e){console.error("❌ Erreur lors de l'initialisation de AppStateService:",e),this.currentUser=null,this.isInitialized=!0,this.notifyListeners()}}async loadCurrentUser(){try{const e=await this.authService.getCurrentUser();this.currentUser=e,console.log("✅ Utilisateur chargé:",e)}catch(e){console.error("❌ Erreur lors du chargement de l'utilisateur:",e),this.currentUser=null,this.authService.clearAuthData()}}async login(e){try{const t=await this.authService.login(e);return await this.loadCurrentUser(),this.notifyListeners(),t}catch(t){throw console.error("❌ Erreur lors de la connexion:",t),t}}async logout(){try{await this.authService.logout(),this.currentUser=null,this.notifyListeners()}catch(e){console.error("❌ Erreur lors de la déconnexion:",e),this.currentUser=null,this.authService.clearAuthData(),this.notifyListeners()}}isAuthenticated(){return this.authService.isAuthenticated()&&this.currentUser!==null}getCurrentUser(){return this.currentUser}getAuthToken(){return this.authService.getAuthToken()}addListener(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notifyListeners(){this.listeners.forEach(e=>{try{e({isAuthenticated:this.isAuthenticated(),currentUser:this.currentUser,isInitialized:this.isInitialized})}catch(t){console.error("❌ Erreur dans un listener:",t)}})}async refreshAuthState(){this.authService.isAuthenticated()?await this.loadCurrentUser():this.currentUser=null,this.notifyListeners()}}const i=new d;class u{constructor(){this.headerElement=null,this.isInitialized=!1}async initialize(){if(!this.isInitialized){if(await i.initialize(),this.headerElement=document.querySelector("nav#navbar"),!this.headerElement){console.warn("⚠️ Header non trouvé dans le DOM");return}this.unsubscribe=i.addListener(e=>{this.updateHeader(e)}),this.updateHeader({isAuthenticated:i.isAuthenticated(),currentUser:i.getCurrentUser(),isInitialized:i.isInitialized}),this.isInitialized=!0,console.log("✅ HeaderComponent initialisé")}}updateHeader(e){if(!this.headerElement)return;const{isAuthenticated:t,currentUser:n}=e,s=this.headerElement.querySelector(".nav-auth");s&&(s.innerHTML="",t&&n?this.renderUserMenu(s,n):this.renderAuthButtons(s))}renderAuthButtons(e){e.innerHTML=`
      <button id="login-btn" class="btn-secondary">Connexion</button>
      <button id="register-btn" class="btn-primary">Inscription</button>
    `,this.setupAuthButtons()}renderUserMenu(e,t){const n=this.getUserInitials(t),s=t.firstName&&t.lastName?`${t.firstName} ${t.lastName}`:t.email||"Utilisateur";e.innerHTML=`
      <div class="user-menu" style="position: relative; display: flex; align-items: center; gap: 12px;">
        <div class="user-avatar" style="
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
          color: white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 700; 
          font-size: 14px;
          cursor: pointer;
        " title="${s}">
          ${n}
        </div>
        <div class="user-dropdown" style="
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 8px 0;
          min-width: 200px;
          z-index: 1000;
          display: none;
        ">
          <div style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">${s}</div>
            <div style="font-size: 0.875rem; color: #64748b;">${t.email}</div>
          </div>
          <a href="/profile.html" style="
            display: block; 
            padding: 12px 16px; 
            color: #374151; 
            text-decoration: none; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            Mon profil
          </a>
          <a href="/my-bookings.html" style="
            display: block; 
            padding: 12px 16px; 
            color: #374151; 
            text-decoration: none; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            Mes réservations
          </a>
          <a href="/boat-management.html" style="
            display: block; 
            padding: 12px 16px; 
            color: #374151; 
            text-decoration: none; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">
            Gérer mes bateaux
          </a>
          <div style="border-top: 1px solid #f1f5f9; margin: 8px 0;"></div>
          <button onclick="headerComponent.logout()" style="
            display: block; 
            width: 100%; 
            padding: 12px 16px; 
            color: #dc2626; 
            background: none; 
            border: none; 
            text-align: left; 
            cursor: pointer; 
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#fef2f2'" onmouseout="this.style.backgroundColor='transparent'">
            Déconnexion
          </button>
        </div>
      </div>
    `,this.setupUserMenuEvents()}setupAuthButtons(){const e=this.headerElement.querySelector("#login-btn"),t=this.headerElement.querySelector("#register-btn");e&&e.addEventListener("click",()=>{window.location.href="/login.html"}),t&&t.addEventListener("click",()=>{window.location.href="/register.html"})}setupUserMenuEvents(){const e=this.headerElement.querySelector(".user-menu"),t=this.headerElement.querySelector(".user-dropdown");!e||!t||(e.addEventListener("click",n=>{n.stopPropagation();const s=t.style.display==="block";t.style.display=s?"none":"block"}),document.addEventListener("click",n=>{e.contains(n.target)||(t.style.display="none")}))}getUserInitials(e){return e.firstName&&e.lastName?`${e.firstName[0]}${e.lastName[0]}`.toUpperCase():e.email?e.email[0].toUpperCase():"U"}async logout(){try{await i.logout(),window.location.href="/"}catch(e){console.error("❌ Erreur lors de la déconnexion:",e),window.location.href="/"}}destroy(){this.unsubscribe&&this.unsubscribe(),this.isInitialized=!1}}const o=new u;window.appState=i;window.headerComponent=o;async function a(){try{console.log("🚀 Initialisation de l'application..."),await i.initialize(),await o.initialize(),console.log("✅ Application initialisée avec succès")}catch(r){console.error("❌ Erreur lors de l'initialisation de l'application:",r)}}function h(){document.addEventListener("click",async r=>{const e=r.target.closest("a[href]");if(!e)return;const t=e.getAttribute("href");if((t.startsWith("/")||t.startsWith("./")||t.startsWith("../"))&&["/boat-management.html","/my-bookings.html","/profile.html"].some(l=>t.includes(l))&&!i.isAuthenticated()){r.preventDefault(),window.location.href="/login.html";return}})}function p(){const r=window.fetch;window.fetch=async(...e)=>{try{const t=await r(...e);return t.status===401&&(console.warn("⚠️ Session expirée, déconnexion..."),await i.logout(),window.location.pathname.includes("login.html")||(window.location.href="/login.html")),t}catch(t){throw console.error("❌ Erreur fetch:",t),t}}}function f(){setInterval(async()=>{i.isAuthenticated()&&await i.refreshAuthState()},5*60*1e3)}function g(){const r=document.querySelector(".navbar");if(!r)return;let e=!1;function t(){window.scrollY>100?r.classList.add("scrolled"):r.classList.remove("scrolled"),e=!1}function n(){e||(requestAnimationFrame(t),e=!0)}window.addEventListener("scroll",n)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a):a();h();p();f();g();typeof window<"u"&&(window.debugApp={appState:i,headerComponent:o,refreshAuth:()=>i.refreshAuthState(),logout:()=>i.logout()});
