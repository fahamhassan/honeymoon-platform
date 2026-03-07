import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useStripe } from '@stripe/stripe-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { GoldButton, GoldDivider } from '../../components';
import { ErrorBar } from '../../components/LoadingStates';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const STEPS = ['Details', 'Payment', 'Confirm'];

export default function BookingFlowScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { vendorId, serviceIndex = 0, services = [] } = route.params || {};
  const { addBooking, user } = useApp();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [step,    setStep]    = useState(0);
  const [selSvc,  setSelSvc]  = useState(serviceIndex);
  const [guests,  setGuests]  = useState(String(user?.events?.[0]?.guest_count || 150));
  const [date,    setDate]    = useState(user?.events?.[0]?.event_date?.slice(0, 10) || '2026-12-15');
  const [notes,   setNotes]   = useState('');
  const [payType, setPayType] = useState('deposit');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [booking, setBooking] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);

  const svc = services[selSvc] || services[0];
  if (!svc) return null;

  const isPerGuest = svc.pricing_unit === 'per_guest';
  const subtotal   = isPerGuest
    ? parseFloat(svc.price) * (parseInt(guests) || 1)
    : parseFloat(svc.price);
  const fee        = Math.round(subtotal * 0.05 * 100) / 100;
  const total      = subtotal + fee;
  const deposit    = Math.round(total * 0.30 * 100) / 100;
  const amountDue  = payType === 'deposit' ? deposit : total;

  // ── Step 1: Reserve booking ────────────────────────────────────────────────
  const handleContinueToPayment = async () => {
    setError('');
    if (!date) { setError('Please enter your event date'); return; }
    setLoading(true);
    try {
      const res = await api.bookings.create({
        vendor_id:    vendorId,
        service_id:   svc.id,
        package_name: svc.name,
        event_date:   date,
        guest_count:  parseInt(guests) || 150,
        notes,
      });
      setBooking(res.booking);
      setStep(1);
    } catch (err) {
      setError(err?.message || 'Failed to reserve booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Real Stripe PaymentSheet ──────────────────────────────────────
  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Ask backend for PaymentIntent + EphemeralKey + Customer
      const sheetData = await api.payments.createSheet({
        booking_id:   booking.id,
        payment_type: payType,
      });

      // 2. Initialise the native PaymentSheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:        'HoneyMoon Platform',
        customerId:                 sheetData.customerId,
        customerEphemeralKeySecret: sheetData.ephemeralKey,
        paymentIntentClientSecret:  sheetData.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name:  user?.full_name,
          email: user?.email,
          phone: user?.phone,
        },
        appearance: {
          // Match our dark luxury theme as closely as possible
          colors: {
            primary:          '#C6A85C',
            background:       '#1A1028',
            componentBackground: '#251535',
            componentBorder:  '#C6A85C33',
            componentDivider: '#C6A85C18',
            primaryText:      '#F5ECD7',
            secondaryText:    '#9B8FA8',
            placeholderText:  '#6B5F78',
            icon:             '#C6A85C',
          },
        },
      });

      if (initError) {
        setError(initError.message);
        setLoading(false);
        return;
      }

      // 3. Present the sheet — user enters card / Apple Pay / Google Pay
      setLoading(false); // let Stripe take over UI
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User dismissed — not an error, just stay on step 1
          return;
        }
        setError(presentError.message);
        return;
      }

      // 4. Payment succeeded — webhook will update DB, we update local state optimistically
      const paid = sheetData.amount;
      setAmountPaid(paid);
      addBooking({
        ...booking,
        status:      'pending',
        paid_amount: paid,
        vendor_name: svc.vendor_name || svc.name,
      });
      setStep(2);
      Toast.show({ type: 'success', text1: 'Payment successful! 🎉' });

    } catch (err) {
      setError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Service</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, alignItems: 'center' }}>
              <View style={[styles.stepBar, { backgroundColor: i <= step ? COLORS.gold : COLORS.dark3 }]} />
              <Text style={[styles.stepLabel, { color: i <= step ? COLORS.gold : COLORS.muted }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STEP 0: Event Details ── */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Event Details</Text>
            <ErrorBar message={error} onDismiss={() => setError('')} />

            {services.length > 1 && (
              <>
                <Text style={styles.fieldLabel}>Package</Text>
                <View style={styles.pkgRow}>
                  {services.map((s, i) => (
                    <TouchableOpacity key={s.id} onPress={() => setSelSvc(i)}
                      style={[styles.pkgChip, selSvc === i && styles.pkgChipActive]}>
                      <Text style={[styles.pkgChipName, selSvc === i && { color: COLORS.gold }]} numberOfLines={1}>{s.name}</Text>
                      <Text style={[styles.pkgChipPrice, selSvc === i && { color: COLORS.gold }]}>
                        AED {parseFloat(s.price).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>Event Date</Text>
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.muted} style={styles.input} />

            {isPerGuest && (
              <>
                <Text style={styles.fieldLabel}>Number of Guests</Text>
                <TextInput value={guests} onChangeText={setGuests} keyboardType="number-pad"
                  placeholder="e.g. 200" placeholderTextColor={COLORS.muted} style={styles.input} />
              </>
            )}

            <Text style={styles.fieldLabel}>Special Requests</Text>
            <TextInput value={notes} onChangeText={setNotes}
              placeholder="Any notes for the vendor…" placeholderTextColor={COLORS.muted}
              multiline numberOfLines={3} style={[styles.input, styles.textArea]} />

            <GoldDivider />

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Price Summary</Text>
              {[
                [svc.name,              `AED ${subtotal.toLocaleString()}`],
                ['Platform Fee (5%)',   `AED ${fee.toLocaleString()}`],
                ['Deposit Due (30%)',   `AED ${deposit.toLocaleString()}`],
              ].map(([l, v]) => (
                <View key={l} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{l}</Text>
                  <Text style={[styles.summaryVal, l.includes('Deposit') && { color: COLORS.gold }]}>{v}</Text>
                </View>
              ))}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: COLORS.cream }]}>Total</Text>
                <Text style={[styles.summaryVal, { color: COLORS.gold, fontWeight: '700', fontSize: FONT_SIZE.lg }]}>
                  AED {total.toLocaleString()}
                </Text>
              </View>
            </View>

            <GoldButton
              label={loading ? 'Reserving…' : 'Continue to Payment'}
              onPress={handleContinueToPayment}
              loading={loading}
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        )}

        {/* ── STEP 1: Payment ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Secure Payment</Text>
            <ErrorBar message={error} onDismiss={() => setError('')} />

            {/* Pay deposit vs full */}
            <Text style={styles.fieldLabel}>Payment Option</Text>
            <View style={styles.payRow}>
              {[
                { k: 'deposit', label: 'Pay Deposit',  sub: '30% now to confirm', amount: `AED ${deposit.toLocaleString()}` },
                { k: 'full',    label: 'Pay in Full',   sub: 'Pay entire amount',  amount: `AED ${total.toLocaleString()}` },
              ].map(o => (
                <TouchableOpacity key={o.k} onPress={() => setPayType(o.k)}
                  style={[styles.payOption, payType === o.k && styles.payOptionActive]}>
                  <Text style={[styles.payOptionLabel, payType === o.k && { color: COLORS.gold }]}>{o.label}</Text>
                  <Text style={styles.payOptionSub}>{o.sub}</Text>
                  <Text style={[styles.payOptionAmt, payType === o.k && { color: COLORS.gold }]}>{o.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Booking reference */}
            {booking && (
              <View style={styles.bookingRefBox}>
                <Text style={styles.bookingRefLabel}>Booking Reference</Text>
                <Text style={styles.bookingRefVal}>{booking.booking_ref}</Text>
              </View>
            )}

            {/* Trust signals */}
            <View style={styles.secureBox}>
              <Text style={{ fontSize: 18 }}>🔒</Text>
              <Text style={styles.secureText}>Secured by Stripe · 256-bit SSL · PCI DSS Level 1</Text>
            </View>

            <View style={styles.methodsRow}>
              {['💳 Visa', '💳 Mastercard', '💳 Amex', '🍎 Apple Pay', '🔵 Google Pay'].map(c => (
                <View key={c} style={styles.methodBadge}>
                  <Text style={styles.methodText}>{c}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.stripeNote}>
              Tapping "Pay" opens Stripe's secure payment sheet. Your card details are never stored on our servers.
            </Text>

            <GoldButton
              label={loading ? 'Opening payment…' : `Pay AED ${amountDue.toLocaleString()}`}
              onPress={handlePay}
              loading={loading}
              style={{ marginTop: SPACING.xl }}
            />

            <TouchableOpacity onPress={() => setStep(0)} style={{ marginTop: SPACING.lg, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted }}>← Back to details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: Confirmation ── */}
        {step === 2 && booking && (
          <View style={styles.confirmWrap}>
            <Text style={styles.confirmEmoji}>✨</Text>
            <Text style={styles.confirmTitle}>Booking Submitted!</Text>
            <Text style={styles.confirmBody}>
              Your request has been sent to the vendor.{'\n'}They'll confirm within 24 hours.
            </Text>

            <View style={styles.confirmCard}>
              {[
                ['Booking Ref',  booking.booking_ref],
                ['Package',      svc.name],
                ['Event Date',   date],
                ['Guests',       guests],
                ['Amount Paid',  `AED ${(amountPaid || amountDue).toLocaleString()}`],
                ['Status',       'Pending Confirmation'],
              ].map(([l, v]) => (
                <View key={l} style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>{l}</Text>
                  <Text style={[styles.confirmVal, l === 'Status' && { color: COLORS.gold }]}>{v}</Text>
                </View>
              ))}
            </View>

            <GoldButton
              label="View My Bookings"
              onPress={() => {
                navigation.navigate('Tabs', { screen: 'Bookings' });
                Toast.show({ type: 'success', text1: `Booking ${booking.booking_ref} submitted!` });
              }}
              style={{ width: '100%', marginBottom: SPACING.md }}
            />
            <GoldButton
              outline
              label="Back to Home"
              onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
              style={{ width: '100%' }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:         { backgroundColor: COLORS.dark, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}12` },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  backArrow:      { fontSize: 24, color: COLORS.gold },
  headerTitle:    { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream },
  stepRow:        { flexDirection: 'row', gap: 8 },
  stepBar:        { height: 3, width: '100%', borderRadius: 2, marginBottom: 4 },
  stepLabel:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, textAlign: 'center' },
  scroll:         { padding: SPACING.xl, paddingBottom: 60 },
  stepTitle:      { fontFamily: FONTS.display, fontSize: 24, color: COLORS.cream, marginBottom: SPACING.xl },
  fieldLabel:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: SPACING.md },
  input:          { backgroundColor: `${COLORS.white}04`, borderWidth: 1, borderColor: `${COLORS.gold}22`, borderRadius: RADIUS.md, color: COLORS.cream, fontFamily: FONTS.body, fontSize: FONT_SIZE.md, padding: SPACING.md },
  textArea:       { minHeight: 80, textAlignVertical: 'top' },
  pkgRow:         { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  pkgChip:        { flex: 1, padding: SPACING.md, backgroundColor: COLORS.dark3, borderWidth: 1, borderColor: `${COLORS.gold}20`, borderRadius: RADIUS.md, alignItems: 'center' },
  pkgChipActive:  { borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}14` },
  pkgChipName:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.muted },
  pkgChipPrice:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.cream, marginTop: 3 },
  summaryBox:     { backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}18`, borderRadius: RADIUS.lg, padding: SPACING.lg },
  summaryTitle:   { fontFamily: FONTS.display, fontSize: FONT_SIZE.lg, color: COLORS.cream, marginBottom: SPACING.md },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  summaryVal:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.cream },
  summaryDivider: { height: 1, backgroundColor: `${COLORS.gold}18`, marginVertical: 8 },
  payRow:         { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  payOption:      { flex: 1, padding: SPACING.md, backgroundColor: COLORS.dark3, borderWidth: 1, borderColor: `${COLORS.gold}20`, borderRadius: RADIUS.md, alignItems: 'center', gap: 3 },
  payOptionActive:{ borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}14` },
  payOptionLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.muted },
  payOptionSub:   { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, textAlign: 'center' },
  payOptionAmt:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.cream, marginTop: 2 },
  bookingRefBox:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${COLORS.gold}10`, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  bookingRefLabel:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  bookingRefVal:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.gold },
  secureBox:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: `${COLORS.gold}10`, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.lg },
  secureText:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, flex: 1 },
  methodsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.md },
  methodBadge:    { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.dark3, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: `${COLORS.gold}15` },
  methodText:     { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted },
  stripeNote:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: `${COLORS.muted}80`, textAlign: 'center', lineHeight: 18, marginTop: SPACING.md },
  confirmWrap:    { alignItems: 'center', paddingTop: SPACING.xxl },
  confirmEmoji:   { fontSize: 72, marginBottom: SPACING.lg },
  confirmTitle:   { fontFamily: FONTS.display, fontSize: 30, color: COLORS.cream, textAlign: 'center', marginBottom: SPACING.md },
  confirmBody:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl },
  confirmCard:    { width: '100%', backgroundColor: COLORS.dark2, borderWidth: 1, borderColor: `${COLORS.gold}18`, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  confirmRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}08` },
  confirmLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  confirmVal:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.cream, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
});
