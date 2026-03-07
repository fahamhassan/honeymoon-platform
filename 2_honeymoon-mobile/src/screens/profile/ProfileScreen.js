import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldDivider, GoldBadge, RowItem, ProgressBar } from '../../components';
import { useApp } from '../../context/AppContext';

const TIER_NEXT  = { silver: 3000, gold: 10000, diamond: Infinity };
const TIER_LABEL = { silver: 'Gold', gold: 'Diamond', diamond: '✦ Max' };

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, wishlist } = useApp();

  if (!user) return null;

  const pts      = user.loyalty_points || 0;
  const tier     = (user.tier || 'silver').toLowerCase();
  const nextPts  = TIER_NEXT[tier] ?? 3000;
  const pointsPct  = tier === 'diamond' ? 100 : Math.min((pts / nextPts) * 100, 100);
  const pointsLeft = tier === 'diamond' ? 0 : Math.max(nextPts - pts, 0);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuSections = [
    {
      title: 'My Account',
      items: [
        { icon: '📅', label: 'My Events',           value: `${user.events?.length ?? 0} events`,  onPress: () => Toast.show({ type: 'info', text1: 'My Events — coming soon' }) },
        { icon: '♥',  label: 'Wishlist',             value: `${wishlist.length} saved`,             onPress: () => navigation.navigate('Wishlist') },
        { icon: '💳', label: 'Payments & Invoices',  value: 'View history',                        onPress: () => navigation.navigate('Payments') },
        { icon: '⭐', label: 'My Reviews',           value: 'View written reviews',                onPress: () => navigation.navigate('Reviews') },
        { icon: '🎁', label: 'Loyalty & Referrals',  value: `${pts.toLocaleString()} points`,      onPress: () => navigation.navigate('Loyalty') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '🔔', label: 'Notifications',   value: 'All alerts on',  onPress: () => navigation.navigate('Notifications') },
        { icon: '🛡️', label: 'Privacy & Security', value: '2FA enabled', onPress: () => Toast.show({ type: 'info', text1: 'Security — coming soon' }) },
        { icon: '📞', label: 'Contact Support', value: '24/7 available', onPress: () => Toast.show({ type: 'info', text1: 'Support — coming soon' }) },
        { icon: '⚙️', label: 'Settings',        value: '',               onPress: () => navigation.navigate('Settings') },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Profile Hero */}
        <LinearGradient
          colors={[COLORS.dark2, COLORS.dark]}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[`${COLORS.gold}AA`, COLORS.gold]} style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.full_name || user.email || '?')[0].toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          <GoldBadge label={`${tier === 'diamond' ? '💎' : tier === 'gold' ? '🥇' : '🥈'} ${tier.charAt(0).toUpperCase() + tier.slice(1)} Member`} style={styles.tierBadge} />
        </LinearGradient>

        <View style={{ paddingHorizontal: SPACING.xl }}>
          {/* Loyalty Card */}
          <TouchableOpacity onPress={() => navigation.navigate('Loyalty')} activeOpacity={0.85}>
            <LinearGradient
              colors={[`${COLORS.gold}22`, `${COLORS.gold}08`]}
              style={styles.loyaltyCard}
            >
              <View style={styles.loyaltyTop}>
                <View>
                  <Text style={styles.loyaltyLabel}>LOYALTY POINTS</Text>
                  <Text style={styles.loyaltyPts}>{pts.toLocaleString()} pts</Text>
                  <Text style={styles.loyaltyReward}>≈ AED {Math.floor(pts / 10)} in rewards</Text>
                </View>
                <Text style={styles.loyaltyTrophy}>🏆</Text>
              </View>
              <ProgressBar percent={pointsPct} style={{ marginTop: SPACING.md }} />
              <View style={styles.loyaltyFooter}>
                <Text style={styles.loyaltyPtsText}>{pts.toLocaleString()} pts</Text>
                {tier !== 'diamond'
                  ? <Text style={styles.loyaltyNextText}>{pointsLeft.toLocaleString()} more to {TIER_LABEL[tier]} →</Text>
                  : <Text style={styles.loyaltyNextText}>✦ Diamond — max tier</Text>
                }
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <GoldDivider />

          {/* Edit Profile */}
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>✏️  Edit Profile</Text>
          </TouchableOpacity>

          {/* Menu Sections */}
          {menuSections.map(section => (
            <View key={section.title} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              {section.items.map(item => (
                <RowItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  onPress={item.onPress}
                />
              ))}
            </View>
          ))}

          {/* Logout */}
          <RowItem
            icon="🚪"
            label="Logout"
            onPress={handleLogout}
            danger
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero:       { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl, alignItems: 'center' },
  avatarWrap: { marginBottom: SPACING.lg },
  avatar:     { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.body, fontSize: 34, fontWeight: '700', color: COLORS.dark },
  name:       { fontFamily: FONTS.display, fontSize: 26, color: COLORS.cream, textAlign: 'center' },
  email:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 4 },
  phone:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 2 },
  tierBadge:  { marginTop: SPACING.md },

  loyaltyCard:  { borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: `${COLORS.gold}30` },
  loyaltyTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loyaltyLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  loyaltyPts:   { fontFamily: FONTS.display, fontSize: 34, color: COLORS.gold },
  loyaltyReward:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 2 },
  loyaltyTrophy:{ fontSize: 40 },
  loyaltyFooter:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  loyaltyPtsText: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted },
  loyaltyNextText:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold },

  editBtn:     { backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}25`, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.lg },
  editBtnText: { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.gold, fontWeight: '600' },

  menuSection:      { marginBottom: SPACING.lg },
  menuSectionTitle: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: SPACING.sm },
});
