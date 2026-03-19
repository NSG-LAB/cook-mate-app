import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';
import { palette } from '../theme/colors';

const DEFAULT_FORM = {
  title: '',
  region: 'Global',
  prepTimeMinutes: '5',
  cookTimeMinutes: '10',
  difficulty: 'easy',
  estimatedCost: '100',
  calories: '300',
  imageUrl: '',
  videoUrl: '',
  ingredientsText: 'salt, pepper',
  substitutionsText: 'No butter? Use olive oil.',
  stepsText: 'Prepare ingredients.\nCook and serve.',
  timestampsText: '0,90',
  updatedBy: 'student',
};

const toInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
};

const toListFromComma = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toListFromLines = (value) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

export default function RecipeEditorScreen({ route, navigation }) {
  const recipeId = route.params?.id;
  const [form, setForm] = useState(DEFAULT_FORM);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(Boolean(recipeId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = useMemo(() => Boolean(recipeId), [recipeId]);

  const fillFromRecipe = (recipe) => {
    setForm({
      title: recipe.title || '',
      region: recipe.region || 'Global',
      prepTimeMinutes: String(recipe.prepTimeMinutes ?? 5),
      cookTimeMinutes: String(recipe.cookTimeMinutes ?? 10),
      difficulty: recipe.difficulty || 'easy',
      estimatedCost: String(recipe.estimatedCost ?? 100),
      calories: String(recipe.calories ?? 300),
      imageUrl: recipe.imageUrl || '',
      videoUrl: recipe.videoUrl || '',
      ingredientsText: (recipe.ingredients || []).join(', '),
      substitutionsText: (recipe.substitutionSuggestions || []).join(', '),
      stepsText: (recipe.steps || []).join('\n'),
      timestampsText: (recipe.videoStepLinks || []).map((item) => item.seconds).join(','),
      updatedBy: 'student',
    });
  };

  const loadRecipe = async () => {
    if (!recipeId) return;
    setLoading(true);
    setError('');
    try {
      const [recipeRes, versionRes] = await Promise.all([
        api.get(`/recipes/${recipeId}`),
        api.get(`/recipes/${recipeId}/versions`),
      ]);
      fillFromRecipe(recipeRes.data);
      setVersions(Array.isArray(versionRes.data) ? versionRes.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load recipe editor data.');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const submit = async () => {
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      region: form.region,
      prepTimeMinutes: toInt(form.prepTimeMinutes, 5),
      cookTimeMinutes: toInt(form.cookTimeMinutes, 10),
      difficulty: form.difficulty.toLowerCase(),
      estimatedCost: toInt(form.estimatedCost, 100),
      calories: toInt(form.calories, 300),
      imageUrl: form.imageUrl,
      videoUrl: form.videoUrl,
      ingredients: toListFromComma(form.ingredientsText),
      substitutionSuggestions: toListFromComma(form.substitutionsText),
      steps: toListFromLines(form.stepsText),
      stepVideoTimestampsSeconds: toListFromComma(form.timestampsText).map((value) => toInt(value, 0)),
      updatedBy: form.updatedBy || 'student',
    };

    try {
      const res = isEdit
        ? await api.put(`/recipes/${recipeId}`, payload)
        : await api.post('/recipes', payload);
      const savedId = res?.data?.id;
      if (savedId) {
        navigation.replace('RecipeDetail', { id: savedId });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loading}>Loading editor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={styles.title}>{isEdit ? 'Edit Recipe Submission' : 'Create Recipe Submission'}</Text>
      <Text style={styles.subtitle}>Fill all details to make recipe submissions first-class.</Text>

      <TextInput style={styles.input} value={form.title} placeholder="Title" onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))} />
      <TextInput style={styles.input} value={form.region} placeholder="Region" onChangeText={(value) => setForm((prev) => ({ ...prev, region: value }))} />
      <TextInput style={styles.input} value={form.difficulty} placeholder="easy | medium | hard" onChangeText={(value) => setForm((prev) => ({ ...prev, difficulty: value }))} />
      <TextInput style={styles.input} value={form.prepTimeMinutes} placeholder="Prep time minutes" keyboardType="numeric" onChangeText={(value) => setForm((prev) => ({ ...prev, prepTimeMinutes: value }))} />
      <TextInput style={styles.input} value={form.cookTimeMinutes} placeholder="Cook time minutes" keyboardType="numeric" onChangeText={(value) => setForm((prev) => ({ ...prev, cookTimeMinutes: value }))} />
      <TextInput style={styles.input} value={form.estimatedCost} placeholder="Estimated cost" keyboardType="numeric" onChangeText={(value) => setForm((prev) => ({ ...prev, estimatedCost: value }))} />
      <TextInput style={styles.input} value={form.calories} placeholder="Calories" keyboardType="numeric" onChangeText={(value) => setForm((prev) => ({ ...prev, calories: value }))} />
      <TextInput style={styles.input} value={form.imageUrl} placeholder="Image URL" onChangeText={(value) => setForm((prev) => ({ ...prev, imageUrl: value }))} />
      <TextInput style={styles.input} value={form.videoUrl} placeholder="Video URL" onChangeText={(value) => setForm((prev) => ({ ...prev, videoUrl: value }))} />
      <TextInput style={styles.input} value={form.ingredientsText} placeholder="Ingredients (comma separated)" onChangeText={(value) => setForm((prev) => ({ ...prev, ingredientsText: value }))} />
      <TextInput style={styles.input} value={form.substitutionsText} placeholder="Substitution suggestions (comma separated)" onChangeText={(value) => setForm((prev) => ({ ...prev, substitutionsText: value }))} />
      <TextInput style={[styles.input, styles.multiline]} multiline value={form.stepsText} placeholder="Steps (one per line)" onChangeText={(value) => setForm((prev) => ({ ...prev, stepsText: value }))} />
      <TextInput style={styles.input} value={form.timestampsText} placeholder="Step timestamps in seconds (comma separated)" onChangeText={(value) => setForm((prev) => ({ ...prev, timestampsText: value }))} />
      <TextInput style={styles.input} value={form.updatedBy} placeholder="Updated by" onChangeText={(value) => setForm((prev) => ({ ...prev, updatedBy: value }))} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.75 }]} onPress={submit} disabled={saving}>
        <Text style={styles.submitText}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Recipe'}</Text>
      </TouchableOpacity>

      {isEdit ? (
        <View style={styles.versionsCard}>
          <Text style={styles.sectionTitle}>Version History</Text>
          {versions.length ? versions.map((version) => (
            <View key={`${version.versionNumber}-${version.updatedAt || 'none'}`} style={styles.versionRow}>
              <Text style={styles.versionMain}>v{version.versionNumber} • {version.title}</Text>
              <Text style={styles.versionSub}>{version.difficulty} • Prep {version.prepTimeMinutes} • Cook {version.cookTimeMinutes}</Text>
              <Text style={styles.versionSub}>Updated by {version.updatedBy}</Text>
            </View>
          )) : <Text style={styles.versionSub}>No prior versions yet.</Text>}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 8, color: palette.text },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  subtitle: { marginTop: 4, marginBottom: 12, color: '#4B5563' },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: palette.text,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  submitText: { color: '#fff', fontWeight: '800' },
  error: { color: '#E74C3C', marginBottom: 8 },
  versionsCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: palette.primaryDark, marginBottom: 8 },
  versionRow: { borderBottomWidth: 1, borderBottomColor: '#EEF2F7', paddingBottom: 8, marginBottom: 8 },
  versionMain: { color: palette.text, fontWeight: '700' },
  versionSub: { color: '#6B7280', marginTop: 2 },
});
