import React, { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AppLayout() {
  const { user, loading } = useAuth();

  // If the user is not logged in, redirect to the login screen
  if (!loading && !user) {
    return <Redirect href="/login" />;
  }

  // While loading, return nothing
  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}