/* ============================================================
   BanaoCV — assets/js/mobile.js
   Touch gestures, swipe, mobile UX
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. DEVICE DETECTION
══════════════════════════════════════════════════════════ */
const Device = {
  isMobile  : () => window.innerWidth <= 900,
  isTouch   : () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  isIOS     : () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid : () => /Android/.test(navigator.userAgent),
  isSafari  : () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
};

/* ══════════════════════════════════════════════════════════
   2. MOBILE EDITOR TAB SWITCHING
══════════════════════════════════════════════════════════ */
const MobileEditor = (() => {

  const panels = {
    edit    : '.editor-left-panel',
    design  : '.editor-left-panel',
    preview : '.editor-canvas-wrap',
    ai      : '.editor-right-panel',
  };

  let currentTab = 'edit';

  function switchTo(name, btn) {
    if (!Device.isMobile()) return;

    currentTab = name;

    // Hide all
    document.querySelectorAll('.editor-left-panel, .editor-canvas-wrap, .editor-right-panel')
      .forEach(el => el.classList.remove('mobile-active'));

    // Show target
    const selector = panels[name];
    if (selector) {
      const el = document.querySelector(selector);
      if (el) el.classList.add('mobile-active');
    }

    // Update tab buttons
    document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Design tab → switch to design tab in left panel
    if (name === 'design') {
      const designTab = document.querySelector('[data-tab="design"]');
      if (designTab && typeof switchLeftTab === 'function') {
        switchLeftTab('design', designTab);
      }
    }

    // Edit tab → switch to content tab
    if (name === 'edit') {
      const contentTab = document.querySelector('[data-tab="content"]');
      if (contentTab && typeof switchLeftTab === 'function') {
        switchLeftTab('content', contentTab);
      }
    }

    // Scroll to top of active panel
    const activeEl = document.querySelector(`${selector}.mobile-active`);
    if (activeEl) activeEl.scrollTop = 0;
  }

  function init() {
    if (!Device.isMobile()) return;

    // Show edit panel by default
    const editPanel = document.querySelector('.editor-left-panel');
    if (editPanel) editPanel.classList.add('mobile-active');

    // Expose mobileTab globally
    window.mobileTab = switchTo;

    // Add editor-page class to body
    document.body.classList.add('editor-page');
  }

  return { init, switchTo };
})();

