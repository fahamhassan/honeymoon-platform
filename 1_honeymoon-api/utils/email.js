const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.sendgrid.net',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const FROM = `"${process.env.EMAIL_FROM_NAME || 'HoneyMoon'}" <${process.env.EMAIL_FROM || 'noreply@honeymoon.ae'}>`;

// ── Base HTML wrapper ─────────────────────────────────────────────────────────
const wrap = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <style>
    body { margin: 0; padding: 0; background: #0C0910; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #1A1028; border-radius: 16px; padding: 40px; border: 1px solid rgba(198,168,92,0.2); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { font-size: 28px; font-weight: 700; color: #C6A85C; letter-spacing: 3px; }
    .logo-moon { font-size: 32px; margin-right: 8px; }
    h1 { color: #F5ECD7; font-size: 24px; margin: 0 0 16px; }
    p { color: #9B8FA8; font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
    .code { background: rgba(198,168,92,0.12); border: 1px solid rgba(198,168,92,0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .code-text { font-size: 40px; font-weight: 700; color: #C6A85C; letter-spacing: 12px; }
    .code-expires { font-size: 13px; color: #6B5F78; margin-top: 8px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #C6A85C, #A8863A); color: #0C0910; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid rgba(198,168,92,0.1); margin: 24px 0; }
    .footer { text-align: center; margin-top: 32px; color: #4A3F54; font-size: 13px; }
    .footer a { color: #6B5F78; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">
      <span class="logo-moon">🌙</span>
      <span class="logo-text">HoneyMoon</span>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 HoneyMoon Platform · Dubai, UAE</p>
      <p><a href="${process.env.CLIENT_URL || 'https://honeymoon.ae'}">honeymoon.ae</a> · <a href="mailto:support@honeymoon.ae">support@honeymoon.ae</a></p>
    </div>
  </div>
</body>
</html>
`;

// ── Send functions ─────────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\n   Subject: ${subject}\n`);
    return;
  }
  await getTransporter().sendMail({ from: FROM, to, subject, html });
};

const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: '🌙 Welcome to HoneyMoon',
    html: wrap(`
      <h1>Welcome, ${user.full_name?.split(' ')[0] || 'there'}! 👋</h1>
      <p>You've joined the UAE's most exclusive wedding planning platform. We're honoured to be part of your special journey.</p>
      <p>Your account is now active. Start discovering UAE's finest vendors:</p>
      <div style="text-align:center">
        <a href="${process.env.CLIENT_URL}" class="btn">Explore Vendors</a>
      </div>
      <hr class="divider">
      <p style="font-size:13px;color:#4A3F54">If you didn't create this account, please contact us at support@honeymoon.ae</p>
    `),
  });
};

const sendPasswordResetEmail = async (user, code) => {
  await sendEmail({
    to: user.email,
    subject: '🔐 Reset Your HoneyMoon Password',
    html: wrap(`
      <h1>Password Reset Request</h1>
      <p>We received a request to reset your password. Use the code below:</p>
      <div class="code">
        <div class="code-text">${code}</div>
        <div class="code-expires">Expires in 10 minutes</div>
      </div>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `),
  });
};

const sendBookingConfirmationEmail = async (user, booking, vendor) => {
  await sendEmail({
    to: user.email,
    subject: `✨ Booking ${booking.booking_ref} Confirmed — HoneyMoon`,
    html: wrap(`
      <h1>Booking Confirmed! ✨</h1>
      <p>Your booking with <strong style="color:#C6A85C">${vendor.business_name}</strong> has been confirmed.</p>
      <div style="background:rgba(198,168,92,0.08);border-radius:8px;padding:20px;margin:20px 0">
        <table width="100%" style="border-collapse:collapse;color:#9B8FA8;font-size:14px">
          <tr><td style="padding:6px 0">Booking Ref</td><td style="text-align:right;color:#C6A85C;font-weight:700">${booking.booking_ref}</td></tr>
          <tr><td style="padding:6px 0">Service</td><td style="text-align:right;color:#F5ECD7">${booking.package_name}</td></tr>
          <tr><td style="padding:6px 0">Event Date</td><td style="text-align:right;color:#F5ECD7">${new Date(booking.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding:6px 0">Total Amount</td><td style="text-align:right;color:#F5ECD7">AED ${parseFloat(booking.total_amount).toLocaleString()}</td></tr>
          <tr><td style="padding:6px 0">Amount Paid</td><td style="text-align:right;color:#C6A85C;font-weight:700">AED ${parseFloat(booking.paid_amount).toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="text-align:center">
        <a href="${process.env.CLIENT_URL}/bookings/${booking.id}" class="btn">View Booking</a>
      </div>
    `),
  });
};

const sendVendorNewBookingEmail = async (vendor, booking, user) => {
  await sendEmail({
    to: vendor.email,
    subject: `📅 New Booking Request — ${booking.booking_ref}`,
    html: wrap(`
      <h1>New Booking Request</h1>
      <p><strong style="color:#C6A85C">${user.full_name}</strong> has requested a booking:</p>
      <div style="background:rgba(198,168,92,0.08);border-radius:8px;padding:20px;margin:20px 0">
        <table width="100%" style="border-collapse:collapse;color:#9B8FA8;font-size:14px">
          <tr><td style="padding:6px 0">Booking Ref</td><td style="text-align:right;color:#C6A85C;font-weight:700">${booking.booking_ref}</td></tr>
          <tr><td style="padding:6px 0">Package</td><td style="text-align:right;color:#F5ECD7">${booking.package_name}</td></tr>
          <tr><td style="padding:6px 0">Event Date</td><td style="text-align:right;color:#F5ECD7">${new Date(booking.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding:6px 0">Guests</td><td style="text-align:right;color:#F5ECD7">${booking.guest_count}</td></tr>
          <tr><td style="padding:6px 0">Total Value</td><td style="text-align:right;color:#F5ECD7">AED ${parseFloat(booking.total_amount).toLocaleString()}</td></tr>
        </table>
      </div>
      <p>Please respond within 24 hours to confirm or decline.</p>
      <div style="text-align:center">
        <a href="${process.env.VENDOR_URL}/bookings/${booking.id}" class="btn">Review Booking</a>
      </div>
    `),
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendVendorNewBookingEmail,
};
