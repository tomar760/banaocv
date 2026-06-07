/* ============================================================
   BanaoCV — assets/js/payment.js
   Razorpay Payment Integration
   ============================================================ */

'use strict';

const Payment = {

  config: {
    keyId     : 'YOUR_RAZORPAY_KEY_ID', // Replace with real key
    currency  : 'INR',
    company   : 'BanaoCV',
    logo      : '',
    theme     : { color: '#1B3A6B' },
  },

  plans: {
    premium: { amount: 9900,  name: 'Premium Plan',   desc: 'Lifetime access — ek baar ki payment' },
    annual : { amount: 69900, name: 'Annual Plan',     desc: '1 saal ka access — 40% savings' },
    pro    : { amount: 29900, name: 'Pro Team/Month',  desc: '10 members, analytics, API' },
  },

  /* ── Open Razorpay checkout ── */
  async open(planKey = 'premium') {
    const user = window.Session?.get();
    const plan = this.plans[planKey];
    if (!plan) return;

    // Load Razorpay script dynamically
    await this.loadScript();

    const options = {
      key         : this.config.keyId,
      amount      : plan.amount,
      currency    : this.config.currency,
      name        : this.config.company,
      description : plan.desc,
      image       : this.config.logo,
      prefill: {
        name    : user?.name  || '',
        email   : user?.email || '',
        contact : user?.phone || '',
      },
      notes: {
        plan    : planKey,
        user_id : user?.id || 'guest',
      },
      theme   : this.config.theme,
      handler : (response) => this.onSuccess(response, planKey),
      modal: {
        ondismiss: () => {
          window.RW?.Toast?.info('Payment cancel ho gayi.');
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => this.onFailure(resp));
      rzp.open();
    } catch(err) {
      // Demo mode
      this.demoPayment(planKey);
    }
  },

  /* ── Payment success ── */
  async onSuccess(response, planKey) {
    window.RW?.Toast?.success('Payment ho gayi! Verify kar rahe hain...');

    try {
      // Verify on backend
      const res = await fetch('/api/payment/verify', {
        method  : 'POST',
        headers : {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${window.Session?.getToken()}`,
        },
        body: JSON.stringify({
          razorpay_payment_id  : response.razorpay_payment_id,
          razorpay_order_id    : response.razorpay_order_id,
          razorpay_signature   : response.razorpay_signature,
          plan                 : planKey,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local session
        const user = window.Session?.get();
        if (user) {
          user.plan = planKey === 'pro' ? 'pro' : 'premium';
          window.Session?.save(user, window.Session?.getToken());
        }

        window.RW?.Toast?.success('Premium unlock ho gaya! 🎉');
        window.RW?.Modal?.close('payment-modal');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch(err) {
      // If backend not connected — still unlock in demo
      this.demoUnlock(planKey);
    }
  },

  /* ── Payment failure ── */
  onFailure(resp) {
    const msg = resp.error?.description || 'Payment fail ho gayi';
    window.RW?.Toast?.error('❌ ' + msg);
  },

  /* ── Demo mode ── */
  demoPayment(planKey) {
    window.RW?.Toast?.info('Demo mode — real mein Razorpay key daalo');
    setTimeout(() => this.demoUnlock(planKey), 1000);
  },

  demoUnlock(planKey) {
    const user = window.Session?.get();
    if (user) {
      user.plan = planKey === 'pro' ? 'pro' : 'premium';
      window.Session?.save(user, window.Session?.getToken());
    }
    window.RW?.Toast?.success('Premium unlock ho gaya! 🎉');
    window.RW?.Modal?.close('payment-modal');
    setTimeout(() => window.location.href = 'dashboard.html', 1200);
  },

  /* ── Create order (calls backend) ── */
  async createOrder(planKey) {
    const res = await fetch('/api/payment/create-order', {
      method  : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${window.Session?.getToken()}`,
      },
      body: JSON.stringify({ plan: planKey }),
    });
    return await res.json();
  },

  /* ── Load Razorpay script ── */
  loadScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(); return; }
      const s   = document.createElement('script');
      s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload  = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  },
};

/* ── Global startPayment function ── */
window.startPayment = (plan = 'premium') => Payment.open(plan);
window.Payment = Payment;
window.RW = window.RW || {};
window.RW.Payment = Payment;
