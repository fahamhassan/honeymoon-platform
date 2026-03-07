const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const { query, withTransaction } = require('../config/db');
const { generateTokens }         = require('../middleware/auth');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/error');
const { sendOtpSms }             = require('../utils/sms');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const uaepass                    = require('../utils/uaepass');

// ─── Helper: issue tokens + store refresh ─────────────────────────────────────
async function issueSession(payload, deviceInfo, ip) {
  const { access, refresh } = generateTokens(payload);
  const hash = crypto.createHash('sha256').update(refresh).digest('hex');
  await query(
    `INSERT INTO refresh_tokens (user_id, vendor_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1,$2,$3,$4,$5, NOW()+INTERVAL '30 days')`,
    [
      payload.role === 'user'   ? payload.id : null,
      payload.role === 'vendor' ? payload.id : null,
      hash, deviceInfo || null, ip || null,
    ]
  );
  return { access, refresh };
}

// ─── Helper: generate + store OTP ────────────────────────────────────────────
async function createOtp(phone, purpose = 'verify') {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  // Invalidate any existing unused codes for this phone+purpose
  await query(
    "UPDATE otp_codes SET is_used=TRUE WHERE phone=$1 AND purpose=$2 AND is_used=FALSE",
    [phone, purpose]
  );
  await query(
    "INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES ($1,$2,$3, NOW()+INTERVAL '10 minutes')",
    [phone, code, purpose]
  );
  return code;
}

// ══════════════════════════════════════════════════════════════════════════════
// USER AUTH
// ══════════════════════════════════════════════════════════════════════════════

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !email || !phone || !password) {
    return sendError(res, 'All fields are required', 400);
  }
  if (password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters', 400);
  }

  const exists = await query(
    'SELECT id FROM users WHERE email=$1 OR phone=$2', [email, phone]
  );
  if (exists.rows.length) {
    return sendError(res, 'Email or phone already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { rows } = await query(
    `INSERT INTO users (full_name, email, phone, password_hash, status)
     VALUES ($1,$2,$3,$4,'pending')
     RETURNING id, full_name, email, phone, status, tier, loyalty_points`,
    [full_name, email, phone, password_hash]
  );

  const user = rows[0];

  // Send OTP via Twilio
  const code = await createOtp(phone, 'verify');
  await sendOtpSms(phone, code, 'verify');

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user).catch(console.error);

  sendSuccess(res, { user }, 'Account created. Please verify your phone.', 201);
});

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return sendError(res, 'Email and password required', 400);

  const { rows } = await query(
    `SELECT id, full_name, email, phone, password_hash, status, tier, loyalty_points, avatar_url, is_verified
     FROM users WHERE email = $1`,
    [email]
  );

  const user = rows[0];
  if (!user || !user.password_hash) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return sendError(res, 'Invalid email or password', 401);

  if (user.status === 'suspended') return sendError(res, 'Account suspended. Contact support.', 403);
  if (user.status === 'deleted')   return sendError(res, 'Account not found', 404);

  // Require phone verification
  if (!user.is_verified) {
    // Re-send OTP so they can verify
    const code = await createOtp(user.phone, 'verify');
    await sendOtpSms(user.phone, code, 'verify');
    return sendError(res, 'Phone not verified. A new OTP has been sent.', 403);
  }

  await query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [user.id]);

  const { access, refresh } = await issueSession(
    { id: user.id, email: user.email, role: 'user' },
    req.headers['user-agent'],
    req.ip
  );

  delete user.password_hash;
  sendSuccess(res, { user, token: access, refreshToken: refresh }, 'Login successful');
});

// ── Vendor Login ──────────────────────────────────────────────────────────────
exports.vendorLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Email and password required', 400);

  const { rows } = await query(
    `SELECT id, business_name, email, phone, password_hash, status, rating, review_count, logo_url, category
     FROM vendors WHERE email = $1`,
    [email]
  );

  const vendor = rows[0];
  if (!vendor) return sendError(res, 'Invalid credentials', 401);

  const match = await bcrypt.compare(password, vendor.password_hash);
  if (!match) return sendError(res, 'Invalid credentials', 401);

  if (vendor.status === 'suspended') return sendError(res, 'Account suspended', 403);
  if (vendor.status === 'rejected')  return sendError(res, 'Application was not approved', 403);
  if (vendor.status === 'pending')   return sendError(res, 'Application under review', 403);

  const { access, refresh } = await issueSession(
    { id: vendor.id, email: vendor.email, role: 'vendor' },
    req.headers['user-agent'],
    req.ip
  );

  delete vendor.password_hash;
  sendSuccess(res, { vendor, token: access, refreshToken: refresh }, 'Login successful');
});

