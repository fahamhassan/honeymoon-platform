# HoneyMoon — Admin Control Panel

Next.js 14 admin dashboard. Runs on port 3002.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Admin sign-in |
| `/dashboard` | Platform overview — KPIs, revenue, health |
| `/dashboard/users` | User management, status updates |
| `/dashboard/vendors` | Approve/reject/suspend vendors |
| `/dashboard/bookings` | All platform bookings |
| `/dashboard/finance` | Revenue, GMV, payout tracking |
| `/dashboard/reports` | User-submitted disputes |
| `/dashboard/content` | Banners, featured vendors, promotions |
| `/dashboard/notifications` | Broadcast notifications |

## Auth
JWT stored in `localStorage` as `admin_token`. Backend: `POST /auth/admin/login`.
