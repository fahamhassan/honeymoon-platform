import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN:   '@honeymoon/access_token',
  REFRESH_TOKEN:  '@honeymoon/refresh_token',
  USER:           '@honeymoon/user',
  ROLE:           '@honeymoon/role',      // 'user' | 'vendor'
  PUSH_TOKEN:     '@honeymoon/push_token',
};

// ── Token helpers ──────────────────────────────────────────────────────────────
export const saveTokens = async (accessToken, refreshToken) => {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS_TOKEN,  accessToken],
    [KEYS.REFRESH_TOKEN, refreshToken],
  ]);
};

export const getAccessToken = async () => {
  return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async () => {
  return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
};

export const clearTokens = async () => {
  await AsyncStorage.multiRemove([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN]);
};

// ── User/session storage ───────────────────────────────────────────────────────
export const saveSession = async ({ user, token, refreshToken, role = 'user' }) => {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS_TOKEN,  token],
    [KEYS.REFRESH_TOKEN, refreshToken],
    [KEYS.USER,          JSON.stringify(user)],
    [KEYS.ROLE,          role],
  ]);
};

export const getSession = async () => {
  const pairs = await AsyncStorage.multiGet([
    KEYS.ACCESS_TOKEN,
    KEYS.REFRESH_TOKEN,
    KEYS.USER,
    KEYS.ROLE,
  ]);
  const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
  return {
    token:        map[KEYS.ACCESS_TOKEN],
    refreshToken: map[KEYS.REFRESH_TOKEN],
    user:         map[KEYS.USER] ? JSON.parse(map[KEYS.USER]) : null,
    role:         map[KEYS.ROLE] || 'user',
  };
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};

export const updateStoredUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const savePushToken = async (token) => {
  await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
};

export const getPushToken = async () => {
  return await AsyncStorage.getItem(KEYS.PUSH_TOKEN);
};
