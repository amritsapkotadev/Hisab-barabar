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
    if (!user) return;
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await createGroup(name, description, user.id);
      if (error) throw error;
      router.replace('/(app)/(tabs)/groups');
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
        Create a group to start tracking shared expenses with friends and family
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Group Name"
          placeholder="Enter group name"
          value={name}
          onChangeText={setName}
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
  },
  title: {
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.s,
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: Layout.spacing.xl,
  },
  form: {
    flex: 1,
  },
  button: {
    marginTop: Layout.spacing.l,
  },
});