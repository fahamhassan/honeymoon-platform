import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZE, RADIUS, SPACING } from '../theme';

export const toastConfig = {
  success: ({ text1 }) => (
    <View style={[styles.toast, { borderLeftColor: COLORS.green }]}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
  error: ({ text1 }) => (
    <View style={[styles.toast, { borderLeftColor: COLORS.red }]}>
      <Text style={styles.icon}>✕</Text>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
  info: ({ text1 }) => (
    <View style={[styles.toast, { borderLeftColor: COLORS.gold }]}>
      <Text style={styles.icon}>✦</Text>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark2,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.xl,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: `${COLORS.gold}20`,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  icon: { fontSize: 14, color: COLORS.gold, fontWeight: '700' },
  text: { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream, flex: 1 },
});