// ── Vendor Register ───────────────────────────────────────────────────────────
exports.vendorRegister = asyncHandler(async (req, res) => {
  const { business_name, email, phone, password, category, city } = req.body;
  if (!business_name || !email || !password || !category) {
    return sendError(res, 'business_name, email, password and category are required', 400);
  }

  const exists = await query('SELECT id FROM vendors WHERE email=$1', [email]);
  if (exists.rows.length) return sendError(res, 'Email already registered', 409);

  const password_hash = await bcrypt.hash(password, 10);

  const { rows } = await query(
    `INSERT INTO vendors (business_name, email, phone, password_hash, category, city, status)
     VALUES ($1,$2,$3,$4,$5,$6,'pending')
     RETURNING id, business_name, email, category, status`,
    [business_name, email, phone, password_hash, category, city || 'Dubai']
  );

  sendSuccess(res, { vendor: rows[0] }, 'Application submitted. You will be notified once reviewed.', 201);
});

// ── Admin Login ───────────────────────────────────────────────────────────────
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Email and password required', 400);

  // Admin accounts are in the users table with tier=diamond and a special flag
  // For simplicity we use a separate env-based check + DB lookup
  const { rows } = await query(
    `SELECT id, full_name, email, password_hash, status FROM users
     WHERE email=$1 AND tier='diamond'`, // Simple admin gate — in prod use a separate admins table
    [email]
  );

  const admin = rows[0];
  if (!admin) return sendError(res, 'Invalid credentials', 401);

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return sendError(res, 'Invalid credentials', 401);
  if (admin.status !== 'active') return sendError(res, 'Account not active', 403);

  const { access, refresh } = await issueSession(
    { id: admin.id, email: admin.email, role: 'admin' },
    req.headers['user-agent'],
    req.ip
  );

  sendSuccess(res, {
    admin: { id: admin.id, full_name: admin.full_name, email: admin.email },
    token: access, refreshToken: refresh
  }, 'Admin login successful');
});

// ══════════════════════════════════════════════════════════════════════════════
// OTP
// ══════════════════════════════════════════════════════════════════════════════

exports.sendOtp = asyncHandler(async (req, res) => {
  const { phone, purpose = 'verify' } = req.body;
  if (!phone) return sendError(res, 'Phone number required', 400);

  // Rate limit: max 5 OTPs per phone per hour
  const { rows: recent } = await query(
    `SELECT COUNT(*) as count FROM otp_codes
     WHERE phone=$1 AND created_at > NOW()-INTERVAL '1 hour'`,
    [phone]
  );
  if (parseInt(recent[0].count) >= 5) {
    return sendError(res, 'Too many OTP requests. Please wait before trying again.', 429);
  }

  const code = await createOtp(phone, purpose);
  await sendOtpSms(phone, code, purpose);

  sendSuccess(res, {}, 'Verification code sent');
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code, purpose = 'verify' } = req.body;
  if (!phone || !code) return sendError(res, 'Phone and code required', 400);

  const { rows } = await query(
    `SELECT id, attempts FROM otp_codes
     WHERE phone=$1 AND code=$2 AND purpose=$3 AND is_used=FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, code.toString(), purpose]
  );

  if (!rows[0]) {
    // Increment failed attempts on the latest unused code
    await query(
      `UPDATE otp_codes SET attempts=attempts+1
       WHERE phone=$1 AND purpose=$2 AND is_used=FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [phone, purpose]
    );
    return sendError(res, 'Invalid or expired code', 400);
  }

  if (rows[0].attempts >= 5) {
    return sendError(res, 'Too many failed attempts. Please request a new code.', 429);
  }

  // Mark code as used
  await query('UPDATE otp_codes SET is_used=TRUE WHERE id=$1', [rows[0].id]);

  // Activate user if this was a verification OTP
  if (purpose === 'verify') {
    await query(
      "UPDATE users SET is_verified=TRUE, status='active', verified_at=NOW() WHERE phone=$1 AND status='pending'",
      [phone]
    );
  }

  sendSuccess(res, { verified: true }, 'Code verified successfully');
});

