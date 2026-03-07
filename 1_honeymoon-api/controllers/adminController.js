const { query, withTransaction } = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/error');

// ── Dashboard Overview ────────────────────────────────────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const [users, vendors, bookings, revenue, recent] = await Promise.all([
    query(`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status='active') as active,
      COUNT(*) FILTER (WHERE status='pending') as pending,
      COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '7 days') as new_this_week
      FROM users`),
    query(`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status='active') as active,
      COUNT(*) FILTER (WHERE status='pending') as pending,
      COUNT(*) FILTER (WHERE is_verified=TRUE) as verified
      FROM vendors`),
    query(`SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status='confirmed') as confirmed,
      COUNT(*) FILTER (WHERE status='pending') as pending,
      COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '30 days') as this_month
      FROM bookings`),
    query(`SELECT
      COALESCE(SUM(platform_fee),0) as total_fees,
      COALESCE(SUM(platform_fee) FILTER (WHERE created_at > NOW()-INTERVAL '30 days'),0) as fees_this_month,
      COALESCE(SUM(amount),0) as total_gmv
      FROM payments WHERE status='paid'`),
    query(`SELECT b.id, b.booking_ref, b.status, b.total_amount, b.created_at,
            u.full_name as user_name, v.business_name as vendor_name
           FROM bookings b
           JOIN users u ON u.id=b.user_id
           JOIN vendors v ON v.id=b.vendor_id
           ORDER BY b.created_at DESC LIMIT 5`),
  ]);

  sendSuccess(res, {
    users:    users.rows[0],
    vendors:  vendors.rows[0],
    bookings: bookings.rows[0],
    revenue:  revenue.rows[0],
    recentBookings: recent.rows,
  });
});

// ── Users ─────────────────────────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];
  let p = 1;

  if (status) { conditions.push(`status=$${p++}`); params.push(status); }
  if (search) { conditions.push(`(full_name ILIKE $${p} OR email ILIKE $${p} OR phone ILIKE $${p})`); params.push(`%${search}%`); p++; }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const { rows } = await query(
    `SELECT id, full_name, email, phone, status, tier, loyalty_points, is_verified, created_at,
            COUNT(*) OVER() as total_count
     FROM users ${where} ORDER BY created_at DESC
     LIMIT $${p} OFFSET $${p+1}`,
    params
  );

  sendSuccess(res, {
    users: rows.map(({ total_count, ...u }) => u),
    pagination: { page: parseInt(page), total: parseInt(rows[0]?.total_count || 0) },
  });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { rows } = await query(
    'UPDATE users SET status=$1 WHERE id=$2 RETURNING id, full_name, status',
    [status, req.params.id]
  );
  if (!rows[0]) return sendError(res, 'User not found', 404);
  sendSuccess(res, { user: rows[0] }, `User ${status}`);
});

// ── Vendors ───────────────────────────────────────────────────────────────────
exports.getVendors = asyncHandler(async (req, res) => {
  const { status, category, search, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];
  let p = 1;

  if (status)   { conditions.push(`status=$${p++}`); params.push(status); }
  if (category) { conditions.push(`category=$${p++}`); params.push(category); }
  if (search)   { conditions.push(`(business_name ILIKE $${p} OR email ILIKE $${p})`); params.push(`%${search}%`); p++; }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const { rows } = await query(
    `SELECT id, business_name, category, email, phone, city, status, is_verified,
            rating, review_count, booking_count, total_revenue, created_at,
            COUNT(*) OVER() as total_count
     FROM vendors ${where} ORDER BY created_at DESC
     LIMIT $${p} OFFSET $${p+1}`,
    params
  );

  sendSuccess(res, {
    vendors: rows.map(({ total_count, ...v }) => v),
    pagination: { page: parseInt(page), total: parseInt(rows[0]?.total_count || 0) },
  });
});

