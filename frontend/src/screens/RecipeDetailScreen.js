import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { palette } from '../theme/colors';
import { useApp } from '../context/AppContext';
import CookingTimer from '../components/CookingTimer';

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
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [moodTag, setMoodTag] = useState('focused');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loggingCook, setLoggingCook] = useState(false);
  const [logMessage, setLogMessage] = useState('');
  const [logIsError, setLogIsError] = useState(false);
  const moodOptions = ['focused', 'lazy chef', 'celebration'];
  const totalSteps = recipe?.steps?.length || 0;
  const completionPercent = totalSteps ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

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

  const toggleStep = (index) => {
    setCompletedSteps((prev) => {
      const exists = prev.includes(index);
      if (!exists) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      return exists ? prev.filter((value) => value !== index) : [...prev, index];
    });
  };

  const handleLogCook = async () => {
    if (!recipe) {
      return;
    }
    setLoggingCook(true);
    setLogMessage('');
    setLogIsError(false);
    try {
      const minutesSpent = timerSeconds > 0
        ? Math.max(1, Math.round(timerSeconds / 60))
        : recipe.totalTimeMinutes || recipe.cookTimeMinutes || 0;

      await api.post('/cook-log', {
        recipeId: id,
        minutesSpent,
        rating,
        moodTag,
        notes,
        usedTimer: timerSeconds > 0,
        completedSteps: completedSteps.length,
        totalSteps,
      });

      addCookedRecipe(id);
      setLogMessage('Cook log saved. Check the History tab!');
      setLogIsError(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Session saved', 'Find this cook in your history timeline.');
      setNotes('');
      setCompletedSteps([]);
      setTimerSeconds(0);
      setMoodTag('focused');
      setRating(5);
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to log cook session.';
      setLogMessage(message);
      setLogIsError(true);
    } finally {
      setLoggingCook(false);
    }
  };

  useEffect(() => {
    setCompletedSteps([]);
    setTimerSeconds(0);
    setNotes('');
    setLogMessage('');
    setLogIsError(false);
    setMoodTag('focused');
    setRating(5);
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
      <CookingTimer onElapsedChange={setTimerSeconds} />

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
      {totalSteps ? (
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{completionPercent}% complete</Text>
          <Text style={styles.progressMeta}>{completedSteps.length}/{totalSteps} steps checked</Text>
        </View>
      ) : null}
      {recipe.steps.map((step, index) => {
        const done = completedSteps.includes(index);
        return (
          <TouchableOpacity
            key={`${index}-${step}`}
            style={[styles.stepItem, done && styles.stepItemDone]}
            onPress={() => toggleStep(index)}
          >
            <Ionicons
              name={done ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={done ? palette.secondary : '#94A3B8'}
              style={styles.stepIcon}
            />
            <Text style={[styles.stepText, done && styles.stepTextDone]}>{index + 1}. {step}</Text>
          </TouchableOpacity>
        );
      })}

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

      <View style={styles.sessionCard}>
        <Text style={styles.sessionTitle}>Session Journal</Text>
        <Text style={styles.sessionLabel}>How did it feel?</Text>
        <View style={styles.moodRow}>
          {moodOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.moodChip, moodTag === option && styles.moodChipActive]}
              onPress={() => setMoodTag(option)}
            >
              <Text style={[styles.moodText, moodTag === option && styles.moodTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sessionLabel}>Score this cook</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={`rating-${value}`} onPress={() => setRating(value)}>
              <Ionicons
                name={value <= rating ? 'star' : 'star-outline'}
                size={28}
                color={value <= rating ? '#FACC15' : '#CBD5F5'}
                style={styles.ratingIcon}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.ratingValue}>{rating}/5</Text>
        </View>

        <Text style={styles.sessionLabel}>Quick notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          placeholder="What went well? Any tweaks?"
          placeholderTextColor="#9CA3AF"
          multiline
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity
        style={[styles.cookedBtn, loggingCook && styles.disabledBtn]}
        onPress={handleLogCook}
        disabled={loggingCook}
      >
        <Text style={styles.cookedBtnText}>{loggingCook ? 'Saving...' : 'Mark As Cooked'}</Text>
      </TouchableOpacity>
      {logMessage ? (
        <Text style={[styles.logMessage, logIsError ? styles.logMessageError : styles.logMessageSuccess]}>{logMessage}</Text>
      ) : null}

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
  sessionCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, marginTop: 16, backgroundColor: '#fff' },
  sessionTitle: { fontSize: 18, fontWeight: '700', color: palette.primaryDark, marginBottom: 8 },
  sessionLabel: { color: '#4B5563', fontWeight: '600', marginTop: 10, marginBottom: 6 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap' },
  moodChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  moodChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  moodText: { color: palette.primaryDark, fontWeight: '600' },
  moodTextActive: { color: '#fff' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingIcon: { marginRight: 6 },
  ratingValue: { marginLeft: 8, fontWeight: '700', color: palette.text },
  notesInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    color: palette.text,
  },
  cookedBtn: { backgroundColor: '#0F766E', padding: 12, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  cookedBtnText: { color: '#fff', fontWeight: '700' },
  disabledBtn: { opacity: 0.7 },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  stepItemDone: { borderColor: palette.secondary, backgroundColor: '#ECFDF5' },
  stepIcon: { marginRight: 10 },
  stepText: { color: palette.text, flex: 1 },
  stepTextDone: { textDecorationLine: 'line-through', color: '#059669' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontWeight: '700', color: palette.primaryDark },
  progressMeta: { color: '#6B7280' },
  logMessage: { marginTop: 8, textAlign: 'center', fontWeight: '600' },
  logMessageSuccess: { color: '#059669' },
  logMessageError: { color: '#DC2626' },
  versionRow: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: '#fff' },
  versionTitle: { color: palette.text, fontWeight: '700' },
  versionMeta: { color: '#6B7280', marginTop: 3 },
  errorText: { color: '#E74C3C', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: palette.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  loadingText: { marginTop: 10, color: palette.text },
});
