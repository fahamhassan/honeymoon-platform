import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING, RADIUS } from '../../theme';
import { ScreenHeader, EmptyState, GoldDivider } from '../../components';
import { LoadingScreen, ErrorState } from '../../components/LoadingStates';
import { api } from '../../services/api';

const STATUS_COLOR = {
  paid:     '#4CAF50',
  pending:  COLORS.gold,
  failed:   '#FF6B6B',
  refunded: '#9B8FA8',
};

const TYPE_LABEL = {
  deposit: 'Deposit',
  full:    'Full Payment',
  balance: 'Balance',
};

const FILTERS = ['All', 'paid', 'pending', 'refunded'];

export default function PaymentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [filter,     setFilter]     = useState('All');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await api.payments.list();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All'
    ? payments
    : payments.filter(p => p.status === filter);

  // Summary stats
  const totalPaid   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalRefund = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + parseFloat(p.amount), 0);
  const pending     = payments.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount), 0);

  if (loading) return <LoadingScreen message="Loading payments…" />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const renderItem = ({ item: p }) => {
    const statusColor = STATUS_COLOR[p.status] || COLORS.muted;
    const typeLabel   = TYPE_LABEL[p.type] || p.type || 'Payment';
    const date        = p.created_at
      ? new Date(p.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: p.booking_id })}
        activeOpacity={0.85}
      >
        {/* Left — icon + info */}
        <View style={[styles.iconWrap, { backgroundColor: `${statusColor}18` }]}>
          <Text style={styles.icon}>
            {p.status === 'paid'     ? '✅' :
             p.status === 'refunded' ? '↩️' :
             p.status === 'failed'   ? '❌' : '⏳'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.vendorName} numberOfLines={1}>{p.counterpart_name}</Text>
          <Text style={styles.bookingRef}>{p.booking_ref} · {typeLabel}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        {/* Right — amount + status */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>AED {parseFloat(p.amount).toLocaleString()}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{p.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <ScreenHeader title="Payments & Invoices" onBack={() => navigation.goBack()} />

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Total Paid',  val: totalPaid,   color: '#4CAF50' },
          { label: 'Pending',     val: pending,      color: COLORS.gold },
          { label: 'Refunded',    val: totalRefund,  color: '#9B8FA8' },
        ].map(s => (
          <View key={s.label} style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: s.color }]}>
              {s.val.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
            <Text style={styles.summaryCurrency}>AED</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && { color: COLORS.gold }]}>
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: SPACING.xl, gap: SPACING.md, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.gold} />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💳"
            title="No Payments"
            body={filter === 'All' ? "Your payment history will appear here." : `No ${filter} payments found.`}
          />
        }
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow:    { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.md, marginBottom: SPACING.md },
  summaryCard:   { flex: 1, backgroundColor: COLORS.dark2, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: `${COLORS.gold}12` },
  summaryVal:    { fontFamily: FONTS.display, fontSize: 20, fontWeight: '700' },
  summaryLabel:  { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, marginTop: 2 },
  summaryCurrency:{ fontFamily: FONTS.body, fontSize: 9, color: `${COLORS.muted}80` },
  filterRow:     { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: 8, marginBottom: SPACING.md },
  filterChip:    { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.dark2, borderRadius: 20, borderWidth: 1, borderColor: `${COLORS.gold}15` },
  filterChipActive: { borderColor: COLORS.gold, backgroundColor: `${COLORS.gold}12` },
  filterText:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, fontWeight: '600' },
  card:          { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.dark2, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: `${COLORS.gold}12` },
  iconWrap:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon:          { fontSize: 20 },
  vendorName:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.cream },
  bookingRef:    { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: COLORS.muted, marginTop: 2 },
  date:          { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: `${COLORS.muted}80`, marginTop: 2 },
  amount:        { fontFamily: FONTS.body, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.cream },
  statusPill:    { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText:    { fontFamily: FONTS.body, fontSize: 10, fontWeight: '700' },
});
