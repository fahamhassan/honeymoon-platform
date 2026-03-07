const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function getToken()  { return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null; }
export function setToken(t, r) { localStorage.setItem('admin_token', t); if (r) localStorage.setItem('admin_refresh', r); }
export function clearToken() { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_refresh'); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `Error ${res.status}`);
  return data.data ?? data;
}

const get   = p      => request(p, { method: 'GET' });
const post  = (p, b) => request(p, { method: 'POST',  body: JSON.stringify(b) });
const patch = (p, b) => request(p, { method: 'PATCH', body: JSON.stringify(b) });
const del   = p      => request(p, { method: 'DELETE' });

export const api = {
  auth: {
    login:  (email, password) => post('/auth/admin/login', { email, password }),
    me:     ()                => get('/auth/me'),
    logout: ()                => post('/auth/logout', {}),
  },
  admin: {
    dashboard:       ()           => get('/admin/dashboard'),
    // Users
    users:           (p)          => get('/admin/users' + (p ? '?' + new URLSearchParams(p) : '')),
    updateUserStatus:(id, status) => patch(`/admin/users/${id}/status`, { status }),
    // Vendors
    vendors:         (p)          => get('/admin/vendors' + (p ? '?' + new URLSearchParams(p) : '')),
    approveVendor:   (id)         => post(`/admin/vendors/${id}/approve`, {}),
    rejectVendor:    (id, reason) => post(`/admin/vendors/${id}/reject`, { reason }),
    suspendVendor:   (id, reason) => post(`/admin/vendors/${id}/suspend`, { reason }),
    // Bookings
    bookings:        (p)          => get('/admin/bookings' + (p ? '?' + new URLSearchParams(p) : '')),
    // Finance
    finance:         ()           => get('/admin/finance'),
    // Reports
    reports:         (p)          => get('/admin/reports' + (p ? '?' + new URLSearchParams(p) : '')),
    updateReport:    (id, data)   => patch(`/admin/reports/${id}`, data),
    // Content
    banners:         ()           => get('/admin/content/banners'),
    createBanner:    (d)          => post('/admin/content/banners', d),
    toggleBanner:    (id)         => patch(`/admin/content/banners/${id}/toggle`, {}),
    deleteBanner:    (id)         => del(`/admin/content/banners/${id}`),
    featured:        ()           => get('/admin/content/featured'),
    addFeatured:     (vendorId)   => post('/admin/content/featured', { vendor_id: vendorId }),
    removeFeatured:  (vendorId)   => del(`/admin/content/featured/${vendorId}`),
    promotions:      ()           => get('/admin/content/promotions'),
    createPromotion: (d)          => post('/admin/content/promotions', d),
    // Notifications
    sendNotification:(d)          => post('/admin/notifications/send', d),
  },
};
