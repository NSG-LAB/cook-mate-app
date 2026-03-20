import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import { palette } from '../theme/colors';

export default function RecipeSuggestionsScreen({ navigation }) {
  const { budget, ingredients, selectedRecipeIds, setSelectedRecipeIds, cookedRecipeIds } = useApp();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [mode, setMode] = useState('budget');
  const [season, setSeason] = useState('summer');
  const [weather, setWeather] = useState('mild');
  const [occasion, setOccasion] = useState('everyday');
  const [remix, setRemix] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const title = useMemo(() => {
    switch (mode) {
      case 'budget':
        return `Budget suggestions (<= INR ${budget})`;
      case 'fridge':
        return 'Fridge match suggestions';
      case 'cook-again':
        return 'Cook Again suggestions from your history';
      case 'seasonal':
        return `Seasonal suggestions for ${season}`;
      case 'weather':
        return `Weather-based suggestions for ${weather}`;
      case 'occasion':
        return `Occasion suggestions for ${occasion}`;
      case 'remix':
        return 'AI-powered recipe remix from your ingredients';
      default:
        return 'Recipe suggestions';
    }
  }, [mode, budget, season, weather, occasion]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'budget':
        return 'Budget Mode';
      case 'fridge':
        return 'Fridge Mode';
      case 'cook-again':
        return 'Cook Again Mode';
      case 'seasonal':
        return 'Seasonal Mode';
      case 'weather':
        return 'Weather Mode';
      case 'occasion':
        return 'Occasion Mode';
      case 'remix':
        return 'AI Remix Mode';
      default:
        return 'Suggestions';
    }
  }, [mode]);

  const toggleSelected = (id) => {
    setSelectedRecipeIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const loadBudgetSuggestions = async () => {
    setLoading(true);
    setMode('budget');
    setRemix(null);
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
    setRemix(null);
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

  const loadCookAgainSuggestions = async () => {
    if (!cookedRecipeIds.length) {
      setStatusMessage('Cook at least one recipe and tap Mark As Cooked to enable Cook Again.');
      return;
    }

    setLoading(true);
    setMode('cook-again');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.post('/recipes/cook-again', { recipeIds: cookedRecipeIds });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No cook-again recipes found yet.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load cook again suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonalSuggestions = async () => {
    setLoading(true);
    setMode('seasonal');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.get('/recipes/seasonal', { params: { season } });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No seasonal recipes found right now.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load seasonal suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherSuggestions = async () => {
    setLoading(true);
    setMode('weather');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.get('/recipes/weather', { params: { type: weather } });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No weather-based recipes found right now.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load weather suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const loadOccasionSuggestions = async () => {
    setLoading(true);
    setMode('occasion');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.get('/recipes/occasion', { params: { type: occasion } });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No occasion recipes found right now.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load occasion suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const loadRemixSuggestion = async () => {
    if (!ingredients.length) {
      setStatusMessage('Add pantry ingredients first to generate a remix.');
      return;
    }

    setLoading(true);
    setMode('remix');
    setStatusMessage('');
    setRecipes([]);
    try {
      const baseRecipeId = cookedRecipeIds[0] || selectedRecipeIds[0] || null;
      const { data } = await api.post('/recipes/remix', { ingredients, baseRecipeId });
      setRemix(data);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to generate remix right now.');
      setRemix(null);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>Recipe Suggestions</Text>
      <Text style={styles.subtitle}>{title}</Text>
      <View style={styles.modeBadge}>
        <Ionicons
          name={mode === 'budget' ? 'pricetag-outline' : 'restaurant-outline'}
          size={16}
          color={mode === 'budget' ? palette.primaryDark : palette.secondary}
        />
        <Text style={styles.modeText}>{modeLabel}</Text>
      </View>

      <View style={styles.filterRow}>
        {['spring', 'summer', 'monsoon', 'winter'].map((value) => (
          <TouchableOpacity key={value} style={[styles.filterChip, season === value && styles.filterChipActive]} onPress={() => setSeason(value)}>
            <Text style={[styles.filterChipText, season === value && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {['cold', 'hot', 'rainy', 'mild'].map((value) => (
          <TouchableOpacity key={value} style={[styles.filterChip, weather === value && styles.filterChipActive]} onPress={() => setWeather(value)}>
            <Text style={[styles.filterChipText, weather === value && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {['everyday', 'date-night', 'kids-meal', 'meal-prep-sunday'].map((value) => (
          <TouchableOpacity key={value} style={[styles.filterChip, occasion === value && styles.filterChipActive]} onPress={() => setOccasion(value)}>
            <Text style={[styles.filterChipText, occasion === value && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
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

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.tertiaryBtn, loading && styles.disabledBtn]} onPress={loadCookAgainSuggestions} disabled={loading}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Cook Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.quaternaryBtn, loading && styles.disabledBtn]} onPress={loadSeasonalSuggestions} disabled={loading}>
          <Ionicons name="sunny-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Seasonal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.weatherBtn, loading && styles.disabledBtn]} onPress={loadWeatherSuggestions} disabled={loading}>
          <Ionicons name="cloud-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Weather</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.occasionBtn, loading && styles.disabledBtn]} onPress={loadOccasionSuggestions} disabled={loading}>
          <Ionicons name="heart-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Occasion</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.remixBtn, loading && styles.disabledBtn]} onPress={loadRemixSuggestion} disabled={loading}>
          <Ionicons name="sparkles-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>AI Remix</Text>
        </TouchableOpacity>
      </View>

      {remix ? (
        <View style={styles.remixCard}>
          <Text style={styles.remixTitle}>{remix.title}</Text>
          <Text style={styles.remixMeta}>Based on: {remix.baseRecipeTitle}</Text>
          <Text style={styles.remixSummary}>{remix.summary}</Text>
          {Array.isArray(remix.generatedSteps) ? remix.generatedSteps.map((step, index) => (
            <Text key={`${index}-${step}`} style={styles.remixStep}>{index + 1}. {step}</Text>
          )) : null}
        </View>
      ) : null}

      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Loading suggestions...' : statusMessage || 'Tap a button above to fetch recipe suggestions.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.backgroundAlt },
  headerBlock: { padding: 14, paddingBottom: 0 },
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  filterChipActive: { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' },
  filterChipText: { color: '#4B5563', fontWeight: '600', fontSize: 12 },
  filterChipTextActive: { color: '#0369A1' },
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
  tertiaryBtn: { backgroundColor: '#0F766E', marginRight: 10 },
  quaternaryBtn: { backgroundColor: '#2563EB' },
  weatherBtn: { backgroundColor: '#0284C7', marginRight: 10 },
  occasionBtn: { backgroundColor: '#7C3AED' },
  remixBtn: { backgroundColor: '#EA580C' },
  btnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  remixCard: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  remixTitle: { color: '#9A3412', fontWeight: '800', fontSize: 16 },
  remixMeta: { color: '#C2410C', marginTop: 4, marginBottom: 4 },
  remixSummary: { color: '#7C2D12', marginBottom: 6 },
  remixStep: { color: '#7C2D12', marginBottom: 3 },
  listSpacing: { paddingHorizontal: 14, paddingBottom: 60 },
  emptyText: { color: palette.text, marginTop: 20, textAlign: 'center' },
  statusText: { color: palette.text, marginBottom: 10 },
  disabledBtn: { opacity: 0.7 },
});
