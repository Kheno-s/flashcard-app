import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';

import { useRepo } from '@/src/storage/useRepo';
import { parseTsvToDeck } from '@/src/services/importTsv';

export default function ImportScreen() {
  const { repo, error } = useRepo();

  const [deckName, setDeckName] = useState('BGB');
  const [tsv, setTsv] = useState('');
  const [status, setStatus] = useState<string>('');

  const placeholder = useMemo(
    () =>
      'Front\tBack\tTags\n' +
      'Was ist ein Anspruch? (§ 194 I BGB)\tDas Recht, von einem anderen ein Tun, Dulden oder Unterlassen zu verlangen.\tbgb grundbegriffe\n',
    []
  );

  async function onImport() {
    setStatus('');
    if (!repo) return;

    const res = parseTsvToDeck(tsv, deckName);
    if (res.cards.length === 0) {
      setStatus('Keine gültigen Karten gefunden. Prüfe das TSV-Format.');
      return;
    }

    await repo.createDeck(res.deck);
    await repo.addCards(res.cards, res.reviewStates);

    const warn = res.warnings.length ? `\nWarnungen: ${res.warnings.length}` : '';
    setStatus(`Importiert: ${res.cards.length} Karten in Deck "${res.deck.name}".${warn}`);
    setTsv('');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Import</Text>

      {error ? (
        <View style={styles.card}>
          <Text style={styles.errorTitle}>DB Fehler</Text>
          <Text>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Deck Name</Text>
        <TextInput value={deckName} onChangeText={setDeckName} style={styles.input} placeholder="z.B. BGB" />

        <Text style={styles.label}>TSV</Text>
        <Text style={styles.muted}>
          Format: Front\tBack\tTags(optional)
        </Text>

        <TextInput
          value={tsv}
          onChangeText={setTsv}
          style={[styles.input, styles.textarea]}
          placeholder={placeholder}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
        />

        <Pressable style={styles.button} onPress={onImport} disabled={!repo}>
          <Text style={styles.buttonText}>Importieren</Text>
        </Pressable>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Text style={styles.mutedSmall}>
          Tipp: Auf Web kannst du auch aus Anki/RemNote exportierte TSV/CSV schnell rein-kopieren.
          {Platform.OS !== 'web' ? ' (Auf iOS: Copy/Paste im Textfeld)' : ''}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  label: { fontWeight: '600' },
  muted: { opacity: 0.7 },
  mutedSmall: { opacity: 0.6, fontSize: 12, marginTop: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#bbb', borderRadius: 10, padding: 10, backgroundColor: '#fafafa' },
  textarea: { minHeight: 220 },
  button: { backgroundColor: '#111827', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  buttonText: { color: 'white', fontWeight: '600' },
  status: { marginTop: 6 },
  errorTitle: { fontWeight: '700', color: '#b91c1c' },
});
