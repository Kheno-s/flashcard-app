import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, TextInput } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRepo } from '@/src/storage/useRepo';
import type { Deck, DeckId } from '@/src/domain/types';

type Row = { deck: Deck; depth: number; hasChildren: boolean };

export default function DecksScreen() {
  const { repo, error } = useRepo();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const [decks, setDecks] = useState<Deck[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState<DeckId | null>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);

  async function refresh() {
    if (!repo) return;
    const ds = await repo.listDecks();
    setDecks(ds);
    // expand root decks by default
    setExpanded((prev) => {
      if (Object.keys(prev).length) return prev;
      const roots = ds.filter((d) => !d.parentDeckId);
      const next: Record<string, boolean> = {};
      for (const r of roots) next[r.id] = true;
      return next;
    });
  }

  useEffect(() => {
    refresh();
  }, [repo]);

  const rows: Row[] = useMemo(() => buildRows(decks, expanded), [decks, expanded]);

  async function onCreate() {
    if (!repo) return;
    const name = newName.trim();
    if (!name) return;

    await repo.createSubdeck({ name, parentDeckId: newParentId });
    setNewName('');
    setNewParentId(null);
    setShowParentPicker(false);
    await refresh();
  }

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
      <Text style={[styles.title, { color: c.text }]}>Decks</Text>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.deck.id}
        renderItem={({ item }) => (
          <View style={[styles.deckRow, { paddingLeft: 12 + item.depth * 14, borderColor: scheme === 'dark' ? '#333' : '#ccc' }]}>
            {item.hasChildren ? (
              <Pressable
                style={styles.caret}
                onPress={() => setExpanded((e) => ({ ...e, [item.deck.id]: !(e[item.deck.id] ?? false) }))}>
                <Text style={[styles.caretText, { color: c.text }]}>{(expanded[item.deck.id] ?? false) ? '▾' : '▸'}</Text>
              </Pressable>
            ) : (
              <View style={styles.caretPlaceholder} />
            )}
            <Text style={[styles.deckName, { color: c.text }]}>{item.deck.name}</Text>
            <Pressable
              style={[styles.addSubdeckButton, { backgroundColor: scheme === 'dark' ? '#111827' : '#f3f4f6' }]}
              onPress={() => {
                setNewParentId(item.deck.id);
                setShowParentPicker(false);
              }}>
              <Text style={[styles.addSubdeckText, { color: scheme === 'dark' ? '#fff' : '#111827' }]}>+ Subdeck</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.muted, { color: c.text }]}>Noch keine Decks. Geh zu Import und füge welche hinzu.</Text>}
      />

      <View style={[styles.createCard, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
        <Text style={[styles.createTitle, { color: c.text }]}>Neues Deck / Subdeck</Text>

        <TextInput
          value={newName}
          onChangeText={setNewName}
          style={[styles.input, { color: c.text, backgroundColor: scheme === 'dark' ? '#0f172a' : '#fafafa', borderColor: scheme === 'dark' ? '#334155' : '#bbb' }]}
          placeholder="Deck Name"
          placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#6b7280'}
        />

        <Pressable
          style={[styles.parentSelect, { backgroundColor: scheme === 'dark' ? '#0f172a' : '#fafafa', borderColor: scheme === 'dark' ? '#334155' : '#bbb' }]}
          onPress={() => setShowParentPicker((v) => !v)}>
          <Text style={[styles.parentSelectText, { color: c.text }]}>
            Parent: {newParentId ? decks.find((d) => d.id === newParentId)?.name ?? newParentId : '(none)'}
          </Text>
          <Text style={[styles.parentSelectHint, { color: c.text }]}>{showParentPicker ? 'Hide' : 'Choose'}</Text>
        </Pressable>

        {showParentPicker ? (
          <View style={[styles.parentPicker, { borderColor: scheme === 'dark' ? '#334155' : '#ddd' }]}>
            <Pressable
              style={[styles.parentPickerRow, { borderColor: scheme === 'dark' ? '#1f2937' : '#eee' }]}
              onPress={() => {
                setNewParentId(null);
                setShowParentPicker(false);
              }}>
              <Text style={[styles.parentPickerText, { color: c.text }]}>(none / root deck)</Text>
            </Pressable>
            {decks.map((d) => (
              <Pressable
                key={d.id}
                style={[styles.parentPickerRow, { borderColor: scheme === 'dark' ? '#1f2937' : '#eee' }]}
                onPress={() => {
                  setNewParentId(d.id);
                  setShowParentPicker(false);
                }}>
                <Text style={[styles.parentPickerText, { color: c.text }]}>{d.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.createRow}>
          <Pressable style={styles.button} onPress={refresh} disabled={!repo}>
            <Text style={styles.buttonText}>Aktualisieren</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onCreate} disabled={!repo}>
            <Text style={styles.buttonText}>Erstellen</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function buildRows(decks: Deck[], expanded: Record<string, boolean>): Row[] {
  const byParent = new Map<string | null, Deck[]>();
  for (const d of decks) {
    const k = d.parentDeckId ?? null;
    byParent.set(k, [...(byParent.get(k) ?? []), d]);
  }

  // stable sort by name
  for (const [k, arr] of byParent.entries()) {
    byParent.set(
      k,
      arr.slice().sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  function hasChildren(id: DeckId) {
    return (byParent.get(id) ?? []).length > 0;
  }

  const out: Row[] = [];
  function walk(parent: string | null, depth: number) {
    const children = byParent.get(parent) ?? [];
    for (const deck of children) {
      const child = hasChildren(deck.id);
      out.push({ deck, depth, hasChildren: child });
      if (child && (expanded[deck.id] ?? false)) walk(deck.id, depth + 1);
    }
  }

  walk(null, 0);
  return out;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  muted: { opacity: 0.7 },

  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  caret: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caretPlaceholder: { width: 24, height: 24 },
  caretText: { fontSize: 16, opacity: 0.7 },
  deckName: { fontSize: 16, flex: 1 },

  addSubdeckButton: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  addSubdeckText: { fontSize: 12, fontWeight: '700' },

  createCard: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  createTitle: { fontWeight: '800' },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
  },

  parentSelect: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parentSelectText: { fontWeight: '600' },
  parentSelectHint: { opacity: 0.6 },

  parentPicker: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, overflow: 'hidden' },
  parentPickerRow: { padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  parentPickerText: { fontSize: 14 },

  createRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#2563eb' },
  buttonText: { color: 'white', fontWeight: '700' },
});
