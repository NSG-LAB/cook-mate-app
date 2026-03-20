import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { palette } from '../theme/colors';

const formatDate = (value) => {
  if (!value) {
    return 'Unknown time';
  }
  try {
    const date = new Date(value);
    const day = date.toLocaleDateString?.('en-US', { month: 'short', day: 'numeric' }) || date.toDateString();
    const time = date.toLocaleTimeString?.('en-US', { hour: '2-digit', minute: '2-digit' }) || date.toISOString().substring(11, 16);
    return `${day} • ${time}`;
  } catch (err) {
    return String(value);
  }
};

export default function CookingHistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const [historyRes, summaryRes] = await Promise.all([
        api.get('/cook-log'),
        api.get('/cook-log/summary'),
      ]);
      setEntries(Array.isArray(historyRes.data) ? historyRes.data : []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load cook log.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTitle}>{item.recipeTitle}</Text>
        {item.rating ? (
          <View style={styles.ratingRow}>
            {Array.from({ length: item.rating }).map((_, index) => (
              <Ionicons key={`star-${item.id}-${index}`} name="star" size={14} color="#FCD34D" />
            ))}
          </View>
        ) : null}
      </View>
      <Text style={styles.entryMeta}>{formatDate(item.cookedAt)}</Text>
      <Text style={styles.entryMeta}>
        {item.minutesSpent ? `${item.minutesSpent} min session • ` : ''}
        {item.completionPercent ? `${item.completionPercent}% steps` : 'Steps logged' }
      </Text>
      {item.notes ? <Text style={styles.entryNotes}>{item.notes}</Text> : null}
      <View style={styles.entryFooter}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{item.moodTag || 'focused'}</Text>
        </View>
        {item.usedTimer ? (
          <View style={[styles.pill, styles.timerPill]}>
            <Ionicons name="timer" color="#fff" size={14} />
            <Text style={[styles.pillText, styles.timerText]}>Timer</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (loading && !refreshing && entries.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={styles.loadingText}>Loading cooking history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cooking History</Text>
      {summary ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{summary.sessionsThisWeek}</Text>
              <Text style={styles.summaryLabel}>Sessions this week</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{summary.minutesThisWeek}</Text>
              <Text style={styles.summaryLabel}>Minutes logged</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{summary.streakDays}</Text>
              <Text style={styles.summaryLabel}>Day streak</Text>
            </View>
          </View>
          <Text style={styles.summaryMeta}>
            {summary.favoriteRegion ? `Fav cuisine: ${summary.favoriteRegion}` : 'Cook a recipe to reveal your go-to cuisine.'}
          </Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEntry}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Cook a recipe and tap "Mark As Cooked" to build your log.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text, marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: palette.text },
  summaryCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: palette.primaryDark },
  summaryLabel: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 4 },
  summaryMeta: { marginTop: 10, color: '#4B5563', textAlign: 'center' },
  error: { color: '#EF4444', marginBottom: 10 },
  entryCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryTitle: { fontSize: 16, fontWeight: '700', color: palette.text },
  ratingRow: { flexDirection: 'row' },
  entryMeta: { color: '#6B7280', marginTop: 4 },
  entryNotes: { marginTop: 6, color: palette.text },
  entryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pillText: { color: palette.primaryDark, fontWeight: '600', marginLeft: 4 },
  timerPill: { backgroundColor: palette.secondary },
  timerText: { color: '#fff', marginLeft: 6 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
