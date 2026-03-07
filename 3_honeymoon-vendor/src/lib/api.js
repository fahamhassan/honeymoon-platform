const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vendor_token');
}

export function setToken(token, refreshToken) {
  localStorage.setItem('vendor_token', token);
  if (refreshToken) localStorage.setItem('vendor_refresh_token', refreshToken);
}

export function clearToken() {
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('vendor_refresh_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data.data ?? data;
}

const get  = (path)        => request(path, { method: 'GET' });
const post = (path, body)  => request(path, { method: 'POST',  body: JSON.stringify(body) });
const put  = (path, body)  => request(path, { method: 'PUT',   body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
const del  = (path)        => request(path, { method: 'DELETE' });

export const api = {
  auth: {
    login:       (email, password) => post('/auth/vendor/login', { email, password }),
    me:          ()                => get('/auth/me'),
    logout:      ()                => post('/auth/logout', {}),
  },
  vendor: {
    profile:         ()          => get('/vendors/profile'),
    updateProfile:   (data)      => put('/vendors/profile', data),
    stats:           ()          => get('/vendors/me/stats'),
    services:        ()          => get('/vendors/me/services'),
    createService:   (data)      => post('/vendors/me/services', data),
    updateService:   (id, data)  => put(`/vendors/me/services/${id}`, data),
    deleteService:   (id)        => del(`/vendors/me/services/${id}`),
    bookings:        (params)    => get('/vendors/me/bookings' + (params ? '?' + new URLSearchParams(params) : '')),
    updateBooking:   (id, data)  => patch(`/vendors/me/bookings/${id}`, data),
    reviews:         (vendorId)  => get(`/vendors/${vendorId}/reviews`),
    replyReview:     (id, reply) => patch(`/users/reviews/${id}/reply`, { reply }),
  },
  payments: {
    list: () => get('/payments'),
  },
};
