import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';

export default function RecipeCard({ recipe, onPress, onToggleSelect, selected }) {
  const match = typeof recipe.ingredientMatchPercent === 'number'
    ? `${recipe.ingredientMatchPercent}% pantry match`
    : `${recipe.region || 'Global'} cuisine`;

  return (
    <TouchableOpacity style={[styles.card, selected && styles.cardSelected]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>{match}</Text>
          <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>{(recipe.difficulty || 'easy').toUpperCase()}</Text>
            <View style={styles.timeChip}>
              <Ionicons name="time-outline" size={14} color={palette.primaryDark} />
              <Text style={styles.timeText}>{recipe.totalTimeMinutes || recipe.cookTimeMinutes}m</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="wallet-outline" size={16} color={palette.primaryDark} />
          <Text style={styles.metaLabel}>₹{recipe.estimatedCost}</Text>
          <Text style={styles.metaHint}>budget</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="flame-outline" size={16} color={palette.primaryDark} />
          <Text style={styles.metaLabel}>{recipe.calories} kcal</Text>
          <Text style={styles.metaHint}>energy</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="leaf-outline" size={16} color={palette.primaryDark} />
          <Text style={styles.metaLabel}>{recipe.region || 'Fusion'}</Text>
          <Text style={styles.metaHint}>origin</Text>
        </View>
      </View>

      {onToggleSelect ? (
        <TouchableOpacity
          style={[styles.selectBtn, selected && styles.selectBtnSelected]}
          onPress={() => onToggleSelect(recipe.id)}
        >
          <Ionicons
            name={selected ? 'checkmark-circle' : 'add-circle-outline'}
            size={18}
            color={selected ? '#0f172a' : '#fff'}
            style={styles.selectIcon}
          />
          <Text style={[styles.selectText, selected && styles.selectTextSelected]}>
            {selected ? 'Added to plan' : 'Add to plan'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  cardSelected: { borderColor: palette.primary, shadowOpacity: 0.12 },
  header: { flexDirection: 'row', marginBottom: 14 },
  image: { width: 88, height: 88, borderRadius: 18, marginRight: 12 },
  headerContent: { flex: 1 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11, color: palette.muted, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '800', color: palette.text, marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  badge: {
    backgroundColor: '#FFE5D5',
    color: palette.primaryDark,
    fontWeight: '700',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.backgroundAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeText: { marginLeft: 4, color: palette.primaryDark, fontWeight: '700', fontSize: 12 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  metaItem: { alignItems: 'flex-start', flex: 1, paddingRight: 6 },
  metaLabel: { color: palette.text, fontWeight: '700', marginTop: 6 },
  metaHint: { color: palette.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  selectBtn: {
    backgroundColor: palette.primary,
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectBtnSelected: { backgroundColor: palette.secondary },
  selectIcon: { marginRight: 8 },
  selectText: { color: '#fff', fontWeight: '800', letterSpacing: 0.4 },
  selectTextSelected: { color: '#0f172a' },
});
