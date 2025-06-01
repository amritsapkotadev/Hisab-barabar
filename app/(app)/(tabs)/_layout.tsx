import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Users, CirclePlus as PlusCircle, Receipt, Settings } from 'lucide-react-native';
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
        name="add-expense"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      
    </Tabs>
  );
}