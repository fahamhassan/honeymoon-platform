const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/error');

// ══════════════════════════════════════════════════════════════════════════════
// USER CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════

exports.getProfile = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.status, u.tier,
            u.loyalty_points, u.is_verified, u.language, u.created_at,
            json_agg(json_build_object(
              'id', e.id, 'name', e.name, 'event_date', e.event_date,
              'guest_count', e.guest_count, 'budget', e.budget, 'is_primary', e.is_primary
            )) FILTER (WHERE e.id IS NOT NULL) as events
     FROM users u
     LEFT JOIN events e ON e.user_id=u.id
     WHERE u.id=$1
     GROUP BY u.id`,
    [req.user.id]
  );
  sendSuccess(res, { user: rows[0] });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['full_name', 'phone', 'language'];
  const updates = [];
  const params  = [];
  let p = 1;

  allowed.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f}=$${p++}`); params.push(req.body[f]); }
  });

  if (!updates.length) return sendError(res, 'No fields to update');
  params.push(req.user.id);

  const { rows } = await query(
    `UPDATE users SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${p} RETURNING *`,
    params
  );
  sendSuccess(res, { user: rows[0] }, 'Profile updated');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  const match = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!match) return sendError(res, 'Current password incorrect', 401);

  const hash = await bcrypt.hash(new_password, 10);
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
  sendSuccess(res, {}, 'Password updated');
});

exports.getLoyalty = asyncHandler(async (req, res) => {
  const [user, transactions] = await Promise.all([
    query('SELECT tier, loyalty_points FROM users WHERE id=$1', [req.user.id]),
    query(
      'SELECT * FROM loyalty_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    ),
  ]);
  sendSuccess(res, { loyalty_points: user.rows[0]?.loyalty_points, tier: user.rows[0]?.tier, transactions: transactions.rows });
});

// ── Events ────────────────────────────────────────────────────────────────────
exports.getEvents = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM events WHERE user_id=$1 ORDER BY event_date', [req.user.id]);
  sendSuccess(res, { events: rows });
});

exports.createEvent = asyncHandler(async (req, res) => {
  const { name, event_date, guest_count, budget, city, notes } = req.body;
  const { rows } = await query(
    'INSERT INTO events (user_id, name, event_date, guest_count, budget, city, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.user.id, name, event_date, guest_count, budget, city, notes]
  );
  sendSuccess(res, { event: rows[0] }, 'Event created', 201);
});

