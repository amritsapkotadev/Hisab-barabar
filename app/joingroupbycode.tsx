import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import React, { useState } from 'react'

export default function JoinGroup() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a group code.');
      return;
    }
    setLoading(true);
    // TODO: Replace with actual join group logic
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Joined group with code: ${code}`);
      setCode('');
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.heading}>Join a Group</Text>
        <Text style={styles.description}>
          Enter the group code shared with you to join your friends and start splitting expenses!
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleJoin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Group'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
  },
  innerContainer: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: '#fafbfc',
    marginBottom: 20,
    letterSpacing: 2,
    color: '#222',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#4f8cff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
});