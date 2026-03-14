import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';

export default function RecipeCard({ recipe, onPress, onToggleSelect, selected }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={16} color={palette.primaryDark} />
            <Text style={styles.metaText}>{recipe.cookTimeMinutes}m</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="wallet-outline" size={16} color={palette.primaryDark} />
            <Text style={styles.metaText}>₹{recipe.estimatedCost}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="flame-outline" size={16} color={palette.primaryDark} />
            <Text style={styles.metaText}>{recipe.calories} kcal</Text>
          </View>
        </View>
        {typeof recipe.ingredientMatchPercent === 'number' ? (
          <Text style={styles.match}>{recipe.ingredientMatchPercent}% Ingredient Match</Text>
        ) : null}
        {onToggleSelect ? (
          <TouchableOpacity style={[styles.selectBtn, selected && styles.selectBtnSelected]} onPress={() => onToggleSelect(recipe.id)}>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'cart-outline'}
              size={18}
              color="#fff"
              style={styles.selectIcon}
            />
            <Text style={styles.selectText}>{selected ? 'In Plan' : 'Add to Plan'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderColor: palette.border,
    borderWidth: 1,
  },
  image: { width: '100%', height: 160 },
  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: palette.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
  },
  metaText: { marginLeft: 4, color: palette.primaryDark, fontWeight: '600', fontSize: 12 },
  match: { color: palette.secondary, fontWeight: '700', marginBottom: 8 },
  selectBtn: {
    backgroundColor: palette.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectBtnSelected: { backgroundColor: palette.primaryDark },
  selectIcon: { marginRight: 6 },
  selectText: { color: '#fff', fontWeight: '700' },
});
