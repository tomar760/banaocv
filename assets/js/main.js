/* ============================================================
   BanaoCV — main.js
   Common JS — runs on every page
   Navbar, scroll reveal, FAQ, toast, modals, counters
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. NAVBAR
══════════════════════════════════════════════════════════ */
const Navbar = (() => {
  const navbar      = document.getElementById('navbar');
  const hamburger   = document.querySelector('.nav-hamburger');
  const mobileMenu  = document.querySelector('.nav-mobile');
  const navLinks    = document.querySelectorAll('.nav-link');

  // Scroll — add .scrolled class
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Highlight active link based on current page
  function setActiveLink() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Mobile hamburger toggle
  function toggleMobile() {
    if (!hamburger || !mobileMenu) return;
    const isOpen = mobileMenu.classList.contains('open');
    hamburger.classList.toggle('open', !isOpen);
    mobileMenu.classList.toggle('open', !isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  }

  // Close mobile on outside click
  function onOutsideClick(e) {
    if (!mobileMenu || !hamburger) return;
    if (mobileMenu.classList.contains('open')) {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  }

  // Close mobile on nav link click
  function onMobileLinkClick() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    setActiveLink();

    if (hamburger) hamburger.addEventListener('click', toggleMobile);
    document.addEventListener('click', onOutsideClick);

    document.querySelectorAll('.nav-mobile .nav-link').forEach(link => {
      link.addEventListener('click', onMobileLinkClick);
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   2. SCROLL REVEAL (IntersectionObserver)
══════════════════════════════════════════════════════════ */
const ScrollReveal = (() => {
  function init() {
    const targets = document.querySelectorAll('[data-reveal], [data-stagger]');
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    targets.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   3. TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════ */
const Toast = (() => {
  let container;

  function getContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(message, type = 'default', duration = 3500) {
    const c = getContainer();
    const icons = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      default: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type !== 'default' ? type : ''}`;
    toast.innerHTML = `
      <span style="font-size:1rem;flex-shrink:0">${icons[type] || icons.default}</span>
      <span>${message}</span>
    `;

    c.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    });

    return toast;
  }

  return {
    show,
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error',   dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
    info:    (msg, dur) => show(msg, 'default',  dur),
  };
})();

/* ══════════════════════════════════════════════════════════
   4. MODAL SYSTEM
══════════════════════════════════════════════════════════ */
const Modal = (() => {
  function open(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close(id) {
    const overlay = id
      ? document.getElementById(id)
      : document.querySelector('.modal-overlay.open');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    // Open buttons: data-modal-open="modal-id"
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      btn.addEventListener('click', () => open(btn.dataset.modalOpen));
    });

    // Close buttons: data-modal-close or .modal-close inside overlay
    document.querySelectorAll('[data-modal-close], .modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) close(overlay.id);
      });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay.id);
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  return { open, close, init };
})();

/* ══════════════════════════════════════════════════════════
   5. FAQ ACCORDION
══════════════════════════════════════════════════════════ */
const FAQ = (() => {
  function init() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        items.forEach(i => i.classList.remove('open'));

        // Toggle current
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   6. RIPPLE EFFECT ON BUTTONS
══════════════════════════════════════════════════════════ */
const Ripple = (() => {
  function createRipple(e) {
    const btn    = e.currentTarget;
    const circle = document.createElement('span');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    circle.className = 'ripple-circle';
    circle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;

    btn.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove(), { once: true });
  }

  function init() {
    document.querySelectorAll('.btn-ripple, .btn-primary, .btn-gold').forEach(btn => {
      btn.classList.add('btn-ripple');
      btn.addEventListener('click', createRipple);
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   7. ANIMATED NUMBER COUNTER
══════════════════════════════════════════════════════════ */
const Counter = (() => {
  function animateCount(el) {
    const target   = parseInt(el.dataset.count, 10);
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    const duration = parseInt(el.dataset.duration, 10) || 1800;
    const start    = performance.now();

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current  = Math.round(ease(progress) * target);
      el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function init() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   8. SMOOTH SCROLL FOR ANCHOR LINKS
══════════════════════════════════════════════════════════ */
const SmoothScroll = (() => {
  function init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const navH   = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-h'), 10) || 68;
        const top    = target.getBoundingClientRect().top + window.scrollY - navH - 16;

        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   9. PRICING TOGGLE (Monthly / Annual) — if on pricing page
══════════════════════════════════════════════════════════ */
const PricingToggle = (() => {
  function init() {
    const toggle    = document.getElementById('pricing-toggle');
    const prices    = document.querySelectorAll('[data-monthly][data-annual]');
    const labels    = document.querySelectorAll('.pricing-toggle-label');
    if (!toggle) return;

    toggle.addEventListener('change', () => {
      const isAnnual = toggle.checked;

      prices.forEach(el => {
        el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
      });

      labels.forEach((label, i) => {
        label.style.fontWeight = (isAnnual && i === 1) || (!isAnnual && i === 0) ? '700' : '400';
        label.style.color      = (isAnnual && i === 1) || (!isAnnual && i === 0)
          ? 'var(--brand)' : 'var(--text-3)';
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   10. GOOGLE SIGN-IN HANDLER (stub — connected in auth.js)
══════════════════════════════════════════════════════════ */
const GoogleAuth = (() => {
  function init() {
    document.querySelectorAll('.btn-google').forEach(btn => {
      btn.addEventListener('click', () => {
        // Will be handled by auth.js fully
        // This prevents default form behavior
        btn.innerHTML = `
          <span class="spinner spinner-sm"></span>
          <span>Connecting...</span>
        `;
        btn.disabled = true;
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   11. BACK TO TOP BUTTON
══════════════════════════════════════════════════════════ */
const BackToTop = (() => {
  function init() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.style.opacity   = window.scrollY > 400 ? '1' : '0';
      btn.style.transform = window.scrollY > 400 ? 'translateY(0)' : 'translateY(20px)';
      btn.style.pointerEvents = window.scrollY > 400 ? 'all' : 'none';
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   12. COPY TO CLIPBOARD UTILITY
══════════════════════════════════════════════════════════ */
const Clipboard = (() => {
  async function copy(text, successMsg = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text);
      Toast.success(successMsg);
      return true;
    } catch {
      Toast.error('Copy nahi hua, manually karo.');
      return false;
    }
  }

  function init() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        copy(btn.dataset.copy, btn.dataset.copyMsg || 'Copied!');
      });
    });
  }

  return { copy, init };
})();

/* ══════════════════════════════════════════════════════════
   13. LAZY LOAD IMAGES
══════════════════════════════════════════════════════════ */
const LazyImages = (() => {
  function init() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => observer.observe(img));
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   14. AUTH STATE — show/hide elements based on login
══════════════════════════════════════════════════════════ */
const AuthState = (() => {
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('rw_user') || 'null');
    } catch {
      return null;
    }
  }

  function updateUI() {
    const user = getUser();
    const loggedIn  = !!user;

    // Show/hide based on auth state
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
      el.style.display = loggedIn ? '' : 'none';
    });

    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
      el.style.display = loggedIn ? 'none' : '';
    });

    // Set user name if element exists
    if (user) {
      document.querySelectorAll('[data-user-name]').forEach(el => {
        el.textContent = user.name || 'User';
      });
    }

    // Update nav CTA
    const navCTA = document.querySelector('.nav-cta-btn');
    if (navCTA) {
      if (loggedIn) {
        navCTA.href        = 'dashboard.html';
        navCTA.textContent = 'Dashboard';
      } else {
        navCTA.href        = '#';
        navCTA.textContent = 'Free Mein Shuru Karo';
        navCTA.setAttribute('data-modal-open', 'auth-modal');
      }
    }
  }

  function logout() {
    localStorage.removeItem('rw_user');
    localStorage.removeItem('rw_token');
    Toast.success('Logout ho gaye!');
    setTimeout(() => window.location.href = 'index.html', 800);
  }

  function init() {
    updateUI();

    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', logout);
    });
  }

  return { init, getUser, updateUI, logout };
})();

/* ══════════════════════════════════════════════════════════
   15. MARQUEE — duplicate items for infinite scroll
══════════════════════════════════════════════════════════ */
const Marquee = (() => {
  function init() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;

    // Duplicate children for seamless loop
    const items = track.innerHTML;
    track.innerHTML = items + items;
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   16. TEMPLATES FILTER (homepage preview section)
══════════════════════════════════════════════════════════ */
const TemplatesFilter = (() => {
  function init() {
    const tabs  = document.querySelectorAll('.templates-tab');
    const cards = document.querySelectorAll('.template-card');
    if (!tabs.length || !cards.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;

        cards.forEach(card => {
          const category = card.dataset.category;
          const show = filter === 'all' || category === filter;

          if (show) {
            card.style.display = '';
            // Stagger reveal
            setTimeout(() => {
              card.style.opacity   = '1';
              card.style.transform = 'translateY(0)';
            }, 50);
          } else {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(16px)';
            setTimeout(() => { card.style.display = 'none'; }, 200);
          }
        });
      });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   17. GLOBAL ERROR HANDLER
══════════════════════════════════════════════════════════ */
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

/* ══════════════════════════════════════════════════════════
   18. EXPOSE GLOBALS
══════════════════════════════════════════════════════════ */
window.RW = {
  Toast,
  Modal,
  AuthState,
  Clipboard,
};

/* ══════════════════════════════════════════════════════════
   19. INIT ALL ON DOM READY
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
  ScrollReveal.init();
  Modal.init();
  FAQ.init();
  Ripple.init();
  Counter.init();
  SmoothScroll.init();
  PricingToggle.init();
  BackToTop.init();
  Clipboard.init();
  LazyImages.init();
  AuthState.init();
  Marquee.init();
  TemplatesFilter.init();
  GoogleAuth.init();
});
