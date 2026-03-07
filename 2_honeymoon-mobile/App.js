import React from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';

import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider, useApp } from './src/context/AppContext';
import { toastConfig } from './src/components/ToastConfig';
import { LoadingScreen } from './src/components/LoadingStates';
import { COLORS } from './src/theme';

// Publishable key — safe to expose in client code (not the secret key)
// In production, fetch this from your backend or store in env config
const STRIPE_PUBLISHABLE_KEY = __DEV__
  ? 'pk_test_your_test_key_here'          // replace with your Stripe test pk_test_...
  : 'pk_live_your_live_key_here';         // replace with your Stripe live pk_live_...

function AppShell() {
  const { isBootstrapped } = useApp();

  if (!isBootstrapped) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
        <LoadingScreen message="Loading HoneyMoon…" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.ae.honeymoon"  // required for Apple Pay
          urlScheme="honeymoon"                        // required for 3D Secure redirects
        >
          <AppProvider>
            <AppShell />
            <Toast config={toastConfig} />
          </AppProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
