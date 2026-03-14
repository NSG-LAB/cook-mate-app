import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { palette } from '../theme/colors';

export default function GroceryScreen() {
  const { selectedRecipeIds } = useApp();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalCalories: 0, recipeCount: 0, avgCalories: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const generate = async () => {
    if (!selectedRecipeIds.length) {
      setMessage('Select at least one recipe from Home or Suggestions.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const [groceryRes, nutritionRes] = await Promise.all([
        api.post('/recipes/grocery-list', { recipeIds: selectedRecipeIds }),
        api.post('/recipes/nutrition-summary', { recipeIds: selectedRecipeIds }),
      ]);

      setItems(groceryRes.data.items || []);
      setSummary(nutritionRes.data);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to generate groceries right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Grocery List</Text>
      <Text style={styles.info}>Selected recipes: {selectedRecipeIds.length}</Text>

      <TouchableOpacity style={[styles.button, loading && styles.disabledBtn]} onPress={generate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh-outline" size={20} color="#fff" />}
        <Text style={styles.buttonText}>{loading ? 'Working...' : 'Generate Grocery + Nutrition'}</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Nutrition Tracking</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="flame-outline" size={18} color={palette.secondary} />
          <Text style={styles.summaryText}>Total Calories: {summary.totalCalories}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="layers-outline" size={18} color={palette.secondary} />
          <Text style={styles.summaryText}>Recipes Count: {summary.recipeCount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="speedometer-outline" size={18} color={palette.secondary} />
          <Text style={styles.summaryText}>Avg Calories: {Math.round(summary.avgCalories || 0)}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listSpacing}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={palette.primaryDark} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.info}>{loading ? 'Building grocery list...' : 'No grocery items yet.'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  info: { color: palette.text, marginVertical: 8 },
  button: {
    backgroundColor: palette.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  summaryCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 16, marginBottom: 12 },
  summaryTitle: { fontWeight: '700', color: palette.primaryDark, marginBottom: 10, fontSize: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  summaryText: { color: palette.text, marginLeft: 8 },
  listSpacing: { paddingBottom: 60 },
  itemRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: { color: palette.text, fontSize: 16, marginLeft: 8 },
  disabledBtn: { opacity: 0.7 },
  message: { color: '#E67E22', marginBottom: 12, textAlign: 'center' },
});
