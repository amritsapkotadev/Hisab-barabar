import React from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function LoginScreen() {
  const { signIn, isLoaded, setSession } = useSignIn();

  // Your deep link redirect URL registered in Clerk & app.json
  const redirectUrl = 'com.amrit.expensetracker://oauthredirect';

  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      Alert.alert('Please wait', 'Sign-in is loading...');
      return;
    }

    try {
      // Use redirect flow for mobile apps
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl,
      });
      // After redirect back, Clerk will handle session automatically
    } catch (err) {
      console.error('Google Sign-In error:', err);
      Alert.alert('Sign-In Error', 'Failed to sign in with Google.');
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Expense Tracker</Text>
      <Button title="Sign in with Google" onPress={handleGoogleSignIn} color="#4285F4" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
