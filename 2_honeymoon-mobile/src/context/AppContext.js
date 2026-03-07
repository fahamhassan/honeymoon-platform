import React, {
  createContext, useContext, useReducer, useCallback, useEffect,
} from 'react';
import Toast from 'react-native-toast-message';
import { api } from '../services/api';
import { saveSession, getSession, clearSession, updateStoredUser } from '../services/storage';

const initialState = {
  isLoggedIn: false,
  isBootstrapped: false,
  user: null,
  role: 'user',
  vendors: [],
  featuredVendors: [],
  bookings: [],
  wishlist: [],
  notifications: [],
  guestCount: 150,
  loadingVendors: false,
  loadingBookings: false,
  loadingNotifs: false,
};

const A = {
  BOOTSTRAP_DONE: 'BOOTSTRAP_DONE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_VENDORS: 'SET_VENDORS',
  SET_FEATURED: 'SET_FEATURED',
  SET_BOOKINGS: 'SET_BOOKINGS',
  ADD_BOOKING: 'ADD_BOOKING',
  CANCEL_BOOKING: 'CANCEL_BOOKING',
  SET_WISHLIST: 'SET_WISHLIST',
  TOGGLE_WISHLIST_LOCAL: 'TOGGLE_WISHLIST_LOCAL',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  MARK_NOTIF_READ: 'MARK_NOTIF_READ',
  MARK_ALL_READ: 'MARK_ALL_READ',
  SET_GUEST_COUNT: 'SET_GUEST_COUNT',
  SET_LOADING: 'SET_LOADING',
};

