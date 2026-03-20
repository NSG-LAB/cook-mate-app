import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const PRIMARY_TABS = [
  {
    name: 'Home',
    component: HomeScreen,
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'Suggestions',
    component: RecipeSuggestionsScreen,
    label: 'Ideas',
    icon: 'bulb-outline',
    activeIcon: 'bulb',
  },
  {
    name: 'Grocery',
    component: GroceryScreen,
    label: 'Grocery',
    icon: 'cart-outline',
    activeIcon: 'cart',
  },
  {
    name: 'Profile',
    component: ProfileScreen,
    label: 'Profile',
    icon: 'person-circle-outline',
    activeIcon: 'person-circle',
  },
];

const TAB_LOOKUP = PRIMARY_TABS.reduce((acc, item) => ({ ...acc, [item.name]: item }), {});
const VISIBLE_TAB_NAMES = PRIMARY_TABS.map((item) => item.name);
const SECONDARY_LINKS = [
  { name: 'My Ingredients', label: 'Pantry', icon: 'nutrition-outline', blurb: 'Stock check' },
  { name: 'History', label: 'Journal', icon: 'time-outline', blurb: 'Session log' },
  { name: 'Recipe Editor', label: 'Creator', icon: 'create-outline', blurb: 'Craft dishes' },
];
const BASE_NAV_HEIGHT = 132;

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const navOffset = Math.max(BASE_NAV_HEIGHT + insets.top, insets.top + 120);

  return (
    <Tab.Navigator
      screenOptions={{
        lazy: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', color: palette.text },
        headerTintColor: palette.primaryDark,
        tabBarHideOnKeyboard: true,
      }}
      sceneContainerStyle={{ paddingTop: navOffset, backgroundColor: palette.background }}
      tabBar={(props) => <FloatingTopBar {...props} insets={insets} />}
    >
      {PRIMARY_TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
      <Tab.Screen name="My Ingredients" component={IngredientsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="History" component={CookingHistoryScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Recipe Editor" component={RecipeEditorScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

function FloatingTopBar({ state, descriptors, navigation, insets }) {
  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => VISIBLE_TAB_NAMES.includes(route.name));
  const topOffset = insets.top + 12;

  return (
    <View style={[styles.navWrapper, { paddingTop: topOffset }]}>
      <View style={styles.navHeader}>
        <View>
          <Text style={styles.navEyebrow}>Application flow</Text>
          <Text style={styles.navTitle}>Navigate modules</Text>
        </View>
        <Badge>Pinned</Badge>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBackground}>
        {visibleRoutes.map(({ route, index }) => {
          const isFocused = state.index === index;
          const isLast = index === visibleRoutes.length - 1;
          const config = TAB_LOOKUP[route.name] || {};
          const label = config.label || route.name;
          const iconName = isFocused ? config.activeIcon || config.icon : config.icon || 'ellipse-outline';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabButton, isFocused && styles.tabButtonActive, !isLast && styles.tabButtonGap]}
            >
              <Ionicons
                name={iconName}
                size={18}
                color={isFocused ? palette.primary : palette.muted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.flowRow}>
        {SECONDARY_LINKS.map((link, index) => {
          const isLast = index === SECONDARY_LINKS.length - 1;
          return (
          <TouchableOpacity
            key={link.name}
            style={[styles.flowPill, !isLast && styles.flowPillGap]}
            onPress={() => navigation.navigate(link.name)}
          >
            <Ionicons name={link.icon} size={16} color={palette.primaryDark} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.flowLabel}>{link.label}</Text>
              <Text style={styles.flowBlurb}>{link.blurb}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={palette.muted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Badge({ children }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: palette.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 10,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  navTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.backgroundAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.primaryDark,
    textTransform: 'uppercase',
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tabButtonGap: {
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: palette.backgroundAlt,
    borderWidth: 1,
    borderColor: palette.primaryLight,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: palette.muted,
    marginLeft: 8,
  },
  tabLabelActive: {
    color: palette.primaryDark,
  },
  flowRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  flowPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },
  flowPillGap: {
    marginRight: 12,
  },
  flowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
  },
  flowBlurb: {
    fontSize: 11,
    color: palette.muted,
  },
});
