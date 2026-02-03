import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRepo } from '@/src/storage/useRepo';

export default function StatsScreen() {
  const { repo, error } = useRepo();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const [stats, setStats] = useState<Awaited<ReturnType<NonNullable<typeof repo>['getStats']>> | null>(null);

  async function load() {
    if (!repo) return;
    const s = await repo.getStats();
    setStats(s);
  }

  useEffect(() => {
    load();
  }, [repo]);

  const maxBar = useMemo(() => {
    const m = Math.max(...(stats?.last7Days?.map((d) => d.count) ?? [0]));
    return m || 1;
  }, [stats]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>DB Fehler</Text>
        <Text style={{ color: c.text }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Stats</Text>
        <Pressable style={styles.smallButton} onPress={load} disabled={!repo}>
          <Text style={styles.smallButtonText}>Reload</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <StatCard label="Learned today" value={stats ? String(stats.learnedToday) : '—'} scheme={scheme} c={c} />
        <StatCard label="Cards due" value={stats ? `${stats.dueCards} / ${stats.totalCards}` : '—'} scheme={scheme} c={c} />
        <StatCard label="Streak" value={stats ? `${stats.streakDays} day(s)` : '—'} scheme={scheme} c={c} />
      </View>

      <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Last 7 days</Text>
        <View style={styles.chart}>
          {(stats?.last7Days ?? []).map((d) => {
            const h = Math.round((d.count / maxBar) * 90);
            return (
              <View key={d.day} style={styles.barCol}>
                <View style={[styles.bar, { height: 8 + h }]} />
                <Text style={[styles.barLabel, { color: c.text }]}>{d.day.slice(5)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {!stats ? <Text style={[styles.muted, { color: c.text }]}>Noch keine Reviews. Starte mit Review.</Text> : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  scheme,
  c,
}: {
  label: string;
  value: string;
  scheme: 'light' | 'dark';
  c: (typeof Colors)['light'];
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
      <Text style={[styles.statLabel, { color: c.text }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '600' },

  grid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { opacity: 0.7, fontSize: 12 },
  statValue: { fontWeight: '800', fontSize: 18 },

  card: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontWeight: '800' },

  chart: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingTop: 6 },
  barCol: { alignItems: 'center', width: 34 },
  bar: { width: 22, borderRadius: 8, backgroundColor: '#2563eb' },
  barLabel: { fontSize: 10, opacity: 0.6, marginTop: 6 },

  muted: { opacity: 0.7 },

  smallButton: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  smallButtonText: { color: 'white', fontWeight: '600' },
});
