import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { useStripe } from '@stripe/stripe-react-native';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { ScreenHeader, StatusBadge, GoldButton, GoldDivider } from '../../components';
import { LoadingScreen, ErrorState } from '../../components/LoadingStates';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const STATUS_COLORS = {
  confirmed:  '#4CAF50',
  pending:    COLORS.gold,
  cancelled:  '#FF6B6B',
  completed:  '#9B8FA8',
  quote_sent: '#64B5F6',
};

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { cancelBooking, fetchBookings, user } = useApp();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [booking,   setBooking]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,     setError]     = useState('');
  const [paying,    setPaying]    = useState(false);

  const loadBooking = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await api.bookings.get(bookingId);
      setBooking(data.booking);
    } catch (err) {
      setError(err?.message || 'Failed to load booking');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBooking(); }, [bookingId]);

  // ── Pay remaining balance via Stripe PaymentSheet ─────────────────────────
  const handlePayBalance = async () => {
    setPaying(true);
    try {
      const sheetData = await api.payments.createSheet({
        booking_id:   booking.id,
        payment_type: 'balance',
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:        'HoneyMoon Platform',
        customerId:                 sheetData.customerId,
        customerEphemeralKeySecret: sheetData.ephemeralKey,
        paymentIntentClientSecret:  sheetData.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name:  user?.full_name,
          email: user?.email,
        },
        appearance: {
          colors: {
            primary:             '#C6A85C',
            background:          '#1A1028',
            componentBackground: '#251535',
            primaryText:         '#F5ECD7',
            secondaryText:       '#9B8FA8',
          },
        },
      });

      if (initError) {
        Toast.show({ type: 'error', text1: initError.message });
        return;
      }

      setPaying(false);
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Toast.show({ type: 'error', text1: presentError.message });
        }
        return;
      }

      Toast.show({ type: 'success', text1: 'Balance paid! 🎉' });
      await loadBooking();           // refresh booking amounts
      await fetchBookings();         // sync context
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.message || 'Payment failed' });
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      `Cancel your booking with ${booking.vendor_name}? This cannot be undone.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(booking.id, 'Cancelled by user');
              navigation.goBack();
            } catch (err) {
              Toast.show({ type: 'error', text1: err?.message || 'Could not cancel' });
            }
          },
        },
      ]
    );
  };

  if (loading)  return <LoadingScreen message="Loading booking…" />;
  if (error)    return <ErrorState message={error} onRetry={loadBooking} />;
  if (!booking) return null;

  const total     = parseFloat(booking.total_amount)   || 0;
  const paid      = parseFloat(booking.paid_amount)    || 0;
  const remaining = parseFloat(booking.remaining)      || 0;
  const deposit   = parseFloat(booking.deposit_amount) || 0;
  const statusColor = STATUS_COLORS[booking.status] || COLORS.muted;

  const canPay    = booking.status === 'confirmed' && remaining > 0;
  const canCancel = ['pending', 'quote_sent'].includes(booking.status);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="Booking Details" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBooking(true)}
            tintColor={COLORS.gold}
          />
        }
      >

        {/* Status hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>
            {booking.status === 'confirmed' ? '✅' :
             booking.status === 'cancelled' ? '❌' :
             booking.status === 'completed' ? '🏆' : '⏳'}
          </Text>
          <Text style={styles.vendorName}>{booking.vendor_name}</Text>
          <Text style={styles.vendorCategory}>{booking.vendor_category}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <GoldDivider />

        {/* Booking ref + package */}
        <View style={styles.card}>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>BOOKING REF</Text>
            <Text style={styles.refVal}>{booking.booking_ref}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.card, { marginTop: SPACING.md }]}>
          {[
            ['Package',       booking.package_name],
            ['Event Date',    booking.event_date
              ? new Date(booking.event_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'],
            ['Guests',        booking.guest_count?.toString()],
            ['Booked On',     booking.created_at
              ? new Date(booking.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'],
          ].map(([l, v]) => v ? (
            <View key={l} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{l}</Text>
              <Text style={styles.detailVal}>{v}</Text>
            </View>
          ) : null)}
        </View>

        <GoldDivider />

        {/* Payment breakdown */}
        <Text style={styles.sectionTitle}>Payment Breakdown</Text>
        <View style={styles.card}>
          {[
            ['Service Total', total,     COLORS.cream],
            ['Deposit',       deposit,   COLORS.muted],
            ['Amount Paid',   paid,      '#4CAF50'],
            ['Remaining',     remaining, remaining > 0 ? '#FF9800' : '#4CAF50'],
          ].map(([l, v, c]) => (
            <View key={l} style={styles.finRow}>
              <Text style={styles.finLabel}>{l}</Text>
              <Text style={[styles.finVal, { color: c }]}>AED {v.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Payment history */}
        {booking.payments?.length > 0 && (
          <>
            <GoldDivider />
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.card}>
              {booking.payments.map((p, i) => (
                <View key={p.id || i} style={styles.pmtRow}>
                  <View>
                    <Text style={styles.pmtType}>{(p.type || 'payment').replace('_', ' ')}</Text>
                    <Text style={styles.pmtDate}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.pmtAmount}>AED {parseFloat(p.amount).toLocaleString()}</Text>
                    <Text style={[styles.pmtStatus, { color: p.status === 'paid' ? '#4CAF50' : COLORS.muted }]}>
                      {p.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Notes */}
        {booking.notes ? (
          <>
            <GoldDivider />
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <View style={styles.card}>
              <Text style={styles.notes}>{booking.notes}</Text>
            </View>
          </>
        ) : null}

        {/* Vendor notes */}
        {booking.vendor_notes ? (
          <>
            <GoldDivider />
            <Text style={styles.sectionTitle}>Message from Vendor</Text>
            <View style={[styles.card, { borderColor: `${COLORS.gold}30` }]}>
              <Text style={styles.notes}>{booking.vendor_notes}</Text>
            </View>
          </>
        ) : null}

        <GoldDivider />

        {/* Actions */}
        {canPay && (
          <GoldButton
            label={paying ? 'Opening payment…' : `Pay Remaining AED ${remaining.toLocaleString()}`}
            onPress={handlePayBalance}
            loading={paying}
            style={{ marginBottom: SPACING.md }}
          />
        )}
        {canCancel && (
          <GoldButton
            outline
            label="Cancel Booking"
            onPress={handleCancel}
          />
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero:          { alignItems: 'center', paddingVertical: SPACING.lg, gap: 6 },
  heroEmoji:     { fontSize: 52, marginBottom: 4 },
  vendorName:    { fontFamily: FONTS.display, fontSize: 22, color: COLORS.cream, textAlign: 'center' },
  vendorCategory:{ fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  statusPill:    { marginTop: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusText:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1 },
  card:          { backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: `${COLORS.gold}15`, marginBottom: 2 },
  refRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  refLabel:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, letterSpacing: 1 },
  refVal:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.gold },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: `${COLORS.gold}08` },
  detailLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted },
  detailVal:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.cream, maxWidth: '55%', textAlign: 'right' },
  sectionTitle:  { fontFamily: FONTS.display, fontSize: FONT_SIZE.xl, color: COLORS.cream, marginBottom: SPACING.md },
  finRow:        { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: `${COLORS.gold}08` },
  finLabel:      { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted },
  finVal:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700' },
  pmtRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: `${COLORS.gold}08` },
  pmtType:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.cream, textTransform: 'capitalize' },
  pmtDate:       { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  pmtAmount:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.cream },
  pmtStatus:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, marginTop: 2 },
  notes:         { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, color: COLORS.muted, lineHeight: 24, padding: SPACING.lg },
});
