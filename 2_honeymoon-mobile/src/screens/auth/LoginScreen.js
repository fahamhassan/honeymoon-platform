import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldButton, GoldDivider } from '../../components';
import { ErrorBar } from '../../components/LoadingStates';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [email, setEmail]       = useState('fatima@example.com');  // prefilled for dev
  const [password, setPassword] = useState('Test@1234');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      Toast.show({ type: 'success', text1: `Welcome back, ${data.user.full_name.split(' ')[0]}!` });
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1C0E2E', COLORS.dark]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Text style={styles.moon}>🌙</Text>
            <Text style={styles.brand}>HoneyMoon</Text>
            <Text style={styles.sub}>Sign in to your account</Text>
          </View>

          <View style={styles.card}>
            <ErrorBar message={error} onDismiss={() => setError('')} />

            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="fatima@example.com"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Password</Text>
            <View style={styles.passRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPass}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <GoldButton
              label={loading ? 'Signing in…' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

            <GoldDivider />

            <TouchableOpacity
              style={styles.uaePassBtn}
              onPress={() => navigation.navigate('UaePass')}
              activeOpacity={0.8}
            >
              <Text style={styles.uaePassEmoji}>🇦🇪</Text>
              <Text style={styles.uaePassText}>Continue with UAE Pass</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerGrey}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scroll:       { flexGrow: 1, paddingHorizontal: SPACING.xl },
  logoWrap:     { alignItems: 'center', marginBottom: SPACING.xxl },
  moon:         { fontSize: 48, marginBottom: 8 },
  brand:        { fontFamily: FONTS.display, fontSize: 36, color: COLORS.cream, letterSpacing: 3 },
  sub:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 6 },
  card:         { backgroundColor: COLORS.dark2, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: `${COLORS.gold}20`, marginBottom: SPACING.xl },
  fieldLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:        { backgroundColor: `${COLORS.white}04`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, color: COLORS.cream, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, padding: SPACING.md, marginBottom: SPACING.sm },
  passRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  eyeBtn:       { padding: 8 },
  eyeIcon:      { fontSize: 18 },
  forgotRow:    { alignItems: 'flex-end', marginBottom: SPACING.lg },
  forgotText:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold },
  loginBtn:     { marginTop: SPACING.sm },
  uaePassBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: `${COLORS.white}06`, borderWidth: 1, borderColor: `${COLORS.gold}25`, borderRadius: RADIUS.md, padding: 13 },
  uaePassEmoji: { fontSize: 20 },
  uaePassText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.cream, fontWeight: '500' },
  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerGrey: { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  registerLink: { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold, fontWeight: '700' },
});
