import { getAccessToken, getRefreshToken, saveTokens, clearSession } from './storage';

// ── Config ─────────────────────────────────────────────────────────────────────
const BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api/v1'           // local dev (Android Emulator)
  : 'https://honeymoon-api.onrender.com/api/v1'; // production (Render placeholder)

const TIMEOUT_MS = 12000;

// ── Request queue for token refresh ───────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
const request = async (method, path, body = null, requiresAuth = true, isRetry = false) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };

    if (requiresAuth) {
      const token = await getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      signal: controller.signal,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    clearTimeout(timeout);

    // Token expired — try refresh once
    if (res.status === 401 && !isRetry && requiresAuth) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(newToken => request(method, path, body, requiresAuth, true));
      }

      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) throw new Error('Refresh failed');

        const { token: newToken } = await refreshRes.json();
        await saveTokens(newToken, refreshToken);
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry original request with new token
        return request(method, path, body, requiresAuth, true);
      } catch (refreshErr) {
        processQueue(refreshErr);
        isRefreshing = false;
        await clearSession();
        throw { type: 'AUTH_EXPIRED', message: 'Session expired. Please log in again.' };
      }
    }

    const data = await res.json();

    if (!res.ok) {
      throw {
        type: 'API_ERROR',
        status: res.status,
        message: data.message || 'Something went wrong',
      };
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      throw { type: 'TIMEOUT', message: 'Request timed out. Check your connection.' };
    }
    if (err.message === 'Network request failed' || err.message?.includes('fetch')) {
      throw { type: 'NETWORK', message: 'No internet connection.' };
    }
    throw err;
  }
};

// ── HTTP method shortcuts ─────────────────────────────────────────────────────
const get = (path, auth = true) => request('GET', path, null, auth);
const post = (path, body, auth = true) => request('POST', path, body, auth);
const put = (path, body, auth = true) => request('PUT', path, body, auth);
const patch = (path, body, auth = true) => request('PATCH', path, body, auth);
const del = (path, auth = true) => request('DELETE', path, null, auth);

const qs = (params) =>
  Object.keys(params).length
    ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString()
    : '';

// ══════════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════

export const api = {

  // ── Auth ───────────────────────────────────────────────────────────────────
  auth: {
    register: (data) => post('/auth/register', data, false),
    login: (email, password) => post('/auth/login', { email, password }, false),
    vendorLogin: (email, password) => post('/auth/vendor/login', { email, password }, false),
    vendorRegister: (data) => post('/auth/vendor/register', data, false),
    adminLogin: (email, password) => post('/auth/admin/login', { email, password }, false),
    sendOtp: (phone, purpose) => post('/auth/otp/send', { phone, purpose: purpose || 'verify' }, false),
    verifyOtp: (phone, code, purpose) => post('/auth/otp/verify', { phone, code, purpose: purpose || 'verify' }, false),
    forgotPassword: (identifier) => post('/auth/forgot-password', { identifier }, false),
    resetPassword: (data) => post('/auth/reset-password', data, false),
    uaepassUrl: () => get('/auth/uaepass/url', false),
    uaepassMobile: (data) => post('/auth/uaepass/mobile', data, false),
    refresh: (refreshToken) => post('/auth/refresh', { refreshToken }, false),
    logout: (refreshToken) => post('/auth/logout', { refreshToken }),
    logoutAll: () => post('/auth/logout-all', {}),
    me: () => get('/auth/me'),
  },

  // ── Vendors ────────────────────────────────────────────────────────────────
  vendors: {
    list: (params = {}) => get(`/vendors${qs(params)}`, false),
    featured: () => get('/vendors/featured', false),
    get: (id) => get(`/vendors/${id}`, false),
    reviews: (vendorId) => get(`/vendors/${vendorId}/reviews`, false),

    // Vendor-auth endpoints
    updateProfile: (data) => put('/vendors/profile', data),
    getServices: () => get('/vendors/me/services'),
    createService: (data) => post('/vendors/me/services', data),
    updateService: (id, data) => put(`/vendors/me/services/${id}`, data),
    deleteService: (id) => del(`/vendors/me/services/${id}`),
    getStats: () => get('/vendors/me/stats'),
    getBookings: (params = {}) => get(`/vendors/me/bookings${qs(params)}`),
    updateBooking: (id, data) => patch(`/vendors/me/bookings/${id}`, data),
  },

  // ── Bookings ───────────────────────────────────────────────────────────────
  bookings: {
    create: (data) => post('/bookings', data),
    list: (params = {}) => get(`/bookings${qs(params)}`),
    get: (id) => get(`/bookings/${id}`),
    cancel: (id, reason) => post(`/bookings/${id}/cancel`, { reason }),
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  payments: {
    createSheet: (data) => post('/payments/sheet', data),   // PaymentSheet (Stripe SDK)
    createIntent: (data) => post('/payments/sheet', data),   // alias
    list: () => get('/payments'),
    refund: (data) => post('/payments/refund', data),
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    getProfile: () => get('/users/profile'),
    updateProfile: (data) => put('/users/profile', data),
    changePassword: (data) => post('/users/change-password', data),
    getLoyalty: () => get('/users/loyalty'),
    getEvents: () => get('/users/events'),
    createEvent: (data) => post('/users/events', data),
    updateEvent: (id, data) => put(`/users/events/${id}`, data),
    getWishlist: () => get('/users/wishlist'),
    toggleWishlist: (vendor_id) => post('/users/wishlist/toggle', { vendor_id }),
    createReview: (data) => post('/users/reviews', data),
    getNotifications: () => get('/users/notifications'),
    markRead: (id) => patch(`/users/notifications/${id}`, {}),
    markAllRead: () => patch('/users/notifications/all', {}),
    updatePushToken: (push_token) => post('/users/push-token', { push_token }),
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    dashboard: () => get('/admin/dashboard'),
    getUsers: (p) => get(`/admin/users${qs(p || {})}`),
    updateUser: (id, data) => patch(`/admin/users/${id}/status`, data),
    getVendors: (p) => get(`/admin/vendors${qs(p || {})}`),
    approveVendor: (id) => post(`/admin/vendors/${id}/approve`, {}),
    rejectVendor: (id, reason) => post(`/admin/vendors/${id}/reject`, { reason }),
    suspendVendor: (id) => post(`/admin/vendors/${id}/suspend`, {}),
    getBookings: (p) => get(`/admin/bookings${qs(p || {})}`),
    getFinance: () => get('/admin/finance'),
    getReports: (p) => get(`/admin/reports${qs(p || {})}`),
    updateReport: (id, data) => patch(`/admin/reports/${id}`, data),
    sendNotification: (data) => post('/admin/notifications/send', data),
  },
};

export default api;
