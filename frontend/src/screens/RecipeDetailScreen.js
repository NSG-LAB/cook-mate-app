import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';
import { palette } from '../theme/colors';

export default function RecipeDetailScreen({ route }) {
  const { id } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecipe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/recipes/${id}`);
      setRecipe(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load recipe.');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRecipe}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Recipe not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.meta}>{recipe.cookTimeMinutes} min • ₹{recipe.estimatedCost} • {recipe.calories} kcal • {recipe.region}</Text>

      <Text style={styles.section}>Ingredients</Text>
      {recipe.ingredients.map((item) => (
        <Text key={item} style={styles.item}>• {item}</Text>
      ))}

      <Text style={styles.section}>Steps</Text>
      {recipe.steps.map((step, index) => (
        <Text key={`${index}-${step}`} style={styles.item}>{index + 1}. {step}</Text>
      ))}

      <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(recipe.videoUrl)}>
        <Text style={styles.videoText}>Open Step-by-Step Video Guide</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: '100%', height: 210, borderRadius: 14, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  meta: { marginTop: 6, color: palette.text, marginBottom: 12 },
  section: { fontSize: 18, fontWeight: '700', color: palette.primaryDark, marginTop: 10, marginBottom: 6 },
  item: { color: palette.text, marginBottom: 4, lineHeight: 21 },
  videoBtn: { backgroundColor: palette.secondary, padding: 12, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  videoText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#E74C3C', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: palette.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  loadingText: { marginTop: 10, color: palette.text },
});
