const { query } = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/error');

// ── List vendors (public, with filters) ──────────────────────────────────────
exports.listVendors = asyncHandler(async (req, res) => {
  const {
    category, city, search, sort = 'rating',
    page = 1, limit = 20,
    min_price, max_price, verified
  } = req.query;

  const conditions = ["v.status = 'active'"];
  const params = [];
  let p = 1;

  if (category) { conditions.push(`v.category = $${p++}`); params.push(category); }
  if (city)     { conditions.push(`v.city ILIKE $${p++}`); params.push(city); }
  if (verified === 'true') { conditions.push(`v.is_verified = TRUE`); }
  if (search)   {
    conditions.push(`(v.business_name ILIKE $${p} OR v.description ILIKE $${p} OR v.location ILIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  // Price filter via cheapest service
  let priceJoin = '';
  if (min_price || max_price) {
    priceJoin = `LEFT JOIN LATERAL (
      SELECT MIN(price) as min_price FROM vendor_services WHERE vendor_id = v.id AND is_active=TRUE
    ) ps ON TRUE`;
    if (min_price) { conditions.push(`ps.min_price >= $${p++}`); params.push(min_price); }
    if (max_price) { conditions.push(`ps.min_price <= $${p++}`); params.push(max_price); }
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const sortMap = {
    rating:   'v.rating DESC, v.review_count DESC',
    price_lo: 'min_service_price ASC',
    price_hi: 'min_service_price DESC',
    newest:   'v.created_at DESC',
    bookings: 'v.booking_count DESC',
  };
  const orderBy = sortMap[sort] || sortMap.rating;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const sql = `
    SELECT
      v.id, v.business_name, v.category, v.location, v.city,
      v.logo_url, v.cover_url, v.rating, v.review_count,
      v.is_verified, v.description,
      (SELECT MIN(price) FROM vendor_services WHERE vendor_id=v.id AND is_active=TRUE) as min_price,
      (SELECT pricing_unit FROM vendor_services WHERE vendor_id=v.id AND is_active=TRUE ORDER BY sort_order LIMIT 1) as pricing_unit,
      COUNT(*) OVER() as total_count
    FROM vendors v
    ${priceJoin}
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${p} OFFSET $${p+1}
  `;
  params.push(parseInt(limit), offset);

  const { rows } = await query(sql, params);
  const total = rows[0]?.total_count || 0;

  sendSuccess(res, {
    vendors: rows.map(({ total_count, ...v }) => v),
    pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total), pages: Math.ceil(total / limit) },
  });
});

// ── Get single vendor ─────────────────────────────────────────────────────────
exports.getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await query(
    `SELECT v.*,
      COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', vs.id, 'name', vs.name, 'description', vs.description,
        'price', vs.price, 'pricing_unit', vs.pricing_unit, 'sort_order', vs.sort_order,
        'features', (SELECT json_agg(vp.feature ORDER BY vp.sort_order) FROM vendor_packages vp WHERE vp.service_id = vs.id)
      )) FILTER (WHERE vs.id IS NOT NULL), '[]') as services,
      COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', r.id, 'rating', r.rating, 'body', r.body, 'vendor_reply', r.vendor_reply,
        'created_at', r.created_at,
        'user_name', u.full_name
      )) FILTER (WHERE r.id IS NOT NULL), '[]') as reviews,
      COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', vm.id, 'url', vm.url, 'type', vm.type, 'caption', vm.caption
      )) FILTER (WHERE vm.id IS NOT NULL), '[]') as media
    FROM vendors v
    LEFT JOIN vendor_services vs ON vs.vendor_id=v.id AND vs.is_active=TRUE
    LEFT JOIN reviews r ON r.vendor_id=v.id AND r.is_visible=TRUE
    LEFT JOIN users u ON u.id=r.user_id
    LEFT JOIN vendor_media vm ON vm.vendor_id=v.id
    WHERE v.id=$1 AND v.status='active'
    GROUP BY v.id`,
    [id]
  );

  if (!rows[0]) return sendError(res, 'Vendor not found', 404);
  sendSuccess(res, { vendor: rows[0] });
});

// ── Get featured vendors ──────────────────────────────────────────────────────
exports.getFeatured = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT v.id, v.business_name, v.category, v.location, v.logo_url, v.rating, v.is_verified,
            (SELECT MIN(price) FROM vendor_services WHERE vendor_id=v.id AND is_active=TRUE) as min_price
     FROM featured_vendors fv
     JOIN vendors v ON v.id=fv.vendor_id AND v.status='active'
     ORDER BY fv.sort_order`
  );
  sendSuccess(res, { vendors: rows });
});

