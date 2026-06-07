/* ============================================================
   BanaoCV — backend/middleware/rateLimit.js
   API Rate Limiting
   ============================================================ */

const rateLimit = require('express-rate-limit');

exports.rateLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 50,
  message  : { success: false, message: 'Zyada requests — 15 minute baad try karo' },
  standardHeaders: true,
  legacyHeaders  : false,
});

exports.authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 10,
  message  : { success: false, message: 'Zyada login attempts — thodi der baad try karo' },
});

exports.aiLimiter = rateLimit({
  windowMs : 60 * 60 * 1000, // 1 hour
  max      : 20,
  message  : { success: false, message: 'AI limit reach ho gayi — 1 ghante baad try karo' },
});
