import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, View as RNView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function ModalScreen() {
  const { mode, setMode } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <Text style={styles.label}>Theme</Text>
      <RNView style={styles.row}>
        <Chip title="System" active={mode === 'system'} onPress={() => setMode('system')} />
        <Chip title="Light" active={mode === 'light'} onPress={() => setMode('light')} />
        <Chip title="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} />
      </RNView>

      <Text style={styles.muted}>Diese Einstellung wird lokal gespeichert.</Text>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

function Chip({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 8,
    height: 1,
    width: '100%',
  },
  label: { fontWeight: '800' },
  muted: { opacity: 0.7, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { fontSize: 13 },
  chipTextActive: { color: 'white', fontWeight: '700' },
});
