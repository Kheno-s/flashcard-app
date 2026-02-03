import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRepo } from '@/src/storage/useRepo';
import { parseDelimitedToDeck } from '@/src/services/importDelimited';

export default function ImportScreen() {
  const { repo, error } = useRepo();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const [deckName, setDeckName] = useState('BGB');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string>('');

  const placeholder = useMemo(
    () =>
      'TSV: Front\tBack\tTags\n' +
      'Was ist ein Anspruch? (§ 194 I BGB)\tDas Recht, von einem anderen ein Tun, Dulden oder Unterlassen zu verlangen.\tbgb grundbegriffe\n\n' +
      'CSV: Front,Back,Tags\n' +
      'Werkvertrag (§ 631 BGB),Erfolg geschuldet; Unternehmer stellt Werk her, Besteller zahlt Vergütung.,werkvertrag\n',
    []
  );

  async function onImport() {
    setStatus('');
    if (!repo) return;

    const res = parseDelimitedToDeck(text, deckName);
    if (res.cards.length === 0) {
      setStatus('Keine gültigen Karten gefunden. Prüfe TSV/CSV-Format.');
      return;
    }

    await repo.createDeck(res.deck);
    await repo.addCards(res.cards, res.reviewStates);

    const warn = res.warnings.length ? `\nWarnungen: ${res.warnings.length}` : '';
    const fmt = `${res.format.toUpperCase()} (${res.delimiter === '\t' ? 'TAB' : res.delimiter})`;
    setStatus(`Importiert: ${res.cards.length} Karten in Deck "${res.deck.name}". Format: ${fmt}.${warn}`);
    setText('');
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Import</Text>

      {error ? (
        <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
          <Text style={[styles.errorTitle, { color: '#b91c1c' }]}>DB Fehler</Text>
          <Text style={{ color: c.text }}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#0b1220' : '#fff', borderColor: scheme === 'dark' ? '#1f2937' : '#ddd' }]}>
        <Text style={[styles.label, { color: c.text }]}>Deck Name</Text>
        <TextInput
          value={deckName}
          onChangeText={setDeckName}
          style={[styles.input, { color: c.text, backgroundColor: scheme === 'dark' ? '#0f172a' : '#fafafa', borderColor: scheme === 'dark' ? '#334155' : '#bbb' }]}
          placeholder="z.B. BGB"
          placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#6b7280'}
        />

        <Text style={[styles.label, { color: c.text }]}>TSV / CSV</Text>
        <Text style={[styles.muted, { color: c.text }]}>TSV: Front\tBack\tTags(optional) — CSV: Front,Back,Tags(optional) (Komma oder Semikolon)</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          style={[
            styles.input,
            styles.textarea,
            { color: c.text, backgroundColor: scheme === 'dark' ? '#0f172a' : '#fafafa', borderColor: scheme === 'dark' ? '#334155' : '#bbb' },
          ]}
          placeholder={placeholder}
          placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#6b7280'}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
        />

        <Pressable style={styles.button} onPress={onImport} disabled={!repo}>
          <Text style={styles.buttonText}>Importieren</Text>
        </Pressable>

        {status ? <Text style={[styles.status, { color: c.text }]}>{status}</Text> : null}

        <Text style={[styles.mutedSmall, { color: c.text }]}>Tipp: Auf Web kannst du auch aus Anki/RemNote exportierte TSV/CSV schnell rein-kopieren.
          {Platform.OS !== 'web' ? ' (Auf iOS: Copy/Paste im Textfeld)' : ''}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  card: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontWeight: '600' },
  muted: { opacity: 0.7 },
  mutedSmall: { opacity: 0.6, fontSize: 12, marginTop: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 10 },
  textarea: { minHeight: 220 },
  button: { backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  buttonText: { color: 'white', fontWeight: '600' },
  status: { marginTop: 6 },
  errorTitle: { fontWeight: '700' },
});
