import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing } from '../theme';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const GROUPS = [
  {
    id: 'pre',
    label: 'Before you go',
    sub: 'Pre-trip prep · D-7 to D-1',
    accent: false,
    items: [
      { when: '7 days before', time: '8:00 AM', icon: '❤', title: 'Start gentle cardio', body: 'Brisk 20-min walks will help your body pre-adjust to altitude.' },
      { when: '5 days before', time: '9:00 AM', icon: '💧', title: 'Hydrate: 3L today', body: 'Extra water + electrolytes make altitude days easier.' },
      { when: '3 days before', time: '8:00 AM', icon: '☀', title: 'Pack SPF 50 & layers', body: 'UV at your destination is stronger. Bring a fleece for mornings.' },
      { when: '1 day before',  time: '6:00 PM', icon: '💼', title: 'Final pre-trip checklist', body: 'Meds, water bottle, reusable mask. Get a good night of sleep.' },
    ],
  },
  {
    id: 'dday',
    label: 'Travel day',
    sub: 'D-Day · today',
    accent: true,
    items: [
      { when: 'Today', time: '6:30 AM', icon: '✈', title: 'Heading to your destination', body: 'Drink water before the drive. Skip caffeine and alcohol in transit.' },
      { when: 'Today', time: '12:00 PM', icon: '💧', title: 'Mid-journey hydration', body: 'Half a litre now. Watch for dizziness on the climb above 1,500 m.' },
      { when: 'Today', time: '7:00 PM', icon: '🌙', title: 'First night tips', body: 'Take it easy tonight. Light dinner, warm layer, early sleep.' },
    ],
  },
  {
    id: 'post',
    label: 'First days & after',
    sub: 'Post-arrival · D+1 to D+7',
    accent: false,
    items: [
      { when: 'Day 1', time: '8:00 AM', icon: '⛰', title: 'How are you feeling?', body: '30-second check-in: headaches, breathing, sleep. Tap to log.' },
      { when: 'Day 2', time: '8:00 AM', icon: '❤', title: 'Light activity only', body: 'No strenuous hikes yet. A short walk is perfect while you acclimate.' },
      { when: 'Day 3', time: '8:00 AM', icon: '⚡', title: 'You should feel normal by now', body: 'If headaches persist, consider descending 500 m. Otherwise, enjoy.' },
      { when: 'Day 7', time: '8:00 AM', icon: '✦', title: 'Trip reflection', body: 'How did your destination treat you? Your notes help personalize next time.' },
    ],
  },
];

export function NotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg}/>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={{ fontSize: 20, color: Colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerSub}>Your reminders</Text>
        <TouchableOpacity hitSlop={8}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.sub}>Your upcoming trip</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {GROUPS.map(g => (
          <View key={g.id} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.groupDot, { backgroundColor: g.accent ? Colors.coral : Colors.primary }]}/>
                <Text style={styles.groupLabel}>{g.label}</Text>
              </View>
              <Text style={styles.groupCount}>{g.items.length} pings</Text>
            </View>
            <Text style={styles.groupSub}>{g.sub}</Text>

            <View style={[styles.card, g.accent && styles.cardAccent]}>
              {g.items.map((n, i) => (
                <View
                  key={i}
                  style={[
                    styles.notifRow,
                    i < g.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: g.accent ? 'rgba(255,255,255,0.08)' : Colors.line,
                    },
                  ]}
                >
                  <View style={[styles.notifIcon, g.accent && styles.notifIconAccent]}>
                    <Text style={{ fontSize: 14 }}>{n.icon}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={[styles.notifTitle, g.accent && { color: '#F6F3EC' }]}>{n.title}</Text>
                      <Text style={[styles.notifTime, g.accent && { color: 'rgba(255,255,255,0.55)' }]}>{n.time}</Text>
                    </View>
                    <Text style={[styles.notifBody, g.accent && { color: 'rgba(255,255,255,0.72)' }]}>{n.body}</Text>
                    <Text style={[styles.notifWhen, g.accent && { color: 'rgba(255,255,255,0.5)' }]}>{n.when}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 32 }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8,
  },
  headerSub: { fontSize: 12, color: Colors.inkFaint, letterSpacing: 0.5 },
  markAll:   { fontSize: 12, fontWeight: '500', color: Colors.mid },
  title:     { fontSize: 26, fontWeight: '500', color: Colors.ink },
  sub:       { fontSize: 13, color: Colors.inkFaint, marginTop: 4 },
  scroll:    { paddingHorizontal: 20, paddingTop: 8 },

  group:       { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  groupDot:    { width: 8, height: 8, borderRadius: 4 },
  groupLabel:  { fontSize: 16, fontWeight: '500', color: Colors.ink },
  groupCount:  { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '600' },
  groupSub:    { fontSize: 11, color: Colors.inkFaint, marginBottom: 10 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.line, overflow: 'hidden',
  },
  cardAccent: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  notifRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12,
  },
  notifIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.tealSoft, alignItems: 'center', justifyContent: 'center',
  },
  notifIconAccent: { backgroundColor: 'rgba(255,255,255,0.1)' },
  notifTitle: { fontSize: 12, fontWeight: '600', color: Colors.ink, flex: 1 },
  notifTime:  { fontSize: 10, color: Colors.inkFaint, fontFamily: 'monospace', marginTop: 1 },
  notifBody:  { fontSize: 11, color: Colors.inkSoft, marginTop: 3, lineHeight: 16 },
  notifWhen:  { fontSize: 9, color: Colors.inkFaint, marginTop: 6, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '600' },
});