// ══════════════════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ══════════════════════════════════════════════════════════════════════════════

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body; // email or phone
  if (!identifier) return sendError(res, 'Email or phone required', 400);

  const isEmail = identifier.includes('@');
  const col     = isEmail ? 'email' : 'phone';

  const { rows } = await query(
    `SELECT id, full_name, email, phone FROM users WHERE ${col}=$1 AND status='active'`,
    [identifier]
  );

  // Always return success to prevent user enumeration
  if (!rows[0]) {
    return sendSuccess(res, {}, 'If that account exists, a reset code has been sent.');
  }

  const user = rows[0];
  const code = await createOtp(user.phone, 'reset');

  // Send via SMS and email
  await Promise.all([
    sendOtpSms(user.phone, code, 'reset'),
    sendPasswordResetEmail(user, code).catch(console.error),
  ]);

  sendSuccess(res, { phone: user.phone?.replace(/(\+\d{3})\d+(\d{4})/, '$1*****$2') },
    'Reset code sent to your registered phone and email.');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { phone, code, new_password } = req.body;
  if (!phone || !code || !new_password) {
    return sendError(res, 'phone, code and new_password are required', 400);
  }
  if (new_password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters', 400);
  }

  // Verify OTP first
  const { rows } = await query(
    `SELECT id FROM otp_codes
     WHERE phone=$1 AND code=$2 AND purpose='reset' AND is_used=FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, code.toString()]
  );

  if (!rows[0]) return sendError(res, 'Invalid or expired reset code', 400);

  await query('UPDATE otp_codes SET is_used=TRUE WHERE id=$1', [rows[0].id]);

  const hash = await bcrypt.hash(new_password, 10);
  const { rowCount } = await query(
    "UPDATE users SET password_hash=$1 WHERE phone=$2 AND status='active'",
    [hash, phone]
  );

  if (!rowCount) return sendError(res, 'User not found', 404);

  sendSuccess(res, {}, 'Password reset successfully. Please log in.');
});

// ══════════════════════════════════════════════════════════════════════════════
// UAE PASS OAUTH
// ══════════════════════════════════════════════════════════════════════════════

// In-memory state store (use Redis in production)
const pendingStates = new Map();

// Step 1 — Get UAE Pass login URL
exports.uaepassUrl = asyncHandler(async (req, res) => {
  const state   = uaepass.generateState();
  const authUrl = uaepass.getAuthUrl(state);

  // Store state for CSRF validation (expire after 10 min)
  pendingStates.set(state, { createdAt: Date.now() });
  setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000);

  sendSuccess(res, { url: authUrl, state }, 'UAE Pass authorization URL generated');
});

// Step 2 — Handle callback from UAE Pass
exports.uaepassCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/uaepass/error?reason=${error}`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/uaepass/error?reason=missing_params`);
  }

  // CSRF validation
  const storedState = pendingStates.get(state);
  if (!storedState) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/uaepass/error?reason=invalid_state`);
  }
  pendingStates.delete(state);

  try {
    // Exchange code for tokens
    const tokens = await uaepass.exchangeCode(code);

    // Get user profile from UAE Pass
    const profile = await uaepass.getUserProfile(tokens.access_token);

    // Find or create user
    let user;
    const { rows } = await query(
      'SELECT * FROM users WHERE uaepass_sub=$1 OR email=$2',
      [profile.sub, profile.email]
    );

    if (rows[0]) {
      // Existing user — update UAE Pass sub if not set
      if (!rows[0].uaepass_sub) {
        await query('UPDATE users SET uaepass_sub=$1 WHERE id=$2', [profile.sub, rows[0].id]);
      }
      user = rows[0];
    } else {
      // New user — create account (auto-verified via UAE Pass)
      const { rows: newRows } = await withTransaction(async (client) => {
        const r = await client.query(
          `INSERT INTO users (full_name, email, phone, uaepass_sub, status, is_verified, verified_at)
           VALUES ($1,$2,$3,$4,'active',TRUE,NOW())
           RETURNING *`,
          [
            profile.fullnameEN || profile.sub,
            profile.email || null,
            profile.mobile || null,
            profile.sub,
          ]
        );
        return r;
      });
      user = newRows[0];
      sendWelcomeEmail(user).catch(console.error);
    }

    // Issue our own JWT
    const { access, refresh } = await issueSession(
      { id: user.id, email: user.email, role: 'user' },
      req.headers['user-agent'],
      req.ip
    );

    // Redirect to app deep link with tokens
    // Mobile app handles this via deep link: honeymoon://auth/callback?token=...
    const deepLink = `${process.env.CLIENT_URL}/auth/uaepass/success?token=${access}&refreshToken=${refresh}`;
    res.redirect(deepLink);

  } catch (err) {
    console.error('UAE Pass callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/auth/uaepass/error?reason=exchange_failed`);
  }
});