exports.approveVendor = asyncHandler(async (req, res) => {
  const { rows } = await query(
    "UPDATE vendors SET status='active', is_verified=TRUE WHERE id=$1 RETURNING id, business_name, status",
    [req.params.id]
  );
  if (!rows[0]) return sendError(res, 'Vendor not found', 404);

  await query(
    `INSERT INTO notifications (vendor_id, type, title, body)
     VALUES ($1,'system','Application Approved! 🎉','Congratulations! Your vendor application has been approved. You can now receive bookings.')`,
    [req.params.id]
  );

  sendSuccess(res, { vendor: rows[0] }, 'Vendor approved');
});

exports.rejectVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { rows } = await query(
    "UPDATE vendors SET status='rejected' WHERE id=$1 RETURNING id, business_name",
    [req.params.id]
  );
  if (!rows[0]) return sendError(res, 'Vendor not found', 404);

  await query(
    `INSERT INTO notifications (vendor_id, type, title, body)
     VALUES ($1,'system','Application Update',$2)`,
    [req.params.id, reason || 'Your application was not approved at this time.']
  );

  sendSuccess(res, {}, 'Vendor rejected');
});

exports.suspendVendor = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE vendors SET status = CASE WHEN status='suspended' THEN 'active' ELSE 'suspended' END
     WHERE id=$1 RETURNING id, business_name, status`,
    [req.params.id]
  );
  sendSuccess(res, { vendor: rows[0] }, `Vendor ${rows[0].status}`);
});

// ── All Bookings ──────────────────────────────────────────────────────────────
exports.getAllBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const params = [];
  let where = '';
  if (status) { where = 'WHERE b.status=$1'; params.push(status); }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const { rows } = await query(
    `SELECT b.*, u.full_name as user_name, v.business_name as vendor_name,
            COUNT(*) OVER() as total_count
     FROM bookings b
     JOIN users u ON u.id=b.user_id
     JOIN vendors v ON v.id=b.vendor_id
     ${where} ORDER BY b.created_at DESC
     LIMIT $${params.length-1} OFFSET $${params.length}`,
    params
  );

  sendSuccess(res, {
    bookings: rows.map(({ total_count, ...b }) => b),
    pagination: { page: parseInt(page), total: parseInt(rows[0]?.total_count || 0) },
  });
});

// ── Finance ───────────────────────────────────────────────────────────────────
exports.getFinancials = asyncHandler(async (req, res) => {
  const [summary, monthly, payouts] = await Promise.all([
    query(`SELECT
      COALESCE(SUM(amount),0) as total_gmv,
      COALESCE(SUM(platform_fee),0) as total_fees,
      COALESCE(SUM(vendor_payout),0) as total_payouts,
      COUNT(*) as total_transactions
      FROM payments WHERE status='paid'`),
    query(`SELECT DATE_TRUNC('month', created_at) as month,
      SUM(amount) as gmv, SUM(platform_fee) as fees
      FROM payments WHERE status='paid'
      GROUP BY month ORDER BY month DESC LIMIT 12`),
    query(`SELECT v.id, v.business_name, SUM(p.vendor_payout) as pending_payout
      FROM payments p JOIN vendors v ON v.id=p.vendor_id
      WHERE p.status='paid' AND p.payout_status='pending'
      GROUP BY v.id, v.business_name ORDER BY pending_payout DESC`),
  ]);

  sendSuccess(res, {
    summary:  summary.rows[0],
    monthly:  monthly.rows,
    pendingPayouts: payouts.rows,
  });
});

// ── Reports ───────────────────────────────────────────────────────────────────
exports.getReports = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];
  let p = 1;

  if (status)   { conditions.push(`r.status=$${p++}`); params.push(status); }
  if (priority) { conditions.push(`r.priority=$${p++}`); params.push(priority); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  params.push(parseInt(limit), offset);

  const { rows } = await query(
    `SELECT r.*, u.full_name as user_name, v.business_name as vendor_name,
            COUNT(*) OVER() as total_count
     FROM reports r
     LEFT JOIN users u ON u.id=r.user_id
     LEFT JOIN vendors v ON v.id=r.vendor_id
     ${where} ORDER BY r.created_at DESC
     LIMIT $${p} OFFSET $${p+1}`,
    params
  );

  sendSuccess(res, {
    reports: rows.map(({ total_count, ...r }) => r),
    pagination: { page: parseInt(page), total: parseInt(rows[0]?.total_count || 0) },
  });
});

exports.updateReport = asyncHandler(async (req, res) => {
  const { status, admin_notes } = req.body;
  const { rows } = await query(
    `UPDATE reports SET status=$1, admin_notes=COALESCE($2,admin_notes),
     resolved_at = CASE WHEN $1='resolved' THEN NOW() ELSE resolved_at END
     WHERE id=$3 RETURNING *`,
    [status, admin_notes, req.params.id]
  );
  sendSuccess(res, { report: rows[0] }, 'Report updated');
});

// ── Content: banners, featured, promotions ────────────────────────────────────
exports.getBanners = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM banners ORDER BY sort_order');
  sendSuccess(res, { banners: rows });
});

exports.createBanner = asyncHandler(async (req, res) => {
  const { title, image_url, link_url, placement, expires_at } = req.body;
  const { rows } = await query(
    'INSERT INTO banners (title, image_url, link_url, placement, expires_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [title, image_url, link_url, placement, expires_at]
  );
  sendSuccess(res, { banner: rows[0] }, 'Banner created', 201);
});

exports.toggleBanner = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'UPDATE banners SET is_active=NOT is_active WHERE id=$1 RETURNING *',
    [req.params.id]
  );
  sendSuccess(res, { banner: rows[0] });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
  await query('DELETE FROM banners WHERE id=$1', [req.params.id]);
  sendSuccess(res, {}, 'Banner deleted');
});

exports.getFeatured = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT fv.*, v.business_name, v.category, v.rating, v.logo_url
     FROM featured_vendors fv JOIN vendors v ON v.id=fv.vendor_id ORDER BY fv.sort_order`
  );
  sendSuccess(res, { featured: rows });
});

