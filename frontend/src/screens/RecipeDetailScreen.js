import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';
import { palette } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function RecipeDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { addCookedRecipe } = useApp();
  const [recipe, setRecipe] = useState(null);
  const [versions, setVersions] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printableText, setPrintableText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    difficulty: '',
    updatedBy: 'student',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecipe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/recipes/${id}`);
      setRecipe(res.data);
      setEditForm({
        title: res.data.title || '',
        prepTimeMinutes: String(res.data.prepTimeMinutes ?? ''),
        cookTimeMinutes: String(res.data.cookTimeMinutes ?? ''),
        difficulty: res.data.difficulty || 'easy',
        updatedBy: 'student',
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load recipe.');
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const res = await api.get(`/recipes/${id}/versions`);
      setVersions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setVersions([]);
    }
  };

  const fetchPrintView = async () => {
    try {
      const res = await api.get(`/recipes/${id}/print`);
      setPrintableText(res.data?.printableText || 'No print view available.');
    } catch {
      setPrintableText('No print view available.');
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/recipes/${id}`, {
        title: editForm.title,
        prepTimeMinutes: Number(editForm.prepTimeMinutes),
        cookTimeMinutes: Number(editForm.cookTimeMinutes),
        difficulty: editForm.difficulty,
        updatedBy: editForm.updatedBy || 'student',
      });
      await Promise.all([fetchRecipe(), fetchVersions()]);
      setShowEditor(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save recipe edit.');
    } finally {
      setSaving(false);
    }
  };

  const sharePrintView = async () => {
    if (!printableText) {
      await fetchPrintView();
    }
    await Share.share({ message: printableText || 'No print view available.' });
  };

  useEffect(() => {
    Promise.all([fetchRecipe(), fetchVersions()]);
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
      <View style={styles.tagRow}>
        <Text style={styles.levelTag}>{(recipe.difficulty || 'easy').toUpperCase()}</Text>
        <Text style={styles.versionTag}>Version {recipe.versionNumber || 1}</Text>
      </View>
      <Text style={styles.meta}>Prep {recipe.prepTimeMinutes} min • Cook {recipe.cookTimeMinutes} min • Total {recipe.totalTimeMinutes} min</Text>
      <Text style={styles.meta}>₹{recipe.estimatedCost} • {recipe.calories} kcal • {recipe.region}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editorNavBtn} onPress={() => navigation.navigate('RecipeEditor', { id })}>
          <Text style={styles.editorNavText}>Open Dedicated Editor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditor((prev) => !prev)}>
          <Text style={styles.editText}>{showEditor ? 'Close Edit' : 'Edit Recipe'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.printBtn}
          onPress={async () => {
            const nextState = !showPrintView;
            setShowPrintView(nextState);
            if (nextState) {
              await fetchPrintView();
            }
          }}
        >
          <Text style={styles.printText}>{showPrintView ? 'Hide Print View' : 'Show Print View'}</Text>
        </TouchableOpacity>
      </View>

      {showEditor ? (
        <View style={styles.editorBox}>
          <Text style={styles.section}>Edit Submission</Text>
          <TextInput
            value={editForm.title}
            onChangeText={(value) => setEditForm((prev) => ({ ...prev, title: value }))}
            style={styles.input}
            placeholder="Recipe title"
          />
          <TextInput
            value={editForm.prepTimeMinutes}
            onChangeText={(value) => setEditForm((prev) => ({ ...prev, prepTimeMinutes: value }))}
            style={styles.input}
            placeholder="Prep minutes"
            keyboardType="numeric"
          />
          <TextInput
            value={editForm.cookTimeMinutes}
            onChangeText={(value) => setEditForm((prev) => ({ ...prev, cookTimeMinutes: value }))}
            style={styles.input}
            placeholder="Cook minutes"
            keyboardType="numeric"
          />
          <TextInput
            value={editForm.difficulty}
            onChangeText={(value) => setEditForm((prev) => ({ ...prev, difficulty: value.toLowerCase() }))}
            style={styles.input}
            placeholder="easy / medium / hard"
          />
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveEdit} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Edit'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showPrintView ? (
        <View style={styles.printCard}>
          <Text style={styles.section}>Print-Friendly View</Text>
          <Text style={styles.printableText}>{printableText || 'Loading printable content...'}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={sharePrintView}>
            <Text style={styles.shareBtnText}>Share / Print Text</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.section}>Ingredients</Text>
      {recipe.ingredients.map((item) => (
        <Text key={item} style={styles.item}>• {item}</Text>
      ))}

      {recipe.substitutionSuggestions?.length ? (
        <>
          <Text style={styles.section}>Substitution Suggestions</Text>
          {recipe.substitutionSuggestions.map((item) => (
            <Text key={item} style={styles.item}>• {item}</Text>
          ))}
        </>
      ) : null}

      <Text style={styles.section}>Steps</Text>
      {recipe.steps.map((step, index) => (
        <Text key={`${index}-${step}`} style={styles.item}>{index + 1}. {step}</Text>
      ))}

      {recipe.videoStepLinks?.length ? (
        <>
          <Text style={styles.section}>Jump To Video Steps</Text>
          <View style={styles.linkWrap}>
            {recipe.videoStepLinks.map((link) => (
              <TouchableOpacity key={`${link.stepNumber}-${link.seconds}`} style={styles.stepLink} onPress={() => Linking.openURL(link.url)}>
                <Text style={styles.stepLinkText}>{link.label} at {link.seconds}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(recipe.videoUrl)}>
        <Text style={styles.videoText}>Open Step-by-Step Video Guide</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cookedBtn}
        onPress={() => {
          addCookedRecipe(id);
          setError('');
        }}
      >
        <Text style={styles.cookedBtnText}>Mark As Cooked</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Version History</Text>
      {versions.length ? versions.map((version) => (
        <View key={`${version.versionNumber}-${version.updatedAt || 'x'}`} style={styles.versionRow}>
          <Text style={styles.versionTitle}>v{version.versionNumber} • {version.title}</Text>
          <Text style={styles.versionMeta}>{version.difficulty || 'easy'} • Prep {version.prepTimeMinutes} • Cook {version.cookTimeMinutes}</Text>
          <Text style={styles.versionMeta}>Updated by {version.updatedBy}</Text>
        </View>
      )) : <Text style={styles.item}>No prior edits yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt, padding: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: '100%', height: 210, borderRadius: 14, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  meta: { marginTop: 6, color: palette.text, marginBottom: 12 },
  tagRow: { flexDirection: 'row', marginTop: 8, marginBottom: 2 },
  levelTag: { backgroundColor: '#DBF3E5', color: '#1E7A44', fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginRight: 8 },
  versionTag: { backgroundColor: '#E9EAFE', color: '#2F3E9E', fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  actionRow: { flexDirection: 'row', marginTop: 4, marginBottom: 8 },
  editorNavBtn: { backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  editorNavText: { color: '#fff', fontWeight: '700' },
  editBtn: { backgroundColor: palette.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  editText: { color: '#fff', fontWeight: '700' },
  printBtn: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  printText: { color: '#fff', fontWeight: '700' },
  editorBox: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8, color: palette.text },
  saveBtn: { backgroundColor: palette.secondary, padding: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  printCard: { borderWidth: 1, borderColor: '#D8DEE6', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  printableText: { color: '#111827', lineHeight: 20 },
  shareBtn: { marginTop: 10, backgroundColor: '#0F766E', padding: 10, borderRadius: 8, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: '700' },
  section: { fontSize: 18, fontWeight: '700', color: palette.primaryDark, marginTop: 10, marginBottom: 6 },
  item: { color: palette.text, marginBottom: 4, lineHeight: 21 },
  linkWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  stepLink: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, marginRight: 6, marginBottom: 6 },
  stepLinkText: { color: '#1D4ED8', fontWeight: '700', fontSize: 12 },
  videoBtn: { backgroundColor: palette.secondary, padding: 12, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  videoText: { color: '#fff', fontWeight: '700' },
  cookedBtn: { backgroundColor: '#0F766E', padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  cookedBtnText: { color: '#fff', fontWeight: '700' },
  versionRow: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: '#fff' },
  versionTitle: { color: palette.text, fontWeight: '700' },
  versionMeta: { color: '#6B7280', marginTop: 3 },
  errorText: { color: '#E74C3C', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: palette.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  loadingText: { marginTop: 10, color: palette.text },
});
