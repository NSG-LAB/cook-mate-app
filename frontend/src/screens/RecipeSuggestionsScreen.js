import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import { palette } from '../theme/colors';
import * as ImagePicker from 'expo-image-picker';

export default function RecipeSuggestionsScreen({ navigation }) {
  const {
    budget,
    ingredients,
    selectedRecipeIds,
    setSelectedRecipeIds,
    cookedRecipeIds,
    viewedRecipes,
    dietaryPreferences,
    toggleDietaryPreference,
  } = useApp();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [mode, setMode] = useState('budget');
  const [season, setSeason] = useState('summer');
  const [weather, setWeather] = useState('mild');
  const [occasion, setOccasion] = useState('everyday');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [excludedAllergens, setExcludedAllergens] = useState([]);
  const [remix, setRemix] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [assistantQuery, setAssistantQuery] = useState('');
  const [predictedIngredients, setPredictedIngredients] = useState([]);
  const [ocrIngredients, setOcrIngredients] = useState([]);

  const title = useMemo(() => {
    switch (mode) {
      case 'budget':
        return `Budget suggestions (<= INR ${budget})`;
      case 'fridge':
        return 'Fridge match suggestions';
      case 'cook-again':
        return 'Cook Again suggestions from your history';
      case 'personalized':
        return 'Personalized picks based on your recent cooking history';
      case 'seasonal':
        return `Seasonal suggestions for ${season}`;
      case 'weather':
        return `Weather-based suggestions for ${weather}`;
      case 'occasion':
        return `Occasion suggestions for ${occasion}`;
      case 'remix':
        return 'AI-powered recipe remix from your ingredients';
      case 'health':
        return 'Goal and dietary filtered suggestions';
      case 'ai-browse':
        return 'AI picks based on your browsing history';
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
      case 'personalized':
        return 'For You Mode';
      case 'seasonal':
        return 'Seasonal Mode';
      case 'weather':
        return 'Weather Mode';
      case 'occasion':
        return 'Occasion Mode';
      case 'remix':
        return 'AI Remix Mode';
      case 'health':
        return 'Health Goal Mode';
      case 'ai-browse':
        return 'AI Browse Mode';
      default:
        return 'Suggestions';
    }
  }, [mode]);

  const toggleFromList = (value, setter) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

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

  const loadPersonalizedSuggestions = async () => {
    setLoading(true);
    setMode('personalized');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.get('/recipes/personalized', { params: { limit: 12 } });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No personalized recommendations yet. Cook a recipe to improve matching.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load personalized suggestions.');
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

  const loadHealthSuggestions = async () => {
    if (!selectedGoals.length && !selectedDietary.length && !excludedAllergens.length) {
      setStatusMessage('Choose at least one goal, diet tag, or excluded allergen first.');
      return;
    }

    setLoading(true);
    setMode('health');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.post('/recipes/health-filter', {
        goals: selectedGoals,
        dietaryTags: [...new Set([...selectedDietary, ...dietaryPreferences])],
        excludedAllergens,
      });
      setRecipes(data);
      setStatusMessage(data.length ? '' : 'No recipes matched this health profile.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to apply health filters.');
    } finally {
      setLoading(false);
    }
  };

  const loadBrowseAIPicks = async () => {
    setLoading(true);
    setMode('ai-browse');
    setRemix(null);
    setStatusMessage('');
    try {
      const { data } = await api.get('/recipes');
      const all = Array.isArray(data) ? data : [];
      if (!viewedRecipes.length) {
        setRecipes(all.slice(0, 10));
        setStatusMessage('Browse a few recipe details to unlock stronger AI recommendations.');
        return;
      }

      const regionScore = viewedRecipes.reduce((acc, item) => {
        const key = (item.region || '').toLowerCase();
        if (key) {
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {});

      const difficultyScore = viewedRecipes.reduce((acc, item) => {
        const key = (item.difficulty || '').toLowerCase();
        if (key) {
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {});

      const scored = all
        .map((recipe) => {
          const region = (recipe.region || '').toLowerCase();
          const difficulty = (recipe.difficulty || '').toLowerCase();
          const dietTags = Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.map((tag) => String(tag).toLowerCase()) : [];
          const dietBoost = dietaryPreferences.some((pref) => dietTags.includes(pref)) ? 1.5 : 0;
          const score = (regionScore[region] || 0) * 2 + (difficultyScore[difficulty] || 0) + dietBoost;
          return { recipe, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((item) => item.recipe);

      setRecipes(scored);
      setStatusMessage(scored.length ? '' : 'No browsing-based recommendations available right now.');
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || 'Unable to load AI browse recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const runVoiceCommand = async () => {
    const command = assistantQuery.trim().toLowerCase();
    if (!command) {
      setStatusMessage('Type a voice-like command first. Example: what can i cook with eggs under 20 minutes');
      return;
    }

    if (command.includes('with') && command.includes('under')) {
      const ingredientSegment = command.split('with')[1]?.split('under')[0] || '';
      const ingredientTerms = ingredientSegment
        .split(/,|and/)
        .map((item) => item.trim())
        .filter(Boolean);
      const maxMinutes = Number(command.match(/under\s+(\d+)/)?.[1] || '15');

      if (ingredientTerms.length) {
        setLoading(true);
        setMode('fridge');
        try {
          const { data } = await api.post('/recipes/fridge-match', { ingredients: ingredientTerms });
          const filtered = (Array.isArray(data) ? data : []).filter(
            (recipe) => Number(recipe.totalTimeMinutes || recipe.cookTimeMinutes || 999) <= maxMinutes
          );
          setRecipes(filtered);
          setStatusMessage(filtered.length ? `Assistant matched ${filtered.length} recipes.` : 'No recipes matched your command.');
        } catch (error) {
          setStatusMessage(error?.response?.data?.message || 'Unable to process assistant command.');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    if (command.includes('personalized')) {
      loadPersonalizedSuggestions();
      return;
    }

    if (command.includes('diet') || command.includes('vegan') || command.includes('keto')) {
      loadHealthSuggestions();
      return;
    }

    setStatusMessage('Command not recognized. Try: what can i cook with eggs under 20 minutes');
  };

  const runOCRDemo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setStatusMessage('Media permission is required for OCR upload demo.');
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
      const tokens = uri.split(/[^a-z]+/).filter((token) => token.length > 2);
      const detected = [...new Set(tokens.filter((token) => ['egg', 'eggs', 'tomato', 'onion', 'rice', 'garlic', 'spinach', 'bread', 'milk', 'paneer'].includes(token)))];
      setOcrIngredients(detected);
      setStatusMessage(detected.length ? `OCR detected: ${detected.join(', ')}` : 'OCR demo could not extract known ingredients from image name/path.');
    } catch {
      setStatusMessage('Unable to process OCR upload demo right now.');
    }
  };

  const buildPredictions = () => {
    const fromViews = viewedRecipes
      .flatMap((entry) => Array.isArray(entry.ingredients) ? entry.ingredients : [])
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .filter((item) => !ingredients.includes(item));

    const ranked = Object.entries(fromViews.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);

    setPredictedIngredients(ranked);
    setStatusMessage(ranked.length ? '' : 'No predictive ingredients yet. Browse and cook more recipes.');
  };

  useEffect(() => {
    loadPersonalizedSuggestions();
  }, []);

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>Recipe Suggestions</Text>
      <Text style={styles.subtitle}>{title}</Text>

      <View style={styles.assistantCard}>
        <Text style={styles.filterTitle}>Voice command support</Text>
        <View style={styles.assistantRow}>
          <TextInput
            value={assistantQuery}
            onChangeText={setAssistantQuery}
            placeholder="Hey app, what can I cook with eggs under 20 minutes?"
            style={styles.assistantInput}
          />
          <TouchableOpacity style={styles.assistantBtn} onPress={runVoiceCommand}>
            <Ionicons name="mic-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
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

      <Text style={styles.filterTitle}>Goal-based filters</Text>
      <View style={styles.filterRow}>
        {['high-protein', 'low-carb', 'weight-loss'].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, selectedGoals.includes(value) && styles.filterChipActive]}
            onPress={() => toggleFromList(value, setSelectedGoals)}
          >
            <Text style={[styles.filterChipText, selectedGoals.includes(value) && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterTitle}>Dietary restrictions</Text>
      <View style={styles.filterRow}>
        {['vegan', 'vegetarian', 'gluten-free', 'keto-friendly'].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, selectedDietary.includes(value) && styles.filterChipActive]}
            onPress={() => toggleFromList(value, setSelectedDietary)}
          >
            <Text style={[styles.filterChipText, selectedDietary.includes(value) && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterTitle}>Exclude allergens</Text>
      <View style={styles.filterRow}>
        {['dairy', 'egg', 'nuts', 'gluten', 'soy'].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, excludedAllergens.includes(value) && styles.filterChipActive]}
            onPress={() => toggleFromList(value, setExcludedAllergens)}
          >
            <Text style={[styles.filterChipText, excludedAllergens.includes(value) && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.personalizedBtn, loading && styles.disabledBtn]} onPress={loadPersonalizedSuggestions} disabled={loading}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.btnText}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.aiBrowseBtn, loading && styles.disabledBtn]} onPress={loadBrowseAIPicks} disabled={loading}>
          <Ionicons name="analytics-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>AI Browse</Text>
        </TouchableOpacity>
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

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.healthBtn, loading && styles.disabledBtn]} onPress={loadHealthSuggestions} disabled={loading}>
          <Ionicons name="fitness-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Health Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.predictBtn, loading && styles.disabledBtn]} onPress={buildPredictions} disabled={loading}>
          <Ionicons name="trending-up-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Predict</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.ocrBtn, loading && styles.disabledBtn]} onPress={runOCRDemo} disabled={loading}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>OCR Upload</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.filterTitle}>Always-on dietary preferences</Text>
      <View style={styles.filterRow}>
        {['vegan', 'vegetarian', 'gluten-free', 'keto-friendly'].map((value) => (
          <TouchableOpacity
            key={`pref-${value}`}
            style={[styles.filterChip, dietaryPreferences.includes(value) && styles.filterChipActive]}
            onPress={() => toggleDietaryPreference(value)}
          >
            <Text style={[styles.filterChipText, dietaryPreferences.includes(value) && styles.filterChipTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {predictedIngredients.length ? (
        <View style={styles.remixCard}>
          <Text style={styles.remixTitle}>Predictive ingredient suggestions</Text>
          <Text style={styles.remixSummary}>{predictedIngredients.join(', ')}</Text>
        </View>
      ) : null}

      {ocrIngredients.length ? (
        <View style={styles.remixCard}>
          <Text style={styles.remixTitle}>OCR extracted ingredients</Text>
          <Text style={styles.remixSummary}>{ocrIngredients.join(', ')}</Text>
        </View>
      ) : null}

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
  filterTitle: { color: '#334155', fontWeight: '700', marginBottom: 6, marginTop: 2 },
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
  personalizedBtn: { backgroundColor: '#BE185D' },
  aiBrowseBtn: { backgroundColor: '#7C3AED', marginLeft: 10 },
  tertiaryBtn: { backgroundColor: '#0F766E', marginRight: 10 },
  quaternaryBtn: { backgroundColor: '#2563EB' },
  weatherBtn: { backgroundColor: '#0284C7', marginRight: 10 },
  occasionBtn: { backgroundColor: '#7C3AED' },
  remixBtn: { backgroundColor: '#EA580C' },
  healthBtn: { backgroundColor: '#0F766E' },
  predictBtn: { backgroundColor: '#0E7490', marginLeft: 10 },
  ocrBtn: { backgroundColor: '#6D28D9' },
  assistantCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 10, marginBottom: 10 },
  assistantRow: { flexDirection: 'row', alignItems: 'center' },
  assistantInput: { flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#fff' },
  assistantBtn: { backgroundColor: '#4338CA', marginLeft: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
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
