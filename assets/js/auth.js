/* ============================================================
   BanaoCV — assets/js/auth.js
   Complete LOCAL Authentication — No API needed
   Works 100% without Supabase in demo mode
   - Email/Password login & signup
   - Google OAuth
   - OTP verification
   - Password reset
   - Session management
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONFIG — Replace with your actual Supabase credentials
══════════════════════════════════════════════════════════ */
const AUTH_CONFIG = {
  supabaseUrl : 'YOUR_SUPABASE_URL',
  supabaseKey : 'YOUR_SUPABASE_ANON_KEY',
  redirectUrl : window.location.origin + '/dashboard.html',
};

/* ══════════════════════════════════════════════════════════
   SUPABASE CLIENT (loaded via CDN in HTML)
   Add this to your HTML head:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
══════════════════════════════════════════════════════════ */
let supabase;

function initSupabase() {
  if (typeof window.supabase !== 'undefined' &&
      AUTH_CONFIG.supabaseUrl !== 'YOUR_SUPABASE_URL') {
    supabase = window.supabase.createClient(
      AUTH_CONFIG.supabaseUrl,
      AUTH_CONFIG.supabaseKey
    );
    return true;
  }
  return false;
}

/* ══════════════════════════════════════════════════════════
   SESSION MANAGEMENT
══════════════════════════════════════════════════════════ */
const Session = {
  save(user, token) {
    try {
      localStorage.setItem('rw_user',  JSON.stringify(user));
      localStorage.setItem('rw_token', token || '');
    } catch(e) {}
  },

  get() {
    try {
      return JSON.parse(localStorage.getItem('rw_user') || 'null');
    } catch { return null; }
  },

  getToken() {
    return localStorage.getItem('rw_token') || '';
  },

  clear() {
    localStorage.removeItem('rw_user');
    localStorage.removeItem('rw_token');
    localStorage.removeItem('rw_draft');
  },

  isLoggedIn() {
    return !!this.get();
  },

  isPremium() {
    const user = this.get();
    return user?.plan === 'premium' || user?.plan === 'pro';
  },
};

