import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS, SHADOW } from '../theme';

// ── Gold Divider ───────────────────────────────────────────────────────────────
export function GoldDivider({ style }) {
  return (
    <View style={[styles.divider, style]}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerDiamond} />
      <View style={[styles.dividerLine, { transform: [{ scaleX: -1 }] }]} />
    </View>
  );
}

// ── Screen Header ──────────────────────────────────────────────────────────────
export function ScreenHeader({ title, subtitle, onBack, rightAction, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }, style]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : <View style={styles.backBtn} />}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
        </View>
        <View style={styles.backBtn}>{rightAction}</View>
      </View>
    </View>
  );
}

// ── Gold Button ────────────────────────────────────────────────────────────────
export function GoldButton({ label, onPress, loading, style, small, outline, disabled }) {
  if (outline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        disabled={disabled || loading}
        style={[styles.outlineBtn, small && styles.smallBtn, disabled && styles.disabledBtn, style]}
      >
        <Text style={styles.outlineBtnText}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[styles.goldBtnWrap, style]}
    >
      <LinearGradient
        colors={[COLORS.gold, COLORS.goldLight, '#B8942E']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.goldBtn, small && styles.smallBtn, disabled && styles.disabledBtn]}
      >
        {loading
          ? <ActivityIndicator color={COLORS.dark} size="small" />
          : <Text style={[styles.goldBtnText, small && { fontSize: 10 }]}>{label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Gold Badge ─────────────────────────────────────────────────────────────────
export function GoldBadge({ label, style }) {
  return (
    <View style={[styles.goldBadge, style]}>
      <Text style={styles.goldBadgeText}>{label}</Text>
    </View>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    Confirmed:    { bg: `${COLORS.green}22`, bd: `${COLORS.green}55`, c: COLORS.green },
    Pending:      { bg: `${COLORS.gold}22`,  bd: `${COLORS.gold}55`,  c: COLORS.gold  },
    Cancelled:    { bg: `${COLORS.red}22`,   bd: `${COLORS.red}55`,   c: COLORS.red   },
    Completed:    { bg: `${COLORS.teal}22`,  bd: `${COLORS.teal}55`,  c: COLORS.teal  },
    'Quote Sent': { bg: `${COLORS.rose}22`,  bd: `${COLORS.rose}55`,  c: COLORS.rose  },
  };
  const s = map[status] || map.Pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.bd }]}>
      <Text style={[styles.statusText, { color: s.c }]}>{status}</Text>
    </View>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, change, positive = true, style }) {
  return (
    <LinearGradient
      colors={[COLORS.dark2, COLORS.dark3]}
      style={[styles.statCard, style]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub    ? <Text style={styles.statSub}>{sub}</Text> : null}
      {change ? <Text style={[styles.statChange, { color: positive ? COLORS.green : COLORS.red }]}>{change}</Text> : null}
    </LinearGradient>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, style]}
    >
      {children}
    </Wrap>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Search Bar ─────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChangeText, placeholder, onClear, style }) {
  return (
    <View style={[styles.searchWrap, style]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search…'}
        placeholderTextColor={COLORS.muted}
        style={styles.searchInput}
      />
      {value ? (
        <TouchableOpacity onPress={onClear} activeOpacity={0.7} style={styles.clearBtn}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Filter Chip ────────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────────
export function ProgressBar({ percent, color, style }) {
  return (
    <View style={[styles.progressTrack, style]}>
      <LinearGradient
        colors={[color || COLORS.gold, color ? color + 'AA' : COLORS.goldLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.progressFill, { width: `${Math.min(percent, 100)}%` }]}
      />
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, body, action, onAction }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action ? (
        <GoldButton label={action} onPress={onAction} style={{ marginTop: SPACING.lg }} />
      ) : null}
    </View>
  );
}

// ── Row Item ───────────────────────────────────────────────────────────────────
export function RowItem({ icon, label, value, onPress, danger, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.rowItem, style]}
    >
      <View style={[styles.rowIconBox, danger && { backgroundColor: `${COLORS.red}18` }]}>
        <Text style={styles.rowIcon}>{icon}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: COLORS.red }]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {!danger && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );
}

// ── Star Rating ────────────────────────────────────────────────────────────────
export function StarRating({ rating, size = 12, style }) {
  return (
    <View style={[styles.stars, style]}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={[styles.star, { fontSize: size, opacity: i <= Math.round(rating) ? 1 : 0.25 }]}>★</Text>
      ))}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // GoldDivider
  divider:        { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine:    { flex: 1, height: 1, backgroundColor: `${COLORS.gold}30` },
  dividerDiamond: { width: 6, height: 6, backgroundColor: COLORS.gold, transform: [{ rotate: '45deg' }], marginHorizontal: 10 },

  // ScreenHeader
  header:       { backgroundColor: COLORS.dark, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream },
  headerSub:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 2 },
  backBtn:      { width: 36, height: 36, justifyContent: 'center' },
  backArrow:    { fontSize: 22, color: COLORS.gold, fontWeight: '300' },

  // GoldButton
  goldBtnWrap:     { borderRadius: RADIUS.md, overflow: 'hidden' },
  goldBtn:         { paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md },
  goldBtnText:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.dark, letterSpacing: 1.4, textTransform: 'uppercase' },
  outlineBtn:      { paddingVertical: 12, paddingHorizontal: 22, borderRadius: RADIUS.md, borderWidth: 1, borderColor: `${COLORS.gold}50`, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.gold, letterSpacing: 1, textTransform: 'uppercase' },
  smallBtn:        { paddingVertical: 8, paddingHorizontal: 14 },
  disabledBtn:     { opacity: 0.5 },

  // GoldBadge
  goldBadge:      { backgroundColor: `${COLORS.gold}18`, borderWidth: 1, borderColor: `${COLORS.gold}45`, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  goldBadgeText:  { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.gold, letterSpacing: 0.8, textTransform: 'uppercase' },

  // StatusBadge
  statusBadge: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText:  { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // StatCard
  statCard:   { borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: `${COLORS.gold}20` },
  statLabel:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statValue:  { fontFamily: FONTS.display, fontSize: 22, color: COLORS.gold, fontWeight: '500' },
  statSub:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  statChange: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 3 },

  // Card
  card: { backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}18`, borderRadius: RADIUS.lg },

  // SectionHeader
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle:  { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream },
  sectionAction: { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold },

  // SearchBar
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: `${COLORS.white}06`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  searchIcon:  { fontSize: 15, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream, paddingVertical: 10 },
  clearBtn:    { padding: 4 },
  clearText:   { color: COLORS.muted, fontSize: 13 },

  // FilterChip
  chip:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: `${COLORS.white}10`, backgroundColor: `${COLORS.white}04`, marginRight: 8 },
  chipActive:    { borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}15` },
  chipText:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  chipTextActive:{ color: COLORS.gold, fontWeight: '600' },

  // ProgressBar
  progressTrack: { height: 5, backgroundColor: `${COLORS.gold}15`, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  // EmptyState
  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  emptyEmoji: { fontSize: 52, marginBottom: SPACING.lg },
  emptyTitle: { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream, textAlign: 'center', marginBottom: 8 },
  emptyBody:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },

  // RowItem
  rowItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}08` },
  rowIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.gold}12`, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  rowIcon:    { fontSize: 16 },
  rowContent: { flex: 1 },
  rowLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream, fontWeight: '500' },
  rowValue:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 2 },
  rowArrow:   { fontSize: 20, color: COLORS.muted },

  // StarRating
  stars: { flexDirection: 'row', gap: 2 },
  star:  { color: COLORS.gold },
});
