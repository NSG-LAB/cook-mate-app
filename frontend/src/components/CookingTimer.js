import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { palette } from '../theme/colors';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function CookingTimer({ onElapsedChange }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useKeepAwake(running);

  useEffect(() => {
    onElapsedChange?.(seconds);
  }, [seconds, onElapsedChange]);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const toggle = () => {
    setRunning((prev) => !prev);
  };

  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  const boost = (delta) => {
    setSeconds((prev) => Math.max(0, prev + delta));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cooking Timer</Text>
      <Text style={styles.time}>{formatTime(seconds)}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, running && styles.pauseBtn]} onPress={toggle}>
          <Text style={styles.btnText}>{running ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.quickRow}>
        {[300, 600, -60].map((delta) => (
          <TouchableOpacity key={delta} style={styles.quickChip} onPress={() => boost(delta)}>
            <Text style={styles.quickText}>{delta > 0 ? `+${delta / 60}m` : '-1m'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 12,
  },
  label: { fontSize: 16, fontWeight: '700', color: palette.primaryDark },
  time: { fontSize: 36, fontWeight: '800', color: palette.text, marginVertical: 12 },
  actions: { flexDirection: 'row', marginBottom: 12 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: palette.secondary,
    marginRight: 10,
  },
  pauseBtn: { backgroundColor: '#F97316' },
  btnText: { color: '#fff', fontWeight: '700' },
  resetBtn: { backgroundColor: '#E5E7EB', marginRight: 0 },
  resetText: { color: palette.primaryDark, fontWeight: '700' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickChip: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    borderRadius: 999,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickText: { color: '#312E81', fontWeight: '700' },
});
