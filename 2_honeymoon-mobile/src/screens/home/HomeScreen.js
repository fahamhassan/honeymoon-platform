import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldDivider, SectionHeader } from '../../components';
import { SkeletonCard, ErrorState } from '../../components/LoadingStates';
import VendorCard from '../../components/VendorCard';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    user, bookings, totalSpent, unreadCount,
    featuredVendors, loadingVendors,
    fetchFeatured, fetchBookings, fetchWishlist, fetchNotifications, fetchProfile,
  } = useApp();

  useEffect(() => {
    fetchProfile();
    fetchFeatured();
    fetchBookings();
    fetchWishlist();
    fetchNotifications();
  }, []);

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount   = bookings.filter(b => ['pending', 'quote_sent'].includes(b.status)).length;

  const primaryEvent = user?.events?.[0];
  const weddingDate  = primaryEvent?.event_date ? new Date(primaryEvent.event_date) : null;
  const daysLeft     = weddingDate ? Math.ceil((weddingDate - new Date()) / 86400000) : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient
          colors={[COLORS.dark2, COLORS.dark]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{user?.full_name?.split(' ')[0] ?? 'There'} 👋</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
                <Text style={styles.notifIcon}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.full_name?.[0] ?? '?'}</Text>
              </View>
            </View>
          </View>

          {/* Countdown */}
          {primaryEvent && (
            <LinearGradient colors={[`${COLORS.gold}22`, `${COLORS.gold}08`]} style={styles.countdownCard}>
              <View style={styles.countdownLeft}>
                <Text style={styles.countdownLabel}>YOUR WEDDING</Text>
                <Text style={styles.countdownDate}>{new Date(primaryEvent.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <Text style={styles.countdownDays}>{daysLeft != null ? `${daysLeft} days to go ✨` : ''}</Text>
              </View>
              <Text style={styles.countdownEmoji}>💍</Text>
            </LinearGradient>
          )}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Booked',  value: confirmedCount.toString() },
            { label: 'Pending', value: pendingCount.toString() },
            { label: 'Spent',   value: `AED ${(totalSpent / 1000).toFixed(0)}K` },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        <GoldDivider style={{ marginHorizontal: SPACING.xl }} />

        {/* Featured Vendors */}
        <View style={styles.section}>
          <SectionHeader title="Featured Vendors" action="See all →" onAction={() => navigation.navigate('Explore')} />
          {loadingVendors && !featuredVendors.length ? (
            <FlatList
              horizontal
              data={[1, 2, 3]}
              keyExtractor={k => k.toString()}
              contentContainerStyle={{ gap: SPACING.md }}
              renderItem={() => <SkeletonCard style={{ width: 180 }} />}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={featuredVendors}
              keyExtractor={v => v.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: SPACING.md }}
              renderItem={({ item }) => (
                <VendorCard
                  vendor={item}
                  compact
                  onPress={() => navigation.navigate('VendorDetail', { vendorId: item.id })}
                />
              )}
            />
          )}
        </View>

        <GoldDivider style={{ marginHorizontal: SPACING.xl }} />

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader title="Browse by Category" />
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catItem}
                onPress={() => navigation.navigate('Explore', { category: cat.key })}
                activeOpacity={0.75}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <GoldDivider style={{ marginHorizontal: SPACING.xl }} />

        {/* AI Insight */}
        <View style={styles.section}>
          <LinearGradient colors={[`${COLORS.gold}14`, `${COLORS.gold}06`]} style={styles.insightCard}>
            <View style={styles.insightRow}>
              <Text style={styles.insightEmoji}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>AI Budget Insight</Text>
                <Text style={styles.insightBody}>
                  Based on your {primaryEvent?.guest_count ?? 150} guests, we recommend booking your venue and catering first — they account for 60% of your budget and have the longest lead times.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:           { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
  headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  greeting:         { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  userName:         { fontFamily: FONTS.display, fontSize: 26, color: COLORS.cream },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  notifBtn:         { position: 'relative' },
  notifIcon:        { fontSize: 22 },
  notifBadge:       { position: 'absolute', top: -4, right: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText:   { fontSize: 9, color: COLORS.white, fontWeight: '700' },
  avatar:           { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.dark },
  countdownCard:    { borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}30` },
  countdownLeft:    { gap: 3 },
  countdownLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  countdownDate:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.cream },
  countdownDays:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  countdownEmoji:   { fontSize: 40 },
  statsRow:         { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.md, marginTop: SPACING.lg },
  statBox:          { flex: 1, backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}12`, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statVal:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gold },
  statLbl:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 3 },
  section:          { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  catGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem:          { width: '22%', backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}12`, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: 5 },
  catEmoji:         { fontSize: 22 },
  catLabel:         { fontFamily: FONTS.body, fontSize: 9, color: COLORS.muted, textAlign: 'center' },
  insightCard:      { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: `${COLORS.gold}25` },
  insightRow:       { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  insightEmoji:     { fontSize: 22 },
  insightTitle:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.gold, marginBottom: 6 },
  insightBody:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 20 },
});
