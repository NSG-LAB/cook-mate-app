import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AccessibilityInfo } from 'react-native';
import { api, setAuthToken } from '../services/api';
import { SUPPORTED_LANGUAGES, translate } from '../utils/i18n';

const AppContext = createContext(null);

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const INGREDIENTS_KEY = 'appIngredients';
const BUDGET_KEY = 'appBudget';
const SELECTED_RECIPES_KEY = 'appSelectedRecipes';
const COOKED_RECIPES_KEY = 'appCookedRecipes';
const SPENT_BUDGET_KEY = 'appSpentBudget';
const PURCHASE_HISTORY_KEY = 'appPurchaseHistory';
const DARK_MODE_KEY = 'appDarkMode';
const STREAK_KEY = 'appStreak';
const WATER_TODAY_KEY = 'appWaterTodayMl';
const WATER_TARGET_KEY = 'appWaterTargetMl';
const CALORIE_TARGET_KEY = 'appCalorieTarget';
const HEALTH_CONNECTIONS_KEY = 'appHealthConnections';
const LANGUAGE_KEY = 'appLanguage';
const REWARD_POINTS_KEY = 'appRewardPoints';
const NOTIFICATIONS_ENABLED_KEY = 'appNotificationsEnabled';
const ACCESSIBILITY_PREFS_KEY = 'appAccessibilityPrefs';
const INTEGRATIONS_KEY = 'appIntegrationSettings';
const VIEWED_RECIPES_KEY = 'appViewedRecipes';
const DIETARY_PREFERENCES_KEY = 'appDietaryPreferences';
const MEAL_PREP_PLAN_KEY = 'appMealPrepPlan';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [budget, setBudget] = useState(1200);
  const [ingredients, setIngredients] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
  const [cookedRecipeIds, setCookedRecipeIds] = useState([]);
  const [spentBudget, setSpentBudget] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [streak, setStreak] = useState(0);
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  const [waterTargetMl, setWaterTargetMl] = useState(2500);
  const [calorieTarget, setCalorieTarget] = useState(2200);
  const [language, setLanguage] = useState('en');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('undetermined');
  const [accessibilityPrefs, setAccessibilityPrefs] = useState({
    largeText: false,
    screenReaderOptimized: false,
  });
  const [integrationSettings, setIntegrationSettings] = useState({
    homeWidgetEnabled: true,
    watchCompanionEnabled: true,
    voiceAssistantEnabled: true,
  });
  const [viewedRecipes, setViewedRecipes] = useState([]);
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [mealPrepPlan, setMealPrepPlan] = useState([]);
  const [healthConnections, setHealthConnections] = useState({
    appleHealth: false,
    googleFit: false,
    lastSyncAt: null,
  });
  const [axiosInterceptorId, setAxiosInterceptorId] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUser, storedIngredients, storedBudget, storedSelected, storedCooked, storedSpentBudget, storedPurchaseHistory, storedDarkMode, storedStreak, storedWaterToday, storedWaterTarget, storedCalorieTarget, storedHealthConnections, storedLanguage, storedRewardPoints, storedNotificationsEnabled, storedAccessibilityPrefs, storedIntegrations, storedViewedRecipes, storedDietaryPreferences, storedMealPrepPlan] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(INGREDIENTS_KEY),
          AsyncStorage.getItem(BUDGET_KEY),
          AsyncStorage.getItem(SELECTED_RECIPES_KEY),
          AsyncStorage.getItem(COOKED_RECIPES_KEY),
          AsyncStorage.getItem(SPENT_BUDGET_KEY),
          AsyncStorage.getItem(PURCHASE_HISTORY_KEY),
          AsyncStorage.getItem(DARK_MODE_KEY),
          AsyncStorage.getItem(STREAK_KEY),
          AsyncStorage.getItem(WATER_TODAY_KEY),
          AsyncStorage.getItem(WATER_TARGET_KEY),
          AsyncStorage.getItem(CALORIE_TARGET_KEY),
          AsyncStorage.getItem(HEALTH_CONNECTIONS_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
          AsyncStorage.getItem(REWARD_POINTS_KEY),
          AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
          AsyncStorage.getItem(ACCESSIBILITY_PREFS_KEY),
          AsyncStorage.getItem(INTEGRATIONS_KEY),
          AsyncStorage.getItem(VIEWED_RECIPES_KEY),
          AsyncStorage.getItem(DIETARY_PREFERENCES_KEY),
          AsyncStorage.getItem(MEAL_PREP_PLAN_KEY),
        ]);

        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
          registerInterceptor();
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        if (storedIngredients) {
          try {
            const parsedIngredients = JSON.parse(storedIngredients);
            if (Array.isArray(parsedIngredients)) {
              setIngredients(parsedIngredients);
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedBudget) {
          const parsedBudget = Number(storedBudget);
          if (!Number.isNaN(parsedBudget)) {
            setBudget(parsedBudget);
          }
        }

        if (storedSelected) {
          try {
            const parsedSelected = JSON.parse(storedSelected);
            if (Array.isArray(parsedSelected)) {
              setSelectedRecipeIds(parsedSelected);
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedCooked) {
          try {
            const parsedCooked = JSON.parse(storedCooked);
            if (Array.isArray(parsedCooked)) {
              setCookedRecipeIds(parsedCooked);
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedSpentBudget) {
          const parsedSpent = Number(storedSpentBudget);
          if (!Number.isNaN(parsedSpent)) {
            setSpentBudget(parsedSpent);
          }
        }

        if (storedPurchaseHistory) {
          try {
            const parsedPurchaseHistory = JSON.parse(storedPurchaseHistory);
            if (parsedPurchaseHistory && typeof parsedPurchaseHistory === 'object') {
              setPurchaseHistory(parsedPurchaseHistory);
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedDarkMode !== null) {
          setDarkMode(storedDarkMode === 'true');
        }

        if (storedStreak) {
          const parsedStreak = Number(storedStreak);
          if (!Number.isNaN(parsedStreak)) {
            setStreak(parsedStreak);
          }
        }

        if (storedWaterToday) {
          const parsedWaterToday = Number(storedWaterToday);
          if (!Number.isNaN(parsedWaterToday)) {
            setWaterTodayMl(parsedWaterToday);
          }
        }

        if (storedWaterTarget) {
          const parsedWaterTarget = Number(storedWaterTarget);
          if (!Number.isNaN(parsedWaterTarget)) {
            setWaterTargetMl(parsedWaterTarget);
          }
        }

        if (storedCalorieTarget) {
          const parsedCalorieTarget = Number(storedCalorieTarget);
          if (!Number.isNaN(parsedCalorieTarget)) {
            setCalorieTarget(parsedCalorieTarget);
          }
        }

        if (storedHealthConnections) {
          try {
            const parsedConnections = JSON.parse(storedHealthConnections);
            if (parsedConnections && typeof parsedConnections === 'object') {
              setHealthConnections((prev) => ({ ...prev, ...parsedConnections }));
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedLanguage) {
          const validLanguage = SUPPORTED_LANGUAGES.some((item) => item.code === storedLanguage);
          if (validLanguage) {
            setLanguage(storedLanguage);
          }
        }

        if (storedRewardPoints) {
          const parsedPoints = Number(storedRewardPoints);
          if (!Number.isNaN(parsedPoints)) {
            setRewardPoints(parsedPoints);
          }
        }

        if (storedNotificationsEnabled !== null) {
          setNotificationsEnabled(storedNotificationsEnabled === 'true');
        }

        if (storedAccessibilityPrefs) {
          try {
            const parsedPrefs = JSON.parse(storedAccessibilityPrefs);
            if (parsedPrefs && typeof parsedPrefs === 'object') {
              setAccessibilityPrefs((prev) => ({ ...prev, ...parsedPrefs }));
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedIntegrations) {
          try {
            const parsedIntegrations = JSON.parse(storedIntegrations);
            if (parsedIntegrations && typeof parsedIntegrations === 'object') {
              setIntegrationSettings((prev) => ({ ...prev, ...parsedIntegrations }));
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedViewedRecipes) {
          try {
            const parsed = JSON.parse(storedViewedRecipes);
            if (Array.isArray(parsed)) {
              setViewedRecipes(parsed);
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedDietaryPreferences) {
          try {
            const parsed = JSON.parse(storedDietaryPreferences);
            if (Array.isArray(parsed)) {
              setDietaryPreferences(parsed);
            }
          } catch (_) {
            // ignore parse errors
          }
        }

        if (storedMealPrepPlan) {
          try {
            const parsed = JSON.parse(storedMealPrepPlan);
            if (Array.isArray(parsed)) {
              setMealPrepPlan(parsed);
            }
          } catch (_) {
            // ignore parse errors
          }
        }
      } finally {
        setIsBootstrapping(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients)).catch(() => {});
  }, [ingredients, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(BUDGET_KEY, String(budget)).catch(() => {});
  }, [budget, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(SELECTED_RECIPES_KEY, JSON.stringify(selectedRecipeIds)).catch(() => {});
  }, [selectedRecipeIds, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(COOKED_RECIPES_KEY, JSON.stringify(cookedRecipeIds)).catch(() => {});
  }, [cookedRecipeIds, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(SPENT_BUDGET_KEY, String(spentBudget)).catch(() => {});
  }, [spentBudget, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(purchaseHistory)).catch(() => {});
  }, [purchaseHistory, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(DARK_MODE_KEY, String(darkMode)).catch(() => {});
  }, [darkMode, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(STREAK_KEY, String(streak)).catch(() => {});
  }, [streak, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(WATER_TODAY_KEY, String(waterTodayMl)).catch(() => {});
  }, [waterTodayMl, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(WATER_TARGET_KEY, String(waterTargetMl)).catch(() => {});
  }, [waterTargetMl, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(CALORIE_TARGET_KEY, String(calorieTarget)).catch(() => {});
  }, [calorieTarget, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(HEALTH_CONNECTIONS_KEY, JSON.stringify(healthConnections)).catch(() => {});
  }, [healthConnections, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => {});
  }, [language, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(REWARD_POINTS_KEY, String(rewardPoints)).catch(() => {});
  }, [rewardPoints, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(notificationsEnabled)).catch(() => {});
  }, [notificationsEnabled, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(ACCESSIBILITY_PREFS_KEY, JSON.stringify(accessibilityPrefs)).catch(() => {});
  }, [accessibilityPrefs, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(integrationSettings)).catch(() => {});
  }, [integrationSettings, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(VIEWED_RECIPES_KEY, JSON.stringify(viewedRecipes)).catch(() => {});
  }, [viewedRecipes, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(DIETARY_PREFERENCES_KEY, JSON.stringify(dietaryPreferences)).catch(() => {});
  }, [dietaryPreferences, isBootstrapping]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    AsyncStorage.setItem(MEAL_PREP_PLAN_KEY, JSON.stringify(mealPrepPlan)).catch(() => {});
  }, [mealPrepPlan, isBootstrapping]);

  const teardownInterceptor = () => {
    if (axiosInterceptorId !== null) {
      api.interceptors.response.eject(axiosInterceptorId);
      setAxiosInterceptorId(null);
    }
  };

  const registerInterceptor = () => {
    teardownInterceptor();
    const id = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.response?.status === 401) {
          await logout();
        }
        return Promise.reject(error);
      }
    );
    setAxiosInterceptorId(id);
  };

  useEffect(() => {
    return () => {
      teardownInterceptor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSession = async (nextToken, nextUser, shouldSetAuthHeader = true) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(shouldSetAuthHeader ? nextToken : null);
    if (shouldSetAuthHeader && nextToken) {
      registerInterceptor();
    }
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, nextToken),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser)),
    ]);
  };

  const formatApiError = (error, fallbackMessage) => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error')) {
      return 'Cannot reach backend. Start Spring Boot server and verify API base URL in frontend/src/services/api.js.';
    }
    return fallbackMessage;
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const nextUser = { email: data.email, name: data.name };
      await persistSession(data.token, nextUser);
    } catch (error) {
      throw new Error(formatApiError(error, 'Invalid login credentials.'));
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/signup', { name, email, password });
      const nextUser = { email: data.email, name: data.name };
      await persistSession(data.token, nextUser);
    } catch (error) {
      throw new Error(formatApiError(error, 'Unable to sign up.'));
    }
  };

  const loginDemo = async () => {
    const demoUser = { email: 'demo@cookmate.com', name: 'Demo User' };
    await persistSession('demo-token', demoUser, false);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
     teardownInterceptor();
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  };

  const addCookedRecipe = (recipeId) => {
    setCookedRecipeIds((prev) => {
      const next = [recipeId, ...prev.filter((id) => id !== recipeId)];
      return next.slice(0, 30);
    });
    setRewardPoints((prev) => prev + 15);
  };

  const recordRecipeView = (recipe) => {
    if (!recipe || recipe.id == null) {
      return;
    }
    const entry = {
      id: recipe.id,
      title: recipe.title,
      region: recipe.region,
      difficulty: recipe.difficulty,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 12) : [],
      viewedAt: new Date().toISOString(),
    };
    setViewedRecipes((prev) => {
      const filtered = prev.filter((item) => item.id !== entry.id);
      return [entry, ...filtered].slice(0, 40);
    });
  };

  const addRewardPoints = (points) => {
    const safePoints = Number(points);
    if (!Number.isFinite(safePoints) || safePoints <= 0) {
      return;
    }
    setRewardPoints((prev) => prev + Math.round(safePoints));
  };

  const toggleDietaryPreference = (pref) => {
    if (!pref || typeof pref !== 'string') {
      return;
    }
    const normalized = pref.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    setDietaryPreferences((prev) =>
      prev.includes(normalized)
        ? prev.filter((item) => item !== normalized)
        : [...prev, normalized]
    );
  };

  const optimizeMealPrepPlan = (recipes, maxBudget) => {
    const list = Array.isArray(recipes) ? recipes : [];
    const safeBudget = Number.isFinite(maxBudget) ? maxBudget : 0;
    if (!list.length) {
      setMealPrepPlan([]);
      return [];
    }

    const sorted = [...list].sort((a, b) => {
      const scoreA = (a.proteinGrams || 0) * 2 - (a.estimatedCost || 0) / 25 - (a.totalTimeMinutes || 0) / 10;
      const scoreB = (b.proteinGrams || 0) * 2 - (b.estimatedCost || 0) / 25 - (b.totalTimeMinutes || 0) / 10;
      return scoreB - scoreA;
    });

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = [];
    let spend = 0;
    for (let i = 0; i < weekdays.length; i++) {
      const candidate = sorted[i % sorted.length];
      if (!candidate) {
        continue;
      }
      const cost = Number(candidate.estimatedCost || 0);
      if (safeBudget > 0 && spend + cost > safeBudget) {
        break;
      }
      spend += cost;
      plan.push({
        day: weekdays[i],
        recipeId: candidate.id,
        title: candidate.title,
        estimatedCost: cost,
        proteinGrams: candidate.proteinGrams || 0,
      });
    }

    setMealPrepPlan(plan);
    return plan;
  };

  const addPantryItem = (item) => {
    if (!item) {
      return;
    }
    const normalized = item.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    setIngredients((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
  };

  const recordPurchasedItem = (item, amount = 0) => {
    if (!item || typeof item !== 'string') {
      return;
    }
    const normalized = item.trim().toLowerCase();
    if (!normalized) {
      return;
    }
    setPurchaseHistory((prev) => ({
      ...prev,
      [normalized]: (prev[normalized] || 0) + 1,
    }));
    if (amount > 0) {
      setSpentBudget((prev) => Number((prev + amount).toFixed(2)));
    }
  };

  const logWater = (amountMl) => {
    const safeAmount = Number(amountMl);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      return;
    }
    setWaterTodayMl((prev) => prev + Math.round(safeAmount));
  };

  const resetWater = () => {
    setWaterTodayMl(0);
  };

  const connectHealthProvider = (provider) => {
    if (!provider) {
      return;
    }
    setHealthConnections((prev) => ({ ...prev, [provider]: true }));
  };

  const disconnectHealthProvider = (provider) => {
    if (!provider) {
      return;
    }
    setHealthConnections((prev) => ({ ...prev, [provider]: false }));
  };

  const markHealthSync = () => {
    setHealthConnections((prev) => ({ ...prev, lastSyncAt: new Date().toISOString() }));
  };

  const setLanguagePreference = (nextLanguage) => {
    const validLanguage = SUPPORTED_LANGUAGES.some((item) => item.code === nextLanguage);
    if (!validLanguage) {
      return;
    }
    setLanguage(nextLanguage);
  };

  const t = (key) => translate(language, key);

  const requestPushPermission = async () => {
    if (!Device.isDevice) {
      setNotificationPermission('denied');
      return { granted: false, reason: 'physical_device_required' };
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const permission = await Notifications.requestPermissionsAsync();
      status = permission.status;
    }

    setNotificationPermission(status);
    const granted = status === 'granted';
    setNotificationsEnabled(granted);
    return { granted };
  };

  const disablePushNotifications = () => {
    setNotificationsEnabled(false);
  };

  const sendSuggestionNotification = async (title = 'Meal idea for you', body = 'Your personalized recipe picks are ready.') => {
    if (!notificationsEnabled) {
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null,
    });
    return true;
  };

  const setAccessibilityOption = (key, value) => {
    if (!(key in accessibilityPrefs)) {
      return;
    }
    setAccessibilityPrefs((prev) => ({ ...prev, [key]: value }));
    if (key === 'screenReaderOptimized') {
      AccessibilityInfo.announceForAccessibility?.(
        value ? 'Screen reader mode enabled' : 'Screen reader mode disabled'
      );
    }
  };

  const setIntegrationOption = (key, value) => {
    if (!(key in integrationSettings)) {
      return;
    }
    setIntegrationSettings((prev) => ({ ...prev, [key]: value }));
  };

  const rewardTier = useMemo(() => {
    if (rewardPoints >= 400) {
      return 'Gold';
    }
    if (rewardPoints >= 200) {
      return 'Silver';
    }
    if (rewardPoints >= 80) {
      return 'Bronze';
    }
    return 'Starter';
  }, [rewardPoints]);

  const value = useMemo(
    () => ({
      token,
      user,
      isBootstrapping,
      budget,
      setBudget,
      ingredients,
      setIngredients,
      selectedRecipeIds,
      setSelectedRecipeIds,
      cookedRecipeIds,
      addCookedRecipe,
      spentBudget,
      setSpentBudget,
      purchaseHistory,
      recordPurchasedItem,
      addPantryItem,
      login,
      loginDemo,
      signup,
      logout,
      darkMode,
      setDarkMode,
      streak,
      setStreak,
      waterTodayMl,
      setWaterTodayMl,
      waterTargetMl,
      setWaterTargetMl,
      calorieTarget,
      setCalorieTarget,
      logWater,
      resetWater,
      healthConnections,
      connectHealthProvider,
      disconnectHealthProvider,
      markHealthSync,
      language,
      setLanguagePreference,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      rewardPoints,
      rewardTier,
      addRewardPoints,
      notificationsEnabled,
      notificationPermission,
      requestPushPermission,
      disablePushNotifications,
      sendSuggestionNotification,
      accessibilityPrefs,
      setAccessibilityOption,
      integrationSettings,
      setIntegrationOption,
      viewedRecipes,
      recordRecipeView,
      dietaryPreferences,
      setDietaryPreferences,
      toggleDietaryPreference,
      mealPrepPlan,
      optimizeMealPrepPlan,
      setMealPrepPlan,
    }),
    [token, user, isBootstrapping, budget, ingredients, selectedRecipeIds, cookedRecipeIds, spentBudget, purchaseHistory, darkMode, streak, waterTodayMl, waterTargetMl, calorieTarget, healthConnections, language, rewardPoints, rewardTier, notificationsEnabled, notificationPermission, accessibilityPrefs, integrationSettings, viewedRecipes, dietaryPreferences, mealPrepPlan]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
