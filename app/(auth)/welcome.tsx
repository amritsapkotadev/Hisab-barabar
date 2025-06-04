import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useOAuth } from '@clerk/clerk-expo';
import { ArrowRight } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeInLeft,
  FadeOut,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Track Expenses Together',
    description: 'Split bills and manage shared expenses with friends and family effortlessly',
    image: 'https://images.pexels.com/photos/7654579/pexels-photo-7654579.jpeg',
  },
  {
    id: '2',
    title: 'Smart Splitting',
    description: 'Split expenses equally or customize amounts for each person',
    image: 'https://images.pexels.com/photos/6289065/pexels-photo-6289065.jpeg',
  },
  {
    id: '3',
    title: 'Stay Organized',
    description: 'Create groups for different occasions and track expenses separately',
    image: 'https://images.pexels.com/photos/7621138/pexels-photo-7621138.jpeg',
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)/(tabs)');
      }
    } catch (err) {
      console.error("OAuth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeInRight.duration(500)}
      exiting={FadeOut}
      style={styles.slide}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>
      <View style={styles.textContainer}>
        <Animated.Text 
          entering={FadeInLeft.duration(800).delay(300)}
          style={styles.title}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text 
          entering={FadeInLeft.duration(800).delay(500)}
          style={styles.description}
        >
          {item.description}
        </Animated.Text>
      </View>
    </Animated.View>
  );

  const Pagination = () => (
    <View style={styles.paginationContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            { opacity: index === currentIndex ? 1 : 0.4 }
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          const x = e.nativeEvent.contentOffset.x;
          setCurrentIndex(Math.round(x / width));
        }}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
      />
      
      <Animated.View 
        entering={FadeIn.duration(1000).delay(600)}
        style={styles.bottomContainer}
      >
        <Pagination />
        
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Image
            source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
          <ArrowRight size={20} color="#1F2937" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    height,
  },
  imageContainer: {
    height: height * 0.6,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  textContainer: {
    padding: 32,
    paddingTop: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'Inter',
    }),
  },
  description: {
    fontSize: 18,
    color: '#4B5563',
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'Inter',
    }),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginHorizontal: 4,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'Inter',
    }),
  },
});