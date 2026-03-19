import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../services/api';

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
  const [axiosInterceptorId, setAxiosInterceptorId] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUser, storedIngredients, storedBudget, storedSelected, storedCooked, storedSpentBudget, storedPurchaseHistory, storedDarkMode, storedStreak] = await Promise.all([
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
    }),
    [token, user, isBootstrapping, budget, ingredients, selectedRecipeIds, cookedRecipeIds, spentBudget, purchaseHistory, darkMode, streak]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
