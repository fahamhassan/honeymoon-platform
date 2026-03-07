import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Keyboard, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldButton } from '../../components';
import { ErrorBar } from '../../components/LoadingStates';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

const OTP_LENGTH   = 4;
const RESEND_SECS  = 60;   // 60 second cooldown before resend

export default function OtpScreen({ route, navigation }) {
  const insets   = useSafeAreaInsets();
  const { login } = useApp();

  const phone    = route.params?.phone    || '';
  const email    = route.params?.email    || '';
  const password = route.params?.password || '';
  const purpose  = route.params?.purpose  || 'verify';

  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [resendCD,  setResendCD]  = useState(RESEND_SECS);
  const [resending, setResending] = useState(false);

  const refs = Array.from({ length: OTP_LENGTH }, () => useRef(null));

  // Countdown timer
  useEffect(() => {
    if (resendCD <= 0) return;
    const t = setTimeout(() => setResendCD(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCD]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (digits.every(d => d !== '') && !loading) {
      handleVerify(digits.join(''));
    }
  }, [digits]);

  const handleChange = useCallback((val, idx) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);

    if (cleaned && idx < OTP_LENGTH - 1) {
      refs[idx + 1].current?.focus();
    }
  }, [digits]);

  const handleKeyPress = useCallback(({ nativeEvent }, idx) => {
    if (nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      refs[idx - 1].current?.focus();
    }
  }, [digits]);

  // Handle paste — user might paste the 4-digit code at once
  const handlePaste = useCallback((val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (cleaned.length === OTP_LENGTH) {
      setDigits(cleaned.split(''));
      refs[OTP_LENGTH - 1].current?.focus();
      Keyboard.dismiss();
    }
  }, []);

  const handleVerify = async (code) => {
    if (!code || code.length < OTP_LENGTH) {
      setError('Enter the complete 4-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.auth.verifyOtp(phone, code, purpose);

      if (purpose === 'reset') {
        // Navigate to reset password screen
        navigation.navigate('ResetPassword', { phone, code });
        return;
      }

      // Auto-login after phone verification
      if (email && password) {
        await login(email, password);
        Toast.show({ type: 'success', text1: 'Welcome to HoneyMoon! ✨' });
      } else {
        navigation.navigate('Login');
        Toast.show({ type: 'success', text1: 'Phone verified! Please sign in.' });
      }
    } catch (err) {
      setError(err?.message || 'Invalid or expired code.');
      setDigits(Array(OTP_LENGTH).fill(''));
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCD > 0 || resending) return;
    setResending(true);
    try {
      await api.auth.sendOtp(phone, purpose);
      setResendCD(RESEND_SECS);
      setDigits(Array(OTP_LENGTH).fill(''));
      refs[0].current?.focus();
      Toast.show({ type: 'success', text1: 'New code sent!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Could not resend. Try again.' });
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = phone
    ? phone.replace(/(\+\d{3})\d+(\d{4})$/, '$1·····$2')
    : '';

  const purposeLabel = {
    verify: 'Verify your number',
    reset:  'Reset your password',
    login:  'Confirm your identity',
  }[purpose] || 'Verify your number';

  return (
    <LinearGradient colors={['#1C0E2E', COLORS.dark]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: SPACING.xxl }}>
          <Text style={{ color: COLORS.gold, fontSize: 22 }}>←</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>
          {purpose === 'reset' ? '🔐' : '📱'}
        </Text>
        <Text style={styles.title}>{purposeLabel}</Text>
        <Text style={styles.sub}>
          We sent a {OTP_LENGTH}-digit code to{'\n'}
          <Text style={{ color: COLORS.gold }}>{maskedPhone}</Text>
        </Text>

        <ErrorBar message={error} onDismiss={() => setError('')} />

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {digits.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={refs[idx]}
              value={digit}
              onChangeText={val => {
                // Allow paste of full code
                if (val.length > 1) { handlePaste(val); return; }
                handleChange(val, idx);
              }}
              onKeyPress={e => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH} // allows paste detection
              selectTextOnFocus
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
              ]}
              autoFocus={idx === 0}
            />
          ))}
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[styles.dot, d ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </View>

        <GoldButton
          label={loading ? 'Verifying…' : 'Verify & Continue'}
          onPress={() => handleVerify(digits.join(''))}
          loading={loading}
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendGrey}>Didn't receive it? </Text>
          {resendCD > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendCD}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendLink}>
                {resending ? 'Sending…' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.hint}>
          {Platform.OS === 'ios'
            ? 'The code will auto-fill from your Messages app.'
            : 'The code will auto-fill if SMS permissions are granted.'}
        </Text>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, paddingHorizontal: SPACING.xl },
  emoji:          { fontSize: 52, marginBottom: SPACING.lg },
  title:          { fontFamily: FONTS.display, fontSize: 30, color: COLORS.cream, marginBottom: 8 },
  sub:            { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, lineHeight: 24, marginBottom: SPACING.xl },
  otpRow:         { flexDirection: 'row', gap: 14, marginBottom: SPACING.lg },
  otpInput:       {
    width: 62, height: 70, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: `${COLORS.gold}30`,
    backgroundColor: COLORS.dark2,
    textAlign: 'center', fontSize: 28,
    fontFamily: FONTS.body, color: COLORS.cream,
  },
  otpInputFilled: { borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}12` },
  otpInputError:  { borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.06)' },
  progressDots:   { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: SPACING.xxl },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  dotEmpty:       { backgroundColor: `${COLORS.gold}25` },
  dotFilled:      { backgroundColor: COLORS.gold },
  resendRow:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  resendGrey:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  resendTimer:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  resendLink:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.gold, fontWeight: '700' },
  hint:           { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: `${COLORS.muted}70`, textAlign: 'center', lineHeight: 18 },
});
