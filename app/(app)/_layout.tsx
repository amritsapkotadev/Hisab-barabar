import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { RefreshCw, AlertCircle } from 'lucide-react-native';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { supabaseProfile, isLoading, error, retrySync } = useClerkSupabaseSync();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  // Show loading while syncing user to Supabase
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20
      }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ 
          marginTop: 16, 
          color: '#6B7280',
          fontSize: 16,
          textAlign: 'center'
        }}>
          Setting up your account...
        </Text>
        <Text style={{ 
          marginTop: 8, 
          color: '#9CA3AF',
          fontSize: 14,
          textAlign: 'center'
        }}>
          Syncing with database
        </Text>
      </View>
    );
  }

  // Show error if sync failed
  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#F9FAFB'
      }}>
        <View style={{
          backgroundColor: '#FEF2F2',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#FECACA',
          alignItems: 'center'
        }}>
          <AlertCircle size={48} color="#DC2626" style={{ marginBottom: 16 }} />
          <Text style={{ 
            color: '#DC2626', 
            textAlign: 'center', 
            marginBottom: 8,
            fontSize: 18,
            fontWeight: '600'
          }}>
            Account Setup Failed
          </Text>
          <Text style={{ 
            color: '#7F1D1D', 
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 16
          }}>
            {error}
          </Text>
          <Text style={{ 
            color: '#991B1B', 
            textAlign: 'center',
            fontSize: 12,
            fontStyle: 'italic'
          }}>
            This usually happens due to network issues or database connectivity problems.
          </Text>
        </View>
        
        <Button
          title="Try Again"
          onPress={retrySync}
          leftIcon={<RefreshCw size={20} color="#FFFFFF" />}
          style={{
            backgroundColor: '#6366F1',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12
          }}
        />
        
        <Text style={{ 
          color: '#6B7280', 
          textAlign: 'center',
          fontSize: 12,
          maxWidth: 280
        }}>
          If the problem persists, please check your internet connection or contact support.
        </Text>
      </View>
    );
  }

  // Only proceed if we have a synced profile
  if (!supabaseProfile) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20
      }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ 
          color: '#6B7280', 
          textAlign: 'center',
          marginTop: 16
        }}>
          Finalizing account setup...
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