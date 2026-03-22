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
  const { budget, setBudget, selectedRecipeIds, setSelectedRecipeIds, streak, t, addRewardPoints } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [personalizedRecipes, setPersonalizedRecipes] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [error, setError] = useState('');
  const [personalizedError, setPersonalizedError] = useState('');
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

  const loadPersonalizedRecipes = async () => {
    setPersonalizedLoading(true);
    setPersonalizedError('');
    try {
      const { data } = await api.get('/recipes/personalized', { params: { limit: 4 } });
      setPersonalizedRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      setPersonalizedRecipes([]);
      setPersonalizedError(err?.response?.data?.message || 'Unable to load personalized picks right now.');
    } finally {
      setPersonalizedLoading(false);
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
    loadPersonalizedRecipes();
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
    setSelectedRecipeIds((prev) => {
      const alreadyAdded = prev.includes(id);
      if (!alreadyAdded) {
        addRewardPoints(2);
      }
      return alreadyAdded ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const headline = hour < 12 ? 'Plan a bold brunch' : hour < 17 ? 'Lunch rush ready' : 'Night prep, bright flavor';
    const streakDays = historySummary?.streakDays ?? streak;
    return {
      salutation,
      headline,
      subtitle: `🔥 ${streakDays} day streak · ₹${budget} ${t('budgetFocus').toLowerCase()}`,
    };
  }, [historySummary, streak, budget, t]);

  const quickActions = useMemo(
    () => [
      {
        key: 'pantry',
        title: 'Pantry Check',
        subtitle: 'Update ingredients & swaps',
        icon: 'nutrition-outline',
        bg: '#E5FBF5',
        color: '#0F766E',
        bubble: 'rgba(15,118,110,0.12)',
        route: 'My Ingredients',
        cta: 'Manage pantry',
      },
      {
        key: 'history',
        title: 'History Pulse',
        subtitle: `${historySummary?.sessionsThisWeek ?? 0} cooks logged this week`,
        icon: 'time-outline',
        bg: '#E7E9FF',
        color: '#312E81',
        bubble: 'rgba(49,46,129,0.12)',
        route: 'History',
        cta: 'Open timeline',
      },
      {
        key: 'editor',
        title: 'Recipe Lab',
        subtitle: 'Submit tweaks & feedback',
        icon: 'create-outline',
        bg: '#FFE9F0',
        color: '#9F1239',
        bubble: 'rgba(159,18,57,0.12)',
        route: 'Recipe Editor',
        cta: 'Start drafting',
      },
      {
        key: 'grocery',
        title: 'Grocery Run',
        subtitle: 'Smart cart synced to budget',
        icon: 'cart-outline',
        bg: '#FFF4E1',
        color: '#B45309',
        bubble: 'rgba(180,83,9,0.12)',
        route: 'Grocery',
        cta: 'Prep list',
      },
    ],
    [historySummary]
  );

  const regions = ['', 'Indian', 'Japanese', 'Asian'];

  const renderHeader = () => (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{greeting.salutation}</Text>
          <Text style={styles.heroTitle}>{greeting.headline}</Text>
          <Text style={styles.heroSubtitle}>{greeting.subtitle}</Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeLabel}>Streak</Text>
          <Text style={styles.heroBadgeValue}>{historySummary?.streakDays ?? streak} days</Text>
          <Text style={styles.heroBadgeHint}>Keep pans sizzling</Text>
        </View>
      </View>

      <HomeWidget
        data={activeWidget}
        onOpen={handleOpenWidget}
        onShuffle={handleShuffleWidget}
        mode={widgetMode}
        setMode={setWidgetMode}
      />

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{t('budgetFocus')}</Text>
          <Text style={styles.metricValue}>₹{budget}</Text>
          <Text style={styles.metricHint}>Drag slider to re-balance</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardAccent]}>
          <Text style={styles.metricLabel}>{t('recipesInPlan')}</Text>
          <Text style={styles.metricValue}>{selectedRecipeIds.length}</Text>
          <Text style={styles.metricHint}>Pin favorites for the week</Text>
        </View>
      </View>

      <View style={styles.budgetShell}>
        <View style={styles.sliderHeader}>
          <View>
            <Text style={styles.sliderTitle}>Curate by budget</Text>
            <Text style={styles.sliderSubtitle}>Instantly tune suggestions</Text>
          </View>
          <TouchableOpacity
            style={[styles.flashBtn, loading && styles.disabledBtn]}
            onPress={() => loadRecipes(true)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Load quick recipe picks"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="flash-outline" size={18} color="#fff" />
            )}
            <Text style={styles.flashBtnText}>{loading ? 'Loading' : '10-min picks'}</Text>
          </TouchableOpacity>
        </View>
        <Slider
          minimumValue={500}
          maximumValue={3000}
          step={100}
          minimumTrackTintColor={palette.primary}
          maximumTrackTintColor={palette.border}
          thumbTintColor={palette.secondary}
          value={budget}
          onValueChange={setBudget}
        />
        <View style={styles.sliderMarks}>
          {[500, 1500, 3000].map((mark) => (
            <Text key={mark} style={styles.sliderMarkText}>₹{mark}</Text>
          ))}
        </View>
      </View>

      <View style={styles.actionGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionCard, { backgroundColor: action.bg }]}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: action.bubble }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            <Text style={styles.actionCta}>{action.cta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>{t('forYou')}</Text>
          <Text style={styles.sectionTitle}>{t('personalizedPicks')}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={loadPersonalizedRecipes}
          accessibilityRole="button"
          accessibilityLabel="Refresh personalized recipes"
        >
          {personalizedLoading ? (
            <ActivityIndicator size="small" color={palette.primaryDark} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={palette.primaryDark} />
              <Text style={styles.refreshText}>{t('refresh')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {personalizedError ? <Text style={styles.errorText}>{personalizedError}</Text> : null}
      {personalizedRecipes.length ? (
        <View style={styles.personalizedBlock}>
          {personalizedRecipes.map((recipe) => (
            <RecipeCard
              key={`for-you-${recipe.id}`}
              recipe={recipe}
              onPress={() => navigation.navigate('RecipeDetail', { id: recipe.id })}
              onToggleSelect={toggleSelected}
              selected={selectedRecipeIds.includes(recipe.id)}
            />
          ))}
        </View>
      ) : (
        !personalizedLoading ? <Text style={styles.emptyText}>Cook a few recipes to improve your For You feed.</Text> : null
      )}

      <View style={styles.regionRow}>
        {regions.map((r) => {
          const iconName = r === 'Japanese' ? 'restaurant-outline' : r === 'Asian' ? 'leaf-outline' : r === 'Indian' ? 'flame-outline' : 'earth-outline';
          const isActive = region === r;
          return (
            <TouchableOpacity
              key={r || 'all'}
              style={[styles.regionChip, isActive && styles.regionChipActive]}
              onPress={() => setRegion(r)}
            >
              <Ionicons name={iconName} size={16} color={isActive ? '#fff' : palette.primaryDark} />
              <Text style={[styles.regionLabel, isActive && styles.regionLabelActive]}>{r || 'All regions'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Fresh for you</Text>
          <Text style={styles.sectionTitle}>Recommended recipes</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadRecipes(false)}>
          <Ionicons name="refresh" size={16} color={palette.primaryDark} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('Recipe Editor')}>
        <Ionicons name="sparkles-outline" size={18} color="#fff" />
        <Text style={styles.createBtnText}>Share a dorm-friendly recipe</Text>
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
  listContent: { paddingHorizontal: 18, paddingTop: 18 },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCopy: { flex: 1, marginRight: 12 },
  heroEyebrow: { textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: palette.muted, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: palette.text, marginTop: 6 },
  heroSubtitle: { color: palette.muted, marginTop: 6, fontWeight: '600' },
  heroBadge: {
    backgroundColor: palette.backgroundAlt,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    width: 120,
  },
  heroBadgeLabel: { textTransform: 'uppercase', fontSize: 11, fontWeight: '700', color: palette.muted },
  heroBadgeValue: { fontSize: 20, fontWeight: '800', color: palette.primaryDark, marginVertical: 6 },
  heroBadgeHint: { fontSize: 12, fontWeight: '600', color: palette.text, textAlign: 'center' },
  metricRow: { flexDirection: 'row', marginBottom: 18 },
  metricCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    marginRight: 12,
  },
  metricCardAccent: { backgroundColor: '#FFF8F0', marginRight: 0 },
  metricLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: palette.muted, fontWeight: '700' },
  metricValue: { fontSize: 26, fontWeight: '800', color: palette.text, marginVertical: 6 },
  metricHint: { color: palette.muted, fontWeight: '600' },
  budgetShell: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 18,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sliderTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  sliderSubtitle: { color: palette.muted, fontWeight: '600', marginTop: 2 },
  flashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  flashBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  sliderMarks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sliderMarkText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  disabledBtn: { opacity: 0.6 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 18 },
  actionCard: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  actionSubtitle: { color: palette.text, fontWeight: '600', marginTop: 4 },
  actionCta: { color: palette.primaryDark, fontWeight: '700', marginTop: 8, textTransform: 'uppercase', fontSize: 11 },
  personalizedBlock: { marginBottom: 8 },
  regionRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: palette.card,
  },
  regionChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  regionLabel: { marginLeft: 8, color: palette.text, fontWeight: '700' },
  regionLabelActive: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionEyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11, color: palette.muted, fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: palette.text },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshText: { color: palette.primaryDark, fontWeight: '700', marginLeft: 6 },
  createBtn: {
    backgroundColor: palette.secondary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, marginLeft: 6 },
  errorText: { color: '#DC2626', marginTop: 8, fontWeight: '700' },
  emptyText: { color: palette.muted, textAlign: 'center', marginTop: 24, fontWeight: '600' },
});