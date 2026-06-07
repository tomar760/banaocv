/* ============================================================
   BanaoCV — backend/controllers/paymentController.js
   Razorpay Payment Controller
   ============================================================ */

const Razorpay   = require('razorpay');
const crypto     = require('crypto');
const { supabase } = require('../config/supabase');

const razorpay = new Razorpay({
  key_id    : process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  premium: { amount: 9900,  name: 'BanaoCV Premium' },
  annual : { amount: 69900, name: 'BanaoCV Annual' },
  pro    : { amount: 29900, name: 'BanaoCV Pro Team' },
};

exports.createOrder = async (req, res) => {
  try {
    const { plan = 'premium' } = req.body;
    const planData = PLANS[plan];
    if (!planData) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const order = await razorpay.orders.create({
      amount  : planData.amount,
      currency: 'INR',
      receipt : `order_${req.user.id}_${Date.now()}`,
      notes   : { user_id: req.user.id, plan },
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update user plan in Supabase
    await supabase.auth.admin.updateUserById(req.user.id, {
      user_metadata: {
        plan        : plan === 'pro' ? 'pro' : 'premium',
        upgraded_at : new Date().toISOString(),
        payment_id  : razorpay_payment_id,
      },
    });

    // Save payment record
    await supabase.from('payments').insert({
      user_id       : req.user.id,
      plan,
      amount        : PLANS[plan]?.amount || 9900,
      payment_id    : razorpay_payment_id,
      order_id      : razorpay_order_id,
      status        : 'success',
    });

    res.json({ success: true, message: 'Payment verified! Premium unlock ho gaya.' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ success: true, payments: data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    const sig  = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (sig !== expected) return res.status(400).send('Invalid signature');

    const { event, payload } = req.body;
    if (event === 'payment.captured') {
      console.log('Payment captured:', payload.payment.entity.id);
    }

    res.json({ status: 'ok' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
