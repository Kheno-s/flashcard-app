import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';

import { useRepo } from '@/src/storage/useRepo';
import type { Deck } from '@/src/domain/types';

export default function DecksScreen() {
  const { repo, error } = useRepo();
  const [decks, setDecks] = useState<Deck[]>([]);

  async function refresh() {
    if (!repo) return;
    const ds = await repo.listDecks();
    setDecks(ds);
  }

  useEffect(() => {
    refresh();
  }, [repo]);

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
      <Text style={styles.title}>Decks</Text>

      <FlatList
        data={decks}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <View style={styles.deckRow}>
            <Text style={styles.deckName}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.muted}>
            Noch keine Decks. Geh zu Import und füge welche hinzu.
          </Text>
        }
      />

      <Pressable style={styles.button} onPress={refresh} disabled={!repo}>
        <Text style={styles.buttonText}>Aktualisieren</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  muted: { opacity: 0.7 },
  deckRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  deckName: { fontSize: 16 },
  button: { backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
});
