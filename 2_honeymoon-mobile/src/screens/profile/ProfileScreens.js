// ──────────────────────────────────────────────────────────────────────────────
// WishlistScreen
// ──────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, ScrollView, TextInput, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { ScreenHeader, EmptyState, GoldButton, GoldDivider, RowItem } from '../../components';
import VendorCard from '../../components/VendorCard';
import { useApp } from '../../context/AppContext';

export function WishlistScreen({ navigation }) {
  const { wishlistedVendors } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="Wishlist" onBack={() => navigation.goBack()} />
      {wishlistedVendors.length === 0 ? (
        <EmptyState
          emoji="💔"
          title="Your wishlist is empty"
          body="Tap the heart on any vendor to save them here."
          action="Explore Vendors"
          onAction={() => navigation.navigate('Tabs', { screen: 'Explore' })}
        />
      ) : (
        <FlatList
          data={wishlistedVendors}
          keyExtractor={v => v.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: SPACING.md, paddingHorizontal: SPACING.xl }}
          contentContainerStyle={{ paddingTop: SPACING.lg, paddingBottom: 100, gap: SPACING.md }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <VendorCard
                vendor={item}
                onPress={() => navigation.navigate('VendorDetail', { vendorId: item.id })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NotificationsScreen
// ──────────────────────────────────────────────────────────────────────────────
export function NotificationsScreen({ navigation }) {
  const { notifications, markNotifRead, markAllRead, unreadCount } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <Text onPress={markAllRead} style={{ color: COLORS.gold, fontFamily: FONTS.body, fontSize: FONT_SIZE.sm }}>
              Read all
            </Text>
          ) : null
        }
      />
      {notifications.length === 0 ? (
        <EmptyState emoji="🔔" title="No Notifications" body="You're all caught up!" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id.toString()}
          contentContainerStyle={{ padding: SPACING.xl, gap: SPACING.md, paddingBottom: 60 }}
          renderItem={({ item: n }) => (
            <View
              onTouchEnd={() => markNotifRead(n.id)}
              style={[styles.notifCard, !n.is_read && styles.notifCardUnread]}
            >
              <View style={styles.notifDot}>
                {!n.is_read && <View style={styles.unreadDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, !n.is_read && { color: COLORS.cream }]}>{n.title}</Text>
                <Text style={styles.notifBody}>{n.body}</Text>
                <Text style={styles.notifTime}>{n.created_at ? new Date(n.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// EditProfileScreen
// ──────────────────────────────────────────────────────────────────────────────
export function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useApp();
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUser({ full_name: form.full_name, phone: form.phone });
      Toast.show({ type: 'success', text1: 'Profile updated ✓' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 60 }}>
        <View style={styles.avatarEditWrap}>
          <LinearGradient colors={[`${COLORS.gold}AA`, COLORS.gold]} style={styles.avatarEdit}>
            <Text style={styles.avatarEditText}>{(form.full_name || '?')[0].toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.changePhoto}>Change Photo</Text>
        </View>
        {[
          { key: 'full_name', label: 'Full Name',    keyboardType: 'default' },
          { key: 'email',     label: 'Email Address', keyboardType: 'email-address', editable: false },
          { key: 'phone',     label: 'Phone Number',  keyboardType: 'phone-pad' },
        ].map(f => (
          <View key={f.key} style={{ marginBottom: SPACING.md }}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <TextInput
              value={form[f.key]}
              onChangeText={set(f.key)}
              keyboardType={f.keyboardType}
              editable={f.editable !== false}
              style={[styles.input, f.editable === false && { opacity: 0.5 }]}
            />
          </View>
        ))}
        <GoldButton label={loading ? 'Saving…' : 'Save Changes'} onPress={handleSave} loading={loading} style={{ marginTop: SPACING.lg }} />
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// LoyaltyScreen
// ──────────────────────────────────────────────────────────────────────────────
export function LoyaltyScreen({ navigation }) {
  const { user } = useApp();
  const pts   = user?.loyalty_points || 0;
  const tier  = (user?.tier || 'silver').toLowerCase();
  const NEXT  = { silver: 3000, gold: 10000, diamond: Infinity };
  const nextPts = NEXT[tier] ?? 3000;
  const pct   = tier === 'diamond' ? 100 : Math.min((pts / nextPts) * 100, 100);
  const ptsLeft = tier === 'diamond' ? 0 : Math.max(nextPts - pts, 0);

  const rewards = [
    { icon: '📅', action: 'Book a service',   pts: '+200 pts' },
    { icon: '⭐', action: 'Write a review',   pts: '+50 pts'  },
    { icon: '👥', action: 'Refer a friend',   pts: '+500 pts' },
    { icon: '💳', action: 'Pay full amount',  pts: '+150 pts' },
    { icon: '📸', action: 'Share your event', pts: '+30 pts'  },
  ];

  const tiers = [
    { name: 'Silver',  pts: '0–2,999',    emoji: '🥈', active: tier === 'silver' },
    { name: 'Gold',    pts: '3,000–9,999', emoji: '🥇', active: tier === 'gold'   },
    { name: 'Diamond', pts: '10,000+',    emoji: '💎', active: tier === 'diamond' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="Loyalty & Rewards" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 80 }}>
        {/* Points Card */}
        <LinearGradient colors={[`${COLORS.gold}25`, `${COLORS.gold}08`]} style={styles.loyaltyHero}>
          <Text style={styles.loyaltyEmoji}>🏆</Text>
          <Text style={styles.loyaltyPts}>{pts.toLocaleString()}</Text>
          <Text style={styles.loyaltyPtsLabel}>LOYALTY POINTS</Text>
          <Text style={styles.loyaltyReward}>≈ AED {Math.floor(pts / 10)} redeemable value</Text>
          <View style={styles.loyaltyBar}>
            <View style={[styles.loyaltyBarFill, { width: `${Math.min(100, pct)}%` }]} />
          </View>
          {tier !== 'diamond'
            ? <Text style={styles.loyaltyNext}>{ptsLeft.toLocaleString()} pts to next tier</Text>
            : <Text style={styles.loyaltyNext}>✦ You've reached Diamond — the highest tier!</Text>
          }
        </LinearGradient>

        {/* Tiers */}
        <Text style={styles.sectionTitle}>Membership Tiers</Text>
        <View style={styles.tiersRow}>
          {tiers.map(t => (
            <View key={t.name} style={[styles.tierCard, t.active && styles.tierCardActive]}>
              <Text style={styles.tierEmoji}>{t.emoji}</Text>
              <Text style={[styles.tierName, t.active && { color: COLORS.gold }]}>{t.name}</Text>
              <Text style={styles.tierPts}>{t.pts}</Text>
            </View>
          ))}
        </View>

        <GoldDivider />

        {/* How to earn */}
        <Text style={styles.sectionTitle}>How to Earn Points</Text>
        {rewards.map(r => (
          <View key={r.action} style={styles.rewardRow}>
            <Text style={styles.rewardIcon}>{r.icon}</Text>
            <Text style={styles.rewardAction}>{r.action}</Text>
            <Text style={styles.rewardPts}>{r.pts}</Text>
          </View>
        ))}

        <GoldDivider />

        <GoldButton label="Redeem Points" onPress={() => Toast.show({ type: 'info', text1: 'Redemption coming soon!' })} />
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SettingsScreen
// ──────────────────────────────────────────────────────────────────────────────
export function SettingsScreen({ navigation }) {
  const { logout } = useApp();
  const [notifs, setNotifs] = useState({ bookings: true, payments: true, reviews: true, promos: false, system: true });
  const [privacy, setPrivacy] = useState({ twofa: true, analytics: false, marketing: false });

  const toggle = (group, key) => {
    if (group === 'notifs') setNotifs(n => ({ ...n, [key]: !n[key] }));
    else setPrivacy(p => ({ ...p, [key]: !p[key] }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 80 }}>

        {/* Notifications */}
        <Text style={styles.settingGroupTitle}>Notifications</Text>
        <View style={styles.settingCard}>
          {[
            { key: 'bookings', label: 'Booking updates' },
            { key: 'payments', label: 'Payment receipts' },
            { key: 'reviews',  label: 'Review reminders' },
            { key: 'promos',   label: 'Promotions & offers' },
            { key: 'system',   label: 'System announcements' },
          ].map(s => (
            <View key={s.key} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Switch
                value={notifs[s.key]}
                onValueChange={() => toggle('notifs', s.key)}
                trackColor={{ false: COLORS.dark3, true: `${COLORS.gold}80` }}
                thumbColor={notifs[s.key] ? COLORS.gold : COLORS.muted}
              />
            </View>
          ))}
        </View>

        {/* Privacy */}
        <Text style={[styles.settingGroupTitle, { marginTop: SPACING.xl }]}>Privacy & Security</Text>
        <View style={styles.settingCard}>
          {[
            { key: 'twofa',     label: 'Two-Factor Authentication' },
            { key: 'analytics', label: 'Usage Analytics' },
            { key: 'marketing', label: 'Marketing Emails' },
          ].map(s => (
            <View key={s.key} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Switch
                value={privacy[s.key]}
                onValueChange={() => toggle('privacy', s.key)}
                trackColor={{ false: COLORS.dark3, true: `${COLORS.gold}80` }}
                thumbColor={privacy[s.key] ? COLORS.gold : COLORS.muted}
              />
            </View>
          ))}
        </View>

        {/* Language */}
        <Text style={[styles.settingGroupTitle, { marginTop: SPACING.xl }]}>Language</Text>
        <View style={styles.settingCard}>
          {[{ label: 'English (Default)', active: true }, { label: 'العربية', active: false }].map(l => (
            <View key={l.label} style={styles.settingRow}>
              <Text style={[styles.settingLabel, l.active && { color: COLORS.gold }]}>{l.label}</Text>
              {l.active && <Text style={{ color: COLORS.gold, fontSize: 16 }}>✓</Text>}
            </View>
          ))}
        </View>

        <GoldDivider />

        <GoldButton
          label="Save Settings"
          onPress={() => Toast.show({ type: 'success', text1: 'Settings saved ✓' })}
          style={{ marginBottom: SPACING.md }}
        />
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ReviewsScreen
// ──────────────────────────────────────────────────────────────────────────────
export function ReviewsScreen({ navigation }) {
  const myReviews = [
    { vendor: 'Al Qasr Palace', emoji: '🏛️', rating: 5, text: 'Absolutely stunning venue. Every detail was perfect.', date: 'Feb 2026' },
    { vendor: 'Lumière Studio',  emoji: '📸', rating: 5, text: 'Best wedding photographers in Dubai, hands down.',    date: 'Feb 2026' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="My Reviews" onBack={() => navigation.goBack()} />
      {myReviews.length === 0 ? (
        <EmptyState emoji="⭐" title="No Reviews Yet" body="After your events, you can rate and review your vendors here." />
      ) : (
        <FlatList
          data={myReviews}
          keyExtractor={r => r.vendor}
          contentContainerStyle={{ padding: SPACING.xl, gap: SPACING.md, paddingBottom: 80 }}
          renderItem={({ item: r }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewVendor}>{r.vendor}</Text>
                  <Text style={styles.reviewDate}>{r.date}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[...Array(r.rating)].map((_, i) => <Text key={i} style={{ color: COLORS.gold, fontSize: 14 }}>★</Text>)}
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared Styles
// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Notifications
  notifCard:       { backgroundColor: COLORS.dark2, borderRadius: RADIUS.md, padding: SPACING.lg, flexDirection: 'row', gap: SPACING.md, borderWidth: 1, borderColor: `${COLORS.gold}10` },
  notifCardUnread: { borderColor: `${COLORS.gold}35`, backgroundColor: `${COLORS.gold}06` },
  notifDot:        { width: 20, paddingTop: 4, alignItems: 'center' },
  unreadDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold },
  notifTitle:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.muted },
  notifBody:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 20, marginTop: 4 },
  notifTime:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: `${COLORS.muted}80`, marginTop: 6 },

  // Edit Profile
  avatarEditWrap: { alignItems: 'center', marginBottom: SPACING.xxl },
  avatarEdit:     { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  avatarEditText: { fontFamily: FONTS.body, fontSize: 36, fontWeight: '700', color: COLORS.dark },
  changePhoto:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold },
  fieldLabel:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:          { backgroundColor: `${COLORS.white}04`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, color: COLORS.cream, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, padding: SPACING.md },

  // Loyalty
  loyaltyHero:      { borderRadius: RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}30`, marginBottom: SPACING.xl },
  loyaltyEmoji:     { fontSize: 56, marginBottom: SPACING.md },
  loyaltyPts:       { fontFamily: FONTS.display, fontSize: 52, color: COLORS.gold },
  loyaltyPtsLabel:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  loyaltyReward:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 6 },
  loyaltyBar:       { width: '100%', height: 5, backgroundColor: `${COLORS.gold}18`, borderRadius: 3, marginTop: SPACING.lg, overflow: 'hidden' },
  loyaltyBarFill:   { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
  loyaltyNext:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 6 },
  sectionTitle:     { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream, marginBottom: SPACING.md },
  tiersRow:         { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  tierCard:         { flex: 1, backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: `${COLORS.gold}12` },
  tierCardActive:   { borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}10` },
  tierEmoji:        { fontSize: 28 },
  tierName:         { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.muted },
  tierPts:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted },
  rewardRow:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}08` },
  rewardIcon:       { fontSize: 22, width: 32, textAlign: 'center' },
  rewardAction:     { flex: 1, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream },
  rewardPts:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.gold },

  // Settings
  settingGroupTitle:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: SPACING.sm },
  settingCard:      { backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: `${COLORS.gold}12` },
  settingRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}08` },
  settingLabel:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream },

  // Reviews
  reviewCard:   { backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: `${COLORS.gold}15` },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  reviewEmoji:  { fontSize: 28 },
  reviewVendor: { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.cream },
  reviewDate:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  reviewText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, lineHeight: 22 },
});
