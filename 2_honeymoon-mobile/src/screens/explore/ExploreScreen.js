import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZE, SPACING } from '../../theme';
import { SearchBar, FilterChip, EmptyState } from '../../components';
import { SkeletonCard, ErrorState } from '../../components/LoadingStates';
import VendorCard from '../../components/VendorCard';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data';

const ALL_FILTERS = [{ id: 0, key: 'all', label: 'All' }, ...CATEGORIES];

export default function ExploreScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { vendors, loadingVendors, fetchVendors } = useApp();

  const initialCat = route.params?.category || 'all';
  const [search, setSearch]           = useState('');
  const [activeFilter, setActiveFilter] = useState(initialCat);
  const [sortBy, setSortBy]           = useState('rating');
  const [error, setError]             = useState('');

  useEffect(() => {
    loadVendors();
  }, []);

  // Refetch when category filter changes (server-side filter)
  useEffect(() => {
    loadVendors();
  }, [activeFilter, sortBy]);

  const loadVendors = async () => {
    setError('');
    try {
      await fetchVendors({
        category: activeFilter !== 'all' ? activeFilter : undefined,
        sort: sortBy,
      });
    } catch (err) {
      setError(err?.message || 'Failed to load vendors');
    }
  };

  // Client-side search filter on top of what API returned
  const filtered = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      v.business_name?.toLowerCase().includes(q) ||
      v.category?.toLowerCase().includes(q) ||
      v.location?.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.title}>Discover Vendors</Text>
        </View>
        <ErrorState message={error} onRetry={loadVendors} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.title}>Discover Vendors</Text>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search vendors, services, locations…"
          style={{ marginTop: SPACING.md }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.md }} contentContainerStyle={{ gap: 8, paddingRight: SPACING.xl }}>
          {ALL_FILTERS.map(f => (
            <FilterChip key={f.key} label={f.label} active={activeFilter === f.key} onPress={() => setActiveFilter(f.key)} />
          ))}
        </ScrollView>
        <View style={styles.sortRow}>
          <Text style={styles.count}>{filtered.length} vendor{filtered.length !== 1 ? 's' : ''}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {[['rating', '⭐ Rating'], ['price_lo', '↑ Price'], ['price_hi', '↓ Price']].map(([k, l]) => (
              <FilterChip key={k} label={l} active={sortBy === k} onPress={() => setSortBy(k)} />
            ))}
          </ScrollView>
        </View>
      </View>

      {loadingVendors ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={k => k.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: SPACING.md, paddingHorizontal: SPACING.xl }}
          contentContainerStyle={{ paddingTop: SPACING.md, gap: SPACING.md }}
          renderItem={() => <View style={{ flex: 1 }}><SkeletonCard /></View>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="No vendors found" body="Try a different search or category." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={v => v.id}
          numColumns={2}
          columnWrapperStyle={{ gap: SPACING.md, paddingHorizontal: SPACING.xl }}
          contentContainerStyle={{ paddingTop: SPACING.md, paddingBottom: 100, gap: SPACING.md }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <VendorCard
                vendor={{ ...item, name: item.business_name, priceLabel: item.min_price ? `AED ${Number(item.min_price).toLocaleString()}` : 'Price on request', emoji: CATEGORIES.find(c => c.key === item.category)?.emoji || '⭐' }}
                onPress={() => navigation.navigate('VendorDetail', { vendorId: item.id })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:  { backgroundColor: COLORS.dark, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: `${COLORS.gold}12` },
  title:   { fontFamily: FONTS.display, fontSize: 28, color: COLORS.cream },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  count:   { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: COLORS.muted, marginRight: SPACING.md },
});
