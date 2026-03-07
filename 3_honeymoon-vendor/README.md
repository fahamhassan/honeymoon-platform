# HoneyMoon — Vendor Portal

Next.js 14 vendor dashboard. Runs on port 3001.

## Setup

```bash
npm install
cp .env.local.example .env.local  # set NEXT_PUBLIC_API_URL
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Vendor sign-in |
| `/dashboard` | Overview — revenue, bookings, stats |
| `/dashboard/bookings` | Manage incoming bookings, confirm/decline |
| `/dashboard/services` | CRUD service listings |
| `/dashboard/earnings` | Revenue & payout history |
| `/dashboard/reviews` | Read reviews, post replies |
| `/dashboard/settings` | Business profile settings |

## Auth
JWT stored in `localStorage` as `vendor_token`. Backend: `POST /auth/vendor/login`.
