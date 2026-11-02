import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Users, Calculator, Shield, Smartphone, Star, Heart, CircleCheck as CheckCircle, Zap, Award, Globe, PieChart } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

type Slide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
};

export default function WelcomeScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slides: Slide[] = [
    {
      id: 1,
      title: 'Welcome to Hisab Barabar',
      subtitle: 'Smart expense sharing for Nepal',
      description: 'Split bills, track expenses, and settle up with friends and family — all in one place.',
      icon: <Heart size={64} color={COLORS.text} />,
    },
    {
      id: 2,
      title: 'Create groups effortlessly',
      subtitle: 'Organize your shared expenses',
      description: 'Create groups for trips, roommate expenses, family gatherings, or any shared costs. Invite members with a simple link.',
      icon: <Users size={64} color={COLORS.text} />,
    },
    {
      id: 3,
      title: 'Smart expense splitting',
      subtitle: 'Fair and transparent, always',
      description: 'Split expenses equally or customize splits by amount, percentage, or shares.',
      icon: <Calculator size={64} color={COLORS.text} />,
    },
    {
      id: 4,
      title: 'Settle up instantly',
      subtitle: 'Seamless digital payments',
      description: 'Send and receive money directly with eSewa integration.',
      icon: <Smartphone size={64} color={COLORS.text} />,
    },
    {
      id: 5,
      title: 'Bank-level security',
      subtitle: 'Your data is protected',
      description: 'Your financial data is encrypted and never shared with third parties.',
      icon: <Shield size={64} color={COLORS.text} />,
    },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentSlide,
      tension: 80,
      friction: 10,
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

  const renderSlide = (slide: Slide) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <View style={styles.slideCard}>
        <View style={styles.iconContainer}>
          {slide.icon}
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
      </View>
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
          ]}
          onPress={() => setCurrentSlide(index)}
          accessibilityRole="button"
          accessibilityLabel={`Slide ${index + 1}`}
        />
      ))}
    </View>
  );

  const features = [
    { icon: <CheckCircle size={22} color={COLORS.positive} />, title: '100% Free', subtitle: 'Always' },
    { icon: <Star size={22} color={COLORS.warning} />, title: 'Easy setup', subtitle: 'In minutes' },
    { icon: <Shield size={22} color={COLORS.text} />, title: 'Secure', subtitle: 'Bank-level' },
    { icon: <Zap size={22} color={COLORS.text} />, title: 'Fast', subtitle: 'Lightning' },
  ];

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <PieChart size={36} color={COLORS.text} />
              <Text style={styles.logoText}>Hisab Barabar</Text>
            </View>
            <View style={styles.taglineContainer}>
              <Text style={styles.tagline}>Made with </Text>
              <Heart size={13} color={COLORS.negative} />
              <Text style={styles.tagline}> in Nepal</Text>
            </View>
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
              {slides.map((slide) => renderSlide(slide))}
            </Animated.View>
          </View>

          {renderDots()}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Why choose Hisab Barabar?</Text>
            <View style={styles.featuresGrid}>
              {features.map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <View style={styles.featureIcon}>{f.icon}</View>
                  <Text style={styles.featureText}>{f.title}</Text>
                  <Text style={styles.featureSubtext}>{f.subtitle}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted} accessibilityRole="button" accessibilityLabel="Get started">
              <Text style={styles.primaryButtonText}>Get started free</Text>
              <ArrowRight size={20} color={COLORS.actionText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn} accessibilityRole="button" accessibilityLabel="Sign in">
              <Text style={styles.secondaryButtonText}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>

          {/* Trust */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Award size={15} color={COLORS.warning} />
              <Text style={styles.trustText}>Built for Nepal</Text>
            </View>
            <View style={styles.trustItem}>
              <Globe size={15} color={COLORS.positive} />
              <Text style={styles.trustText}>Web, iOS and Android</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.8,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  slidesContainer: {
    height: 380,
    overflow: 'hidden',
    marginBottom: 20,
    borderRadius: 16,
  },
  slidesWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 28,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
    fontFamily: 'Inter-Bold',
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  slideDescription: {
    fontSize: 15,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.action,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'Inter-Bold',
  },
  featureSubtext: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.actionText,
    fontFamily: 'Inter-Bold',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  trustSection: {
    alignItems: 'center',
    paddingBottom: 32,
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
});
