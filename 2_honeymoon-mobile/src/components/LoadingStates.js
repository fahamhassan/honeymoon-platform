import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../theme';

// ── Full-screen loader ────────────────────────────────────────────────────────
export function LoadingScreen({ message = 'Loading…' }) {
  return (
    <View style={styles.fullCenter}>
      <ActivityIndicator size="large" color={COLORS.gold} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ── Inline loader (inside a card / section) ───────────────────────────────────
export function LoadingSpinner({ size = 'small', style }) {
  return (
    <View style={[styles.spinnerWrap, style]}>
      <ActivityIndicator size={size} color={COLORS.gold} />
    </View>
  );
}

// ── Skeleton placeholder bar ──────────────────────────────────────────────────
export function SkeletonBar({ width = '100%', height = 14, style }) {
  return <View style={[styles.skeleton, { width, height }, style]} />;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
export function SkeletonCard({ style }) {
  return (
    <View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonHero} />
      <View style={{ padding: SPACING.md, gap: 8 }}>
        <SkeletonBar width="70%" height={12} />
        <SkeletonBar width="45%" height={10} />
        <SkeletonBar width="60%" height={10} />
      </View>
    </View>
  );
}

// ── Error state with retry ────────────────────────────────────────────────────
export function ErrorState({ message, onRetry, style }) {
  return (
    <View style={[styles.fullCenter, style]}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMsg}>{message || 'Please check your connection and try again.'}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.8}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Inline error bar ──────────────────────────────────────────────────────────
export function ErrorBar({ message, onDismiss }) {
  if (!message) return null;
  return (
    <View style={styles.errorBar}>
      <Text style={styles.errorBarText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.errorBarClose}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Network banner (shown when offline) ──────────────────────────────────────
export function OfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>📡  No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fullCenter:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, backgroundColor: COLORS.dark },
  loadingText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: SPACING.md },

  spinnerWrap:  { padding: SPACING.xl, alignItems: 'center', justifyContent: 'center' },

  skeleton:     { backgroundColor: `${COLORS.white}08`, borderRadius: RADIUS.sm },
  skeletonCard: { backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: `${COLORS.gold}10`, overflow: 'hidden', flex: 1 },
  skeletonHero: { height: 130, backgroundColor: `${COLORS.white}06` },

  errorEmoji: { fontSize: 44, marginBottom: SPACING.md },
  errorTitle: { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream, marginBottom: 8, textAlign: 'center' },
  errorMsg:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
  retryBtn:   { marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold, fontWeight: '600' },

  errorBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${COLORS.red}22`, borderWidth: 1, borderColor: `${COLORS.red}50`, borderRadius: RADIUS.md, padding: SPACING.md, margin: SPACING.xl },
  errorBarText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.red, flex: 1 },
  errorBarClose: { color: COLORS.red, fontSize: 14, paddingLeft: SPACING.sm },

  offlineBanner: { backgroundColor: COLORS.dark3, borderBottomWidth: 1, borderBottomColor: `${COLORS.red}40`, padding: SPACING.sm, alignItems: 'center' },
  offlineText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
});
