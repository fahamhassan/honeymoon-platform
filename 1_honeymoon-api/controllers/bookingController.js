const { query, withTransaction } = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/error');

// ── User: create booking ──────────────────────────────────────────────────────
exports.createBooking = asyncHandler(async (req, res) => {
  const {
    vendor_id, service_id, event_id, package_name,
    event_date, guest_count, notes,
  } = req.body;

  // Get service price
  const { rows: svcRows } = await query(
    'SELECT * FROM vendor_services WHERE id=$1 AND vendor_id=$2 AND is_active=TRUE',
    [service_id, vendor_id]
  );
  if (!svcRows[0]) return sendError(res, 'Service not found', 404);

  const svc          = svcRows[0];
  const guests       = parseInt(guest_count) || 1;
  const subtotal     = svc.pricing_unit === 'per_guest' ? svc.price * guests : svc.price;
  const commission   = parseFloat(process.env.PLATFORM_COMMISSION_RATE || 0.05);
  const platform_fee = Math.round(subtotal * commission * 100) / 100;
  const total_amount = subtotal + platform_fee;
  const deposit_pct  = parseFloat(process.env.DEPOSIT_PERCENTAGE || 0.30);
  const deposit_amount = Math.round(total_amount * deposit_pct * 100) / 100;

  const booking = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO bookings
         (user_id, vendor_id, event_id, service_id, package_name, event_date,
          guest_count, subtotal, platform_fee, total_amount, deposit_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, vendor_id, event_id || null, service_id,
       package_name || svc.name, event_date, guest_count,
       subtotal, platform_fee, total_amount, deposit_amount, notes]
    );
    return rows[0];
  });

  // Notify vendor
  await query(
    `INSERT INTO notifications (vendor_id, type, title, body, data)
     VALUES ($1,'booking','New Booking Request',
     $2, $3)`,
    [vendor_id,
     `New booking request: ${package_name || svc.name} for ${event_date}`,
     JSON.stringify({ booking_id: booking.id })]
  );

  sendSuccess(res, { booking }, 'Booking created', 201);
});

// ── User: get my bookings ─────────────────────────────────────────────────────
exports.getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const params = [req.user.id];
  let where = 'WHERE b.user_id=$1';
  if (status) { where += ` AND b.status=$2`; params.push(status); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const { rows } = await query(
    `SELECT b.*, v.business_name as vendor_name, v.logo_url as vendor_logo, v.category as vendor_category,
            COUNT(*) OVER() as total_count
     FROM bookings b
     JOIN vendors v ON v.id=b.vendor_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = rows[0]?.total_count || 0;
  sendSuccess(res, {
    bookings: rows.map(({ total_count, ...b }) => b),
    pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) },
  });
});

// ── User: get single booking ──────────────────────────────────────────────────
exports.getBooking = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT b.*, v.business_name as vendor_name, v.logo_url, v.phone as vendor_phone,
            json_agg(p.*) FILTER (WHERE p.id IS NOT NULL) as payments
     FROM bookings b
     JOIN vendors v ON v.id=b.vendor_id
     LEFT JOIN payments p ON p.booking_id=b.id
     WHERE b.id=$1 AND (b.user_id=$2 OR $3)
     GROUP BY b.id, v.business_name, v.logo_url, v.phone`,
    [req.params.id, req.user?.id || null, req.role === 'admin']
  );

  if (!rows[0]) return sendError(res, 'Booking not found', 404);
  sendSuccess(res, { booking: rows[0] });
});

// ── User: cancel booking ──────────────────────────────────────────────────────
exports.cancelBooking = asyncHandler(async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM bookings WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return sendError(res, 'Booking not found', 404);

  const b = rows[0];
  if (['cancelled', 'completed'].includes(b.status)) {
    return sendError(res, `Cannot cancel a ${b.status} booking`);
  }

  await query(
    "UPDATE bookings SET status='cancelled', cancelled_at=NOW(), cancel_reason=$1 WHERE id=$2",
    [req.body.reason || 'Cancelled by user', b.id]
  );

  // Notify vendor
  await query(
    `INSERT INTO notifications (vendor_id, type, title, body, data) VALUES ($1,'booking','Booking Cancelled',$2,$3)`,
    [b.vendor_id, `Booking ${b.booking_ref} was cancelled by the client.`, JSON.stringify({ booking_id: b.id })]
  );

  sendSuccess(res, {}, 'Booking cancelled');
});

// ── Vendor: get their bookings ────────────────────────────────────────────────
exports.getVendorBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const params = [req.vendor.id];
  let where = 'WHERE b.vendor_id=$1';
  if (status) { where += ` AND b.status=$2`; params.push(status); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const { rows } = await query(
    `SELECT b.*, u.full_name as client_name, u.phone as client_phone, u.avatar_url,
            COUNT(*) OVER() as total_count
     FROM bookings b
     JOIN users u ON u.id=b.user_id
     ${where}
     ORDER BY b.event_date ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  sendSuccess(res, {
    bookings: rows.map(({ total_count, ...b }) => b),
    pagination: { page: parseInt(page), total: parseInt(rows[0]?.total_count || 0) },
  });
});

// ── Vendor: confirm / add notes ───────────────────────────────────────────────
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, vendor_notes } = req.body;
  const allowed = ['confirmed', 'cancelled'];
  if (!allowed.includes(status)) return sendError(res, 'Invalid status');

  const { rows } = await query(
    `UPDATE bookings SET
       status=$1,
       vendor_notes=COALESCE($2, vendor_notes),
       confirmed_at = CASE WHEN $1='confirmed' THEN NOW() ELSE confirmed_at END,
       cancelled_at = CASE WHEN $1='cancelled' THEN NOW() ELSE cancelled_at END
     WHERE id=$3 AND vendor_id=$4
     RETURNING *`,
    [status, vendor_notes, req.params.id, req.vendor.id]
  );

  if (!rows[0]) return sendError(res, 'Booking not found', 404);

  // Notify user
  await query(
    `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1,'booking',$2,$3,$4)`,
    [rows[0].user_id,
     status === 'confirmed' ? 'Booking Confirmed! 🎉' : 'Booking Update',
     `${status === 'confirmed' ? 'Your booking has been confirmed' : 'Your booking was updated'}: ${rows[0].booking_ref}`,
     JSON.stringify({ booking_id: rows[0].id })]
  );

  sendSuccess(res, { booking: rows[0] }, `Booking ${status}`);
});
