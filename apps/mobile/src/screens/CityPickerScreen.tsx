import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Modal, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CITIES, MONTHS, CityOption } from '../cities';
import { Colors, Radius, Spacing } from '../theme';
import { RouteArc, ElevationChart } from '../components/RouteArc';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'CityPicker'>;

export function CityPickerScreen({ navigation, route }: Props) {
  const p = route.params ?? {};

  const [origin, setOrigin] = useState<CityOption | null>(
    p.prefillOriginId ? (CITIES.find(c => c.id === p.prefillOriginId) ?? null) : null
  );
  const [dest, setDest] = useState<CityOption | null>(
    p.prefillDestId ? (CITIES.find(c => c.id === p.prefillDestId) ?? null) : null
  );
  const [month, setMonth] = useState(p.prefillMonth ?? new Date().getMonth() + 1);
  const [modal, setModal] = useState<'origin' | 'dest' | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() =>
    CITIES.filter(c => c.label.toLowerCase().includes(query.toLowerCase())), [query]);

  const swap = () => { const tmp = origin; setOrigin(dest); setDest(tmp); };
  const selectCity = (city: CityOption) => {
    if (modal === 'origin') setOrigin(city); else setDest(city);
    setModal(null); setQuery('');
  };
  const canContinue = origin && dest && origin.id !== dest.id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary}/>

      {/* Dark header */}
      <View style={styles.darkHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={{ fontSize: 22, color: '#F6F3EC' }}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerSub}>New trip</Text>
        <View style={{ width: 30 }}/>
      </View>
      <Text style={styles.headerTitle}>Where are you going?</Text>

      {/* White card body pulled up */}
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Origin / Dest */}
          <View>
            <TouchableOpacity style={styles.cityField} onPress={() => setModal('origin')} activeOpacity={0.7}>
              <View style={[styles.dot, { backgroundColor: Colors.primary }]}/>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>FROM</Text>
                <Text style={[styles.fieldValue, !origin && styles.placeholder]}>
                  {origin?.name ?? 'Your home city'}
                </Text>
                {origin && <Text style={styles.fieldSub}>{origin.state} · {origin.altitude_m}m</Text>}
              </View>
              <Text style={{ color: Colors.inkFaint, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cityField} onPress={() => setModal('dest')} activeOpacity={0.7}>
              <View style={[styles.dot, { backgroundColor: Colors.coral }]}/>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>TO</Text>
                <Text style={[styles.fieldValue, !dest && styles.placeholder]}>
                  {dest?.name ?? 'Your destination'}
                </Text>
                {dest && <Text style={styles.fieldSub}>{dest.state} · {dest.altitude_m}m</Text>}
              </View>
              <Text style={{ color: Colors.inkFaint, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* Swap button */}
            <TouchableOpacity style={styles.swapBtn} onPress={swap} activeOpacity={0.7}>
              <Text style={{ fontSize: 16, color: Colors.ink }}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* Arc preview */}
          {origin && dest && origin.id !== dest.id && (
            <View style={styles.arcCard}>
              <RouteArc
                origin={{ name: origin.name, alt: origin.altitude_m }}
                dest={{ name: dest.name, alt: dest.altitude_m }}
                height={90}
              />
              <ElevationChart
                originAlt={origin.altitude_m}
                destAlt={dest.altitude_m}
                height={60}
              />
            </View>
          )}

          {/* Month grid */}
          <View style={styles.monthSection}>
            <Text style={styles.sectionLabel}>📅  TRAVEL MONTH</Text>
            <View style={styles.monthGrid}>
              {MONTHS.map((m, i) => {
                const n = i + 1;
                const on = month === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.monthChip, on && styles.monthChipOn]}
                    onPress={() => setMonth(n)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.monthText, on && styles.monthTextOn]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaBtn, !canContinue && { opacity: 0.4 }]}
            onPress={() => {
              if (!canContinue) return;
              navigation.navigate('Questionnaire', {
                originId: origin!.id, originName: origin!.name,
                destId: dest!.id, destName: dest!.name, month,
              });
            }}
            activeOpacity={0.85}
            disabled={!canContinue}
          >
            <Text style={styles.ctaText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* City search modal */}
      <Modal visible={modal !== null} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModal(null); setQuery(''); }} hitSlop={8}>
              <Text style={{ fontSize: 20, color: Colors.ink }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modal === 'origin' ? 'Pick your home' : 'Pick destination'}
            </Text>
            <View style={{ width: 30 }}/>
          </View>
          <View style={styles.searchBox}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities"
              placeholderTextColor={Colors.inkFaint}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={c => c.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityRow} onPress={() => selectCity(item)} activeOpacity={0.7}>
                <View style={styles.cityIdBox}>
                  <Text style={styles.cityId}>{item.id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.citySub}>{item.state} · {item.altitude_m}m</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.line, marginLeft: 72 }}/>}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  darkHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerSub:   { fontSize: 12, letterSpacing: 0.5, color: 'rgba(255,255,255,0.7)' },
  headerTitle: {
    fontSize: 24, fontWeight: '500', color: '#F6F3EC',
    paddingHorizontal: 20, paddingBottom: 32,
  },

  body: {
    flex: 1, marginTop: -20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    backgroundColor: Colors.bg,
  },
  scroll: { padding: 20, paddingBottom: 100 },

  cityField: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.line,
    padding: 14, marginBottom: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  fieldLabel: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 1, textTransform: 'uppercase' },
  fieldValue: { fontSize: 18, color: Colors.ink, fontWeight: '500', marginTop: 2 },
  fieldSub:   { fontSize: 11, color: Colors.inkFaint },
  placeholder: { color: Colors.inkFaint },
  swapBtn: {
    position: 'absolute', right: 18, top: 62,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateY: -17 }],
  },

  arcCard: {
    marginTop: 22, backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.line,
    padding: 12, paddingBottom: 16,
  },

  monthSection: { marginTop: 22 },
  sectionLabel: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600', marginBottom: 10 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthChip: {
    width: '14.5%', height: 38, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  monthChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthText:   { fontSize: 12, fontWeight: '500', color: Colors.inkSoft },
  monthTextOn: { color: '#F6F3EC' },

  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.line, backgroundColor: Colors.bg },
  ctaBtn: {
    height: 52, borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#F6F3EC', letterSpacing: 0.2 },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '500', color: Colors.ink },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.line,
    paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.ink },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  cityIdBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.tealSoft, alignItems: 'center', justifyContent: 'center',
  },
  cityId:   { fontSize: 11, fontWeight: '600', color: Colors.primary, fontFamily: 'monospace' },
  cityName: { fontSize: 16, fontWeight: '500', color: Colors.ink },
  citySub:  { fontSize: 11, color: Colors.inkFaint },
});
