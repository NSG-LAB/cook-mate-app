import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import { palette } from '../theme/colors';

export default function RecipeSuggestionsScreen({ navigation }) {
  const { budget, ingredients, selectedRecipeIds, setSelectedRecipeIds } = useApp();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [mode, setMode] = useState('budget');
  const [statusMessage, setStatusMessage] = useState('');

  const title = useMemo(() => {
    return mode === 'budget' ? `Budget suggestions (<= INR ${budget})` : 'Fridge match suggestions';
  }, [mode, budget]);

  const toggleSelected = (id) => {
    setSelectedRecipeIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const loadBudgetSuggestions = async () => {
    setLoading(true);
    setMode('budget');
    setStatusMessage('');
    try {
      const { data } = await api.get('/recipes/budget', {
        params: { budget, quickOnly: false },
      });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No recipes match this budget yet.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load budget suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const loadFridgeSuggestions = async () => {
    if (!ingredients.length) {
      setStatusMessage('Pick at least one ingredient from My Ingredients.');
      return;
    }

    setLoading(true);
    setMode('fridge');
    setStatusMessage('');
    try {
      const { data } = await api.post('/recipes/fridge-match', { ingredients });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No matches yet. Try adding more pantry items.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load fridge matches.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe Suggestions</Text>
      <Text style={styles.subtitle}>{title}</Text>
      <View style={styles.modeBadge}>
        <Ionicons
          name={mode === 'budget' ? 'pricetag-outline' : 'restaurant-outline'}
          size={16}
          color={mode === 'budget' ? palette.primaryDark : palette.secondary}
        />
        <Text style={styles.modeText}>{mode === 'budget' ? 'Budget Mode' : 'Fridge Mode'}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn, loading && styles.disabledBtn]} onPress={loadBudgetSuggestions} disabled={loading}>
          <Ionicons name="wallet-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>By Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn, loading && styles.disabledBtn]} onPress={loadFridgeSuggestions} disabled={loading}>
          <Ionicons name="leaf-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>By Ingredients</Text>
        </TouchableOpacity>
      </View>

      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listSpacing}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
            onToggleSelect={toggleSelected}
            selected={selectedRecipeIds.includes(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Loading suggestions...' : statusMessage || 'Tap a button above to fetch recipe suggestions.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  subtitle: { marginTop: 6, color: palette.text, marginBottom: 12 },
  modeBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  modeText: { marginLeft: 6, fontWeight: '700', color: '#555' },
  actionsRow: { flexDirection: 'row', marginBottom: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtn: { backgroundColor: palette.primary, marginRight: 10 },
  secondaryBtn: { backgroundColor: palette.secondary },
  btnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  listSpacing: { paddingBottom: 40 },
  emptyText: { color: palette.text, marginTop: 20, textAlign: 'center' },
  statusText: { color: palette.text, marginBottom: 10 },
  disabledBtn: { opacity: 0.7 },
});
