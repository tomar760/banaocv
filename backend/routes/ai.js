/* ============================================================
   BanaoCV — backend/routes/ai.js
   AI API Routes
   ============================================================ */

const express    = require('express');
const router     = express.Router();
const aiCtrl     = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

router.post('/generate',    authMiddleware, aiCtrl.generateResume);
router.post('/score',       authMiddleware, aiCtrl.scoreResume);
router.post('/jd-match',    authMiddleware, aiCtrl.jdMatch);
router.post('/cover-letter',authMiddleware, aiCtrl.coverLetter);
router.post('/tips',        authMiddleware, aiCtrl.improvementTips);

module.exports = router;
