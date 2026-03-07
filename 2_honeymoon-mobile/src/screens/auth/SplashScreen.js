import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../theme';
import { useApp } from '../../context/AppContext';

export default function SplashScreen({ navigation }) {
  const { isLoggedIn, isBootstrapping } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, friction: 5,   useNativeDriver: true }),
    ]).start();
  }, []);

  // Once bootstrapping finishes, navigate
  useEffect(() => {
    if (!isBootstrapping) {
      const timer = setTimeout(() => {
        navigation.replace(isLoggedIn ? 'Main' : 'Login');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isBootstrapping, isLoggedIn]);

  return (
    <LinearGradient colors={['#1C0E2E', COLORS.dark, '#0A1520']} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.moon}>🌙</Text>
        <Text style={styles.brand}>HoneyMoon</Text>
        <Text style={styles.tagline}>Luxury Weddings · UAE</Text>
        <View style={styles.divider}>
          <View style={styles.line} />
          <View style={styles.diamond} />
          <View style={[styles.line, { transform: [{ scaleX: -1 }] }]} />
        </View>
      </Animated.View>
      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap:  { alignItems: 'center' },
  moon:      { fontSize: 64, marginBottom: SPACING.lg },
  brand:     { fontFamily: FONTS.display, fontSize: 42, color: COLORS.cream, letterSpacing: 4 },
  tagline:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold, letterSpacing: 4, textTransform: 'uppercase', marginTop: 8 },
  divider:   { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl, width: 160 },
  line:      { flex: 1, height: 1, backgroundColor: `${COLORS.gold}40` },
  diamond:   { width: 6, height: 6, backgroundColor: COLORS.gold, transform: [{ rotate: '45deg' }], marginHorizontal: 10 },
  version:   { position: 'absolute', bottom: 40, fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted },
});