/* ══════════════════════════════════════════════════════════
   3. SWIPE GESTURES
══════════════════════════════════════════════════════════ */
const SwipeHandler = (() => {
  let startX = 0, startY = 0, startTime = 0;
  const THRESHOLD  = 60;  // min px to count as swipe
  const RESTRAINT  = 100; // max perpendicular movement
  const MAX_TIME   = 300; // max ms

  function onTouchStart(e) {
    startX    = e.touches[0].clientX;
    startY    = e.touches[0].clientY;
    startTime = Date.now();
  }

  function onTouchEnd(e) {
    const dx   = e.changedTouches[0].clientX - startX;
    const dy   = e.changedTouches[0].clientY - startY;
    const dt   = Date.now() - startTime;

    if (dt > MAX_TIME)          return;
    if (Math.abs(dy) > RESTRAINT) return;

    if (Math.abs(dx) >= THRESHOLD) {
      const dir = dx > 0 ? 'right' : 'left';
      handleSwipe(dir, e.target);
    }
  }

  function handleSwipe(dir, target) {
    // Close mobile nav on swipe left
    const mobileMenu = document.querySelector('.nav-mobile');
    if (mobileMenu?.classList.contains('open') && dir === 'left') {
      document.querySelector('.nav-hamburger')?.click();
      return;
    }

    // Editor panel swipe navigation
    if (document.querySelector('.editor-shell')) {
      const tabs   = ['edit', 'preview', 'ai'];
      const curIdx = tabs.indexOf(window._currentMobileTab || 'edit');

      if (dir === 'left'  && curIdx < tabs.length - 1) {
        const btn = document.querySelectorAll('.mobile-tab')[curIdx + 1];
        MobileEditor.switchTo(tabs[curIdx + 1], btn);
        window._currentMobileTab = tabs[curIdx + 1];
      }
      if (dir === 'right' && curIdx > 0) {
        const btn = document.querySelectorAll('.mobile-tab')[curIdx - 1];
        MobileEditor.switchTo(tabs[curIdx - 1], btn);
        window._currentMobileTab = tabs[curIdx - 1];
      }
    }

    // Close preview modal on swipe down (handled separately)
  }

  function init() {
    if (!Device.isTouch()) return;
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   4. TEMPLATE CARDS — Tap to reveal overlay
══════════════════════════════════════════════════════════ */
const TouchCards = (() => {
  function init() {
    if (!Device.isTouch()) return;

    document.addEventListener('click', (e) => {
      const card = e.target.closest('.template-card, .tpl-card');
      if (!card) {
        // Click outside — untap all
        document.querySelectorAll('.template-card.tapped, .tpl-card.tapped')
          .forEach(c => c.classList.remove('tapped'));
        return;
      }

      // If clicking a button inside card — let it through
      if (e.target.closest('.btn, button, a')) return;

      // Toggle tapped state
      const wasTapped = card.classList.contains('tapped');
      document.querySelectorAll('.template-card.tapped, .tpl-card.tapped')
        .forEach(c => c.classList.remove('tapped'));

      if (!wasTapped) card.classList.add('tapped');
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   5. PULL TO REFRESH (Editor auto-save)
══════════════════════════════════════════════════════════ */
const PullToRefresh = (() => {
  let startY = 0, pulling = false;
  let indicator;

  function createIndicator() {
    indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed; top: var(--nav-h); left: 50%; transform: translateX(-50%) translateY(-50px);
      background: var(--brand); color: white; padding: 8px 20px; border-radius: 20px;
      font-size: 0.8rem; font-weight: 600; z-index: 9999;
      transition: transform 0.3s ease; pointer-events: none; opacity: 0;
    `;
    indicator.textContent = '↓ Neeche kheencho save karne ke liye';
    document.body.appendChild(indicator);
    return indicator;
  }

  function init() {
    if (!Device.isTouch()) return;
    if (!document.querySelector('.editor-shell')) return;

    const ind = createIndicator();
    const canvas = document.querySelector('.editor-canvas-wrap');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      if (canvas.scrollTop === 0) {
        startY  = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 20 && dy < 100) {
        ind.style.opacity   = Math.min(1, dy / 60).toString();
        ind.style.transform = `translateX(-50%) translateY(${Math.min(dy - 40, 10)}px)`;
        ind.textContent     = dy > 60 ? '↑ Chhodo save karne ke liye' : '↓ Neeche kheencho save karne ke liye';
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (!pulling) return;
      const dy = e.changedTouches[0].clientY - startY;
      pulling = false;

      ind.style.opacity   = '0';
      ind.style.transform = 'translateX(-50%) translateY(-50px)';

      if (dy > 60) {
        if (typeof autoSave === 'function') autoSave();
        window.RW?.Toast?.success('Saved! ✓');
      }
    }, { passive: true });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   6. BOTTOM SHEET — Mobile modals
══════════════════════════════════════════════════════════ */
const BottomSheet = (() => {
  function init() {
    if (!Device.isMobile()) return;

    // Add drag-to-close for modals
    document.querySelectorAll('.modal').forEach(modal => {
      let startY = 0, dragging = false;

      modal.addEventListener('touchstart', (e) => {
        if (e.touches[0].clientY < modal.getBoundingClientRect().top + 40) {
          startY   = e.touches[0].clientY;
          dragging = true;
        }
      }, { passive: true });

      modal.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 0) {
          modal.style.transform = `translateY(${dy}px)`;
        }
      }, { passive: true });

      modal.addEventListener('touchend', (e) => {
        if (!dragging) return;
        const dy = e.changedTouches[0].clientY - startY;
        dragging = false;
        modal.style.transform = '';

        if (dy > 100) {
          const overlay = modal.closest('.modal-overlay');
          if (overlay) {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
          }
        }
      }, { passive: true });
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   7. INPUT FOCUS — Scroll into view on mobile
══════════════════════════════════════════════════════════ */
const InputFocus = (() => {
  function init() {
    if (!Device.isMobile()) return;

    document.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('focus', () => {
        // Small delay for keyboard to appear
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      });
    });

    // iOS keyboard pushes content — handle viewport
    if (Device.isIOS()) {
      const origHeight = window.innerHeight;
      window.addEventListener('resize', () => {
        const isKeyboard = window.innerHeight < origHeight * 0.75;
        document.body.style.paddingBottom = isKeyboard ? '0' : '';
      });
    }
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   8. SMOOTH SCROLL — Mobile panels
══════════════════════════════════════════════════════════ */
const SmoothPanels = (() => {
  function init() {
    // All scrollable panels — momentum scrolling
    document.querySelectorAll(
      '.editor-left-panel, .editor-canvas-wrap, .editor-right-panel, .left-panel-body, .right-panel-body'
    ).forEach(el => {
      el.style.webkitOverflowScrolling = 'touch';
      el.style.overflowY = 'auto';
    });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   9. HAPTIC FEEDBACK (Android/iOS)
══════════════════════════════════════════════════════════ */
const Haptic = (() => {
  function light() {
    if ('vibrate' in navigator) navigator.vibrate(10);
  }

  function medium() {
    if ('vibrate' in navigator) navigator.vibrate(20);
  }

  function success() {
    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
  }

  function init() {
    if (!Device.isTouch()) return;

    // Buttons — light tap
    document.querySelectorAll('.btn, button').forEach(btn => {
      btn.addEventListener('touchstart', () => light(), { passive: true });
    });

    // CTA buttons — stronger
    document.querySelectorAll('.btn-primary, .btn-gold').forEach(btn => {
      btn.addEventListener('click', () => medium());
    });
  }

  return { init, light, medium, success };
})();

/* ══════════════════════════════════════════════════════════
   10. RESIZE HANDLER
══════════════════════════════════════════════════════════ */
const ResizeHandler = (() => {
  let lastWidth = window.innerWidth;

  function onResize() {
    const currentWidth = window.innerWidth;
    if (currentWidth === lastWidth) return;
    lastWidth = currentWidth;

    if (currentWidth > 900) {
      // Desktop — show all panels
      document.querySelectorAll('.editor-left-panel, .editor-canvas-wrap, .editor-right-panel')
        .forEach(el => { el.style.display = ''; el.classList.remove('mobile-active'); });
    } else {
      // Mobile — reinit
      MobileEditor.init();
    }
  }

  function init() {
    window.addEventListener('resize', debounce(onResize, 150));
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   11. PREVENT DOUBLE TAP ZOOM — Buttons
══════════════════════════════════════════════════════════ */
function preventDoubleTapZoom() {
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    const el  = e.target.closest('button, a, .btn');
    if (el && now - lastTap < 300) {
      e.preventDefault();
    }
    lastTap = now;
  });
}

/* ══════════════════════════════════════════════════════════
   12. EDITOR RESUME PAPER — Pinch to zoom
══════════════════════════════════════════════════════════ */
const PinchZoom = (() => {
  let initialDist = 0;
  let currentScale = 1;

  function getDistance(touches) {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  function init() {
    const paper = document.getElementById('resume-paper');
    if (!paper || !Device.isTouch()) return;

    paper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDist = getDistance(e.touches);
      }
    }, { passive: true });

    paper.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2) return;
      const dist  = getDistance(e.touches);
      const scale = currentScale * (dist / initialDist);
      const clamped = Math.max(0.5, Math.min(2, scale));

      paper.style.transform       = `scale(${clamped})`;
      paper.style.transformOrigin = 'top center';

      const label = document.getElementById('zoom-label');
      if (label) label.textContent = Math.round(clamped * 100) + '%';
    }, { passive: true });

    paper.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        const matrix = new DOMMatrix(getComputedStyle(paper).transform);
        currentScale = matrix.a;
      }
    }, { passive: true });
  }

  return { init };
})();

/* ══════════════════════════════════════════════════════════
   13. MOBILE SHARE — Native share API
══════════════════════════════════════════════════════════ */
window.nativeShare = async function(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      window.RW?.Toast?.success('Shared! 🎉');
    } catch (err) {
      if (err.name !== 'AbortError') {
        window.RW?.Toast?.error('Share fail hua, copy karo link.');
      }
    }
  } else {
    // Fallback
    window.RW?.Clipboard?.copy(url, 'Link copy ho gaya!');
  }
};

/* ══════════════════════════════════════════════════════════
   14. FIX — iOS 100vh issue
══════════════════════════════════════════════════════════ */
function fixIOSViewport() {
  if (!Device.isIOS()) return;

  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => setTimeout(setVH, 100));
}

/* ══════════════════════════════════════════════════════════
   15. INIT ALL
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fixIOSViewport();
  preventDoubleTapZoom();

  MobileEditor.init();
  SwipeHandler.init();
  TouchCards.init();
  BottomSheet.init();
  InputFocus.init();
  SmoothPanels.init();
  ResizeHandler.init();
  PinchZoom.init();
  PullToRefresh.init();

  if (Device.isTouch()) {
    Haptic.init();
  }

  // Expose
  window.RW = window.RW || {};
  window.RW.Haptic = Haptic;
  window.RW.Device = Device;
});
