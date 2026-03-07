require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/error');
const authRoutes = require('./routes/index');
const { vendorRouter, bookingRouter, paymentRouter, userRouter, adminRouter } = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;
const V = `/api/${process.env.API_VERSION || 'v1'}`;

// ── Security & middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    process.env.VENDOR_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3005',
    'http://localhost:8081',  // React Native Metro
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body — must come BEFORE express.json()
app.use(`${V}/payments/webhook`, express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(V, limiter);

// Auth routes get stricter limiting
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many auth attempts.' },
});
app.use(`${V}/auth`, authLimiter);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HoneyMoon API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use(`${V}/auth`, authRoutes);
app.use(`${V}/vendors`, vendorRouter);
app.use(`${V}/bookings`, bookingRouter);
app.use(`${V}/payments`, paymentRouter);
app.use(`${V}/users`, userRouter);
app.use(`${V}/admin`, adminRouter);

// ── Static uploads (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use('/uploads', express.static('uploads'));
}

// ── Errors ─────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🌙 HoneyMoon API                     ║
║   Port    : ${PORT}                       ║
║   Env     : ${process.env.NODE_ENV || 'development'}               ║
║   Base    : ${V}                   ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
