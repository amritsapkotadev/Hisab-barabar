import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
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
      <Text variant="heading1" style={styles.title}>Create New Group</Text>
      <Text style={styles.subtitle}>
        Create a group to start tracking shared expenses
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Group Name"
          placeholder="Enter group name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(''); // Clear error when user types
          }}
          error={error}
          leftIcon={<Users size={20} color="#6B7280" />}
        />

        <TextInput
          label="Description (Optional)"
          placeholder="Enter group description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Button
          title="Create Group"
          onPress={handleCreateGroup}
          isLoading={isLoading}
          style={styles.button}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.l,
    backgroundColor: '#F9FAFB', // Light background for clean feel
  },
  title: {
    marginTop: Layout.spacing.xxl,
    marginBottom: Layout.spacing.s,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827', // Darker text for better readability
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: Layout.spacing.xxl,
    lineHeight: 22,
  },
  form: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Layout.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  button: {
    marginTop: Layout.spacing.xl,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#3B82F6', // Soft blue for primary action
  },
});
