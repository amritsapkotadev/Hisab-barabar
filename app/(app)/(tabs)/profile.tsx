import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [name, setName] = React.useState('Amrit Lama');
  const [email, setEmail] = React.useState('amrit@example.com');
  const [phone, setPhone] = React.useState('+977 98XXXXXXXX');
  const [editing, setEditing] = React.useState(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={{ alignItems: 'center' }}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
            style={styles.avatar}
          />
          <Text variant="titleLarge" style={styles.name}>{name}</Text>
          <Text variant="bodyMedium" style={styles.email}>{email}</Text>
        </Card.Content>
      </Card>

      <View style={styles.infoSection}>
        <TextInput
          label="Name"
          mode="outlined"
          value={name}
          onChangeText={setName}
          editable={editing}
          style={styles.input}
        />
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          editable={false}
          style={styles.input}
        />
        <TextInput
          label="Phone"
          mode="outlined"
          value={phone}
          onChangeText={setPhone}
          editable={editing}
          style={styles.input}
        />

        <Button
          mode="contained"
          icon={editing ? 'check' : 'pencil'}
          onPress={() => setEditing(!editing)}
          style={styles.button}
        >
          {editing ? 'Save Profile' : 'Edit Profile'}
        </Button>

        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Log Out
        </Button>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f9fc',
  },
  card: {
    borderRadius: 16,
    elevation: 3,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
    marginBottom: 8,
  },
  infoSection: {
    paddingHorizontal: 8,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  logoutButton: {
    marginTop: 16,
    borderRadius: 12,
    borderColor: '#ff4444',
  },
});
