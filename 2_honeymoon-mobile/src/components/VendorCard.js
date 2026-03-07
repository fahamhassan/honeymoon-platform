import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS, SHADOW } from '../theme';
import { GoldBadge, StarRating } from './index';
import { useApp } from '../context/AppContext';

export default function VendorCard({ vendor, onPress, compact = false }) {
  const { wishlist, toggleWishlist } = useApp();
  const wished = wishlist.includes(vendor.id);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, compact && styles.compact, SHADOW.sm]}>
      {/* Hero */}
      <LinearGradient
        colors={[COLORS.dark3, '#1A0F28']}
        style={[styles.hero, compact && styles.heroCompact]}
      >
        <Text style={[styles.emoji, compact && { fontSize: 36 }]}>{vendor.emoji}</Text>

        {vendor.verified && (
          <GoldBadge label="✓ Verified" style={styles.verifiedBadge} />
        )}

        {/* Wishlist Heart */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); toggleWishlist(vendor.id); }}
          style={styles.heartBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.heart, { color: wished ? COLORS.rose : COLORS.muted }]}>
            {wished ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.name} numberOfLines={1}>{vendor.name}</Text>
            <Text style={styles.cat}>{vendor.categoryLabel}</Text>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingEmoji}>★</Text>
            <Text style={styles.rating}>{vendor.rating}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.locRow}>
            <Text style={styles.locPin}>📍</Text>
            <Text style={styles.loc} numberOfLines={1}>{vendor.location}</Text>
          </View>
          <Text style={styles.price}>{vendor.priceLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.dark2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.gold}15`,
    overflow: 'hidden',
    flex: 1,
  },
  compact: { width: 180 },

  hero: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroCompact: { height: 110 },
  emoji: { fontSize: 52 },

  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { fontSize: 16 },

  body: { padding: SPACING.md },

  topRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.cream },
  cat:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },

  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingEmoji:{ color: COLORS.gold, fontSize: 12 },
  rating:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.gold },

  bottomRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locRow:     { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  locPin:     { fontSize: 10 },
  loc:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, flex: 1 },
  price:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.gold },
});
