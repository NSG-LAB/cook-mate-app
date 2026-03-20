import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import IngredientsScreen from '../screens/IngredientsScreen';
import GroceryScreen from '../screens/GroceryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecipeSuggestionsScreen from '../screens/RecipeSuggestionsScreen';
import RecipeEditorScreen from '../screens/RecipeEditorScreen';
import CookingHistoryScreen from '../screens/CookingHistoryScreen';
import { palette } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const iconForRoute = (routeName) => {
    switch (routeName) {
      case 'Home':
        return 'home-outline';
      case 'Suggestions':
        return 'bulb-outline';
      case 'My Ingredients':
        return 'leaf-outline';
      case 'Grocery':
        return 'cart-outline';
      case 'History':
        return 'time-outline';
      case 'Recipe Editor':
        return 'create-outline';
      case 'Profile':
        return 'person-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12, marginBottom: -2 },
        tabBarItemStyle: { marginHorizontal: 4 },
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: 'transparent',
          elevation: 10,
          shadowColor: '#000',
          height: 60,
          marginHorizontal: 18,
          marginBottom: 12,
          borderRadius: 999,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <View
            style={{
              backgroundColor: focused ? '#EEF2FF' : 'transparent',
              padding: 6,
              borderRadius: 12,
            }}
          >
            <Ionicons name={iconForRoute(route.name)} size={size} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Suggestions" component={RecipeSuggestionsScreen} />
      <Tab.Screen
        name="My Ingredients"
        component={IngredientsScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="Grocery" component={GroceryScreen} />
      <Tab.Screen
        name="History"
        component={CookingHistoryScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Recipe Editor"
        component={RecipeEditorScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
