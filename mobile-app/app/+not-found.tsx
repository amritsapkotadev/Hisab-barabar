import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function NotFoundScreen() {
  const { styles } = useThemedStyles(createStyles);
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 600,
  },
  link: {
    marginTop: 15,
    color: COLORS.primary,
    paddingVertical: 15,
  },
});
