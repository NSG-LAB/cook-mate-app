import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import HomeWidget from '../components/HomeWidget';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/colors';

const formatRelativeCookedAt = (isoDate) => {
  if (!isoDate) {
    return 'Log your first cook';
  }
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString?.('en-US', { month: 'short', day: 'numeric' }) || date.toDateString();
  } catch (err) {
    return 'Recent session';
  }
};

export default function HomeScreen({ navigation }) {
  const { budget, setBudget, selectedRecipeIds, setSelectedRecipeIds, streak } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historySummary, setHistorySummary] = useState(null);
  const [widgetMode, setWidgetMode] = useState('plan');
  const [shuffleCount, setShuffleCount] = useState(0);

  const loadRecipes = async (quickOnly = false) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/recipes/budget', {
        params: { budget, region: region || undefined, quickOnly },
      });
      setRecipes(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load recipes right now.');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes(false);
  }, [budget, region]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await api.get('/cook-log/summary');
        setHistorySummary(data);
      } catch (err) {
        setHistorySummary(null);
      }
    };
    loadSummary();
  }, []);

  const planWidget = useMemo(() => {
    if (!recipes.length) {
      return null;
    }
    const prioritized = selectedRecipeIds.length
      ? recipes.find((recipe) => selectedRecipeIds.includes(recipe.id)) || recipes[0]
      : recipes[0];
    if (!prioritized) {
      return null;
    }
    return {
      recipeId: prioritized.id,
      title: prioritized.title,
      subtitle: `${prioritized.region} • ${prioritized.difficulty}`,
      meta: `${prioritized.totalTimeMinutes} min • ₹${prioritized.estimatedCost}`,
      imageUrl: prioritized.imageUrl,
      tagline: selectedRecipeIds.length ? 'Today\'s plan' : 'Quick pick',
    };
  }, [recipes, selectedRecipeIds]);

  const historyWidget = useMemo(() => {
    if (!historySummary?.recentEntries?.length) {
      return null;
    }
    const entry = historySummary.recentEntries[0];
    return {
      recipeId: entry.recipeId,
      title: entry.recipeTitle,
      subtitle: entry.notes || 'Last logged cook',
      meta: formatRelativeCookedAt(entry.cookedAt),
      imageUrl: entry.recipeImage,
      tagline: 'From your log',
    };
  }, [historySummary]);

  const randomWidget = useMemo(() => {
    if (!recipes.length) {
      return null;
    }
    const index = Math.abs(shuffleCount) % recipes.length;
    const pick = recipes[index];
    return pick
      ? {
          recipeId: pick.id,
          title: pick.title,
          subtitle: `${pick.region} • ${pick.difficulty}`,
          meta: `${pick.totalTimeMinutes} min • ₹${pick.estimatedCost}`,
          imageUrl: pick.imageUrl,
          tagline: 'Kitchen roulette',
        }
      : null;
  }, [recipes, shuffleCount]);

  const activeWidget = useMemo(() => {
    if (widgetMode === 'history') {
      return historyWidget;
    }
    if (widgetMode === 'random') {
      return randomWidget;
    }
    return planWidget;
  }, [widgetMode, planWidget, historyWidget, randomWidget]);

  const handleOpenWidget = () => {
    if (activeWidget?.recipeId) {
      navigation.navigate('RecipeDetail', { id: activeWidget.recipeId });
    }
  };

  const handleShuffleWidget = () => {
    setShuffleCount((prev) => prev + 1);
  };

  const toggleSelected = (id) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const quickActions = useMemo(
    () => [
      {
        key: 'pantry',
        title: 'My Pantry',
        subtitle: 'Update fridge chips',
        icon: 'leaf-outline',
        bg: '#ECFCCB',
        color: '#365314',
        route: 'My Ingredients',
      },
      {
        key: 'history',
        title: 'History',
        subtitle: `${historySummary?.sessionsThisWeek ?? 0} cooks this week`,
        icon: 'time-outline',
        bg: '#E0E7FF',
        color: '#312E81',
        route: 'History',
      },
      {
        key: 'editor',
        title: 'Create',
        subtitle: 'Submit a recipe',
        icon: 'create-outline',
        bg: '#FFE4E6',
        color: '#9F1239',
        route: 'Recipe Editor',
      },
    ],
    [historySummary]
  );

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>CookMate Student</Text>
      <Text style={styles.streak}>🔥 Cooked {historySummary?.streakDays ?? streak} days in a row!</Text>

      <HomeWidget
        data={activeWidget}
        onOpen={handleOpenWidget}
        onShuffle={handleShuffleWidget}
        mode={widgetMode}
        setMode={setWidgetMode}
      />

      <View style={styles.statusRow}>
        <View style={[styles.statusCard, styles.cardSpacing]}>
          <Text style={styles.statusLabel}>Budget Target</Text>
          <Text style={styles.statusValue}>₹{budget}</Text>
        </View>
        <View style={[styles.statusCard, styles.secondaryCard]}>
          <Text style={styles.statusLabel}>Recipes in Plan</Text>
          <Text style={styles.statusValue}>{selectedRecipeIds.length}</Text>
        </View>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.quickCard, { backgroundColor: action.bg }]}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.quickTitle}>{action.title}</Text>
            <Text style={styles.quickSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        {['', 'Indian', 'Japanese', 'Asian'].map((r) => {
          const iconName = r === 'Japanese' ? 'restaurant-outline' : r === 'Asian' ? 'leaf-outline' : r === 'Indian' ? 'flame-outline' : 'earth-outline';
          return (
            <TouchableOpacity key={r || 'all'} style={[styles.chip, region === r && styles.chipActive]} onPress={() => setRegion(r)}>
              <Ionicons name={iconName} size={16} color={region === r ? '#fff' : palette.primaryDark} />
              <Text style={[styles.chipText, region === r && styles.chipTextActive]}>{r || 'All'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.budgetText}>Budget: ₹{budget}</Text>
        <Text style={styles.sliderHint}>drag to tweak suggestions</Text>
      </View>
      <Slider
        minimumValue={500}
        maximumValue={3000}
        step={100}
        minimumTrackTintColor={palette.primary}
        maximumTrackTintColor={palette.border}
        thumbTintColor={palette.accent}
        value={budget}
        onValueChange={setBudget}
      />

      <TouchableOpacity style={[styles.quickBtn, loading && styles.disabledBtn]} onPress={() => loadRecipes(true)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="flash-outline" size={20} color="#fff" />}
        <Text style={styles.quickBtnText}>{loading ? 'Loading...' : 'Suggest 10-minute recipe'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('Recipe Editor')}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createBtnText}>Create Recipe Submission</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
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
          !loading ? (
            <Text style={styles.emptyText}>No recipes found for this filter. Try another region or budget.</Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt },
  listContent: { paddingHorizontal: 14, paddingTop: 14 },
  title: { fontSize: 26, fontWeight: '800', color: palette.text },
  streak: { color: palette.secondary, marginVertical: 8, fontWeight: '700' },
  statusRow: { flexDirection: 'row', marginBottom: 16 },
  cardSpacing: { marginRight: 12 },
  statusCard: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    padding: 16,
  },
  secondaryCard: { backgroundColor: '#FEF3C7' },
  statusValue: { fontSize: 24, fontWeight: '800', color: palette.text, marginTop: 6 },
  statusLabel: { color: palette.muted, fontWeight: '600', letterSpacing: 0.2 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    marginRight: 12,
  },
  quickIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: { fontWeight: '800', color: palette.text, fontSize: 16 },
  quickSubtitle: { color: palette.text, opacity: 0.7, marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: palette.primary },
  chipText: { color: palette.text, marginLeft: 6 },
  chipTextActive: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  budgetText: { color: palette.text, fontWeight: '800', fontSize: 16 },
  sliderHint: { color: palette.muted, fontSize: 12 },
  quickBtn: {
    backgroundColor: palette.secondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  disabledBtn: { opacity: 0.7 },
  createBtn: {
    backgroundColor: '#1D4ED8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  errorText: { color: '#E74C3C', marginBottom: 8, textAlign: 'left' },
  emptyText: { color: palette.muted, textAlign: 'center', marginTop: 24, fontWeight: '600' },
});