/* ══════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════ */
function setLoading(btnId, loading, originalText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner spinner-sm spinner-white"></span> Please wait...`
    : originalText;
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent    = msg;
  el.style.display  = 'block';
  el.style.animation = 'fadeUp 0.3s ease both';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

function hideError(elId) {
  const el = document.getElementById(elId);
  if (el) el.style.display = 'none';
}

function showSuccess(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent   = msg;
  el.style.display = 'block';
}

/* ══════════════════════════════════════════════════════════
   VALIDATION
══════════════════════════════════════════════════════════ */
const Validate = {
  email(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  },
  password(val) {
    return val && val.length >= 8;
  },
  name(val) {
    return val && val.trim().length >= 2;
  },
};

/* ══════════════════════════════════════════════════════════
   MAIN AUTH OBJECT
══════════════════════════════════════════════════════════ */
const Auth = {

  /* ────────────────────────────────────────
     EMAIL LOGIN
  ──────────────────────────────────────── */
  async emailLogin(e) {
    if (e) e.preventDefault();
    hideError('login-error');

    const email    = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const remember = document.getElementById('remember-me')?.checked;

    // Validate
    if (!email || !Validate.email(email)) {
      showError('login-error', '⚠️ Sahi email daalo');
      return;
    }
    if (!password) {
      showError('login-error', '⚠️ Password daalo');
      return;
    }

    setLoading('login-btn', true, 'Login Karo →');

    try {
      // Try Supabase first
      if (initSupabase()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw new Error(error.message);

        const user = {
          id    : data.user.id,
          email : data.user.email,
          name  : data.user.user_metadata?.name || email.split('@')[0],
          plan  : data.user.user_metadata?.plan || 'free',
        };

        Session.save(user, data.session?.access_token);
        Auth.onLoginSuccess(user);

      } else {
        // Demo mode — works without backend
        await Auth.demoLogin(email, password);
      }
    } catch(err) {
      const msg = Auth.getErrorMessage(err.message);
      showError('login-error', '❌ ' + msg);
      setLoading('login-btn', false, 'Login Karo →');
    }
  },

  /* ────────────────────────────────────────
     EMAIL SIGNUP
  ──────────────────────────────────────── */
  async emailSignup(e) {
    if (e) e.preventDefault();
    hideError('signup-error');

    const fname    = document.getElementById('signup-fname')?.value?.trim();
    const lname    = document.getElementById('signup-lname')?.value?.trim() || '';
    const email    = document.getElementById('signup-email')?.value?.trim();
    const password = document.getElementById('signup-password')?.value;
    const name     = (fname + ' ' + lname).trim();

    // Validate
    if (!Validate.name(fname)) {
      showError('signup-error', '⚠️ Apna naam daalo (2+ characters)');
      return;
    }
    if (!email || !Validate.email(email)) {
      showError('signup-error', '⚠️ Sahi email address daalo');
      return;
    }
    if (!Validate.password(password)) {
      showError('signup-error', '⚠️ Password kam se kam 8 characters ka hona chahiye');
      return;
    }

    setLoading('signup-btn', true, 'Free Account Banao 🎉');

    try {
      if (initSupabase()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, plan: 'free' },
            emailRedirectTo: AUTH_CONFIG.redirectUrl,
          },
        });

        if (error) throw new Error(error.message);

        // Check if email confirmation needed
        if (data.user && !data.session) {
          // Email confirmation required
          window.pendingEmail = email;
          if (typeof switchView === 'function') switchView('otp');
          if (typeof startResendTimer === 'function') startResendTimer(30);
          const sub = document.getElementById('otp-sub');
          if (sub) sub.textContent = `6-digit OTP bheja hai ${email} pe`;
          setLoading('signup-btn', false, 'Free Account Banao 🎉');
        } else if (data.session) {
          const user = {
            id    : data.user.id,
            email : data.user.email,
            name,
            plan  : 'free',
          };
          Session.save(user, data.session.access_token);
          Auth.onSignupSuccess(user);
        }

      } else {
        // Demo mode
        await Auth.demoSignup(name, email, password);
      }
    } catch(err) {
      const msg = Auth.getErrorMessage(err.message);
      showError('signup-error', '❌ ' + msg);
      setLoading('signup-btn', false, 'Free Account Banao 🎉');
    }
  },

  /* ────────────────────────────────────────
     GOOGLE LOGIN
  ──────────────────────────────────────── */
  async googleLogin() {
    const btnId = document.getElementById('view-login')?.classList.contains('active')
      ? 'google-login-btn'
      : 'google-signup-btn';

    const btn = document.getElementById(btnId);
    if (btn) {
      btn.innerHTML = `<span class="spinner spinner-sm"></span> Google se connect ho raha hai...`;
      btn.disabled  = true;
    }

    try {
      if (initSupabase()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider : 'google',
          options  : { redirectTo: AUTH_CONFIG.redirectUrl },
        });
        if (error) throw new Error(error.message);
        // Redirect happens automatically

      } else {
        // Demo Google login
        await new Promise(r => setTimeout(r, 1500));
        const demoUser = {
          id    : 'demo-' + Date.now(),
          email : 'demo@gmail.com',
          name  : 'Demo User',
          plan  : 'free',
          avatar: 'https://lh3.googleusercontent.com/a/demo',
        };
        Session.save(demoUser, 'demo-token');
        Auth.onLoginSuccess(demoUser);
      }
    } catch(err) {
      window.RW?.Toast?.error('Google login fail hua — try again karo');
      if (btn) {
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google se Login Karo`;
        btn.disabled = false;
      }
    }
  },

  /* ────────────────────────────────────────
     FORGOT PASSWORD
  ──────────────────────────────────────── */
  async forgotPassword(e) {
    if (e) e.preventDefault();
    hideError('forgot-error');

    const email = document.getElementById('forgot-email')?.value?.trim();

    if (!email || !Validate.email(email)) {
      showError('forgot-error', '⚠️ Sahi email daalo');
      return;
    }

    setLoading('forgot-btn', true, 'Reset Link Bhejo');

    try {
      if (initSupabase()) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login.html?mode=reset',
        });
        if (error) throw new Error(error.message);
      }

      // Always show success (security: don't reveal if email exists)
      showSuccess('forgot-success', `✓ Reset link bhej diya ${email} pe! Inbox check karo (spam bhi dekho).`);
      setLoading('forgot-btn', false, 'Reset Link Bhejo');

    } catch(err) {
      showError('forgot-error', '❌ ' + Auth.getErrorMessage(err.message));
      setLoading('forgot-btn', false, 'Reset Link Bhejo');
    }
  },

  /* ────────────────────────────────────────
     OTP VERIFICATION
  ──────────────────────────────────────── */
  async verifyOTP() {
    hideError('otp-error');
    const otp = [0,1,2,3,4,5]
      .map(i => document.getElementById('otp-' + i)?.value || '')
      .join('');

    if (otp.length < 6) {
      showError('otp-error', '⚠️ Poora 6-digit OTP daalo');
      return;
    }

    setLoading('otp-btn', true, 'Verify Karo ✓');

    try {
      if (initSupabase() && window.pendingEmail) {
        const { data, error } = await supabase.auth.verifyOtp({
          email : window.pendingEmail,
          token : otp,
          type  : 'signup',
        });
        if (error) throw new Error(error.message);

        const user = {
          id    : data.user.id,
          email : data.user.email,
          name  : data.user.user_metadata?.name || data.user.email.split('@')[0],
          plan  : 'free',
        };
        Session.save(user, data.session?.access_token);
        Auth.onSignupSuccess(user);

      } else {
        // Demo OTP — accept "123456"
        if (otp === '123456' || otp.length === 6) {
          const demoUser = {
            id   : 'demo-' + Date.now(),
            email: window.pendingEmail || 'user@email.com',
            name : 'New User',
            plan : 'free',
          };
          Session.save(demoUser, 'demo-token');
          Auth.onSignupSuccess(demoUser);
        } else {
          throw new Error('Invalid OTP');
        }
      }
    } catch(err) {
      showError('otp-error', '❌ Galat OTP — phir se try karo');
      // Clear inputs
      [0,1,2,3,4,5].forEach(i => {
        const inp = document.getElementById('otp-' + i);
        if (inp) { inp.value = ''; inp.classList.remove('filled'); }
      });
      document.getElementById('otp-0')?.focus();
      setLoading('otp-btn', false, 'Verify Karo ✓');
    }
  },

  /* ────────────────────────────────────────
     RESEND OTP
  ──────────────────────────────────────── */
  async resendOTP() {
    const email = window.pendingEmail;
    if (!email) return;

    try {
      if (initSupabase()) {
        await supabase.auth.resend({ type: 'signup', email });
      }
      window.RW?.Toast?.success('OTP dobara bhej diya! ✓');
      if (typeof startResendTimer === 'function') startResendTimer(30);
    } catch(err) {
      window.RW?.Toast?.error('Resend fail hua — try again');
    }
  },

  /* ────────────────────────────────────────
     LOGOUT
  ──────────────────────────────────────── */
  async logout() {
    try {
      if (initSupabase()) {
        await supabase.auth.signOut();
      }
    } catch(e) {}

    Session.clear();
    window.RW?.Toast?.success('Logout ho gaye! 👋');
    setTimeout(() => window.location.href = 'index.html', 800);
  },

  /* ────────────────────────────────────────
     SUCCESS HANDLERS
  ──────────────────────────────────────── */
  onLoginSuccess(user) {
    window.RW?.Toast?.success(`Welcome back, ${user.name?.split(' ')[0]}! 👋`);

    // Redirect to intended page or dashboard
    const redirect = new URLSearchParams(window.location.search).get('next')
      || 'dashboard.html';

    setTimeout(() => window.location.href = redirect, 800);
  },

  onSignupSuccess(user) {
    if (typeof switchView === 'function') switchView('success');
    window.RW?.Toast?.success(`BanaoCV mein welcome, ${user.name?.split(' ')[0]}! 🎉`);

    // Auto redirect after 3 seconds
    setTimeout(() => window.location.href = 'editor.html', 3000);
  },

  /* ────────────────────────────────────────
     DEMO MODE (no backend)
  ──────────────────────────────────────── */
  async demoLogin(email, password) {
    await new Promise(r => setTimeout(r, 600));

    const stored = JSON.parse(localStorage.getItem('rw_users') || '{}');
    const key    = email.toLowerCase();

    if (!stored[key]) {
      throw new Error('No account found. Pehle signup karo.');
    }
    if (stored[key].password !== btoa(password)) {
      throw new Error('Email ya password galat hai');
    }

    const user = { ...stored[key] };
    delete user.password;
    Session.save(user, 'local-token-' + Date.now());
    Auth.onLoginSuccess(user);
  },

  async demoSignup(name, email, password) {
    await new Promise(r => setTimeout(r, 600));

    const stored = JSON.parse(localStorage.getItem('rw_users') || '{}');
    const key    = email.toLowerCase();

    if (stored[key]) {
      throw new Error('Yeh email already registered hai. Login karo.');
    }

    const user = {
      id      : 'u_' + Date.now(),
      email   : key,
      name,
      plan    : 'free',
      created : new Date().toISOString(),
      password: btoa(password),
    };

    stored[key] = user;
    localStorage.setItem('rw_users', JSON.stringify(stored));

    const userClean = { id: user.id, email: user.email, name: user.name, plan: user.plan };
    Session.save(userClean, 'local-token-' + Date.now());
    Auth.onSignupSuccess(userClean);
  },

  /* ────────────────────────────────────────
     ERROR MESSAGES — Hinglish
  ──────────────────────────────────────── */
  getErrorMessage(msg) {
    const map = {
      'Invalid login credentials'       : 'Email ya password galat hai',
      'Email not confirmed'             : 'Pehle email verify karo',
      'User already registered'         : 'Yeh email already registered hai',
      'Password should be at least 6'   : 'Password 8+ characters ka hona chahiye',
      'Unable to validate email address': 'Sahi email daalo',
      'Email rate limit exceeded'       : 'Zyada attempts — thodi der baad try karo',
      'Invalid OTP'                     : 'Galat OTP — sahi code daalo',
      'Token has expired'               : 'OTP expire ho gaya — dobara bhejo',
      'Wrong password'                  : 'Password galat hai',
      'No account found'                : 'Account nahi mila — pehle signup karo',
      'Yeh email already registered hai': 'Yeh email already registered hai',
    };

    for (const [key, val] of Object.entries(map)) {
      if (msg?.toLowerCase().includes(key.toLowerCase())) return val;
    }

    return msg || 'Kuch problem hui — dobara try karo';
  },
};

/* ══════════════════════════════════════════════════════════
   AUTH STATE LISTENER — updates UI on all pages
══════════════════════════════════════════════════════════ */
function initAuthListener() {
  if (!initSupabase()) return;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const user = {
        id    : session.user.id,
        email : session.user.email,
        name  : session.user.user_metadata?.name || session.user.email.split('@')[0],
        plan  : session.user.user_metadata?.plan || 'free',
      };
      Session.save(user, session.access_token);

      // Update UI
      if (window.RW?.AuthState) {
        window.RW.AuthState.updateUI();
      }
    }

    if (event === 'SIGNED_OUT') {
      Session.clear();
      if (window.RW?.AuthState) {
        window.RW.AuthState.updateUI();
      }
    }

    if (event === 'PASSWORD_RECOVERY') {
      // Show new password form
      if (typeof switchView === 'function') switchView('reset');
    }
  });
}

/* ══════════════════════════════════════════════════════════
   PROTECT PAGES — redirect if not logged in
══════════════════════════════════════════════════════════ */
function requireAuth() {
  if (!Session.isLoggedIn()) {
    const current = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?next=${current}`;
    return false;
  }
  return true;
}

function requirePremium() {
  if (!Session.isPremium()) {
    window.RW?.Modal?.open('auth-modal');
    return false;
  }
  return true;
}

/* ══════════════════════════════════════════════════════════
   EXPOSE GLOBALLY
══════════════════════════════════════════════════════════ */
window.Auth    = Auth;
window.Session = Session;

window.RW = window.RW || {};
window.RW.Auth    = Auth;
window.RW.Session = Session;

// Override logout in main.js
document.addEventListener('DOMContentLoaded', () => {
  initAuthListener();

  // Override logout buttons
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.onclick = () => Auth.logout();
  });

  // Override modal login/signup buttons
  window.RW.Auth = Auth;
});
