import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { View } from '@/components/View';
import { Text } from '@/components/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text variant="heading1" style={styles.title}>Not Found</Text>
        <Text style={styles.description}>This page doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});