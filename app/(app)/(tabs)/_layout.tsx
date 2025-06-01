import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Users, Receipt, Settings } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const primaryColor = useThemeColor('primary');
  const tabIconDefault = useThemeColor('tabIconDefault');
  const backgroundColor = useThemeColor('background');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: tabIconDefault,
        tabBarStyle: { backgroundColor },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}