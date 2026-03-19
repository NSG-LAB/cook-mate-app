import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabs from './MainTabs';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeEditorScreen from '../screens/RecipeEditorScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, isBootstrapping } = useApp();

  if (isBootstrapping) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="CookMate" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe Detail' }} />
      <Stack.Screen name="RecipeEditor" component={RecipeEditorScreen} options={{ title: 'Recipe Editor' }} />
    </Stack.Navigator>
  );
}
