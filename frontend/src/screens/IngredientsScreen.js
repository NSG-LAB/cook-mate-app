import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import { palette } from '../theme/colors';
import * as ImagePicker from 'expo-image-picker';

const pantry = ['Onion', 'Egg', 'Rice', 'Tomato', 'Noodles', 'Garlic', 'Soy Sauce', 'Potato', 'Carrot', 'Chickpea', 'Paneer', 'Spinach', 'Yogurt'];

export default function IngredientsScreen({ navigation }) {
  const { ingredients, setIngredients, selectedRecipeIds, setSelectedRecipeIds, purchaseHistory, viewedRecipes } = useApp();
  const [matches, setMatches] = useState([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const sortedPantry = useMemo(() => [...pantry].sort(), []);
  const predictiveSuggestions = useMemo(() => {
    const fromHistory = Object.entries(purchaseHistory || {})
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => String(name).toLowerCase());

    const fromViews = viewedRecipes
      .flatMap((entry) => Array.isArray(entry.ingredients) ? entry.ingredients : [])
      .map((item) => String(item).toLowerCase());

    return [...new Set([...fromHistory, ...fromViews])]
      .filter((item) => item && !ingredients.includes(item))
      .slice(0, 8);
  }, [purchaseHistory, viewedRecipes, ingredients]);

  const toggleIngredient = (item) => {
    const lower = item.toLowerCase();
    setIngredients((prev) => (prev.includes(lower) ? prev.filter((x) => x !== lower) : [...prev, lower]));
  };

  const suggest = async () => {
    if (!ingredients.length) {
      setFormError('Add at least one ingredient to get matches.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/recipes/fridge-match', { ingredients });
      setMatches(data);
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Unable to fetch matches right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customIngredient.trim().toLowerCase();
    if (!trimmed) {
      return;
    }
    if (ingredients.includes(trimmed)) {
      setCustomIngredient('');
      return;
    }
    setIngredients((prev) => [...prev, trimmed]);
    setCustomIngredient('');
  };

  const removeIngredient = (item) => {
    setIngredients((prev) => prev.filter((ing) => ing !== item));
  };

  const runOCRDemo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Media permission is required for OCR upload demo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const uri = String(result.assets[0]?.uri || '').toLowerCase();
    const detected = [...new Set(uri.split(/[^a-z]+/).filter((token) => ['egg', 'eggs', 'tomato', 'onion', 'rice', 'garlic', 'spinach', 'bread', 'milk', 'paneer'].includes(token)))];
    if (!detected.length) {
      setFormError('OCR demo did not find known ingredient keywords in image metadata.');
      return;
    }
    setIngredients((prev) => [...new Set([...prev, ...detected])]);
    setFormError('OCR demo added ingredients: ' + detected.join(', '));
  };

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>What’s in my fridge?</Text>
      <View style={styles.tipCard}>
        <Ionicons name="sparkles-outline" size={18} color={palette.secondary} />
        <Text style={styles.tipText}>Tap ingredients to highlight pantry items. The more you add, the smarter the matches.</Text>
      </View>
      <View style={styles.addRow}>
        <TextInput
          value={customIngredient}
          onChangeText={setCustomIngredient}
          placeholder="Add custom ingredient"
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddCustom}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.addRow}>
        <TouchableOpacity style={styles.ocrBtn} onPress={runOCRDemo}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.ocrBtnText}>OCR Recipe Photo Upload (Demo)</Text>
        </TouchableOpacity>
      </View>
      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      {predictiveSuggestions.length ? (
        <View style={styles.selectedWrap}>
          <Text style={styles.selectedTitle}>Predictive ingredient suggestions</Text>
          <View style={styles.selectedChips}>
            {predictiveSuggestions.map((item) => (
              <TouchableOpacity key={`predict-${item}`} style={styles.predictChip} onPress={() => setIngredients((prev) => [...prev, item])}>
                <Ionicons name="trending-up-outline" size={14} color="#0C4A6E" />
                <Text style={styles.predictChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.chipsWrap}>
        {sortedPantry.map((item) => {
          const active = ingredients.includes(item.toLowerCase());
          return (
            <TouchableOpacity key={item} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleIngredient(item)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {ingredients.length ? (
        <View style={styles.selectedWrap}>
          <Text style={styles.selectedTitle}>Selected ({ingredients.length})</Text>
          <View style={styles.selectedChips}>
            {ingredients.map((item) => (
              <TouchableOpacity key={item} style={styles.selectedChip} onPress={() => removeIngredient(item)}>
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.selectedChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.suggestBtn} onPress={suggest} disabled={isSubmitting}>
        <Ionicons name="restaurant-outline" size={18} color="#fff" />
        <Text style={styles.suggestText}>{isSubmitting ? 'Loading matches...' : 'Suggest Recipes'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      data={matches}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listSpacing}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={<View style={{ height: 32 }} />}
      ListEmptyComponent={<Text style={styles.emptyText}>Add ingredients and tap "Suggest Recipes" to see tailored matches.</Text>}
      renderItem={({ item }) => (
        <RecipeCard
          recipe={item}
          onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
          onToggleSelect={toggleSelected}
          selected={selectedRecipeIds.includes(item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: palette.backgroundAlt },
  listSpacing: { padding: 14 },
  title: { fontSize: 22, fontWeight: '800', color: palette.text, marginBottom: 8 },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE1D6',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  tipText: { marginLeft: 8, flex: 1, color: '#7A4C32' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: palette.primary },
  chipText: { color: palette.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  suggestBtn: {
    backgroundColor: palette.secondary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  suggestText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  emptyText: { textAlign: 'center', color: palette.muted, marginTop: 20, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
  },
  addBtn: {
    backgroundColor: palette.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  ocrBtnText: { color: '#fff', marginLeft: 8, fontWeight: '700' },
  selectedWrap: { marginBottom: 12 },
  selectedTitle: { fontWeight: '700', marginBottom: 6, color: palette.text },
  selectedChips: { flexDirection: 'row', flexWrap: 'wrap' },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChipText: { color: '#fff', marginLeft: 4, textTransform: 'capitalize' },
  predictChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  predictChipText: { color: '#0C4A6E', marginLeft: 4, textTransform: 'capitalize', fontWeight: '700' },
  errorText: { color: '#E74C3C', marginBottom: 8 },
});
