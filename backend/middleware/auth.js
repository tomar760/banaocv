/* ============================================================
   BanaoCV — backend/middleware/auth.js
   JWT Auth Middleware
   ============================================================ */

const jwt        = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'banaocv-secret-change-this';

exports.authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Login karo pehle' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from Supabase
    const { data: { user }, error } = await supabase.auth.admin.getUserById(decoded.id);
    if (error || !user)
      return res.status(401).json({ success: false, message: 'Session expire ho gayi — dobara login karo' });

    req.user = {
      id    : user.id,
      email : user.email,
      name  : user.user_metadata?.name || user.email.split('@')[0],
      plan  : user.user_metadata?.plan || 'free',
    };

    next();
  } catch(err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, message: 'Session expire ho gayi — dobara login karo' });
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

exports.premiumMiddleware = (req, res, next) => {
  if (!['premium','pro'].includes(req.user?.plan))
    return res.status(403).json({ success: false, message: 'Premium feature hai — upgrade karo' });
  next();
};
