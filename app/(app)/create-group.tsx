import React, { useState } from 'react';
import { StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { View } from '@/components/View';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { createGroup } from '@/services/groups';
import { Users } from 'lucide-react-native';
import Layout from '@/constants/layout';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleCreateGroup = async () => {
    if (!user) {
      setError('You must be logged in to create a group');
      return;
    }
    
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await createGroup(name.trim(), description.trim(), user.id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        router.replace('/(app)/(tabs)/groups');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} variant="screen">
      <View style={styles.header}>
        <Image
          // source={require('@/assets/images/group-illustration.png')}
          style={styles.illustration}
        />
        <Text variant="heading1" style={styles.title}>Create New Group</Text>
        <Text style={styles.subtitle}>
          Start tracking shared expenses with friends or family
        </Text>
      </View>

      <View style={styles.card}>
        <TextInput
          label="Group Name"
          placeholder="e.g., Roommates, Family Trip"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          error={error}
          leftIcon={<Users size={22} color="#6B7280" />}
          containerStyle={styles.input}
        />

        <TextInput
          label="Description (Optional)"
          placeholder="What's this group for?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          containerStyle={styles.input}
        />

        <Button
          title="Create Group"
          onPress={handleCreateGroup}
          isLoading={isLoading}
          style={styles.button}
          textStyle={styles.buttonText}
        />
        
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  illustration: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    height: 56,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});