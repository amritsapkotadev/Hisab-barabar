import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Text';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { supabaseProfile, isLoading, error } = useClerkSupabaseSync();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  // Show loading while syncing user to Supabase
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Setting up your account...</Text>
      </View>
    );
  }

  // Show error if sync failed
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 16 }}>
          Failed to set up your account: {error}
        </Text>
        <Text style={{ color: '#6B7280', textAlign: 'center' }}>
          Please try restarting the app or contact support if the issue persists.
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}