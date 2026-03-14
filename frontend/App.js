import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { palette } from './src/theme/colors';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: '#FFFFFF',
    text: palette.text,
    primary: palette.primary,
  },
};

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
