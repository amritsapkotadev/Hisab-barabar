import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

export default function App() {
  const handlePress = () => {
    Alert.alert('Hello!', 'You pressed the button.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to My Simple Page!</Text>
      <Text style={styles.message}>
        This is a very basic React Native screen. You can customize it however you want.
      </Text>
      <Button title="Press Me" onPress={handlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
});
