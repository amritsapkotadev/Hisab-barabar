import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Users, DollarSign, Calculator, Shield, Smartphone, Star, Heart, Sparkles, TrendingUp, Globe, CircleCheck as CheckCircle, Zap, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      id: 1,
      title: 'Welcome to SplitSaathi',
      subtitle: 'Smart Expense Sharing for Nepal 🇳🇵',
      description: 'Split bills, track expenses, and settle up with friends and family - all in one beautiful app designed specifically for Nepali users.',
      icon: <Heart size={100} color="#ffffff" />,
      gradient: ['#667eea', '#764ba2'],
      accent: '#667eea',
    },
    {
      id: 2,
      title: 'Create Groups Effortlessly',
      subtitle: 'Organize Your Shared Expenses',
      description: 'Create groups for trips to Pokhara, roommate expenses in Kathmandu, family gatherings, or any shared costs. Invite members instantly with a simple link.',
      icon: <Users size={100} color="#ffffff" />,
      gradient: ['#f093fb', '#f5576c'],
      accent: '#f093fb',
    },
    {
      id: 3,
      title: 'Smart Expense Splitting',
      subtitle: 'Fair & Transparent Always',
      description: 'Split expenses equally or customize splits by amount, percentage, or shares. Advanced algorithms ensure everyone knows exactly what they owe.',
      icon: <Calculator size={100} color="#ffffff" />,
      gradient: ['#4facfe', '#00f2fe'],
      accent: '#4facfe',
    },
    {
      id: 4,
      title: 'eSewa Integration',
      subtitle: 'Seamless Digital Payments',
      description: 'Settle up instantly with eSewa integration. Send and receive money directly through Nepal\'s most trusted digital wallet platform.',
      icon: <Smartphone size={100} color="#ffffff" />,
      gradient: ['#43e97b', '#38f9d7'],
      accent: '#43e97b',
    },
    {
      id: 5,
      title: 'Bank-Level Security',
      subtitle: 'Your Data is Protected',
      description: 'Military-grade encryption with end-to-end security. Your financial data is protected and never shared with third parties. Trust guaranteed.',
      icon: <Shield size={100} color="#ffffff" />,
      gradient: ['#fa709a', '#fee140'],
      accent: '#fa709a',
    },
  ];

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle animation
    Animated.loop(
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-advance slides
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Slide transition animation
    Animated.spring(slideAnim, {
      toValue: currentSlide,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(auth)/signup');
  };

  const handleSignIn = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(auth)/login');
  };

  const currentSlideData = slides[currentSlide];

  const floatingTransform = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderSlide = (slide: typeof slides[0], index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.slideContent,
            {
              transform: [
                { translateY: floatingTransform },
                { scale: pulseAnim }
              ]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            {slide.icon}
            <Animated.View 
              style={[
                styles.sparkle,
                {
                  transform: [{ rotate: sparkleRotation }]
                }
              ]}
            >
              <Sparkles size={30} color="#ffffff" />
            </Animated.View>
          </View>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            currentSlide === index && styles.activeDot,
            { 
              backgroundColor: currentSlide === index 
                ? currentSlideData.accent 
                : 'rgba(255, 255, 255, 0.3)' 
            }
          ]}
          onPress={() => setCurrentSlide(index)}
        />
      ))}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  transform: [
                    { 
                      scale: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    }
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoEmoji}>💰</Text>
              </LinearGradient>
              <Text style={styles.logoText}>SplitSaathi</Text>
              <View style={styles.taglineContainer}>
                <Text style={styles.tagline}>Made with </Text>
                <Heart size={14} color="#e11d48" />
                <Text style={styles.tagline}> in Nepal</Text>
              </View>
            </Animated.View>
          </View>

          {/* Slides */}
          <View style={styles.slidesContainer}>
            <Animated.View
              style={[
                styles.slidesWrapper,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, slides.length - 1],
                        outputRange: [0, -(width * (slides.length - 1))],
                      }),
                    },
                  ],
                },
              ]}
            >
              {slides.map((slide, index) => renderSlide(slide, index))}
            </Animated.View>
          </View>

          {/* Dots Indicator */}
          {renderDots()}

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Why Choose SplitSaathi?</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#10b981' }]}>
                  <CheckCircle size={24} color="#ffffff" />
                </View>
                <Text style={styles.featureText}>100% Free</Text>
                <Text style={styles.featureSubtext}>Always</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#f59e0b' }]}>
                  <Star size={24} color="#ffffff" />
                </View>
                <Text style={styles.featureText}>5-Star Rated</Text>
                <Text style={styles.featureSubtext}>By Users</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#8b5cf6' }]}>
                  <Shield size={24} color="#ffffff" />
                </View>
                <Text style={styles.featureText}>Bank-Level</Text>
                <Text style={styles.featureSubtext}>Security</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#06b6d4' }]}>
                  <Zap size={24} color="#ffffff" />
                </View>
                <Text style={styles.featureText}>Lightning</Text>
                <Text style={styles.featureSubtext}>Fast</Text>
              </View>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.statsCard}
            >
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Happy Users</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>₹50L+</Text>
                <Text style={styles.statLabel}>Money Managed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>99.9%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={currentSlideData.gradient}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Get Started Free</Text>
                <ArrowRight size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
              <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Award size={16} color="#f59e0b" />
              <Text style={styles.trustText}>Trusted by 10,000+ Nepalis</Text>
            </View>
            <View style={styles.trustItem}>
              <Globe size={16} color="#10b981" />
              <Text style={styles.trustText}>Available on Web • iOS • Android</Text>
            </View>
          </View>
        </Animated.View>

        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.patternDot,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.1, 0.3, 0.1],
                  }),
                  transform: [
                    {
                      scale: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.5, 1, 0.5],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagline: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  slidesContainer: {
    height: 400,
    overflow: 'hidden',
    marginBottom: 20,
    borderRadius: 24,
  },
  slidesWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  sparkle: {
    position: 'absolute',
    top: -15,
    right: -15,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 32,
    height: 12,
    borderRadius: 6,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  actionButtons: {
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  trustSection: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});