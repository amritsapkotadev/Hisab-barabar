import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AnimatedSplashLoader from '@/components/AnimatedSplashLoader';

export default function LogoPreviewScreen() {
  const [playing, setPlaying] = React.useState(false);

  return (
    <View style={styles.container}>
      {playing ? (
        <AnimatedSplashLoader
          onFinish={() => setPlaying(false)}
          replayOnTap
          fallback={<Text style={styles.label}>Splash video unavailable. Rebuild the development app.</Text>}
        />
      ) : (
        <Pressable
          style={styles.replay}
          onPress={() => setPlaying(true)}
          accessibilityRole="button"
          accessibilityLabel="Play splash video"
        >
          <Text style={styles.label}>Tap to play splash preview</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  replay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
