import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useRepo } from '@/src/storage/useRepo';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function StatsScreen() {
  const { repo, error } = useRepo();
  const { mode, setMode } = useAppTheme();

  const [stats, setStats] = useState<null | {
    totalCards: number;
    dueCards: number;
    learnedToday: number;
    streakDays: number;
    last7Days: { day: string; count: number }[];
  }>(null);

  async function load() {
    if (!repo) return;
    const s = await repo.getStats(Date.now());
    setStats(s);
  }

  useEffect(() => {
    load();
  }, [repo]);

  const max = useMemo(() => Math.max(1, ...(stats?.last7Days.map((d) => d.count) ?? [1])), [stats]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Stats</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Heute gelernt</Text>
        <Text style={styles.big}>{stats?.learnedToday ?? '—'}</Text>
        <Text style={styles.mutedSmall}>Streak: {stats?.streakDays ?? '—'} Tage</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Überblick</Text>
        <Text>Total Cards: {stats?.totalCards ?? '—'}</Text>
        <Text>Due Cards: {stats?.dueCards ?? '—'}</Text>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={load} disabled={!repo}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Aktualisieren</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Letzte 7 Tage</Text>
        <View style={styles.barRow}>
          {(stats?.last7Days ?? []).map((d) => (
            <View key={d.day} style={styles.barItem}>
              <View style={[styles.bar, { height: 8 + Math.round((64 * d.count) / max) }]} />
              <Text style={styles.barLabel}>{d.day.slice(5)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Theme</Text>
        <Text style={styles.mutedSmall}>Aktuell: {mode}</Text>
        <View style={styles.row}>
          <ModeButton active={mode === 'system'} onPress={() => setMode('system')} label="System" />
          <ModeButton active={mode === 'light'} onPress={() => setMode('light')} label="Light" />
          <ModeButton active={mode === 'dark'} onPress={() => setMode('dark')} label="Dark" />
        </View>
      </View>
    </View>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.modeBtn, active && styles.modeBtnActive]} onPress={onPress}>
      <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  label: { fontWeight: '700' },
  big: { fontSize: 34, fontWeight: '800' },
  mutedSmall: { opacity: 0.6, fontSize: 12 },

  button: { backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#e5e7eb' },
  buttonTextSecondary: { color: '#111827' },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeBtn: { backgroundColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#111827' },
  modeBtnText: { color: '#111827', fontWeight: '700' },
  modeBtnTextActive: { color: 'white' },

  barRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barItem: { alignItems: 'center', gap: 6, flex: 1 },
  bar: { width: 16, backgroundColor: '#111827', borderRadius: 8 },
  barLabel: { fontSize: 10, opacity: 0.6 },
});
