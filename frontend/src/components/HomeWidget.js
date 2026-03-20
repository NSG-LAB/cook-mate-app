import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/colors';

const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';

export default function HomeWidget({ data, onOpen, onShuffle, mode, setMode }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.modeRow}>
        {['plan', 'history', 'random'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.modeChip, mode === option && styles.modeChipActive]}
            onPress={() => setMode(option)}
          >
            <Text style={[styles.modeText, mode === option && styles.modeTextActive]}>
              {option === 'plan' ? 'Today' : option === 'history' ? 'History' : 'Shuffle'}
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
            <Text style={styles.tag}>{data.tagline}</Text>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>{data.subtitle}</Text>
            {data.meta ? <Text style={styles.meta}>{data.meta}</Text> : null}
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={onOpen}>
                <Text style={styles.btnText}>Open Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={onShuffle}>
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
    paddingVertical: 8,
    borderRadius: 999,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeChipActive: { backgroundColor: palette.primary },
  modeText: { color: palette.primaryDark, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
    justifyContent: 'flex-end',
  },
  cardImage: { borderRadius: 20 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.45)', padding: 18 },
  tag: { color: '#FDE68A', fontWeight: '700', marginBottom: 6, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#EDEDED', marginBottom: 4 },
  meta: { color: '#CBD5F5', fontSize: 12, marginBottom: 12 },
  btnRow: { flexDirection: 'row' },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    marginRight: 8,
  },
  primaryBtn: { backgroundColor: '#F97316' },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 0 },
  btnText: { color: '#fff', fontWeight: '700' },
  secondaryText: { color: '#fff', fontWeight: '700' },
  emptyCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
  },
  emptyTitle: { fontWeight: '700', color: palette.text, marginBottom: 4 },
  emptySubtitle: { color: '#6B7280' },
});
