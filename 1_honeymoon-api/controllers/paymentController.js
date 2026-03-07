const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query, withTransaction } = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/error');
const { sendBookingConfirmationEmail, sendVendorNewBookingEmail } = require('../utils/email');

// ─── Helper: get or create Stripe Customer for a user ─────────────────────────
async function getOrCreateStripeCustomer(user) {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await stripe.customers.create({
    name:     user.full_name,
    email:    user.email,
    phone:    user.phone,
    metadata: { user_id: user.id },
  });

  await query('UPDATE users SET stripe_customer_id=$1 WHERE id=$2', [customer.id, user.id]);
  return customer.id;
}

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENT SHEET  (used by @stripe/stripe-react-native)
// ══════════════════════════════════════════════════════════════════════════════
exports.createPaymentSheet = asyncHandler(async (req, res) => {
  const { booking_id, payment_type } = req.body;
  if (!booking_id || !payment_type) {
    return sendError(res, 'booking_id and payment_type required', 400);
  }

  // Load booking + user in parallel
  const [bookingRes, userRes] = await Promise.all([
    query('SELECT * FROM bookings WHERE id=$1 AND user_id=$2', [booking_id, req.user.id]),
    query('SELECT id, full_name, email, phone, stripe_customer_id FROM users WHERE id=$1', [req.user.id]),
  ]);

  const booking = bookingRes.rows[0];
  const user    = userRes.rows[0];

  if (!booking) return sendError(res, 'Booking not found', 404);
  if (booking.status === 'cancelled') return sendError(res, 'Booking is cancelled');

  // Determine amount to charge
  let amount;
  if (payment_type === 'deposit') amount = parseFloat(booking.deposit_amount);
  else if (payment_type === 'full') amount = parseFloat(booking.total_amount);
  else amount = parseFloat(booking.remaining); // balance

  amount = Math.round(amount * 100) / 100; // round to 2dp
  if (amount <= 0) return sendError(res, 'Nothing to pay');

  const amountFils = Math.round(amount * 100); // AED → fils

  // Get or create Stripe Customer (enables saved cards)
  const customerId = await getOrCreateStripeCustomer(user);

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount:   amountFils,
    currency: 'aed',
    customer: customerId,
    setup_future_usage: 'off_session', // save card for future payments
    metadata: {
      booking_id:   booking.id,
      booking_ref:  booking.booking_ref,
      user_id:      req.user.id,
      vendor_id:    booking.vendor_id,
      payment_type,
    },
    description: `HoneyMoon: ${booking.booking_ref} — ${payment_type}`,
  });

  // Create ephemeral key so the SDK can manage saved cards
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: '2023-10-16' }
  );

  // Record pending payment in DB
  const { rows: pmtRows } = await query(
    `INSERT INTO payments
       (booking_id, user_id, vendor_id, amount, platform_fee, vendor_payout, type, status, gateway, gateway_payment_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','stripe',$8)
     ON CONFLICT (gateway_payment_id) DO UPDATE SET updated_at=NOW()
     RETURNING id`,
    [
      booking.id,
      req.user.id,
      booking.vendor_id,
      amount,
      parseFloat(booking.platform_fee),
      amount - parseFloat(booking.platform_fee),
      payment_type,
      paymentIntent.id,
    ]
  );

  sendSuccess(res, {
    paymentIntentClientSecret: paymentIntent.client_secret,
    ephemeralKey:              ephemeralKey.secret,
    customerId,
    publishableKey:            process.env.STRIPE_PUBLISHABLE_KEY,
    amount,
    currency:                  'AED',
    bookingRef:                booking.booking_ref,
    paymentId:                 pmtRows[0]?.id,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STRIPE WEBHOOK  (called by Stripe, not by the app)
// ══════════════════════════════════════════════════════════════════════════════
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // ── payment_intent.succeeded ─────────────────────────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { booking_id, payment_type } = pi.metadata;
    const amount = pi.amount / 100;

    await withTransaction(async (client) => {
      // 1. Mark payment as paid
      await client.query(
        `UPDATE payments
         SET status='paid', gateway_charge_id=$1, updated_at=NOW()
         WHERE gateway_payment_id=$2`,
        [pi.latest_charge, pi.id]
      );

      // 2. Update booking paid_amount; auto-confirm once deposit received
      const { rows: bRows } = await client.query(
        `UPDATE bookings SET
           paid_amount  = paid_amount + $1,
           status       = CASE
             WHEN paid_amount + $1 >= deposit_amount AND status = 'pending' THEN 'confirmed'
             ELSE status
           END,
           confirmed_at = CASE
             WHEN paid_amount + $1 >= deposit_amount AND status = 'pending' THEN NOW()
             ELSE confirmed_at
           END,
           updated_at   = NOW()
         WHERE id = $2
         RETURNING *, (paid_amount >= total_amount) as fully_paid`,
        [amount, booking_id]
      );
      const booking = bRows[0];

      // 3. Award loyalty points (1 pt per 10 AED)
      const points = Math.floor(amount / 10);
      if (points > 0 && booking) {
        await client.query(
          'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id=$2',
          [points, booking.user_id]
        );
        const { rows: uRows } = await client.query(
          'SELECT loyalty_points FROM users WHERE id=$1', [booking.user_id]
        );
        await client.query(
          `INSERT INTO loyalty_transactions (user_id, points, reason, ref_id, balance)
           VALUES ($1,$2,'Payment: '||$3,$4,$5)`,
          [booking.user_id, points, booking.booking_ref, booking_id, uRows[0].loyalty_points]
        );
      }

      // 4. Notify user
      if (booking) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1,'payment',$2,$3,$4)`,
          [
            booking.user_id,
            booking.status === 'confirmed' ? 'Booking Confirmed! 🎉' : 'Payment Received ✓',
            `AED ${amount.toLocaleString()} paid for ${booking.booking_ref}.` +
              (booking.status === 'confirmed' ? ' Your booking is confirmed!' : ''),
            JSON.stringify({ booking_id }),
          ]
        );

        // 5. Send confirmation emails (non-blocking)
        const [uRes, vRes] = await Promise.all([
          client.query('SELECT full_name, email FROM users WHERE id=$1', [booking.user_id]),
          client.query('SELECT business_name, email FROM vendors WHERE id=$1', [booking.vendor_id]),
        ]);
        if (booking.status === 'confirmed') {
          sendBookingConfirmationEmail(uRes.rows[0], booking, vRes.rows[0]).catch(console.error);
          sendVendorNewBookingEmail(vRes.rows[0], booking, uRes.rows[0]).catch(console.error);
        }
      }
    });
  }

  // ── payment_intent.payment_failed ────────────────────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await query(
      "UPDATE payments SET status='failed', updated_at=NOW() WHERE gateway_payment_id=$1",
      [pi.id]
    );
    // Notify user
    const { rows } = await query(
      `SELECT b.user_id, b.booking_ref FROM payments p
       JOIN bookings b ON b.id=p.booking_id
       WHERE p.gateway_payment_id=$1`, [pi.id]
    );
    if (rows[0]) {
      await query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1,'payment','Payment Failed','Your payment could not be processed. Please try again.',$2)`,
        [rows[0].user_id, JSON.stringify({ booking_ref: rows[0].booking_ref })]
      );
    }
  }

  // ── charge.refunded ──────────────────────────────────────────────────────
  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    await query(
      "UPDATE payments SET status='refunded', updated_at=NOW() WHERE gateway_charge_id=$1",
      [charge.id]
    );
  }

  res.json({ received: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET PAYMENT HISTORY
// ══════════════════════════════════════════════════════════════════════════════
exports.getPayments = asyncHandler(async (req, res) => {
  const isVendor = req.role === 'vendor';
  const id       = isVendor ? req.vendor.id : req.user.id;
  const col      = isVendor ? 'vendor_id' : 'user_id';

  const { rows } = await query(
    `SELECT
       p.id, p.amount, p.platform_fee, p.vendor_payout, p.currency,
       p.type, p.status, p.gateway, p.payout_status, p.created_at,
       b.booking_ref, b.event_date, b.package_name,
       ${isVendor
         ? 'u.full_name  AS counterpart_name'
         : 'v.business_name AS counterpart_name'}
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     ${isVendor
       ? 'JOIN users   u ON u.id = p.user_id'
       : 'JOIN vendors v ON v.id = p.vendor_id'}
     WHERE p.${col} = $1
     ORDER BY p.created_at DESC`,
    [id]
  );

  sendSuccess(res, { payments: rows });
});

// ══════════════════════════════════════════════════════════════════════════════
// REQUEST REFUND
// ══════════════════════════════════════════════════════════════════════════════
exports.requestRefund = asyncHandler(async (req, res) => {
  const { payment_id, reason } = req.body;
  if (!payment_id) return sendError(res, 'payment_id required', 400);

  const { rows } = await query(
    "SELECT * FROM payments WHERE id=$1 AND user_id=$2 AND status='paid'",
    [payment_id, req.user.id]
  );
  if (!rows[0]) return sendError(res, 'Payment not found or not eligible', 404);

  const payment = rows[0];
  if (!payment.gateway_charge_id) {
    return sendError(res, 'Cannot refund — charge ID missing', 400);
  }

  const refund = await stripe.refunds.create({
    charge: payment.gateway_charge_id,
    reason: 'requested_by_customer',
    metadata: { payment_id, user_reason: reason || '' },
  });

  await query(
    "UPDATE payments SET status='refunded', refund_id=$1, updated_at=NOW() WHERE id=$2",
    [refund.id, payment_id]
  );

  sendSuccess(res, { refundId: refund.id }, 'Refund initiated. Processing takes 5–10 business days.');
});
