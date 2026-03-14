import React from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/colors';

export default function ProfileScreen() {
  const { user, darkMode, setDarkMode, logout, setStreak, streak, budget, ingredients, selectedRecipeIds } = useApp();

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.title, darkMode && styles.darkText]}>Profile</Text>
      <Text style={[styles.text, darkMode && styles.darkText]}>Name: {user?.name || 'Student'}</Text>
      <Text style={[styles.text, darkMode && styles.darkText]}>Email: {user?.email || '-'}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{budget}</Text>
          <Text style={styles.statLabel}>Budget Target</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ingredients.length}</Text>
          <Text style={styles.statLabel}>Pantry Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{selectedRecipeIds.length}</Text>
          <Text style={styles.statLabel}>Recipes Planned</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={[styles.text, darkMode && styles.darkText]}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.text, darkMode && styles.darkText]}>Cooking Streak</Text>
        <Text style={[styles.streakText, darkMode && styles.darkText]}>{streak} days 🔥</Text>
      </View>

      <TouchableOpacity
        style={styles.orangeBtn}
        onPress={() => Alert.alert('Hydration Reminder', 'Drink water every 2 hours while cooking/studying 💧')}
      >
        <Text style={styles.btnText}>Set Water Reminder</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.greenBtn} onPress={() => setStreak((s) => s + 1)}>
        <Text style={styles.btnText}>Mark Meal Cooked Today</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={() => setStreak(0)}>
        <Text style={styles.resetText}>Reset Streak</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 16 },
  darkContainer: { backgroundColor: '#1A1A1A' },
  title: { fontSize: 24, fontWeight: '800', color: palette.text, marginBottom: 12 },
  text: { color: palette.text, marginBottom: 8, fontSize: 16 },
  darkText: { color: '#F1F1F1' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: palette.primaryDark },
  statLabel: { color: '#777', fontSize: 12, marginTop: 4, textAlign: 'center' },
  streakText: { fontWeight: '700', color: palette.secondary },
  orangeBtn: { backgroundColor: palette.secondary, padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  greenBtn: { backgroundColor: palette.primary, padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  resetBtn: { backgroundColor: '#FFE7D9', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  resetText: { color: palette.secondary, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#9E9E9E', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
