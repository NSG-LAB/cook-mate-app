import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/colors';

const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';

const MODE_LABELS = {
  plan: 'Today',
  history: 'History',
  random: 'Shuffle',
};

export default function HomeWidget({ data, onOpen, onShuffle, mode, setMode }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.modeRow}>
        {['plan', 'history', 'random'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.modeChip, mode === option && styles.modeChipActive]}
            onPress={() => setMode(option)}
            accessibilityRole="button"
            accessibilityLabel={`Widget mode ${MODE_LABELS[option]}`}
          >
            <Text style={[styles.modeText, mode === option && styles.modeTextActive]}>
              {MODE_LABELS[option]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {data ? (
        <ImageBackground
          source={{ uri: data.imageUrl || fallbackImage }}
          style={styles.card}
          imageStyle={styles.cardImage}
        >
          <View style={styles.overlay}>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>{data.tagline}</Text>
              <Text style={styles.modeBadge}>{MODE_LABELS[mode]}</Text>
            </View>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>{data.subtitle}</Text>
            {data.meta ? <Text style={styles.meta}>{data.meta}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={onOpen}>
                <Text style={styles.btnText}>Open Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.secondaryBtn]}
                onPress={onShuffle}
                accessibilityRole="button"
                accessibilityLabel="Shuffle widget recipe"
              >
                <Text style={styles.secondaryText}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Plan a meal to see a widget here.</Text>
          <Text style={styles.emptySubtitle}>Pick recipes or cook once to unlock historical suggestions.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  modeRow: { flexDirection: 'row', marginBottom: 10 },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
    borderRadius: 999,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: palette.card,
  },
  modeChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  modeText: { color: palette.primaryDark, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  modeTextActive: { color: '#fff' },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 210,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardImage: { borderRadius: 24 },
  overlay: { backgroundColor: palette.overlay, padding: 20 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { color: palette.warning, fontWeight: '800', marginBottom: 6, letterSpacing: 0.8, fontSize: 12 },
  modeBadge: {
    color: '#fff',
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4, marginTop: 4 },
  subtitle: { color: '#F5F5F5', marginBottom: 6, fontSize: 14 },
  meta: { color: '#DCE2F7', fontSize: 13, marginBottom: 16 },
  btnRow: { flexDirection: 'row' },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  primaryBtn: { backgroundColor: palette.secondary },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.16)', marginRight: 0 },
  btnText: { color: '#0f172a', fontWeight: '800', letterSpacing: 0.3 },
  secondaryText: { color: '#fff', fontWeight: '700' },
  emptyCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 20,
    padding: 20,
    backgroundColor: palette.card,
  },
  emptyTitle: { fontWeight: '800', color: palette.text, marginBottom: 6, fontSize: 16 },
  emptySubtitle: { color: palette.muted },
});
