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

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [form, setForm]   = useState({ full_name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setError('');
    const { full_name, email, phone, password } = form;
    if (!full_name || !email || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.register({ full_name, email, phone, password });
      await api.auth.sendOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'full_name', label: 'Full Name',     placeholder: 'Fatima Al-Rashid', keyType: 'default' },
    { key: 'email',     label: 'Email Address', placeholder: 'fatima@example.com', keyType: 'email-address' },
    { key: 'phone',     label: 'Mobile Number', placeholder: '+971 50 000 0000', keyType: 'phone-pad' },
    { key: 'password',  label: 'Password',      placeholder: 'Min 8 characters', keyType: 'default', secure: true },
  ];

  return (
    <LinearGradient colors={['#1C0E2E', COLORS.dark]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: SPACING.xl }}>
            <Text style={{ color: COLORS.gold, fontSize: 22 }}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.sub}>Join the UAE's most exclusive wedding platform</Text>

          <View style={styles.card}>
            <ErrorBar message={error} onDismiss={() => setError('')} />
            {fields.map(f => (
              <View key={f.key} style={{ marginBottom: SPACING.md }}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  value={form[f.key]}
                  onChangeText={set(f.key)}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.muted}
                  keyboardType={f.keyType}
                  secureTextEntry={f.secure}
                  autoCapitalize={f.key === 'full_name' ? 'words' : 'none'}
                  style={styles.input}
                />
              </View>
            ))}

            <View style={styles.notice}>
              <Text style={styles.noticeIcon}>🔒</Text>
              <Text style={styles.noticeText}>HoneyMoon is a female-only platform. Accounts are verified via UAE ID.</Text>
            </View>

            <GoldButton
              label={loading ? 'Creating Account…' : 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: SPACING.md }}
            />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginGrey}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:     { flexGrow: 1, paddingHorizontal: SPACING.xl },
  title:      { fontFamily: FONTS.display, fontSize: 32, color: COLORS.cream, marginBottom: 8 },
  sub:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginBottom: SPACING.xl },
  card:       { backgroundColor: COLORS.dark2, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: `${COLORS.gold}20`, marginBottom: SPACING.xl },
  label:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:      { backgroundColor: `${COLORS.white}04`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, color: COLORS.cream, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, padding: SPACING.md },
  notice:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: `${COLORS.gold}10`, borderRadius: RADIUS.md, padding: SPACING.md, gap: 10, marginTop: SPACING.sm },
  noticeIcon: { fontSize: 16 },
  noticeText: { flex: 1, fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, lineHeight: 20 },
  loginRow:   { flexDirection: 'row', justifyContent: 'center' },
  loginGrey:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  loginLink:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold, fontWeight: '700' },
});
