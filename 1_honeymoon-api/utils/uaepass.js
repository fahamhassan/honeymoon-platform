/**
 * UAE Pass OAuth 2.0 Integration
 *
 * UAE Pass is the UAE government's national digital identity app.
 * It uses OpenID Connect (OAuth 2.0 + OIDC).
 *
 * Environments:
 *  - QA:         https://stg-id.uaepass.ae
 *  - Production: https://id.uaepass.ae
 *
 * Docs: https://docs.uaepass.ae
 *
 * Required env vars:
 *   UAEPASS_CLIENT_ID
 *   UAEPASS_CLIENT_SECRET
 *   UAEPASS_REDIRECT_URI   (e.g. https://api.honeymoon.ae/v1/auth/uaepass/callback)
 *   UAEPASS_ENV            ('qa' | 'production')
 */

const BASE_URLS = {
  qa:         'https://stg-id.uaepass.ae',
  production: 'https://id.uaepass.ae',
};

const getBase = () => BASE_URLS[process.env.UAEPASS_ENV || 'qa'];

/**
 * Step 1 — Build the UAE Pass authorization URL.
 * Redirect the user's browser / WebView to this URL.
 */
const getAuthUrl = (state) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.UAEPASS_CLIENT_ID,
    redirect_uri:  process.env.UAEPASS_REDIRECT_URI,
    scope:         'urn:uae:digitalid:profile:general',
    state:         state || generateState(),
    acr_values:    'urn:safelayer:tws:policies:authentication:level:low',
    ui_locales:    'en',
  });

  return `${getBase()}/idsheer/authorize?${params.toString()}`;
};

/**
 * Step 2 — Exchange authorization code for tokens.
 */
const exchangeCode = async (code) => {
  const url = `${getBase()}/idsheer/oauth2/token`;

  const body = new URLSearchParams({
    grant_type:   'authorization_code',
    code,
    redirect_uri: process.env.UAEPASS_REDIRECT_URI,
    client_id:    process.env.UAEPASS_CLIENT_ID,
    client_secret: process.env.UAEPASS_CLIENT_SECRET,
  });

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`UAE Pass token exchange failed: ${err}`);
  }

  return res.json(); // { access_token, id_token, refresh_token, ... }
};

/**
 * Step 3 — Fetch user profile from UAE Pass.
 */
const getUserProfile = async (accessToken) => {
  const url = `${getBase()}/idsheer/oauth2/userinfo`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch UAE Pass user profile');

  /**
   * UAE Pass profile response includes:
   * {
   *   sub:           'unique-user-id',
   *   fullnameEN:    'Fatima Al-Rashid',
   *   fullnameAR:    'فاطمة الراشد',
   *   email:         'fatima@example.com',
   *   mobile:        '+971501234567',
   *   gender:        'Female',
   *   idType:        'EID',
   *   nationalityEN: 'Emirati',
   *   userType:      'SOP1' | 'SOP2' | 'SOP3',   // verification level
   *   acr:           'urn:safelayer:...',
   * }
   */
  return res.json();
};

/**
 * Decode UAE Pass ID token (JWT) without verification — for dev only.
 * In production always verify the signature against UAE Pass's JWKS endpoint.
 */
const decodeIdToken = (idToken) => {
  const parts = idToken.split('.');
  if (parts.length < 2) throw new Error('Invalid ID token');
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
};

/**
 * Generate a cryptographically random state string for CSRF protection.
 */
const generateState = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Validate state parameter (CSRF check).
 * In production, store state in Redis/session and compare here.
 */
const validateState = (received, expected) => {
  if (!received || !expected || received !== expected) {
    throw new Error('Invalid state parameter — possible CSRF attack');
  }
};

module.exports = { getAuthUrl, exchangeCode, getUserProfile, decodeIdToken, generateState, validateState };
