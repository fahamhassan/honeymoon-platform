import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldButton } from '../../components';
import { ErrorBar } from '../../components/LoadingStates';
import { api } from '../../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [sent,       setSent]       = useState(false);
  const [phone,      setPhone]      = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(identifier.trim());
      setPhone(res.phone || identifier);
      setSent(true);
      Toast.show({ type: 'success', text1: 'Reset code sent!' });
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <LinearGradient colors={['#1C0E2E', COLORS.dark]} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <Text style={{ fontSize: 64, marginBottom: SPACING.xl }}>📩</Text>
          <Text style={styles.title}>Check Your Phone</Text>
          <Text style={styles.sub}>
            We've sent a 4-digit reset code to{'\n'}
            <Text style={{ color: COLORS.gold }}>{phone}</Text>
          </Text>
          <GoldButton
            label="Enter Reset Code"
            onPress={() => navigation.navigate('Otp', {
              phone,
              purpose: 'reset',
            })}
            style={{ marginBottom: SPACING.lg }}
          />
          <TouchableOpacity onPress={() => setSent(false)}>
            <Text style={styles.back}>← Use a different email / number</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1C0E2E', COLORS.dark]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: SPACING.xl }}>
            <Text style={{ color: COLORS.gold, fontSize: 22 }}>←</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 52, marginBottom: SPACING.lg }}>🔑</Text>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.sub}>
            Enter the email address or phone number associated with your account.
            We'll send you a reset code.
          </Text>

          <View style={styles.card}>
            <ErrorBar message={error} onDismiss={() => setError('')} />

            <Text style={styles.label}>Email or Phone Number</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="fatima@example.com or +971501234567"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <GoldButton
              label={loading ? 'Sending…' : 'Send Reset Code'}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: SPACING.md }}
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ alignItems: 'center', marginTop: SPACING.xl }}
          >
            <Text style={styles.back}>← Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  scroll:    { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  title:     { fontFamily: FONTS.display, fontSize: 30, color: COLORS.cream, marginBottom: 8 },
  sub:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, lineHeight: 24, marginBottom: SPACING.xl, textAlign: 'center' },
  card:      { backgroundColor: COLORS.dark2, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: `${COLORS.gold}20`, marginBottom: SPACING.xl },
  label:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:     { backgroundColor: `${COLORS.white}04`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, color: COLORS.cream, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, padding: SPACING.md },
  back:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold, textAlign: 'center' },
});
