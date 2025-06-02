import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Welcome to MyApp',
    subtitle: 'Discover amazing features and enjoy the journey!',
    // image: require('./assets/slide1.png'), // Add your own images here
  },
  {
    key: '2',
    title: 'Connect with friends',
    subtitle: 'Share your moments and stay updated with what matters.',
    // image: require('./assets/slide2.png'),
  },
  {
    key: '3',
    title: 'Get Started',
    subtitle: 'Login with Google to continue.',
    // image: require('./assets/slide3.png'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const router = useRouter();

  // Google OAuth request setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '1080592315622-8dcon4ij4b8ioj5rmja8sgpd3qb9hh74.apps.googleusercontent.com',
    androidClientId: '1080592315622-u01m7hbjspn1vhqqna35qrna8vo8q9qj.apps.googleusercontent.com',
    webClientId: '1080592315622-59udlvepkltt7h80b5vh38q2a9mdom9f.apps.googleusercontent.com',
    scopes: ['profile', 'email'],

  });

  // Effect to handle the OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        setLoading(true);

        // Simulate async token validation, fetching user profile, etc.
        setTimeout(() => {
          setLoading(false);
          router.replace('/home'); // Navigate to your home screen after login
        }, 1500);
      }
    } else if (response?.type === 'error') {
      alert('Authentication failed. Please try again.');
    }
  }, [response]);

  // Handle pagination dots when user scrolls slides
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderItem = ({ item, index }) => (
    <View style={[styles.slide, { width }]}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>

      {index === slides.length - 1 && (
        <TouchableOpacity
          style={[styles.googleButton, (!request || loading) && styles.disabledButton]}
          disabled={!request || loading}
          onPress={() => promptAsync()}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
      />

      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View
            key={i.toString()}
            style={[styles.dot, currentIndex === i ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    flex: 1,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  googleButton: {
    marginTop: 30,
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: 220,
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#2563EB',
  },
  inactiveDot: {
    backgroundColor: '#bbb',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
