/**
 * UAE Pass OAuth Screen
 *
 * Flow:
 * 1. App calls GET /auth/uaepass/url  → gets { url, state }
 * 2. Opens a WebView pointing to the UAE Pass authorization URL
 * 3. UAE Pass redirects back to our deep link: honeymoon://auth/uaepass/callback?code=xxx
 * 4. App catches the navigation change, extracts the code, and calls POST /auth/uaepass/mobile
 * 5. Backend exchanges the code → returns user + JWT
 *
 * Requires:  react-native-webview
 * Install:   npm install react-native-webview
 *            cd ios && pod install
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../theme';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

// Dynamic import to avoid crash if react-native-webview not installed
let WebView;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

const DEEP_LINK_SCHEME = 'honeymoon://';

export default function UaePassScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { loginWithTokens } = useApp();

  const [authUrl,  setAuthUrl]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const stateRef   = useRef(null);

  // Fetch UAE Pass authorization URL from our backend
  const loadAuthUrl = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.uaepassUrl();
      stateRef.current = data.state;
      setAuthUrl(data.url);
    } catch (err) {
      setError(err?.message || 'Failed to connect to UAE Pass.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAuthUrl();
  }, []);

  // Intercept WebView navigation to catch the deep link callback
  const handleNavChange = async (navState) => {
    const { url } = navState;
    if (!url) return;

    // Our deep link: honeymoon://auth/uaepass/callback?code=xxx&state=yyy
    if (url.startsWith(DEEP_LINK_SCHEME) || url.includes('/auth/uaepass/')) {
      const urlObj = new URL(url.replace('honeymoon://', 'https://app'));
      const code   = urlObj.searchParams.get('code');
      const state  = urlObj.searchParams.get('state');
      const err    = urlObj.searchParams.get('error') || urlObj.searchParams.get('reason');

      if (err) {
        Toast.show({ type: 'error', text1: 'UAE Pass sign-in was cancelled.' });
        navigation.goBack();
        return;
      }

      if (code) {
        setLoading(true);
        try {
          const data = await api.auth.uaepassMobile({ code, state });
          if (data.token) {
            await loginWithTokens(data.user, data.token, data.refreshToken);
            Toast.show({ type: 'success', text1: `Welcome, ${data.user.full_name?.split(' ')[0]}! 🇦🇪` });
          }
        } catch (err) {
          Toast.show({ type: 'error', text1: err?.message || 'UAE Pass login failed.' });
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      }
    }
  };

  if (!WebView) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>WebView Not Installed</Text>
        <Text style={styles.errorBody}>
          Run: npm install react-native-webview{'\n'}
          Then rebuild the app.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🇦🇪 UAE Pass</Text>
          <Text style={styles.headerSub}>Secure government sign-in</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Connecting to UAE Pass…</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>❌</Text>
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity onPress={loadAuthUrl} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {authUrl && !error && (
        <WebView
          source={{ uri: authUrl }}
          onNavigationStateChange={handleNavChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setError('Page failed to load. Check your connection.')}
          userAgent={
            Platform.OS === 'ios'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
              : 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          }
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md, backgroundColor: COLORS.dark, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}12` },
  closeBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText:     { color: COLORS.muted, fontSize: 18 },
  headerCenter:  { alignItems: 'center' },
  headerTitle:   { fontFamily: FONTS.display, fontSize: FONT_SIZE.lg, color: COLORS.cream },
  headerSub:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  loadingOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: `${COLORS.dark}CC`, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, marginTop: SPACING.md },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  errorEmoji:    { fontSize: 52, marginBottom: SPACING.lg },
  errorTitle:    { fontFamily: FONTS.display, fontSize: 22, color: COLORS.cream, marginBottom: 8, textAlign: 'center' },
  errorBody:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl },
  retryBtn:      { backgroundColor: `${COLORS.gold}20`, borderWidth: 1, borderColor: COLORS.gold, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 },
  retryText:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.gold, fontWeight: '700' },
  backBtn:       { marginTop: SPACING.lg },
  backBtnText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.gold },
});