exports.addFeatured = asyncHandler(async (req, res) => {
  await query('INSERT INTO featured_vendors (vendor_id, sort_order) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.body.vendor_id, req.body.sort_order || 0]);
  sendSuccess(res, {}, 'Added to featured');
});

exports.removeFeatured = asyncHandler(async (req, res) => {
  await query('DELETE FROM featured_vendors WHERE vendor_id=$1', [req.params.vendorId]);
  sendSuccess(res, {}, 'Removed from featured');
});

exports.getPromotions = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM promotions ORDER BY created_at DESC');
  sendSuccess(res, { promotions: rows });
});

exports.createPromotion = asyncHandler(async (req, res) => {
  const { name, code, discount_type, discount_value, max_uses, expires_at } = req.body;
  const { rows } = await query(
    'INSERT INTO promotions (name, code, discount_type, discount_value, max_uses, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, code.toUpperCase(), discount_type, discount_value, max_uses, expires_at]
  );
  sendSuccess(res, { promotion: rows[0] }, 'Promotion created', 201);
});

// ── Send Notification ──────────────────────────────────────────────────────────
exports.sendNotification = asyncHandler(async (req, res) => {
  const { audience, type, title, body } = req.body; // audience: all | users | vendors

  if (audience === 'users' || audience === 'all') {
    const { rows } = await query("SELECT id FROM users WHERE status='active'");
    const inserts = rows.map(u =>
      query('INSERT INTO notifications (user_id, type, title, body) VALUES ($1,$2,$3,$4)', [u.id, type, title, body])
    );
    await Promise.all(inserts);
  }

  if (audience === 'vendors' || audience === 'all') {
    const { rows } = await query("SELECT id FROM vendors WHERE status='active'");
    const inserts = rows.map(v =>
      query('INSERT INTO notifications (vendor_id, type, title, body) VALUES ($1,$2,$3,$4)', [v.id, type, title, body])
    );
    await Promise.all(inserts);
  }

  sendSuccess(res, {}, 'Notifications sent');
});
