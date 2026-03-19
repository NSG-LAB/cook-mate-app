import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import IngredientsScreen from '../screens/IngredientsScreen';
import GroceryScreen from '../screens/GroceryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecipeSuggestionsScreen from '../screens/RecipeSuggestionsScreen';
import RecipeEditorScreen from '../screens/RecipeEditorScreen';
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
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: palette.border,
          height: 64,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconForRoute(route.name)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Suggestions" component={RecipeSuggestionsScreen} />
      <Tab.Screen name="My Ingredients" component={IngredientsScreen} />
      <Tab.Screen name="Grocery" component={GroceryScreen} />
      <Tab.Screen name="Recipe Editor" component={RecipeEditorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
