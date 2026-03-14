import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { budget, setBudget, selectedRecipeIds, setSelectedRecipeIds, streak } = useApp();
  const [recipes, setRecipes] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const toggleSelected = (id) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CookMate Student</Text>
      <Text style={styles.streak}>🔥 Cooked {streak} days in a row!</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusCard, styles.cardSpacing]}>
          <Ionicons name="wallet-outline" size={22} color={palette.primaryDark} />
          <Text style={styles.statusValue}>₹{budget}</Text>
          <Text style={styles.statusLabel}>Budget Target</Text>
        </View>
        <View style={styles.statusCard}>
          <Ionicons name="cart-outline" size={22} color={palette.secondary} />
          <Text style={styles.statusValue}>{selectedRecipeIds.length}</Text>
          <Text style={styles.statusLabel}>Recipes in Plan</Text>
        </View>
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

      <Text style={styles.budgetText}>Budget: ₹{budget}</Text>
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

      <TouchableOpacity style={[styles.quickBtn, loading && styles.disabledBtn]} onPress={() => loadRecipes(true)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="flash-outline" size={20} color="#fff" />}
        <Text style={styles.quickBtnText}>{loading ? 'Loading...' : 'Suggest 10-minute recipe'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Fetching recipes...' : error ? 'Try adjusting the filters or pull to refresh.' : 'No recipes found for this filter.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  streak: { color: palette.secondary, marginVertical: 8, fontWeight: '700' },
  statusRow: { flexDirection: 'row', marginBottom: 16 },
  cardSpacing: { marginRight: 12 },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  statusValue: { fontSize: 20, fontWeight: '800', color: palette.text, marginTop: 6 },
  statusLabel: { color: '#777', marginTop: 2 },
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
  budgetText: { color: palette.text, marginBottom: 6, fontWeight: '700' },
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
  errorText: { color: '#E74C3C', marginBottom: 8, textAlign: 'center' },
  emptyText: { color: palette.text, textAlign: 'center', marginTop: 20 },
});
