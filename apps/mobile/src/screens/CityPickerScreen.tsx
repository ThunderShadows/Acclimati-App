/**
 * CityPickerScreen — full screen modal with dark header + white card body.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Modal, SafeAreaView, ScrollView, StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CITIES, MONTHS, CityOption } from '../cities';
import { Colors, Font, Radius, Spacing } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'CityPicker'>;

export function CityPickerScreen({ navigation }: Props) {
  const [origin, setOrigin] = useState<CityOption | null>(null);
  const [dest,   setDest]   = useState<CityOption | null>(null);
  const [month,  setMonth]  = useState<number>(new Date().getMonth() + 1);
  const [modal,  setModal]  = useState<'origin' | 'dest' | null>(null);
  const [query,  setQuery]  = useState('');

  const filtered = useMemo(() =>
    CITIES.filter(c =>
      c.label.toLowerCase().includes(query.toLowerCase())
    ), [query]);

  function swap() {
    setOrigin(dest);
    setDest(origin);
  }

  function selectCity(city: CityOption) {
    if (modal === 'origin') setOrigin(city);
    else                    setDest(city);
    setModal(null);
    setQuery('');
  }

  const canContinue = origin && dest && origin.id !== dest.id;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Dark header ───────────────────────────────────────────────── */}
      <View style={styles.darkHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select route</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── White body card ────────────────────────────────────────────── */}
      <View style={styles.bodyCard}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Route card */}
          <View style={styles.routeCard}>
            {/* Origin */}
            <TouchableOpacity
              style={styles.cityField}
              onPress={() => setModal('origin')}
              activeOpacity={0.7}
            >
              <Text style={styles.fieldLabel}>FROM</Text>
              <Text style={[styles.fieldValue, !origin && styles.placeholder]}>
                {origin?.name ?? 'Select origin city'}
              </Text>
              {origin && <Text style={styles.fieldState}>{origin.state}</Text>}
            </TouchableOpacity>

            {/* Divider + swap */}
            <View style={styles.swapRow}>
              <View style={styles.dividerLine} />
              <TouchableOpacity style={styles.swapBtn} onPress={swap} activeOpacity={0.7}>
                <Text style={styles.swapIcon}>⇅</Text>
              </TouchableOpacity>
              <View style={styles.dividerLine} />
            </View>

            {/* Destination */}
            <TouchableOpacity
              style={styles.cityField}
              onPress={() => setModal('dest')}
              activeOpacity={0.7}
            >
              <Text style={styles.fieldLabel}>TO</Text>
              <Text style={[styles.fieldValue, !dest && styles.placeholder]}>
                {dest?.name ?? 'Select destination city'}
              </Text>
              {dest && <Text style={styles.fieldState}>{dest.state}</Text>}
            </TouchableOpacity>
          </View>

          {/* Month section */}
          <Text style={styles.sectionLabel}>WHEN ARE YOU TRAVELLING?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthRow}
          >
            {MONTHS.map((m, i) => {
              const n = i + 1;
              const selected = month === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.monthChip, selected && styles.monthChipSelected]}
                  onPress={() => setMonth(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.monthText, selected && styles.monthTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
            onPress={() => {
              if (!canContinue) return;
              navigation.navigate('Questionnaire', {
                originId:   origin!.id,
                originName: origin!.name,
                destId:     dest!.id,
                destName:   dest!.name,
                month,
              });
            }}
            activeOpacity={0.85}
            disabled={!canContinue}
          >
            <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
              {canContinue
                ? `Find my plan  →`
                : 'Select both cities to continue'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── City search modal ────────────────────────────────────────────── */}
      <Modal visible={modal !== null} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modal === 'origin' ? 'Origin City' : 'Destination City'}
            </Text>
            <TouchableOpacity onPress={() => { setModal(null); setQuery(''); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or state..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={c => c.id}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityRow}
                onPress={() => selectCity(item)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cityRowName}>{item.name}</Text>
                  <Text style={styles.cityRowState}>{item.state}</Text>
                </View>
                <View style={styles.cityIdBadge}>
                  <Text style={styles.cityRowId}>{item.id}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: Colors.primary,
  },

  // Dark header
  darkHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
  },
  backBtn: {
    minWidth: 64,
  },
  backText: {
    fontSize:   Font.size.md,
    color:      Colors.bright,
    fontWeight: Font.weight.medium,
  },
  headerTitle: {
    fontSize:   Font.size.lg,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
  },

  // White card body
  bodyCard: {
    flex:               1,
    backgroundColor:    Colors.card,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
  },
  scroll: {
    padding:       Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Route card
  routeCard: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cityField:    { paddingVertical: Spacing.sm },
  fieldLabel:   {
    fontSize:    Font.size.xs,
    fontWeight:  Font.weight.bold,
    color:       Colors.mid,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldValue:   {
    fontSize:   Font.size.xl,
    fontWeight: Font.weight.semibold,
    color:      Colors.text,
  },
  fieldState:   { fontSize: Font.size.sm, color: Colors.textMuted, marginTop: 2 },
  placeholder:  { color: Colors.border },

  swapRow:    { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  swapBtn: {
    width:            36,
    height:           36,
    borderRadius:     18,
    backgroundColor:  Colors.card,
    borderWidth:      1.5,
    borderColor:      Colors.border,
    alignItems:       'center',
    justifyContent:   'center',
    marginHorizontal: Spacing.sm,
  },
  swapIcon: {
    fontSize:   16,
    color:      Colors.mid,
    fontWeight: Font.weight.bold,
  },

  // Month chips
  sectionLabel: {
    fontSize:    Font.size.xs,
    fontWeight:  Font.weight.bold,
    color:       Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  monthRow: { paddingBottom: Spacing.lg },
  monthChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.bg,
    marginRight:       Spacing.sm,
  },
  monthChipSelected: { borderColor: Colors.mid, backgroundColor: Colors.mid },
  monthText:         { fontSize: Font.size.sm, fontWeight: Font.weight.medium, color: Colors.textMuted },
  monthTextSelected: { color: Colors.textOnDark },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.mid,
    borderRadius:    Radius.lg,
    height:          56,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Spacing.md,
    shadowColor:     Colors.mid,
    shadowOpacity:   0.35,
    shadowRadius:    10,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       5,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity:   0,
    elevation:       0,
  },
  ctaText: {
    fontSize:   Font.size.md,
    fontWeight: Font.weight.bold,
    color:      Colors.textOnDark,
  },
  ctaTextDisabled: { color: Colors.textMuted },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    padding:          Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:  Colors.card,
  },
  modalTitle: { fontSize: Font.size.lg, fontWeight: Font.weight.bold, color: Colors.text },
  modalClose: { fontSize: Font.size.xl, color: Colors.textMuted, padding: Spacing.xs },

  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.card,
    margin:            Spacing.md,
    borderRadius:      Radius.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchIcon:  { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 48, fontSize: Font.size.md, color: Colors.text },

  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: Spacing.lg },
  cityRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    backgroundColor:   Colors.card,
  },
  cityRowName:  { fontSize: Font.size.md, fontWeight: Font.weight.medium, color: Colors.text },
  cityRowState: { fontSize: Font.size.sm, color: Colors.textMuted, marginTop: 2 },
  cityIdBadge: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
  },
  cityRowId: { fontSize: Font.size.xs, color: Colors.textMuted, fontWeight: Font.weight.bold },
});