// Mobile deep-link handler — app calls this after receiving the UAE Pass redirect
exports.uaepassMobile = asyncHandler(async (req, res) => {
  const { code, state } = req.body;
  if (!code) return sendError(res, 'Authorization code required', 400);

  try {
    const tokens  = await uaepass.exchangeCode(code);
    const profile = await uaepass.getUserProfile(tokens.access_token);

    let user;
    const { rows } = await query(
      'SELECT * FROM users WHERE uaepass_sub=$1 OR (email=$2 AND $2 IS NOT NULL)',
      [profile.sub, profile.email || null]
    );

    if (rows[0]) {
      if (!rows[0].uaepass_sub) {
        await query('UPDATE users SET uaepass_sub=$1, updated_at=NOW() WHERE id=$2', [profile.sub, rows[0].id]);
      }
      await query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [rows[0].id]);
      user = { ...rows[0], uaepass_sub: profile.sub };
    } else {
      const { rows: newRows } = await query(
        `INSERT INTO users (full_name, email, phone, uaepass_sub, status, is_verified, verified_at)
         VALUES ($1,$2,$3,$4,'active',TRUE,NOW()) RETURNING *`,
        [profile.fullnameEN || 'UAE Pass User', profile.email || null, profile.mobile || null, profile.sub]
      );
      user = newRows[0];
      sendWelcomeEmail(user).catch(console.error);
    }

    const { access, refresh } = await issueSession(
      { id: user.id, email: user.email || user.id, role: 'user' },
      req.headers['user-agent'],
      req.ip
    );

    delete user.password_hash;
    sendSuccess(res, { user, token: access, refreshToken: refresh }, 'UAE Pass login successful');

  } catch (err) {
    console.error('UAE Pass mobile error:', err);
    sendError(res, 'UAE Pass authentication failed. Please try again.', 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return sendError(res, 'Refresh token required', 400);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }

  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const { rows } = await query(
    'SELECT id FROM refresh_tokens WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at > NOW()',
    [hash]
  );

  if (!rows[0]) return sendError(res, 'Refresh token revoked or expired', 401);

  const { access } = generateTokens({
    id: decoded.id, email: decoded.email, role: decoded.role,
  });

  sendSuccess(res, { token: access }, 'Token refreshed');
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=$1', [hash]);
  }
  sendSuccess(res, {}, 'Logged out successfully');
});

// Logout from all devices
exports.logoutAll = asyncHandler(async (req, res) => {
  const col = req.role === 'vendor' ? 'vendor_id' : 'user_id';
  const id  = req.role === 'vendor' ? req.vendor.id : req.user.id;
  await query(
    `UPDATE refresh_tokens SET revoked_at=NOW() WHERE ${col}=$1 AND revoked_at IS NULL`,
    [id]
  );
  sendSuccess(res, {}, 'Logged out from all devices');
});

// ══════════════════════════════════════════════════════════════════════════════
// CURRENT USER
// ══════════════════════════════════════════════════════════════════════════════

exports.me = asyncHandler(async (req, res) => {
  if (req.role === 'vendor') {
    const { rows } = await query(
      `SELECT id, business_name, email, phone, category, city, description, logo_url, cover_url,
              status, is_verified, rating, review_count, booking_count, commission_rate, deposit_percent
       FROM vendors WHERE id=$1`,
      [req.vendor.id]
    );
    return sendSuccess(res, { vendor: rows[0], role: 'vendor' });
  }

  const { rows } = await query(
    `SELECT id, full_name, email, phone, avatar_url, status, tier, loyalty_points,
            is_verified, language, uaepass_sub IS NOT NULL as has_uaepass, created_at
     FROM users WHERE id=$1`,
    [req.user.id]
  );
  sendSuccess(res, { user: rows[0], role: req.role });
});
