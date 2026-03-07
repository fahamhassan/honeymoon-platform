import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, FONT_SIZE } from '../theme';
import { useApp } from '../context/AppContext';

// Tab Screens
import HomeScreen       from '../screens/home/HomeScreen';
import ExploreScreen    from '../screens/explore/ExploreScreen';
import BudgetScreen     from '../screens/budget/BudgetScreen';
import BookingsScreen   from '../screens/bookings/BookingsScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';

// Stack screens pushed from tabs
import VendorDetailScreen  from '../screens/explore/VendorDetailScreen';
import BookingFlowScreen   from '../screens/bookings/BookingFlowScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import { WishlistScreen, NotificationsScreen, EditProfileScreen, LoyaltyScreen, SettingsScreen, ReviewsScreen } from '../screens/profile/ProfileScreens';
import PaymentsScreen from '../screens/profile/PaymentsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab Bar Icon ───────────────────────────────────────────────────────────────
function TabIcon({ icon, label, focused, badge }) {
  return (
    <View style={styles.tabItem}>
      <View style={styles.tabIconWrap}>
        <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.45 }]}>{icon}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color: focused ? COLORS.gold : COLORS.muted }]}>
        {label}
      </Text>
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

// ── Custom Tab Bar ─────────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useApp();

  const tabs = [
    { icon: '🏠', label: 'Home' },
    { icon: '🔍', label: 'Explore' },
    { icon: '💰', label: 'Budget' },
    { icon: '📅', label: 'Bookings' },
    { icon: '👤', label: 'Profile' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 10 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const badge = route.name === 'Profile' ? unreadCount : 0;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabBtn}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <TabIcon
              icon={tabs[index].icon}
              label={tabs[index].label}
              focused={focused}
              badge={badge}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Bottom Tab Navigator ───────────────────────────────────────────────────────
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Explore"  component={ExploreScreen} />
      <Tab.Screen name="Budget"   component={BudgetScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Main Stack (tabs + pushed screens) ────────────────────────────────────────
export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.dark },
      }}
    >
      <Stack.Screen name="Tabs"           component={TabNavigator} />
      <Stack.Screen name="VendorDetail"   component={VendorDetailScreen} />
      <Stack.Screen name="BookingFlow"    component={BookingFlowScreen} />
      <Stack.Screen name="BookingDetail"  component={BookingDetailScreen} />
      <Stack.Screen name="Wishlist"       component={WishlistScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="Loyalty"        component={LoyaltyScreen} />
      <Stack.Screen name="Payments"       component={PaymentsScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="Reviews"        component={ReviewsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark2,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.gold}20`,
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: FONTS.body,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '700',
  },
});
