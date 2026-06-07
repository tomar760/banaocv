/* ============================================================
   BanaoCV — backend/routes/auth.js
   Auth Routes
   ============================================================ */

const express  = require('express');
const router   = express.Router();
const authCtrl = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/signup',         authCtrl.signup);
router.post('/login',          authCtrl.login);
router.post('/logout',         authMiddleware, authCtrl.logout);
router.post('/forgot-password',authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);
router.get('/me',              authMiddleware, authCtrl.getMe);
router.put('/profile',         authMiddleware, authCtrl.updateProfile);

module.exports = router;
