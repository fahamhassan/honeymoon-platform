# 🌙 HoneyMoon API

Node.js + Express + PostgreSQL REST API for the HoneyMoon wedding platform.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Create the database
createdb honeymoon_db

# 4. Run schema + seed data
npm run db:reset

# 5. Start development server
npm run dev
```

Server runs at `http://localhost:5000`
Base URL: `http://localhost:5000/api/v1`

---

## Deployment (Railway / Render / EC2)

```bash
# Railway
railway login
railway init
railway add postgresql
railway up

# Render — connect PostgreSQL add-on, set env vars in dashboard, deploy from GitHub

# Environment variables required in production:
# DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET,
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
# TWILIO_*, AWS_*, SMTP_*
```

---

## Full API Reference

### Auth  `/api/v1/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | — | `full_name, email, phone, password` | Register user |
| POST | `/login` | — | `email, password` | Login user → returns `token` |
| POST | `/vendor/register` | — | `business_name, email, phone, password, category, city` | Register vendor |
| POST | `/vendor/login` | — | `email, password` | Login vendor |
| POST | `/otp/send` | — | `phone` | Send OTP via SMS |
| POST | `/otp/verify` | — | `phone, code` | Verify OTP → activates account |
| POST | `/refresh` | — | `refreshToken` | Get new access token |
| POST | `/logout` | — | `refreshToken` | Revoke refresh token |
| GET | `/me` | ✓ | — | Get current user/vendor |

### Vendors  `/api/v1/vendors`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | List vendors (filter: `category, city, search, sort, min_price, max_price`) |
| GET | `/featured` | — | Get featured vendors |
| GET | `/:id` | — | Get full vendor profile with services + reviews |
| GET | `/:vendor_id/reviews` | — | Get vendor reviews |
| PUT | `/profile` | Vendor | Update own profile |
| GET | `/me/services` | Vendor | Get own services |
| POST | `/me/services` | Vendor | Create service |
| PUT | `/me/services/:id` | Vendor | Update service |
| DELETE | `/me/services/:id` | Vendor | Delete service |
| GET | `/me/stats` | Vendor | Get bookings/revenue stats |
| GET | `/me/bookings` | Vendor | Get own bookings |
| PATCH | `/me/bookings/:id` | Vendor | Confirm or cancel booking |

### Bookings  `/api/v1/bookings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | User | Create booking |
| GET | `/` | User | Get my bookings (filter: `status`) |
| GET | `/:id` | User/Admin | Get single booking |
| POST | `/:id/cancel` | User | Cancel booking |

### Payments  `/api/v1/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/intent` | User | Create Stripe PaymentIntent → returns `clientSecret` |
| GET | `/` | User/Vendor | Get payment history |
| POST | `/refund` | User | Request refund |
| POST | `/webhook` | — (Stripe sig) | Stripe webhook handler |

### Users  `/api/v1/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | User | Get full profile + events |
| PUT | `/profile` | User | Update profile |
| POST | `/change-password` | User | Change password |
| GET | `/loyalty` | User | Get loyalty points + transaction history |
| GET | `/events` | User | Get my events |
| POST | `/events` | User | Create event |
| PUT | `/events/:id` | User | Update event |
| GET | `/wishlist` | User | Get wishlisted vendors |
| POST | `/wishlist/toggle` | User | Add/remove from wishlist |
| POST | `/reviews` | User | Submit review |
| GET | `/notifications` | User/Vendor | Get notifications |
| PATCH | `/notifications/:id` | User/Vendor | Mark read (use `all` for all) |
| POST | `/push-token` | User/Vendor | Update FCM/APNs push token |

### Admin  `/api/v1/admin`  *(requires Admin JWT)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Platform overview stats |
| GET | `/users` | List all users |
| PATCH | `/users/:id/status` | Update user status |
| GET | `/vendors` | List all vendors |
| POST | `/vendors/:id/approve` | Approve vendor |
| POST | `/vendors/:id/reject` | Reject vendor |
| POST | `/vendors/:id/suspend` | Toggle suspend |
| GET | `/bookings` | All bookings |
| GET | `/finance` | Revenue, GMV, pending payouts |
| GET | `/reports` | User reports |
| PATCH | `/reports/:id` | Update report status |
| GET | `/content/banners` | Get banners |
| POST | `/content/banners` | Create banner |
| PATCH | `/content/banners/:id/toggle` | Toggle active |
| DELETE | `/content/banners/:id` | Delete banner |
| GET | `/content/featured` | Featured vendors |
| POST | `/content/featured` | Add to featured |
| DELETE | `/content/featured/:vendorId` | Remove from featured |
| GET | `/content/promotions` | Promotions list |
| POST | `/content/promotions` | Create promotion |
| POST | `/notifications/send` | Broadcast notification |

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

**Token lifetimes:**
- Access token: 7 days
- Refresh token: 30 days

**Roles:** `user` | `vendor` | `admin`

---

## Connecting the React Native App

In `src/services/api.js`:

```javascript
const BASE = 'https://api.honeymoon.ae/api/v1';

const get = (path, token) =>
  fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }).then(r => r.json());

const post = (path, body, token) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());

export const api = {
  // Auth
  login:        (email, password)       => post('/auth/login', { email, password }),
  register:     (data)                  => post('/auth/register', data),
  sendOtp:      (phone)                 => post('/auth/otp/send', { phone }),
  verifyOtp:    (phone, code)           => post('/auth/otp/verify', { phone, code }),
  me:           (token)                 => get('/auth/me', token),

  // Vendors
  getVendors:   (params)                => get(`/vendors?${new URLSearchParams(params)}`),
  getVendor:    (id)                    => get(`/vendors/${id}`),
  getFeatured:  ()                      => get('/vendors/featured'),

  // Bookings
  getBookings:  (token, params)         => get(`/bookings?${new URLSearchParams(params)}`, token),
  createBooking:(token, data)           => post('/bookings', data, token),
  cancelBooking:(token, id, reason)     => post(`/bookings/${id}/cancel`, { reason }, token),

  // Payments
  paymentIntent:(token, data)           => post('/payments/intent', data, token),

  // User
  getProfile:   (token)                 => get('/users/profile', token),
  getWishlist:  (token)                 => get('/users/wishlist', token),
  toggleWishlist:(token, vendor_id)     => post('/users/wishlist/toggle', { vendor_id }, token),
  getNotifs:    (token)                 => get('/users/notifications', token),
};
```

---

## File Structure

```
honeymoon-api/
├── server.js               Entry point + middleware setup
├── package.json
├── .env.example
│
├── config/
│   └── db.js               PostgreSQL pool + helpers
│
├── database/
│   ├── schema.sql           All tables, indexes, triggers
│   └── seed.sql             Sample data for development
│
├── middleware/
│   ├── auth.js              JWT verify + role guards
│   └── error.js             Global error handler + helpers
│
├── controllers/
│   ├── authController.js    Register, login, OTP, refresh
│   ├── vendorController.js  Vendor CRUD, services, stats
│   ├── bookingController.js Create, list, cancel, confirm
│   ├── paymentController.js Stripe intents, webhook, refunds
│   ├── userController.js    Profile, wishlist, reviews, notifs
│   └── adminController.js   Full admin platform management
│
└── routes/
    └── index.js             All route definitions
```

---

## What's Next (Session 2)

- Connect React Native app to this API (replace mock data)
- Add loading states and error handling in every screen
- Store JWT securely with AsyncStorage
- Session 3: Real OTP via Twilio, UAE Pass OAuth
- Session 4: Stripe SDK in React Native app
