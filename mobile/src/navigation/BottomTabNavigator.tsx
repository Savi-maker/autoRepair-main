import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/Dashboard/HomeScreen';
import SearchScreen from '../screens/Search/Search';
import SettingsScreen from '../screens/Settings/Settings';
import { useTheme } from '../screens/ThemeContext/ThemeContext';

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getTabBarIcon = (routeName: string, color: string, size: number) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'home';
  if (routeName === 'Search') iconName = 'search';
  else if (routeName === 'Settings') iconName = 'settings';

  return <Ionicons name={iconName} size={size} color={color} />;
};


  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#fff' : '#000',
        tabBarStyle: {
          backgroundColor: isDark ? '#303030' : '#fff',
          borderTopWidth: 0.5,
          borderTopColor: isDark ? '#555' : '#ccc',
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => getTabBarIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