function reducer(state, { type, payload }) {
  switch (type) {
    case A.BOOTSTRAP_DONE:
      return { ...state, isBootstrapped: true, ...payload };
    case A.LOGIN:
      return { ...state, isLoggedIn: true, user: payload.user, role: payload.role || 'user' };
    case A.LOGOUT:
      return { ...initialState, isBootstrapped: true };
    case A.UPDATE_USER:
      return { ...state, user: { ...state.user, ...payload } };
    case A.SET_VENDORS:
      return { ...state, vendors: payload, loadingVendors: false };
    case A.SET_FEATURED:
      return { ...state, featuredVendors: payload };
    case A.SET_BOOKINGS:
      return { ...state, bookings: payload, loadingBookings: false };
    case A.ADD_BOOKING:
      return { ...state, bookings: [payload, ...state.bookings] };
    case A.CANCEL_BOOKING:
      return { ...state, bookings: state.bookings.map(b => b.id === payload ? { ...b, status: 'cancelled' } : b) };
    case A.SET_WISHLIST:
      return { ...state, wishlist: payload };
    case A.TOGGLE_WISHLIST_LOCAL:
      return {
        ...state,
        wishlist: state.wishlist.includes(payload)
          ? state.wishlist.filter(id => id !== payload)
          : [...state.wishlist, payload],
      };
    case A.SET_NOTIFICATIONS:
      return { ...state, notifications: payload, loadingNotifs: false };
    case A.MARK_NOTIF_READ:
      return { ...state, notifications: state.notifications.map(n => n.id === payload ? { ...n, is_read: true } : n) };
    case A.MARK_ALL_READ:
      return { ...state, notifications: state.notifications.map(n => ({ ...n, is_read: true })) };
    case A.SET_GUEST_COUNT:
      return { ...state, guestCount: payload };
    case A.SET_LOADING:
      return { ...state, ...payload };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Bootstrap from AsyncStorage on launch
  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session?.token && session?.user) {
          dispatch({ type: A.BOOTSTRAP_DONE, payload: { isLoggedIn: true, user: session.user, role: session.role } });
        } else {
          dispatch({ type: A.BOOTSTRAP_DONE, payload: {} });
        }
      } catch {
        dispatch({ type: A.BOOTSTRAP_DONE, payload: {} });
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.auth.login(email, password);
    await saveSession({ user: data.user, token: data.token, refreshToken: data.refreshToken, role: 'user' });
    dispatch({ type: A.LOGIN, payload: { user: data.user, role: 'user' } });
    // Fetch full profile including events in the background
    setTimeout(async () => {
      try {
        const profile = await api.users.getProfile();
        dispatch({ type: A.UPDATE_USER, payload: profile.user });
        await updateStoredUser(profile.user);
      } catch { }
    }, 500);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      const { refreshToken } = await getSession();
      if (refreshToken) await api.auth.logout(refreshToken);
    } catch { }
    await clearSession();
    dispatch({ type: A.LOGOUT });
  }, []);

  const updateUser = useCallback(async (data) => {
    dispatch({ type: A.UPDATE_USER, payload: data });
    await updateStoredUser({ ...state.user, ...data });
    try {
      const res = await api.users.updateProfile(data);
      dispatch({ type: A.UPDATE_USER, payload: res.user });
      await updateStoredUser(res.user);
    } catch (err) {
      dispatch({ type: A.UPDATE_USER, payload: state.user });
      throw err;
    }
  }, [state.user]);

  const loginWithTokens = useCallback(async (user, token, refreshToken) => {
    await saveSession({ user, token, refreshToken, role: 'user' });
    dispatch({ type: A.LOGIN, payload: { user, role: 'user' } });
    setTimeout(async () => {
      try {
        const profile = await api.users.getProfile();
        dispatch({ type: A.UPDATE_USER, payload: profile.user });
        await updateStoredUser(profile.user);
      } catch { }
    }, 500);
  }, []);
  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.users.getProfile();
      dispatch({ type: A.UPDATE_USER, payload: data.user });
      await updateStoredUser(data.user);
    } catch { }
  }, []);

  const fetchVendors = useCallback(async (params = {}) => {
    try {
      const data = await api.vendors.list(params);
      dispatch({ type: A.SET_VENDORS, payload: data.vendors });
      return data.vendors;
    } catch (err) {
      dispatch({ type: A.SET_LOADING, payload: { loadingVendors: false } });
      throw err;
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const data = await api.vendors.featured();
      dispatch({ type: A.SET_FEATURED, payload: data.vendors });
    } catch { }
  }, []);

  const fetchBookings = useCallback(async (params = {}) => {
    dispatch({ type: A.SET_LOADING, payload: { loadingBookings: true } });
    try {
      const data = await api.bookings.list(params);
      dispatch({ type: A.SET_BOOKINGS, payload: data.bookings });
      return data.bookings;
    } catch (err) {
      dispatch({ type: A.SET_LOADING, payload: { loadingBookings: false } });
      throw err;
    }
  }, []);

  const addBooking = useCallback((booking) => {
    dispatch({ type: A.ADD_BOOKING, payload: booking });
  }, []);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    dispatch({ type: A.CANCEL_BOOKING, payload: bookingId });
    try {
      await api.bookings.cancel(bookingId, reason);
      Toast.show({ type: 'info', text1: 'Booking cancelled' });
    } catch (err) {
      await fetchBookings();
      throw err;
    }
  }, [fetchBookings]);

  const fetchWishlist = useCallback(async () => {
    try {
      const data = await api.users.getWishlist();
      dispatch({ type: A.SET_WISHLIST, payload: data.vendors.map(v => v.id) });
    } catch { }
  }, []);

  const toggleWishlist = useCallback(async (vendorId) => {
    dispatch({ type: A.TOGGLE_WISHLIST_LOCAL, payload: vendorId });
    try {
      const data = await api.users.toggleWishlist(vendorId);
      Toast.show({ type: data.wishlisted ? 'success' : 'info', text1: data.wishlisted ? 'Saved to wishlist ♥' : 'Removed from wishlist' });
    } catch {
      dispatch({ type: A.TOGGLE_WISHLIST_LOCAL, payload: vendorId });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    dispatch({ type: A.SET_LOADING, payload: { loadingNotifs: true } });
    try {
      const data = await api.users.getNotifications();
      dispatch({ type: A.SET_NOTIFICATIONS, payload: data.notifications });
    } catch {
      dispatch({ type: A.SET_LOADING, payload: { loadingNotifs: false } });
    }
  }, []);

  const markNotifRead = useCallback(async (id) => {
    dispatch({ type: A.MARK_NOTIF_READ, payload: id });
    try { await api.users.markRead(id); } catch { }
  }, []);

  const markAllRead = useCallback(async () => {
    dispatch({ type: A.MARK_ALL_READ });
    try { await api.users.markAllRead(); } catch { }
  }, []);

  const setGuestCount = useCallback((count) => {
    dispatch({ type: A.SET_GUEST_COUNT, payload: count });
  }, []);

  const wishlistedVendors = state.vendors.filter(v => state.wishlist.includes(v.id));
  const unreadCount = state.notifications.filter(n => !n.is_read).length;
  const totalSpent = state.bookings.reduce((s, b) => s + (parseFloat(b.paid_amount) || 0), 0);

  return (
    <AppContext.Provider value={{
      ...state,
      wishlistedVendors,
      unreadCount,
      totalSpent,
      login, logout, loginWithTokens, updateUser, fetchProfile,
      fetchVendors, fetchFeatured,
      fetchBookings, addBooking, cancelBooking,
      fetchWishlist, toggleWishlist,
      fetchNotifications, markNotifRead, markAllRead,
      setGuestCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
