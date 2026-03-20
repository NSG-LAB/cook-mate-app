import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { palette } from '../theme/colors';

const BARCODE_MAP = {
  '8901030890123': 'rice',
  '8901063012345': 'noodles',
  '8901200901234': 'milk',
  '8901122334455': 'bread',
  '8909988776655': 'egg',
  '8904433221100': 'tomato',
};

const GROCERY_PAGE_SIZE = 25;

export default function GroceryScreen() {
  const { selectedRecipeIds, budget, spentBudget, setSpentBudget, purchaseHistory, recordPurchasedItem, addPantryItem } = useApp();
  const [items, setItems] = useState([]);
  const [groceryPage, setGroceryPage] = useState(0);
  const [groceryHasNext, setGroceryHasNext] = useState(false);
  const [groceryLoadingMore, setGroceryLoadingMore] = useState(false);
  const [groupedItems, setGroupedItems] = useState({});
  const [barcode, setBarcode] = useState('');
  const [plannedSpend, setPlannedSpend] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState('0');
  const [summary, setSummary] = useState({ totalCalories: 0, recipeCount: 0, avgCalories: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const frequentlyBought = Object.entries(purchaseHistory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  const remainingBudget = Number((budget - spentBudget).toFixed(2));

  const scanBarcode = () => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      setMessage('Enter a barcode number to scan.');
      return;
    }
    const item = BARCODE_MAP[trimmed];
    if (!item) {
      setMessage('Barcode not found in demo map. Try 8901030890123 or 8901063012345.');
      return;
    }

    addPantryItem(item);
    setMessage('Scanned and added to pantry: ' + item);
    setBarcode('');
  };

  const addSpend = () => {
    const amount = Number(purchaseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid amount greater than 0.');
      return;
    }
    setSpentBudget((prev) => Number((prev + amount).toFixed(2)));
    setMessage('Added spend of INR ' + amount + '.');
    setPurchaseAmount('0');
  };

  const reorderItem = (item) => {
    if (!item) {
      return;
    }
    const exists = items.includes(item);
    if (!exists) {
      setItems((prev) => [...prev, item]);
    }
    addPantryItem(item);
    setMessage('Added reorder item: ' + item);
  };

  const markItemBought = (item) => {
    recordPurchasedItem(item, 0);
    setMessage('Marked as frequently bought: ' + item);
  };

  const generate = async () => {
    if (!selectedRecipeIds.length) {
      setMessage('Select at least one recipe from Home or Suggestions.');
      return;
    }

    setLoading(true);
    setMessage('');
    setGroceryPage(0);
    setGroceryHasNext(false);
    try {
      const [groceryRes, groupedRes, nutritionRes, planRes] = await Promise.all([
        api.post('/recipes/grocery-list', { recipeIds: selectedRecipeIds }, { params: { page: 0, size: GROCERY_PAGE_SIZE } }),
        api.post('/recipes/grocery-list-grouped', { recipeIds: selectedRecipeIds }),
        api.post('/recipes/nutrition-summary', { recipeIds: selectedRecipeIds }),
        api.post('/recipes/planned-spend', { recipeIds: selectedRecipeIds }),
      ]);

      const groceryData = groceryRes.data || {};
      const initialItems = Array.isArray(groceryData.items) ? groceryData.items : [];
      setItems(initialItems);
      setGroceryPage((groceryData.page ?? 0) + 1);
      setGroceryHasNext(Boolean(groceryData.hasNext));
      setGroupedItems(groupedRes.data || {});
      setSummary(nutritionRes.data);
      setPlannedSpend(planRes.data?.totalEstimatedCost || 0);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to generate groceries right now.');
      setItems([]);
      setGroceryHasNext(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreItems = async () => {
    if (!groceryHasNext || groceryLoadingMore || !selectedRecipeIds.length) {
      return;
    }
    setGroceryLoadingMore(true);
    setMessage('');
    try {
      const { data } = await api.post(
        '/recipes/grocery-list',
        { recipeIds: selectedRecipeIds },
        { params: { page: groceryPage, size: GROCERY_PAGE_SIZE } }
      );
      const moreItems = Array.isArray(data?.items) ? data.items : [];
      setItems((prev) => [...prev, ...moreItems]);
      setGroceryPage((data?.page ?? groceryPage) + 1);
      setGroceryHasNext(Boolean(data?.hasNext));
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to load more groceries right now.');
    } finally {
      setGroceryLoadingMore(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Grocery List</Text>
      <Text style={styles.info}>Selected recipes: {selectedRecipeIds.length}</Text>

      <View style={styles.scannerCard}>
        <Text style={styles.cardTitle}>Barcode Scanner (Demo)</Text>
        <View style={styles.scanRow}>
          <TextInput
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Enter barcode"
          />
          <TouchableOpacity style={styles.scanBtn} onPress={scanBarcode}>
            <Ionicons name="barcode-outline" size={18} color="#fff" />
            <Text style={styles.scanBtnText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reorderCard}>
        <Text style={styles.cardTitle}>One-Tap Reorder</Text>
        <View style={styles.reorderWrap}>
          {frequentlyBought.length ? frequentlyBought.map((item) => (
            <TouchableOpacity key={item} style={styles.reorderChip} onPress={() => reorderItem(item)}>
              <Text style={styles.reorderChipText}>{item}</Text>
            </TouchableOpacity>
          )) : <Text style={styles.info}>No frequently bought items yet.</Text>}
        </View>
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.disabledBtn]} onPress={generate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh-outline" size={20} color="#fff" />}
        <Text style={styles.buttonText}>{loading ? 'Working...' : 'Generate Grocery + Nutrition'}</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Budget Tracker</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="wallet-outline" size={18} color={palette.secondary} />
          <Text style={styles.summaryText}>Planned budget: INR {budget}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="receipt-outline" size={18} color={palette.secondary} />
          <Text style={styles.summaryText}>Planned spend from selected recipes: INR {plannedSpend}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="cash-outline" size={18} color={palette.secondary} />
          <Text style={styles.summaryText}>Spent so far: INR {spentBudget}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="analytics-outline" size={18} color={remainingBudget >= 0 ? palette.primaryDark : '#E74C3C'} />
          <Text style={[styles.summaryText, remainingBudget < 0 && { color: '#E74C3C' }]}>Remaining: INR {remainingBudget}</Text>
        </View>
        <View style={styles.scanRow}>
          <TextInput
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Add spend amount"
          />
          <TouchableOpacity style={styles.scanBtn} onPress={addSpend}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.scanBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Aisle Grouping</Text>
        {Object.keys(groupedItems).length ? Object.entries(groupedItems).map(([aisle, aisleItems]) => (
          <View key={aisle} style={styles.aisleBlock}>
            <Text style={styles.aisleTitle}>{aisle}</Text>
            <Text style={styles.aisleItemsText}>{Array.isArray(aisleItems) && aisleItems.length ? aisleItems.join(', ') : 'None'}</Text>
          </View>
        )) : <Text style={styles.info}>Generate list to view grouped aisles.</Text>}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listSpacing}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={palette.primaryDark} />
            <Text style={styles.itemText}>{item}</Text>
            <TouchableOpacity style={styles.boughtBtn} onPress={() => markItemBought(item)}>
              <Text style={styles.boughtBtnText}>Bought</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.info}>{loading ? 'Building grocery list...' : 'No grocery items yet.'}</Text>}
        ListFooterComponent={
          groceryHasNext ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreItems} disabled={groceryLoadingMore}>
              {groceryLoadingMore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loadMoreText}>Load more items</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  cardTitle: { fontWeight: '700', color: palette.primaryDark, marginBottom: 8 },
  info: { color: palette.text, marginVertical: 8 },
  scannerCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 12, marginBottom: 10 },
  reorderCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 12, marginBottom: 10 },
  reorderWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  reorderChip: { backgroundColor: '#E0F2FE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  reorderChipText: { color: '#0C4A6E', fontWeight: '700', textTransform: 'capitalize' },
  scanRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  scanBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  scanBtnText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
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
  aisleBlock: { marginBottom: 10 },
  aisleTitle: { color: '#0F172A', fontWeight: '700' },
  aisleItemsText: { color: '#475569', marginTop: 2 },
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
  boughtBtn: { marginLeft: 'auto', backgroundColor: '#0F766E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  boughtBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  loadMoreBtn: { backgroundColor: palette.secondary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  loadMoreText: { color: '#fff', fontWeight: '700' },
  disabledBtn: { opacity: 0.7 },
  message: { color: '#E67E22', marginBottom: 12, textAlign: 'center' },
});
