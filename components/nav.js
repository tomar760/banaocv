/* ============================================================
   BanaoCV — components/nav.js
   Auto-inject navbar on every page
   ============================================================ */

(function () {
  const navHTML = `
  <nav id="navbar">
    <div class="nav-inner">

      <!-- Logo -->
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="2" width="12" height="15" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="5" y="5" width="8" height="1.2" rx="0.6" fill="#1B3A6B"/>
            <rect x="5" y="7.5" width="6" height="1.2" rx="0.6" fill="#1B3A6B" opacity="0.6"/>
            <rect x="5" y="10" width="7" height="1.2" rx="0.6" fill="#1B3A6B" opacity="0.6"/>
            <circle cx="16" cy="15" r="5" fill="#F5A623"/>
            <path d="M14 15l1.5 1.5L18 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="nav-logo-text">Banao<span>CV</span></span>
      </a>

      <!-- Desktop links -->
      <div class="nav-links">
        <a href="index.html"     class="nav-link">Home</a>
        <a href="templates.html" class="nav-link">Templates</a>
        <a href="editor.html"    class="nav-link">Editor</a>
        <a href="pricing.html"   class="nav-link">Pricing</a>
      </div>

      <!-- Desktop actions -->
      <div class="nav-actions">
        <a href="login.html" class="nav-login-btn" data-auth="logged-out">Login</a>
        <a href="editor.html" class="btn btn-primary btn-sm btn-shine nav-cta-btn"
           data-auth="logged-out">
          Free Mein Shuru Karo
        </a>
        <a href="dashboard.html" class="nav-login-btn" data-auth="logged-in" style="display:none">
          👋 <span data-user-name>User</span>
        </a>
        <a href="editor.html" class="btn btn-primary btn-sm btn-shine"
           data-auth="logged-in" style="display:none">
          Resume Banao
        </a>
        <button class="btn btn-ghost btn-sm" data-auth="logged-in"
                data-logout style="display:none">Logout</button>
      </div>

      <!-- Hamburger -->
      <button class="nav-hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <div class="nav-mobile">
      <a href="index.html"     class="nav-link">🏠 Home</a>
      <a href="templates.html" class="nav-link">🎨 Templates</a>
      <a href="editor.html"    class="nav-link">✏️ Editor</a>
      <a href="pricing.html"   class="nav-link">💰 Pricing</a>
      <div class="nav-mobile-actions">
        <a href="login.html" class="btn btn-outline btn-lg"
           style="width:100%;justify-content:center" data-auth="logged-out">Login</a>
        <a href="editor.html" class="btn btn-primary btn-lg btn-shine"
           style="width:100%;justify-content:center" data-auth="logged-out">
          Free Mein Shuru Karo 🚀
        </a>
        <a href="dashboard.html" class="btn btn-primary btn-lg"
           style="width:100%;justify-content:center;display:none" data-auth="logged-in">
          Dashboard
        </a>
        <button class="btn btn-ghost btn-lg" style="width:100%;display:none"
                data-auth="logged-in" data-logout>Logout</button>
      </div>
    </div>
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  const hero = document.querySelector('.hero, .auth-shell, .dash-shell, .editor-shell');
  if (!hero) document.body.style.paddingTop = 'var(--nav-h, 68px)';
})();
