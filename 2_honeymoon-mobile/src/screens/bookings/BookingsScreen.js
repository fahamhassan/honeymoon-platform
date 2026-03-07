import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { FilterChip, StatusBadge, GoldButton, EmptyState } from '../../components';
import { LoadingScreen, ErrorState } from '../../components/LoadingStates';
import { useApp } from '../../context/AppContext';

const FILTERS = ['All', 'confirmed', 'pending', 'quote_sent', 'cancelled'];
const FILTER_LABELS = { All: 'All', confirmed: 'Confirmed', pending: 'Pending', quote_sent: 'Quote Sent', cancelled: 'Cancelled' };

export default function BookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { bookings, fetchBookings, cancelBooking } = useApp();
  const [filter,     setFilter]     = useState('All');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      await fetchBookings();
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);

  const handleCancel = (b) => {
    Alert.alert('Cancel Booking', `Cancel your booking with ${b.vendor_name || b.vendorName}?`, [
      { text: 'Keep Booking', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: async () => {
        try { await cancelBooking(b.id); }
        catch (err) { Toast.show({ type: 'error', text1: err?.message || 'Failed to cancel' }); }
      }},
    ]);
  };

  if (loading && !bookings.length) return <LoadingScreen message="Loading bookings…" />;
  if (error && !bookings.length)   return <ErrorState message={error} onRetry={() => load()} />;

  const renderBooking = ({ item: b }) => {
    const vendorName = b.vendor_name || b.vendorName || 'Vendor';
    const status = b.status?.replace('_', ' ') || 'pending';
    return (
      <TouchableOpacity onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })} activeOpacity={0.85} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.vendorRow}>
            <Text style={styles.vendorEmoji}>{b.vendor_logo ? '🏢' : '🌙'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{vendorName}</Text>
              <Text style={styles.vendorMeta}>{b.vendor_category || b.type} · {b.event_date}</Text>
              <Text style={styles.bookingId}>{b.booking_ref}</Text>
            </View>
            <StatusBadge status={b.status === 'quote_sent' ? 'Quote Sent' : b.status?.charAt(0).toUpperCase() + b.status?.slice(1)} />
          </View>
        </View>
        <View style={styles.amountsRow}>
          {[['Total', `AED ${parseFloat(b.total_amount).toLocaleString()}`],['Paid', `AED ${parseFloat(b.paid_amount).toLocaleString()}`],['Remaining', `AED ${parseFloat(b.remaining).toLocaleString()}`]].map(([l, v]) => (
            <View key={l} style={styles.amountCol}>
              <Text style={styles.amountLabel}>{l}</Text>
              <Text style={styles.amountVal}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actionsRow}>
          <GoldButton outline label="Details" onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })} style={styles.actionBtn} small />
          {(b.status === 'pending' || b.status === 'quote_sent') && (
            <TouchableOpacity onPress={() => handleCancel(b)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.statsRow}>
          {[
            { label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length,  color: COLORS.green },
            { label: 'Pending',   count: bookings.filter(b => b.status === 'pending').length,    color: COLORS.gold  },
            { label: 'Total',     count: bookings.length,                                        color: COLORS.teal  },
          ].map(s => (
            <View key={s.label} style={styles.statChip}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        <FlatList data={FILTERS} keyExtractor={f => f} horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: SPACING.xl }}
          renderItem={({ item: f }) => <FilterChip label={FILTER_LABELS[f]} active={filter === f} onPress={() => setFilter(f)} />}
          style={{ marginTop: SPACING.md }}
        />
      </View>

      {filtered.length === 0
        ? <EmptyState emoji="📭" title="No Bookings Yet" body="Start exploring vendors to book your dream wedding." action="Explore Vendors" onAction={() => navigation.navigate('Explore')} />
        : (
          <FlatList
            data={filtered}
            keyExtractor={b => b.id}
            contentContainerStyle={{ padding: SPACING.xl, gap: SPACING.md, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.gold} />}
            renderItem={renderBooking}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { backgroundColor: COLORS.dark, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}12` },
  title:       { fontFamily: FONTS.display, fontSize: 28, color: COLORS.cream, marginBottom: SPACING.md },
  statsRow:    { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statChip:    { flex: 1, backgroundColor: COLORS.dark2, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}12` },
  statNum:     { fontFamily: FONTS.body, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  statLabel:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  card:        { backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: `${COLORS.gold}15`, overflow: 'hidden' },
  cardHeader:  { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}08` },
  vendorRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  vendorEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  vendorName:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.cream },
  vendorMeta:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginTop: 2 },
  bookingId:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: `${COLORS.gold}80`, marginTop: 2 },
  amountsRow:  { flexDirection: 'row', padding: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md },
  amountCol:   { flex: 1, alignItems: 'center' },
  amountLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginBottom: 3 },
  amountVal:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.cream },
  actionsRow:  { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg, paddingTop: 0 },
  actionBtn:   { flex: 1 },
  cancelBtn:   { flex: 1, borderWidth: 1, borderColor: `${COLORS.red}40`, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  cancelText:  { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.red, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
});
