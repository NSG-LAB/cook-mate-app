import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { palette } from './src/theme/colors';

function AppShell() {
  const { darkMode } = useApp();
  const activePalette = darkMode
    ? {
        background: '#111827',
        card: '#1F2937',
        text: '#F9FAFB',
        primary: '#F97316',
        border: '#374151',
        secondary: '#14B8A6',
      }
    : palette;

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: activePalette.background,
      card: activePalette.card,
      text: activePalette.text,
      primary: activePalette.primary,
      border: activePalette.border,
      notification: activePalette.secondary,
    },
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: activePalette.background }} edges={['top', 'bottom']}>
        <StatusBar style={darkMode ? 'light' : 'dark'} translucent={false} backgroundColor={activePalette.background} />
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
