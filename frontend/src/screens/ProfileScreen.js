import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/colors';

export default function ProfileScreen() {
  const {
    user,
    darkMode,
    setDarkMode,
    logout,
    setStreak,
    streak,
    budget,
    ingredients,
    selectedRecipeIds,
    healthConnections,
    connectHealthProvider,
    disconnectHealthProvider,
    markHealthSync,
    t,
    language,
    setLanguagePreference,
    supportedLanguages,
    rewardPoints,
    rewardTier,
    addRewardPoints,
    notificationsEnabled,
    requestPushPermission,
    disablePushNotifications,
    sendSuggestionNotification,
    accessibilityPrefs,
    setAccessibilityOption,
    integrationSettings,
    setIntegrationOption,
  } = useApp();

  const [weightKg, setWeightKg] = useState('70');
  const [heightCm, setHeightCm] = useState('170');

  const bmiResult = useMemo(() => {
    const weight = Number(weightKg);
    const height = Number(heightCm);
    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
      return { bmi: null, label: 'Enter valid values', recommendation: 'Add your height and weight to calculate BMI.' };
    }
    const meters = height / 100;
    const bmi = weight / (meters * meters);
    if (bmi < 18.5) {
      return {
        bmi,
        label: 'Underweight',
        recommendation: 'Increase calories with protein-rich meals and healthy fats.',
      };
    }
    if (bmi < 25) {
      return {
        bmi,
        label: 'Normal',
        recommendation: 'Maintain a balanced macro split and hydration routine.',
      };
    }
    if (bmi < 30) {
      return {
        bmi,
        label: 'Overweight',
        recommendation: 'Prioritize high-protein, low-carb, and moderate calorie deficits.',
      };
    }
    return {
      bmi,
      label: 'Obese',
      recommendation: 'Aim for structured calorie targets and regular activity with professional guidance.',
    };
  }, [weightKg, heightCm]);

  const handleNotificationToggle = async (value) => {
    if (value) {
      const result = await requestPushPermission();
      if (!result.granted) {
        Alert.alert('Notification permission', 'Push notifications need permission on a physical device.');
      }
      return;
    }
    disablePushNotifications();
  };

  const handleSuggestionNotification = async () => {
    const sent = await sendSuggestionNotification('Recipe suggestions ready', 'Open For You picks and claim reward points.');
    if (!sent) {
      Alert.alert('Notifications disabled', 'Enable push notifications first.');
      return;
    }
    addRewardPoints(3);
    Alert.alert('Sent', 'A suggestion notification has been scheduled.');
  };

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.darkContainer]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, darkMode && styles.darkText]}>{t('profile')}</Text>
      <Text style={[styles.text, darkMode && styles.darkText]}>Name: {user?.name || 'Student'}</Text>
      <Text style={[styles.text, darkMode && styles.darkText]}>Email: {user?.email || '-'}</Text>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('language')}</Text>
        <View style={styles.langRow}>
          {supportedLanguages.map((item) => {
            const active = item.code === language;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => setLanguagePreference(item.code)}
                accessibilityRole="button"
                accessibilityLabel={`Switch language to ${item.label}`}
              >
                <Text style={[styles.langText, active && styles.langTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
        <Text style={[styles.text, darkMode && styles.darkText]}>{t('darkMode')}</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.text, darkMode && styles.darkText]}>{t('notifications')}</Text>
        <Switch value={notificationsEnabled} onValueChange={handleNotificationToggle} />
      </View>

      <TouchableOpacity style={styles.orangeBtn} onPress={handleSuggestionNotification}>
        <Text style={styles.btnText}>{t('sendSuggestion')}</Text>
      </TouchableOpacity>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('accessibility')}</Text>
        <View style={styles.rowPlain}>
          <Text style={styles.text}>{t('largeText')}</Text>
          <Switch
            value={accessibilityPrefs.largeText}
            onValueChange={(value) => setAccessibilityOption('largeText', value)}
          />
        </View>
        <View style={styles.rowPlain}>
          <Text style={styles.text}>{t('screenReader')}</Text>
          <Switch
            value={accessibilityPrefs.screenReaderOptimized}
            onValueChange={(value) => setAccessibilityOption('screenReaderOptimized', value)}
          />
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('rewards')}</Text>
        <Text style={styles.rewardsValue}>{rewardPoints} {t('points')} · {rewardTier} tier</Text>
        <Text style={styles.syncMeta}>Earn points by cooking, planning, and engaging with suggestions.</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('widget')}</Text>
        <View style={styles.rowPlain}>
          <Text style={styles.text}>Enable home-screen widget feed</Text>
          <Switch
            value={integrationSettings.homeWidgetEnabled}
            onValueChange={(value) => setIntegrationOption('homeWidgetEnabled', value)}
          />
        </View>
        <Text style={styles.syncMeta}>Today meal plan and random recipe widget payload is now generated from Home.</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('watchCompanion')}</Text>
        <View style={styles.rowPlain}>
          <Text style={styles.text}>Enable watch companion sync</Text>
          <Switch
            value={integrationSettings.watchCompanionEnabled}
            onValueChange={(value) => setIntegrationOption('watchCompanionEnabled', value)}
          />
        </View>
        <Text style={styles.syncMeta}>{t('watchCompanionHint')}</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>{t('voiceAssistant')}</Text>
        <View style={styles.rowPlain}>
          <Text style={styles.text}>Enable assistant intents</Text>
          <Switch
            value={integrationSettings.voiceAssistantEnabled}
            onValueChange={(value) => setIntegrationOption('voiceAssistantEnabled', value)}
          />
        </View>
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={() => Alert.alert('Assistant query', 'Try saying: What can I cook with eggs under 20 minutes?')}
        >
          <Text style={styles.btnText}>Test voice command</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={[styles.text, darkMode && styles.darkText]}>{t('cookStreak')}</Text>
        <Text style={[styles.streakText, darkMode && styles.darkText]}>{streak} days 🔥</Text>
      </View>

      <TouchableOpacity
        style={styles.orangeBtn}
        onPress={() => Alert.alert('Hydration Reminder', 'Drink water every 2 hours while cooking/studying 💧')}
      >
        <Text style={styles.btnText}>Set Water Reminder</Text>
      </TouchableOpacity>

      <View style={styles.healthCard}>
        <Text style={styles.healthTitle}>Apple Health / Google Fit</Text>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Apple Health</Text>
          <TouchableOpacity
            style={[styles.healthBtn, healthConnections.appleHealth ? styles.disconnectBtn : styles.connectBtn]}
            onPress={() => {
              if (healthConnections.appleHealth) {
                disconnectHealthProvider('appleHealth');
              } else {
                connectHealthProvider('appleHealth');
              }
            }}
          >
            <Text style={styles.healthBtnText}>{healthConnections.appleHealth ? 'Disconnect' : 'Connect'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.healthRow}>
          <Text style={styles.healthLabel}>Google Fit</Text>
          <TouchableOpacity
            style={[styles.healthBtn, healthConnections.googleFit ? styles.disconnectBtn : styles.connectBtn]}
            onPress={() => {
              if (healthConnections.googleFit) {
                disconnectHealthProvider('googleFit');
              } else {
                connectHealthProvider('googleFit');
              }
            }}
          >
            <Text style={styles.healthBtnText}>{healthConnections.googleFit ? 'Disconnect' : 'Connect'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={() => {
            markHealthSync();
            Alert.alert('Sync Complete', 'Nutrition and hydration targets synced with connected providers.');
          }}
        >
          <Text style={styles.btnText}>Sync Health Data</Text>
        </TouchableOpacity>
        <Text style={styles.syncMeta}>
          Last sync: {healthConnections.lastSyncAt ? new Date(healthConnections.lastSyncAt).toLocaleString() : 'Never'}
        </Text>
      </View>

      <View style={styles.healthCard}>
        <Text style={styles.healthTitle}>BMI Calculator</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={weightKg}
            onChangeText={setWeightKg}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Weight (kg)"
          />
          <TextInput
            value={heightCm}
            onChangeText={setHeightCm}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Height (cm)"
          />
        </View>
        <Text style={styles.bmiValue}>BMI: {bmiResult.bmi ? bmiResult.bmi.toFixed(1) : '--'} ({bmiResult.label})</Text>
        <Text style={styles.bmiRecommendation}>{bmiResult.recommendation}</Text>
      </View>

      <TouchableOpacity style={styles.greenBtn} onPress={() => setStreak((s) => s + 1)}>
        <Text style={styles.btnText}>Mark Meal Cooked Today</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={() => setStreak(0)}>
        <Text style={styles.resetText}>Reset Streak</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt },
  content: { padding: 16, paddingBottom: 48 },
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
  rowPlain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '800', color: palette.primaryDark, marginBottom: 10, fontSize: 15 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap' },
  langChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  langChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  langText: { color: palette.primaryDark, fontWeight: '700', fontSize: 12 },
  langTextActive: { color: '#fff' },
  rewardsValue: { color: palette.text, fontWeight: '800', fontSize: 16, marginBottom: 6 },
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
  healthCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: palette.border },
  healthTitle: { fontWeight: '800', color: palette.primaryDark, fontSize: 16, marginBottom: 10 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  healthLabel: { color: palette.text, fontWeight: '600' },
  healthBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  connectBtn: { backgroundColor: '#0EA5E9' },
  disconnectBtn: { backgroundColor: '#64748B' },
  healthBtnText: { color: '#fff', fontWeight: '700' },
  syncBtn: { backgroundColor: '#0F766E', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  syncMeta: { color: '#64748B', marginTop: 8, fontSize: 12 },
  inputRow: { flexDirection: 'row', marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  bmiValue: { color: palette.text, fontWeight: '700', marginBottom: 4 },
  bmiRecommendation: { color: '#475569', fontWeight: '600' },
  orangeBtn: { backgroundColor: palette.secondary, padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  greenBtn: { backgroundColor: palette.primary, padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  resetBtn: { backgroundColor: '#FFE7D9', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  resetText: { color: palette.secondary, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#9E9E9E', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
