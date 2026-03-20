import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabs from './MainTabs';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeEditorScreen from '../screens/RecipeEditorScreen';
import { palette } from '../theme/colors';

const Stack = createNativeStackNavigator();

const baseScreenOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: palette.background },
  headerTitleStyle: { fontWeight: '800', color: palette.text },
  headerTintColor: palette.primaryDark,
  contentStyle: { backgroundColor: palette.background },
  animation: 'slide_from_right',
};

export default function RootNavigator() {
  const { token, isBootstrapping } = useApp();

  if (isBootstrapping) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={baseScreenOptions}>
      <Stack.Screen name="CookMate" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          title: 'Recipe Detail',
          headerBackTitle: 'Back',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="RecipeEditor"
        component={RecipeEditorScreen}
        options={{
          title: 'Recipe Editor',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
