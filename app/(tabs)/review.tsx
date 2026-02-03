import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRepo } from '@/src/storage/useRepo';
import type { Deck, Rating } from '@/src/domain/types';
import { scheduleNext } from '@/src/services/scheduler';

type DueCard = Awaited<ReturnType<NonNullable<ReturnType<typeof useRepo>['repo']>['getDueCards']>>[number];

export default function ReviewScreen() {
  const { repo, error } = useRepo();
  const params = useLocalSearchParams<{ deckId?: string }>();

  const scheme = useColorScheme();
  const c = Colors[scheme];

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | 'ALL' | null>(params.deckId ?? null);

  const [queue, setQueue] = useState<DueCard[]>([]);
  const [showBack, setShowBack] = useState(false);

  const current = queue[0];

  async function loadDecks() {
    if (!repo) return;
    const ds = await repo.listDecks();
    setDecks(ds);
  }

  async function loadQueue() {
    if (!repo) return;
    const now = Date.now();
    const due = selectedDeckId && selectedDeckId !== 'ALL'
      ? await repo.getDueCardsForDeck(selectedDeckId, 50, now)
      : await repo.getDueCards(50, now);
    setQueue(due);
    setShowBack(false);
  }

  useEffect(() => {
    loadDecks();
  }, [repo]);

  useEffect(() => {
    loadQueue();
  }, [repo, selectedDeckId]);

  const remaining = queue.length;

  const selectedDeckName = useMemo(() => {
    if (!selectedDeckId || selectedDeckId === 'ALL') return 'Alle Decks';
    return decks.find((d) => d.id === selectedDeckId)?.name ?? 'Deck';
  }, [decks, selectedDeckId]);

  async function rate(rating: Rating) {
    if (!repo || !current) return;

    const now = Date.now();
    const nextState = scheduleNext(current.state, rating, now);
    await repo.updateReviewState({ ...nextState, lastReviewedAt: now }, current.deckId, rating);

    // pop current
    setQueue((q) => q.slice(1));
    setShowBack(false);

    // prefetch if running low
    if (queue.length <= 3) {
      const more = selectedDeckId && selectedDeckId !== 'ALL'
        ? await repo.getDueCardsForDeck(selectedDeckId, 50, now)
        : await repo.getDueCards(50, now);
      setQueue((q) => {
        const existing = new Set(q.map((x) => x.id));
        const merged = [...q];
        for (const card of more) {
          if (!existing.has(card.id)) merged.push(card);
        }
        return merged;
      });
    }
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>DB Fehler</Text>
        <Text style={{ color: c.text }}>{error}</Text>
      </View>
    );
  }

  if (!repo) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>Review</Text>
        <Text style={[styles.muted, { color: c.text }]}>DB lädt…</Text>
      </View>
    );
  }

  // Deck picker (simple)
  if (selectedDeckId === null) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>Review</Text>
        <Text style={[styles.muted, { color: c.text }]}>Wähle ein Deck (Subdecks werden automatisch mitgenommen):</Text>

        <FlatList
          data={decks}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.deckPickRow, { borderColor: scheme === 'dark' ? '#334155' : '#ddd' }]}
              onPress={() => setSelectedDeckId(item.id)}>
              <Text style={[styles.deckPickName, { color: c.text }]}>{item.name}</Text>
              <Text style={[styles.deckPickHint, { color: c.text }]}>Review</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={[styles.muted, { color: c.text }]}>Noch keine Decks. Importiere erst Karten.</Text>}
        />

        <Pressable style={styles.button} onPress={() => setSelectedDeckId('ALL')}>
          <Text style={styles.buttonText}>Review All (alle Decks)</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => router.push('/(tabs)/decks')}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Zu Decks</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={[styles.title, { color: c.text }]}>Review</Text>
          <Text style={[styles.mutedSmall, { color: c.text }]}>Deck: {selectedDeckName}</Text>
        </View>
        <Pressable style={styles.smallButton} onPress={loadQueue}>
          <Text style={styles.smallButtonText}>Reload</Text>
        </Pressable>
      </View>

      {!current ? (
        <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
          <Text style={[styles.muted, { color: c.text }]}>Keine fälligen Karten 🎉</Text>
          <Text style={[styles.mutedSmall, { color: c.text }]}>Importiere Karten oder komm später wieder.</Text>
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => setSelectedDeckId(null)}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Deck wechseln</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.mutedSmall, { color: c.text }]}>Noch {remaining} Karten</Text>

          <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
            <Text style={[styles.sideLabel, { color: c.text }]}>Front</Text>
            <Text style={[styles.cardText, { color: c.text }]}>{current.front}</Text>

            {showBack ? (
              <>
                <Text style={[styles.sideLabel, { marginTop: 12, color: c.text }]}>Back</Text>
                <Text style={[styles.cardText, { color: c.text }]}>{current.back}</Text>
              </>
            ) : null}
          </View>

          {!showBack ? (
            <Pressable style={styles.button} onPress={() => setShowBack(true)}>
              <Text style={styles.buttonText}>Antwort zeigen</Text>
            </Pressable>
          ) : (
            <View style={styles.row}>
              {(['again', 'hard', 'good', 'easy'] as Rating[]).map((r) => (
                <RateButton key={r} rating={r} state={current.state} onPress={() => rate(r)} />
              ))}
            </View>
          )}

          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => setSelectedDeckId(null)}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Deck wechseln</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function RateButton({
  rating,
  state,
  onPress,
}: {
  rating: Rating;
  state: DueCard['state'];
  onPress: () => void;
}) {
  const next = useMemo(() => scheduleNext(state, rating, Date.now()), [state, rating]);
  const label = ratingLabel(rating);
  const preview = humanizeDue(next.dueAt);
  return (
    <Pressable style={[styles.rateButton, ratingStyles[rating]]} onPress={onPress}>
      <Text style={styles.rateText}>{label}</Text>
      <Text style={styles.rateSubText}>{preview}</Text>
    </Pressable>
  );
}

function ratingLabel(r: Rating) {
  switch (r) {
    case 'again':
      return 'Again';
    case 'hard':
      return 'Hard';
    case 'good':
      return 'Good';
    case 'easy':
      return 'Easy';
  }
}

function humanizeDue(dueAt: number) {
  const diff = Math.max(0, dueAt - Date.now());
  const mins = Math.round(diff / 60000);
  if (mins <= 1) return 'in <1m';
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

const ratingStyles = StyleSheet.create({
  again: { backgroundColor: '#b91c1c' },
  hard: { backgroundColor: '#b45309' },
  good: { backgroundColor: '#1f2937' },
  easy: { backgroundColor: '#047857' },
});

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '600' },
  muted: { opacity: 0.7 },
  mutedSmall: { opacity: 0.6, fontSize: 12 },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 220,
    justifyContent: 'center',
  },
  sideLabel: { fontSize: 12, opacity: 0.6, textTransform: 'uppercase' },
  cardText: { fontSize: 18, fontWeight: '500' },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rateButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, minWidth: 120 },
  rateText: { color: 'white', fontWeight: '700' },
  rateSubText: { color: 'white', opacity: 0.9, fontSize: 12, marginTop: 2 },

  button: { backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#e5e7eb' },
  buttonTextSecondary: { color: '#111827' },

  smallButton: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  smallButtonText: { color: 'white', fontWeight: '600' },

  deckPickRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckPickName: { fontSize: 16, fontWeight: '600' },
  deckPickHint: { opacity: 0.6 },
});
