import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldDivider, ProgressBar } from '../../components';
import { useApp } from '../../context/AppContext';
import { BUDGET_CATEGORIES } from '../../data';

const RATE_PER_GUEST = 2200; // AED

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { guestCount, setGuestCount, bookings } = useApp();

  const total    = guestCount * RATE_PER_GUEST;
  const low      = Math.round(total * 0.85);
  const high     = Math.round(total * 1.15);
  const totalSpent = bookings.reduce((s, b) => s + b.depositPaid, 0);
  const committed  = bookings.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.dark2, COLORS.dark]}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <Text style={styles.title}>Smart Budget</Text>
          <Text style={styles.subtitle}>AI-powered estimates for UAE weddings</Text>
        </LinearGradient>

        <View style={{ padding: SPACING.xl }}>

          {/* Guest count */}
          <View style={styles.guestCard}>
            <Text style={styles.guestLabel}>GUEST COUNT</Text>
            <View style={styles.guestRow}>
              <TouchableOpacity
                onPress={() => setGuestCount(Math.max(20, guestCount - 10))}
                style={styles.guestBtn}
              >
                <Text style={styles.guestBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.guestNum}>{guestCount}</Text>
              <TouchableOpacity
                onPress={() => setGuestCount(guestCount + 10)}
                style={styles.guestBtn}
              >
                <Text style={styles.guestBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.guestHint}>Tap +/− or drag to adjust</Text>
          </View>

          {/* Total estimate */}
          <LinearGradient
            colors={[`${COLORS.gold}20`, `${COLORS.gold}06`]}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel}>ESTIMATED TOTAL</Text>
            <Text style={styles.totalVal}>AED {(total / 1000).toFixed(0)}K</Text>
            <Text style={styles.totalRange}>
              Range: AED {(low / 1000).toFixed(0)}K – {(high / 1000).toFixed(0)}K
            </Text>
          </LinearGradient>

          {/* Actual spend */}
          <View style={styles.spendRow}>
            <View style={styles.spendBox}>
              <Text style={styles.spendLabel}>Paid</Text>
              <Text style={[styles.spendVal, { color: COLORS.green }]}>AED {(totalSpent / 1000).toFixed(1)}K</Text>
            </View>
            <View style={styles.spendBox}>
              <Text style={styles.spendLabel}>Committed</Text>
              <Text style={[styles.spendVal, { color: COLORS.rose }]}>AED {(committed / 1000).toFixed(1)}K</Text>
            </View>
            <View style={styles.spendBox}>
              <Text style={styles.spendLabel}>Budget Left</Text>
              <Text style={[styles.spendVal, { color: COLORS.teal }]}>AED {((total - committed) / 1000).toFixed(1)}K</Text>
            </View>
          </View>

          {/* Overall progress */}
          <View style={styles.overallProgress}>
            <View style={styles.overallHeader}>
              <Text style={styles.overallLabel}>Budget Used</Text>
              <Text style={styles.overallPct}>{Math.min(100, Math.round(committed / total * 100))}%</Text>
            </View>
            <ProgressBar percent={Math.min(100, (committed / total) * 100)} />
          </View>

          <GoldDivider />

          {/* Category Breakdown */}
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {BUDGET_CATEGORIES.map(cat => {
            const amount = Math.round(total * cat.percent / 100);
            return (
              <View key={cat.key} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Text style={styles.catName}>{cat.label}</Text>
                  <Text style={[styles.catAmt, { color: cat.color }]}>
                    AED {(amount / 1000).toFixed(0)}K
                    <Text style={styles.catPct}> ({cat.percent}%)</Text>
                  </Text>
                </View>
                <ProgressBar percent={cat.percent / 0.35} color={cat.color} />
              </View>
            );
          })}

          <GoldDivider />

          {/* AI Insight */}
          <LinearGradient
            colors={[`${COLORS.gold}12`, `${COLORS.gold}04`]}
            style={styles.insightCard}
          >
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>✨</Text>
              <Text style={styles.insightTitle}>AI Planning Insight</Text>
            </View>
            <Text style={styles.insightText}>
              For a {guestCount}-guest wedding in Dubai, we recommend securing your venue and catering first — they account for 60% of your budget and venues typically book 12–18 months ahead.
              {'\n\n'}
              At AED {RATE_PER_GUEST.toLocaleString()}/guest, your estimated spend of AED {(total / 1000).toFixed(0)}K is {total < 300000 ? 'within a mid-range budget' : 'positioned for a luxury event'}.
            </Text>
          </LinearGradient>

          {/* Checklist */}
          <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Planning Checklist</Text>
          {[
            { done: true,  label: 'Set event date',           when: '12+ months before' },
            { done: true,  label: 'Book venue',               when: '12 months before' },
            { done: false, label: 'Confirm catering',         when: '9 months before' },
            { done: false, label: 'Book photography',         when: '9 months before' },
            { done: false, label: 'Arrange décor & florals',  when: '6 months before' },
            { done: false, label: 'Book makeup & beauty',     when: '3 months before' },
            { done: false, label: 'Order cake & desserts',    when: '2 months before' },
            { done: false, label: 'Confirm entertainment',    when: '1 month before' },
          ].map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
                {item.done && <Text style={styles.checkTick}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>{item.label}</Text>
                <Text style={styles.checkWhen}>{item.when}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:   { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
  title:    { fontFamily: FONTS.display, fontSize: 28, color: COLORS.cream },
  subtitle: { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 4 },

  guestCard: { backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}20`, marginBottom: SPACING.md },
  guestLabel:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.md },
  guestRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxl },
  guestBtn:  { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: `${COLORS.gold}40`, alignItems: 'center', justifyContent: 'center' },
  guestBtnText:{ fontFamily: FONTS.body, fontSize: 24, color: COLORS.gold, lineHeight: 26 },
  guestNum:  { fontFamily: FONTS.display, fontSize: 52, color: COLORS.gold },
  guestHint: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: SPACING.sm },

  totalCard: { borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}30`, marginBottom: SPACING.md },
  totalLabel:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  totalVal:  { fontFamily: FONTS.display, fontSize: 44, color: COLORS.gold },
  totalRange:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 6 },

  spendRow:  { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  spendBox:  { flex: 1, backgroundColor: COLORS.dark2, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}10` },
  spendLabel:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginBottom: 4 },
  spendVal:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700' },

  overallProgress:{ marginBottom: SPACING.sm },
  overallHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  overallLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  overallPct:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.gold },

  sectionTitle: { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream, marginBottom: SPACING.md },

  catRow:    { marginBottom: SPACING.lg },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream },
  catAmt:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  catPct:    { fontWeight: '400', color: COLORS.muted },

  insightCard:   { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: `${COLORS.gold}25` },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  insightIcon:   { fontSize: 20 },
  insightTitle:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.gold },
  insightText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 22 },

  checkRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.md },
  checkBox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: `${COLORS.gold}40`, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkBoxDone:   { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkTick:      { color: COLORS.dark, fontSize: 12, fontWeight: '700' },
  checkLabel:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream },
  checkLabelDone: { color: COLORS.muted, textDecorationLine: 'line-through' },
  checkWhen:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
});
