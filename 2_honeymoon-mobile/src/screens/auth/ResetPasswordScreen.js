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

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'One uppercase letter',  test: pw => /[A-Z]/.test(pw) },
  { label: 'One number',            test: pw => /\d/.test(pw) },
];

export default function ResetPasswordScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { phone, code } = route.params || {};

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleReset = async () => {
    setError('');
    if (!password) { setError('Please enter a new password.'); return; }
    if (REQUIREMENTS.some(r => !r.test(password))) {
      setError('Password does not meet all requirements.'); return;
    }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await api.auth.resetPassword({ phone, code, new_password: password });
      Toast.show({ type: 'success', text1: 'Password reset! Please sign in.' });
      navigation.navigate('Login');
    } catch (err) {
      setError(err?.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={{ fontSize: 52, marginBottom: SPACING.lg }}>🔒</Text>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.sub}>Choose a strong password for your account.</Text>

          <View style={styles.card}>
            <ErrorBar message={error} onDismiss={() => setError('')} />

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 characters"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPw}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Requirements */}
            <View style={styles.requirements}>
              {REQUIREMENTS.map(r => {
                const met = password.length > 0 && r.test(password);
                return (
                  <View key={r.label} style={styles.reqRow}>
                    <Text style={{ color: met ? '#4CAF50' : COLORS.muted, fontSize: 14 }}>
                      {met ? '✓' : '○'}
                    </Text>
                    <Text style={[styles.reqText, met && { color: '#4CAF50' }]}>{r.label}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: SPACING.md }]}>Confirm Password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPw}
              style={[
                styles.input,
                confirm.length > 0 && confirm !== password && styles.inputError,
                confirm.length > 0 && confirm === password && styles.inputSuccess,
              ]}
            />
            {confirm.length > 0 && confirm !== password && (
              <Text style={styles.matchError}>Passwords don't match</Text>
            )}

            <GoldButton
              label={loading ? 'Resetting…' : 'Reset Password'}
              onPress={handleReset}
              loading={loading}
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  title:        { fontFamily: FONTS.display, fontSize: 30, color: COLORS.cream, marginBottom: 8 },
  sub:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, marginBottom: SPACING.xl },
  card:         { backgroundColor: COLORS.dark2, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: `${COLORS.gold}20` },
  label:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:        { backgroundColor: `${COLORS.white}04`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, color: COLORS.cream, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, padding: SPACING.md, marginBottom: SPACING.sm },
  inputError:   { borderColor: '#FF6B6B' },
  inputSuccess: { borderColor: '#4CAF50' },
  passRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  eyeBtn:       { padding: 8 },
  requirements: { gap: 6, marginBottom: SPACING.md },
  reqRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqText:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  matchError:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: '#FF6B6B', marginTop: -4, marginBottom: SPACING.sm },
});
