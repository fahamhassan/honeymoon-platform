import { Platform } from 'react-native';

// ── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  gold:        '#C6A85C',
  goldLight:   '#E8D5A3',
  goldDim:     '#8B6914',
  dark:        '#0C0910',
  dark2:       '#161120',
  dark3:       '#1E1628',
  dark4:       '#251D2F',
  cream:       '#FAF6EE',
  muted:       '#8A7A9A',
  rose:        '#D4A0B5',
  teal:        '#7EC8C8',
  green:       '#5CB88A',
  red:         '#D46A6A',
  white:       '#FFFFFF',
  transparent: 'transparent',

  // Semantic
  success:     '#5CB88A',
  warning:     '#C6A85C',
  error:       '#D46A6A',
  info:        '#7EC8C8',
};

// ── Typography ────────────────────────────────────────────────────────────────
export const FONTS = {
  // Display / headings — serif feel
  display: Platform.select({
    ios:     'Georgia',
    android: 'serif',
  }),
  // Body / UI — clean sans
  body: Platform.select({
    ios:     'System',
    android: 'sans-serif',
  }),
  bodyLight: Platform.select({
    ios:     'System',
    android: 'sans-serif-light',
  }),
  bodyMedium: Platform.select({
    ios:     'System',
    android: 'sans-serif-medium',
  }),
};

export const FONT_SIZE = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 28,
  huge: 36,
};

// ── Spacing ───────────────────────────────────────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl:36,
};

// ── Border Radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
  }),
  gold: Platform.select({
    ios: {
      shadowColor: '#C6A85C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
  }),
};
