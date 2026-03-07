import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldButton, GoldDivider, GoldBadge, StarRating } from '../../components';
import { LoadingScreen, ErrorState } from '../../components/LoadingStates';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { CATEGORIES } from '../../data';

export default function VendorDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { vendorId } = route.params;
  const { wishlist, toggleWishlist } = useApp();

  const [vendor, setVendor]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selectedPkg, setSelectedPkg] = useState(0);

  const wished = wishlist.includes(vendorId);

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  const loadVendor = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.vendors.get(vendorId);
      setVendor(data.vendor);
    } catch (err) {
      setError(err?.message || 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading vendor…" />;
  if (error)   return <ErrorState message={error} onRetry={loadVendor} />;
  if (!vendor) return null;

  const services = vendor.services || [];
  const reviews  = vendor.reviews  || [];
  const pkg      = services[selectedPkg];
  const emoji    = CATEGORIES.find(c => c.key === vendor.category)?.emoji || '⭐';
  const price    = pkg ? parseFloat(pkg.price) : 0;
  const fee      = Math.round(price * 0.05);
  const total    = price + fee;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Hero */}
        <LinearGradient colors={[COLORS.dark3, '#1A0A2E']} style={styles.hero}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.circleBtn, { top: insets.top + 12, left: SPACING.xl }]}>
            <Text style={styles.circleBtnIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleWishlist(vendorId)}
            style={[styles.circleBtn, { top: insets.top + 12, right: SPACING.xl }]}
          >
            <Text style={[styles.circleBtnIcon, { color: wished ? COLORS.rose : COLORS.cream }]}>{wished ? '♥' : '♡'}</Text>
          </TouchableOpacity>
          {vendor.is_verified && <GoldBadge label="✓ Verified" style={styles.verifiedBadge} />}
        </LinearGradient>

        <View style={styles.body}>
          {/* Title */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={styles.vendorName}>{vendor.business_name}</Text>
              <Text style={styles.vendorCat}>{vendor.category}</Text>
              <View style={styles.locRow}>
                <Text style={styles.pin}>📍</Text>
                <Text style={styles.loc}>{vendor.location}{vendor.city ? `, ${vendor.city}` : ''}</Text>
              </View>
            </View>
            <View style={styles.ratingBlock}>
              <Text style={styles.ratingNum}>{vendor.rating}</Text>
              <StarRating rating={parseFloat(vendor.rating)} size={11} />
              <Text style={styles.reviewCount}>({vendor.review_count} reviews)</Text>
            </View>
          </View>

          {vendor.description ? <Text style={styles.desc}>{vendor.description}</Text> : null}

          <GoldDivider />

          {/* Packages */}
          {services.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Select Package</Text>
              {services.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedPkg(i)}
                  style={[styles.pkgCard, selectedPkg === i && styles.pkgCardActive]}
                  activeOpacity={0.82}
                >
                  {i === 1 && <Text style={styles.popularLabel}>★ MOST POPULAR</Text>}
                  <View style={styles.pkgHeader}>
                    <Text style={styles.pkgName}>{s.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.pkgPrice}>AED {Number(s.price).toLocaleString()}</Text>
                      {selectedPkg === i && <Text style={{ color: COLORS.green, fontSize: 16 }}>✓</Text>}
                    </View>
                  </View>
                  <Text style={styles.pkgUnit}>/{s.pricing_unit?.replace('_', ' ')}</Text>
                  {(s.features || []).filter(Boolean).map((f, fi) => (
                    <View key={fi} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ))}
              <GoldDivider />
            </>
          )}

          {/* Price summary */}
          {pkg && (
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Price Summary</Text>
              {[
                [pkg.name, `AED ${price.toLocaleString()}`],
                ['Service Fee (5%)', `AED ${fee.toLocaleString()}`],
                ['Deposit Required (30%)', `AED ${Math.round(total * 0.30).toLocaleString()}`],
              ].map(([l, v]) => (
                <View key={l} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{l}</Text>
                  <Text style={[styles.summaryVal, l.includes('Deposit') && { color: COLORS.gold, fontWeight: '700' }]}>{v}</Text>
                </View>
              ))}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: COLORS.cream, fontWeight: '600' }]}>Total</Text>
                <Text style={[styles.summaryVal, { color: COLORS.gold, fontWeight: '700', fontSize: FONT_SIZE.lg }]}>AED {total.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <GoldDivider />

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first to book!</Text>
          ) : reviews.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{r.user_name?.[0] ?? 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>{r.user_name}</Text>
                  <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-AE', { month: 'short', year: 'numeric' })}</Text>
                </View>
                <StarRating rating={r.rating} size={12} />
              </View>
              <Text style={styles.reviewText}>{r.body}</Text>
              {r.vendor_reply && (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>Vendor reply:</Text>
                  <Text style={styles.replyText}>{r.vendor_reply}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <LinearGradient colors={[`${COLORS.dark}00`, COLORS.dark]} style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <GoldButton outline label="Request Quote" onPress={() => Toast.show({ type: 'info', text1: 'Quote request sent!' })} style={styles.quoteBtn} />
        <GoldButton
          label="Book Now"
          onPress={() => navigation.navigate('BookingFlow', { vendorId: vendor.id, serviceIndex: selectedPkg, services })}
          style={styles.bookBtn}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  hero:         { height: 240, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroEmoji:    { fontSize: 80 },
  circleBtn:    { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  circleBtnIcon:{ fontSize: 20, color: COLORS.cream },
  verifiedBadge:{ position: 'absolute', bottom: 14, right: 16 },
  body:         { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl },
  titleRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  vendorName:   { fontFamily: FONTS.display, fontSize: 26, color: COLORS.cream },
  vendorCat:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 2, textTransform: 'capitalize' },
  locRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  pin:          { fontSize: 12 },
  loc:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  ratingBlock:  { alignItems: 'flex-end', gap: 4 },
  ratingNum:    { fontFamily: FONTS.display, fontSize: 28, color: COLORS.gold },
  reviewCount:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted },
  desc:         { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, lineHeight: 24 },
  sectionTitle: { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream, marginBottom: SPACING.md },
  pkgCard:      { backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}18`, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  pkgCardActive:{ borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}08` },
  popularLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  pkgHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  pkgName:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.cream },
  pkgPrice:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gold },
  pkgUnit:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginBottom: SPACING.md },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  featureCheck: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  featureText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  summaryCard:  { backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}18`, borderRadius: RADIUS.lg, padding: SPACING.lg },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  summaryVal:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.cream },
  summaryDivider:{ height: 1, backgroundColor: `${COLORS.gold}18`, marginVertical: 10 },
  reviewCard:   { backgroundColor: COLORS.dark2, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: `${COLORS.gold}12` },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.dark },
  reviewName:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.cream },
  reviewDate:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  reviewText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 22 },
  replyBox:     { marginTop: SPACING.sm, backgroundColor: `${COLORS.gold}08`, borderRadius: RADIUS.sm, padding: SPACING.sm, borderLeftWidth: 2, borderLeftColor: COLORS.gold },
  replyLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.gold, fontWeight: '700', marginBottom: 4 },
  replyText:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  noReviews:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, fontStyle: 'italic' },
  bottomCTA:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: SPACING.xl, paddingTop: 30, gap: SPACING.md },
  quoteBtn:     { flex: 1 },
  bookBtn:      { flex: 2 },
});