// ── Vendor: update own profile ────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const vendorId = req.vendor.id;
  const fields = ['business_name', 'description', 'location', 'city', 'phone', 'whatsapp', 'language'];
  const updates = [];
  const params = [];
  let p = 1;

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${p++}`);
      params.push(req.body[f]);
    }
  });

  if (!updates.length) return sendError(res, 'No fields to update');

  params.push(vendorId);
  const { rows } = await query(
    `UPDATE vendors SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${p} RETURNING *`,
    params
  );
  sendSuccess(res, { vendor: rows[0] }, 'Profile updated');
});

// ── Vendor: manage services ───────────────────────────────────────────────────
exports.getServices = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT vs.*, json_agg(vp.feature ORDER BY vp.sort_order) FILTER (WHERE vp.id IS NOT NULL) as features
     FROM vendor_services vs
     LEFT JOIN vendor_packages vp ON vp.service_id = vs.id
     WHERE vs.vendor_id=$1
     GROUP BY vs.id ORDER BY vs.sort_order`,
    [req.vendor.id]
  );
  sendSuccess(res, { services: rows });
});

exports.createService = asyncHandler(async (req, res) => {
  const { name, description, price, pricing_unit, max_guests, features = [] } = req.body;

  const { rows } = await query(
    `INSERT INTO vendor_services (vendor_id, name, description, price, pricing_unit, max_guests)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.vendor.id, name, description, price, pricing_unit || 'per_event', max_guests]
  );

  const svc = rows[0];
  for (let i = 0; i < features.length; i++) {
    await query(
      'INSERT INTO vendor_packages (service_id, feature, sort_order) VALUES ($1,$2,$3)',
      [svc.id, features[i], i]
    );
  }

  sendSuccess(res, { service: svc }, 'Service created', 201);
});

exports.updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, pricing_unit, is_active, features } = req.body;

  const { rows } = await query(
    `UPDATE vendor_services
     SET name=COALESCE($1,name), description=COALESCE($2,description),
         price=COALESCE($3,price), pricing_unit=COALESCE($4,pricing_unit),
         is_active=COALESCE($5,is_active)
     WHERE id=$6 AND vendor_id=$7 RETURNING *`,
    [name, description, price, pricing_unit, is_active, id, req.vendor.id]
  );

  if (!rows[0]) return sendError(res, 'Service not found', 404);

  if (features) {
    await query('DELETE FROM vendor_packages WHERE service_id=$1', [id]);
    for (let i = 0; i < features.length; i++) {
      await query('INSERT INTO vendor_packages (service_id, feature, sort_order) VALUES ($1,$2,$3)', [id, features[i], i]);
    }
  }

  sendSuccess(res, { service: rows[0] }, 'Service updated');
});

exports.deleteService = asyncHandler(async (req, res) => {
  await query('DELETE FROM vendor_services WHERE id=$1 AND vendor_id=$2', [req.params.id, req.vendor.id]);
  sendSuccess(res, {}, 'Service deleted');
});

// ── Vendor: get stats ─────────────────────────────────────────────────────────
exports.getStats = asyncHandler(async (req, res) => {
  const vendorId = req.vendor.id;
  const [bookings, revenue, reviews] = await Promise.all([
    query(`SELECT status, COUNT(*) as count FROM bookings WHERE vendor_id=$1 GROUP BY status`, [vendorId]),
    query(`SELECT SUM(vendor_payout) as total, DATE_TRUNC('month', created_at) as month
           FROM payments WHERE vendor_id=$1 AND status='paid'
           GROUP BY month ORDER BY month DESC LIMIT 6`, [vendorId]),
    query(`SELECT AVG(rating)::DECIMAL(3,2) as avg, COUNT(*) as count FROM reviews WHERE vendor_id=$1`, [vendorId]),
  ]);

  sendSuccess(res, {
    bookings: bookings.rows,
    revenue:  revenue.rows,
    reviews:  reviews.rows[0],
  });
});
