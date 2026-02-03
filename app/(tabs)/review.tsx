import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useRepo } from '@/src/storage/useRepo';
import type { Rating } from '@/src/domain/types';
import { scheduleNext } from '@/src/services/scheduler';

export default function ReviewScreen() {
  const { repo, error } = useRepo();
  const [queue, setQueue] = useState<Awaited<ReturnType<NonNullable<typeof repo>['getDueCards']>>>([]);
  const [showBack, setShowBack] = useState(false);

  const current = queue[0];

  async function load() {
    if (!repo) return;
    const due = await repo.getDueCards(20);
    setQueue(due);
    setShowBack(false);
  }

  useEffect(() => {
    load();
  }, [repo]);

  const remaining = useMemo(() => queue.length, [queue.length]);

  async function rate(rating: Rating) {
    if (!repo || !current) return;

    const nextState = scheduleNext(current.state, rating);
    await repo.updateReviewState(nextState);

    // pop current
    setQueue((q) => q.slice(1));
    setShowBack(false);
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>DB Fehler</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review</Text>
        <Pressable style={styles.smallButton} onPress={load} disabled={!repo}>
          <Text style={styles.smallButtonText}>Reload</Text>
        </Pressable>
      </View>

      {!current ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Keine fälligen Karten 🎉</Text>
          <Text style={styles.mutedSmall}>Importiere Karten oder komm später wieder.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.mutedSmall}>Noch {remaining} Karten</Text>

          <Pressable style={styles.card} onPress={() => setShowBack((v) => !v)}>
            <Text style={styles.sideLabel}>{showBack ? 'Back' : 'Front'}</Text>
            <Text style={styles.cardText}>{showBack ? current.back : current.front}</Text>
            <Text style={styles.mutedSmall}>Tippen zum Umdrehen</Text>
          </Pressable>

          <View style={styles.row}>
            <RateButton title="Again" onPress={() => rate('again')} disabled={!showBack} />
            <RateButton title="Hard" onPress={() => rate('hard')} disabled={!showBack} />
            <RateButton title="Good" onPress={() => rate('good')} disabled={!showBack} />
            <RateButton title="Easy" onPress={() => rate('easy')} disabled={!showBack} />
          </View>

          {!showBack ? <Text style={styles.mutedSmall}>Erst umdrehen, dann bewerten.</Text> : null}
        </>
      )}
    </View>
  );
}

function RateButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.rateButton, disabled && styles.rateButtonDisabled]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.rateText, disabled && styles.rateTextDisabled]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '600' },
  muted: { opacity: 0.7 },
  mutedSmall: { opacity: 0.6, fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    minHeight: 220,
    justifyContent: 'center',
  },
  sideLabel: { fontSize: 12, opacity: 0.6, textTransform: 'uppercase' },
  cardText: { fontSize: 18, fontWeight: '500' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rateButton: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  rateButtonDisabled: { backgroundColor: '#e5e7eb' },
  rateText: { color: 'white', fontWeight: '600' },
  rateTextDisabled: { color: '#6b7280' },
  smallButton: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  smallButtonText: { color: 'white', fontWeight: '600' },
});
