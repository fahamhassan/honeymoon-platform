# HoneyMoon Platform — Complete Codebase

UAE luxury wedding & events planning platform.
Built across 5 sessions. Everything needed to go live is in these 4 folders.

---

## Project Structure

```
honeymoon-api/          ← Node.js/Express backend + PostgreSQL
HoneyMoonApp/           ← React Native iOS & Android app
honeymoon-vendor/       ← Next.js vendor dashboard (port 3001)
honeymoon-admin/        ← Next.js admin control panel (port 3002)
```

---

## Quick Start (local development)

### 1. Database
```bash
# Spin up PostgreSQL (or use Supabase free tier)
psql -U postgres -c "CREATE DATABASE honeymoon;"
psql -U postgres -d honeymoon -f honeymoon-api/database/schema.sql
psql -U postgres -d honeymoon -f honeymoon-api/database/seed.sql
```

### 2. Backend API
```bash
cd honeymoon-api
npm install
cp .env.example .env        # fill in your keys
npm run dev                 # runs on http://localhost:5000
```

### 3. Vendor Dashboard
```bash
cd honeymoon-vendor
npm install
npm run dev                 # runs on http://localhost:3001
```

### 4. Admin Dashboard
```bash
cd honeymoon-admin
npm install
npm run dev                 # runs on http://localhost:3002
```

### 5. Mobile App
```bash
cd HoneyMoonApp
npm install
cd ios && pod install && cd ..        # iOS only
npx react-native run-ios              # or run-android
```

---

## Environment Variables (honeymoon-api/.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/honeymoon

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Stripe (https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Twilio SMS (https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+971xxxxxxxxx

# Email / SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
EMAIL_FROM=noreply@honeymoon.ae
EMAIL_FROM_NAME=HoneyMoon

# UAE Pass OAuth (https://uaepass.ae)
UAEPASS_CLIENT_ID=xxx
UAEPASS_CLIENT_SECRET=xxx
UAEPASS_REDIRECT_URI=https://api.honeymoon.ae/api/v1/auth/uaepass/callback
UAEPASS_ENV=qa               # change to 'production' when approved

# App URLs (for CORS + email links)
CLIENT_URL=https://honeymoon.ae
VENDOR_URL=https://vendor.honeymoon.ae
ADMIN_URL=https://admin.honeymoon.ae
API_VERSION=v1
PORT=5000
NODE_ENV=production
```

---

## Mobile App — Key Config

**Update API URL** before building:
`HoneyMoonApp/src/services/api.js` → change `BASE_URL` to your live API

**Update Stripe key:**
`HoneyMoonApp/App.js` → replace `pk_test_your_test_key_here` with your real publishable key

**Deep links (UAE Pass callback):**

iOS — add to `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>honeymoon</string></array>
  </dict>
</array>
```

Android — add to `AndroidManifest.xml` inside `<activity>`:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="honeymoon" />
</intent-filter>
```

---

## Deployment

| Service | Recommended Host | Command |
|---------|-----------------|---------|
| `honeymoon-api` | Railway / Render / DigitalOcean | `npm start` |
| `honeymoon-vendor` | Vercel | `vercel deploy` |
| `honeymoon-admin` | Vercel | `vercel deploy` |
| Database | Supabase / AWS RDS | — |
| Mobile | App Store + Play Console | Archive in Xcode / Gradle |

**Stripe Webhook:**
In Stripe Dashboard → Developers → Webhooks → Add endpoint:
`https://api.honeymoon.ae/api/v1/payments/webhook`
Events to listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

---

## Default Login Credentials (seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@honeymoon.ae | Admin@123456 |
| Vendor | alqasr@honeymoon.ae | Vendor@123456 |
| User | fatima@example.com | User@123456 |

> Change all passwords immediately in production.

---

## What's Built

### Backend API (honeymoon-api)
- 60+ REST endpoints
- JWT auth with refresh tokens
- Phone OTP via Twilio
- UAE Pass OAuth 2.0
- Stripe PaymentSheet + webhooks
- Loyalty points system
- Push notifications
- Admin, vendor, user, booking, payment controllers
- PostgreSQL schema — 20 tables

### Mobile App (HoneyMoonApp) — iOS & Android
- 25+ screens
- Auth: register, login, OTP, UAE Pass, forgot/reset password
- Home, Explore vendors, Vendor detail
- Booking flow — 3-step with real Stripe payment
- Bookings list + detail with balance payment
- Budget planner
- Payment history
- Loyalty points + tier
- Profile, settings, wishlist, notifications

### Vendor Dashboard (honeymoon-vendor) — Next.js
- Login
- Overview — revenue, bookings, ratings
- Bookings — confirm/decline with client notes
- Services — full CRUD
- Earnings — revenue & payout breakdown
- Reviews — read + reply
- Settings — business profile

### Admin Panel (honeymoon-admin) — Next.js
- Login
- Platform overview — KPIs, health metrics
- Users — list, suspend, restore
- Vendors — approve, reject, suspend pending applications
- Bookings — all platform bookings
- Finance — GMV, fees, payouts
- Reports — dispute management
- Content — banners, featured vendors, promotions
- Notifications — broadcast to all/active/gold/diamond users

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18, Express 4, PostgreSQL 15 |
| Mobile | React Native 0.73, React Navigation 6 |
| Web Dashboards | Next.js 14, Tailwind CSS 3 |
| Payments | Stripe (PaymentSheet + webhooks) |
| Auth | JWT, Twilio OTP, UAE Pass OAuth 2.0 |
| Email | Nodemailer / SendGrid |
| SMS | Twilio |

---

*Built for HoneyMoon Events Management Platform · Dubai, UAE · 2026*
