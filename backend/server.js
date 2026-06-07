/* ============================================================
   BanaoCV — backend/server.js
   Main Express Server
   ============================================================ */

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const dotenv     = require('dotenv');
const path       = require('path');

// Load env
dotenv.config();

// Routes
const aiRoutes      = require('./routes/ai');
const authRoutes    = require('./routes/auth');
const resumeRoutes  = require('./routes/resume');
const paymentRoutes = require('./routes/payment');

// Middleware
const { authMiddleware } = require('./middleware/auth');
const { rateLimiter }    = require('./middleware/rateLimit');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security & Parsing ── */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin  : process.env.FRONTEND_URL || '*',
  methods : ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* ── Serve frontend static files ── */
app.use(express.static(path.join(__dirname, '..')));

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'BanaoCV API' });
});

/* ── API Routes ── */
app.use('/api/ai',      rateLimiter, aiRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/resume',  authMiddleware, resumeRoutes);
app.use('/api/payment', paymentRoutes);

/* ── Serve HTML pages ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success : false,
    message : err.message || 'Server error',
  });
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`BanaoCV server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API:      http://localhost:${PORT}/api`);
});

module.exports = app;
