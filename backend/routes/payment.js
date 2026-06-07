/* ============================================================
   BanaoCV — backend/routes/payment.js
   Payment Routes
   ============================================================ */

const express      = require('express');
const router       = express.Router();
const paymentCtrl  = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

router.post('/create-order', authMiddleware, paymentCtrl.createOrder);
router.post('/verify',       authMiddleware, paymentCtrl.verifyPayment);
router.get('/history',       authMiddleware, paymentCtrl.getHistory);
router.post('/webhook',      paymentCtrl.webhook);

module.exports = router;
