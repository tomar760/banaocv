/* ============================================================
   BanaoCV — backend/controllers/authController.js
   Auth Controller
   ============================================================ */

const { supabase } = require('../config/supabase');
const jwt          = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET || 'banaocv-secret-change-this';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Sab fields required hain' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password 8+ characters ka hona chahiye' });

    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata : { name, plan: 'free' },
      email_confirm : false,
    });

    if (error) throw new Error(error.message);

    const token = signToken(data.user.id);
    res.status(201).json({
      success : true,
      message : 'Account ban gaya!',
      token,
      user    : { id: data.user.id, name, email, plan: 'free' },
    });
  } catch(err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email aur password required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email ya password galat hai');

    const token = signToken(data.user.id);
    res.json({
      success : true,
      message : 'Login successful!',
      token,
      user    : {
        id    : data.user.id,
        name  : data.user.user_metadata?.name || email.split('@')[0],
        email : data.user.email,
        plan  : data.user.user_metadata?.plan || 'free',
      },
    });
  } catch(err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logout ho gaye!' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/login.html?mode=reset`,
    });

    res.json({ success: true, message: 'Reset link bhej diya gaya!' });
  } catch(err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, token } = req.body;
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    res.json({ success: true, message: 'Password update ho gaya!' });
  } catch(err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      user_metadata: { name, phone, location },
    });
    if (error) throw new Error(error.message);
    res.json({ success: true, message: 'Profile update ho gayi!' });
  } catch(err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
