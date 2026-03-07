const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// ── Verify JWT ────────────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user/vendor still exists and is active
    if (decoded.role === 'vendor') {
      const { rows } = await query(
        'SELECT id, email, status FROM vendors WHERE id = $1',
        [decoded.id]
      );
      if (!rows[0] || rows[0].status !== 'active') {
        return res.status(401).json({ success: false, message: 'Account not active' });
      }
      req.vendor = rows[0];
      req.role = 'vendor';
    } else if (decoded.role === 'admin') {
      req.user = { id: decoded.id, email: decoded.email };
      req.role = 'admin';
    } else {
      const { rows } = await query(
        'SELECT id, email, status, tier FROM users WHERE id = $1',
        [decoded.id]
      );
      if (!rows[0] || rows[0].status !== 'active') {
        return res.status(401).json({ success: false, message: 'Account not active' });
      }
      req.user = rows[0];
      req.role = 'user';
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── Role Guards ───────────────────────────────────────────────────────────────
const requireUser   = (req, res, next) => {
  if (req.role !== 'user') return res.status(403).json({ success: false, message: 'Users only' });
  next();
};

const requireVendor = (req, res, next) => {
  if (req.role !== 'vendor') return res.status(403).json({ success: false, message: 'Vendors only' });
  next();
};

const requireAdmin  = (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).json({ success: false, message: 'Admins only' });
  next();
};

const requireAny    = (...roles) => (req, res, next) => {
  if (!roles.includes(req.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};

// ── Generate tokens ───────────────────────────────────────────────────────────
const generateTokens = (payload) => {
  const access = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refresh = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { access, refresh };
};

module.exports = { authenticate, requireUser, requireVendor, requireAdmin, requireAny, generateTokens };