exports.updateEvent = asyncHandler(async (req, res) => {
  const { name, event_date, guest_count, budget, city, notes } = req.body;
  const { rows } = await query(
    `UPDATE events SET name=COALESCE($1,name), event_date=COALESCE($2,event_date),
     guest_count=COALESCE($3,guest_count), budget=COALESCE($4,budget),
     city=COALESCE($5,city), notes=COALESCE($6,notes), updated_at=NOW()
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [name, event_date, guest_count, budget, city, notes, req.params.id, req.user.id]
  );
  if (!rows[0]) return sendError(res, 'Event not found', 404);
  sendSuccess(res, { event: rows[0] }, 'Event updated');
});

// ══════════════════════════════════════════════════════════════════════════════
// WISHLIST CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════

exports.getWishlist = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT v.id, v.business_name, v.category, v.location, v.logo_url,
            v.rating, v.is_verified,
            (SELECT MIN(price) FROM vendor_services WHERE vendor_id=v.id AND is_active=TRUE) as min_price
     FROM wishlist w JOIN vendors v ON v.id=w.vendor_id
     WHERE w.user_id=$1 ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  sendSuccess(res, { vendors: rows });
});

exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { vendor_id } = req.body;

  const { rows } = await query(
    'SELECT id FROM wishlist WHERE user_id=$1 AND vendor_id=$2',
    [req.user.id, vendor_id]
  );

  if (rows[0]) {
    await query('DELETE FROM wishlist WHERE user_id=$1 AND vendor_id=$2', [req.user.id, vendor_id]);
    return sendSuccess(res, { wishlisted: false }, 'Removed from wishlist');
  }

  await query('INSERT INTO wishlist (user_id, vendor_id) VALUES ($1,$2)', [req.user.id, vendor_id]);
  sendSuccess(res, { wishlisted: true }, 'Added to wishlist');
});

// ══════════════════════════════════════════════════════════════════════════════
// REVIEWS CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════

exports.createReview = asyncHandler(async (req, res) => {
  const { booking_id, rating, title, body } = req.body;

  // Verify booking belongs to user and is completed/confirmed
  const { rows: bRows } = await query(
    "SELECT * FROM bookings WHERE id=$1 AND user_id=$2 AND status IN ('confirmed','completed')",
    [booking_id, req.user.id]
  );
  if (!bRows[0]) return sendError(res, 'You can only review confirmed bookings', 403);

  // Check no existing review
  const { rows: rRows } = await query('SELECT id FROM reviews WHERE booking_id=$1', [booking_id]);
  if (rRows[0]) return sendError(res, 'You already reviewed this booking', 409);

  const { rows } = await query(
    'INSERT INTO reviews (booking_id, user_id, vendor_id, rating, title, body) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [booking_id, req.user.id, bRows[0].vendor_id, rating, title, body]
  );

  // Award loyalty points for review
  await query('UPDATE users SET loyalty_points=loyalty_points+50 WHERE id=$1', [req.user.id]);

  sendSuccess(res, { review: rows[0] }, 'Review submitted', 201);
});

exports.getVendorReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, u.full_name as reviewer_name, u.avatar_url
     FROM reviews r JOIN users u ON u.id=r.user_id
     WHERE r.vendor_id=$1 AND r.is_visible=TRUE
     ORDER BY r.created_at DESC`,
    [req.params.vendor_id]
  );
  sendSuccess(res, { reviews: rows });
});

exports.replyToReview = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'UPDATE reviews SET vendor_reply=$1, replied_at=NOW() WHERE id=$2 AND vendor_id=$3 RETURNING *',
    [req.body.reply, req.params.id, req.vendor.id]
  );
  if (!rows[0]) return sendError(res, 'Review not found', 404);
  sendSuccess(res, { review: rows[0] }, 'Reply added');
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════

exports.getNotifications = asyncHandler(async (req, res) => {
  const isVendor = req.role === 'vendor';
  const id = isVendor ? req.vendor.id : req.user.id;
  const col = isVendor ? 'vendor_id' : 'user_id';

  const { rows } = await query(
    `SELECT * FROM notifications WHERE ${col}=$1 ORDER BY created_at DESC LIMIT 50`,
    [id]
  );
  const unread = rows.filter(n => !n.is_read).length;
  sendSuccess(res, { notifications: rows, unread });
});

exports.markRead = asyncHandler(async (req, res) => {
  const isVendor = req.role === 'vendor';
  const id = isVendor ? req.vendor.id : req.user.id;
  const col = isVendor ? 'vendor_id' : 'user_id';
  const { id: notifId } = req.params;

  if (notifId === 'all') {
    await query(`UPDATE notifications SET is_read=TRUE, read_at=NOW() WHERE ${col}=$1`, [id]);
  } else {
    await query(`UPDATE notifications SET is_read=TRUE, read_at=NOW() WHERE id=$1 AND ${col}=$2`, [notifId, id]);
  }
  sendSuccess(res, {}, 'Marked as read');
});

exports.updatePushToken = asyncHandler(async (req, res) => {
  const { push_token } = req.body;
  if (req.role === 'vendor') {
    await query('UPDATE vendors SET push_token=$1 WHERE id=$2', [push_token, req.vendor.id]);
  } else {
    await query('UPDATE users SET push_token=$1 WHERE id=$2', [push_token, req.user.id]);
  }
  sendSuccess(res, {}, 'Push token updated');
});
