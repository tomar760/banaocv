/* ============================================================
   BanaoCV — components/nav.js
   Auto-inject navbar on every page
   Usage: <script src="../components/nav.js"></script>
          or <script src="components/nav.js"></script>
   ============================================================ */

(function () {
  const navHTML = `
  <nav id="navbar">
    <div class="nav-inner">

      <!-- Logo -->
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon">R</div>
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
        <!-- Logged OUT -->
        <a href="#" class="nav-login-btn" data-auth="logged-out" data-modal-open="auth-modal">
          Login
        </a>
        <a href="#" class="btn btn-primary btn-sm btn-shine nav-cta-btn"
           data-auth="logged-out" data-modal-open="auth-modal">
          Free Mein Shuru Karo
        </a>

        <!-- Logged IN -->
        <a href="dashboard.html" class="nav-login-btn" data-auth="logged-in" style="display:none">
          👋 <span data-user-name>User</span>
        </a>
        <a href="editor.html" class="btn btn-primary btn-sm btn-shine"
           data-auth="logged-in" style="display:none">
          Resume Banao
        </a>
        <button class="btn btn-ghost btn-sm" data-auth="logged-in"
                data-logout style="display:none">
          Logout
        </button>
      </div>

      <!-- Hamburger -->
      <button class="nav-hamburger" aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <div class="nav-mobile">
      <a href="index.html"     class="nav-link">🏠 Home</a>
      <a href="templates.html" class="nav-link">🎨 Templates</a>
      <a href="editor.html"    class="nav-link">✏️ Editor</a>
      <a href="pricing.html"   class="nav-link">💰 Pricing</a>

      <div class="nav-mobile-actions">
        <!-- Logged OUT -->
        <a href="#" class="btn btn-outline btn-lg" style="width:100%;justify-content:center"
           data-auth="logged-out" data-modal-open="auth-modal">
          Login
        </a>
        <a href="#" class="btn btn-primary btn-lg btn-shine" style="width:100%;justify-content:center"
           data-auth="logged-out" data-modal-open="auth-modal">
          Free Mein Shuru Karo 🚀
        </a>

        <!-- Logged IN -->
        <a href="dashboard.html" class="btn btn-primary btn-lg" style="width:100%;justify-content:center;display:none"
           data-auth="logged-in">
          Dashboard
        </a>
        <button class="btn btn-ghost btn-lg" style="width:100%;display:none"
                data-auth="logged-in" data-logout>
          Logout
        </button>
      </div>
    </div>
  </nav>
  `;

  // Inject navbar at start of body
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Add padding to body so content doesn't go behind fixed nav
  document.body.style.paddingTop = 'var(--nav-h, 68px)';

  // Hero sections don't need extra padding (they handle it themselves)
  const hero = document.querySelector('.hero');
  if (hero) {
    document.body.style.paddingTop = '0';
  }
})();
