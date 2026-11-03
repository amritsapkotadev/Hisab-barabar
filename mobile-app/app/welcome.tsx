import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Users, WifiOff, Languages, Wallet, Check, Percent, Sun, Moon } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useAppAlert } from '@/contexts/AppAlertContext';

const HORIZONTAL_PADDING = 24;

type Slide = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export default function WelcomeScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { isDark, setPreference } = useTheme();
  const showAlert = useAppAlert();
  const { width, height, fontScale } = useWindowDimensions();
  const slideWidth = Math.max(width - HORIZONTAL_PADDING * 2, 0);
  const slideHeight = Math.max(560 * fontScale, height * 0.62);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const carouselRef = useRef<ScrollView>(null);

  const slides: Slide[] = [
    {
      id: 1,
      title: 'Shared expenses',
      description: 'Split group expenses and see who owes what, from everyday bills to your next trip.',
      icon: <Users size={96} strokeWidth={1.5} color={COLORS.text} />,
    },
    {
      id: 2,
      title: 'Personal spending',
      description: 'Track personal expenses alongside shared bills, all in one place.',
      icon: <Wallet size={96} strokeWidth={1.5} color={COLORS.text} />,
    },
    {
      id: 3,
      title: 'Offline access',
      description: 'Save expenses offline and sync when you reconnect. Sign in online to get started.',
      icon: <WifiOff size={96} strokeWidth={1.5} color={COLORS.text} />,
    },
    {
      id: 4,
      title: 'English & Nepali',
      description: 'Choose English or Nepali in Settings and make the app feel like yours.',
      icon: <Languages size={96} strokeWidth={1.5} color={COLORS.text} />,
    },
    {
      id: 5,
      title: 'Flexible splits',
      description: 'Split equally, by exact amounts, percentages or shares, so everyone pays their fair part.',
      icon: <Percent size={96} strokeWidth={1.5} color={COLORS.text} />,
    },
  ];

  useEffect(() => {
    let active = true;
    const checkWelcomeStatus = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
        if (!active) return;
        if (hasSeenWelcome === 'true') {
          router.replace('/login');
          return;
        }
        setWelcomeChecked(true);
      } catch (error) {
        console.error('Failed to check welcome status:', error);
        if (!active) return;
        showAlert('Welcome', 'Unable to check whether this screen has already been shown.', [
          { text: 'Retry', onPress: () => { void checkWelcomeStatus(); } },
        ]);
      }
    };
    void checkWelcomeStatus();
    return () => { active = false; };
  }, [showAlert]);

  useEffect(() => {
    carouselRef.current?.scrollTo({ x: currentSlide * slideWidth, animated: true });
  }, [currentSlide, slideWidth]);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/login');
  };

  const renderSlide = (slide: Slide) => (
    <View
      key={slide.id}
      style={[styles.slide, { width: slideWidth, height: slideHeight }]}
      accessibilityElementsHidden={currentSlide !== slide.id - 1}
      importantForAccessibility={currentSlide === slide.id - 1 ? 'auto' : 'no-hide-descendants'}
    >
      <View style={styles.slideCard}>
        <View style={styles.illustration} accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={styles.halo} />
          <View style={styles.iconContainer}>{slide.icon}</View>
          <View style={styles.checkBadge}>
            <Check size={24} color={COLORS.actionText} />
          </View>
          <View style={styles.illustrationBase} />
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View
      style={styles.dotsContainer}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Welcome progress"
      accessibilityValue={{ min: 1, max: slides.length, now: currentSlide + 1, text: `Slide ${currentSlide + 1} of ${slides.length}` }}
    >
      {slides.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, currentSlide === index && styles.activeDot]}
        />
      ))}
    </View>
  );

  if (!welcomeChecked) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.action} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/new_logo.png')} style={styles.logoImage} accessible={false} />
              <Text style={styles.logoText}>Hisab Barabar</Text>
            </View>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={() => { void setPreference(isDark ? 'light' : 'dark'); }}
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun size={22} color={COLORS.text} accessible={false} />
                : <Moon size={22} color={COLORS.text} accessible={false} />}
            </TouchableOpacity>
          </View>

          {/* Slides */}
          <View style={styles.carousel}>
          <ScrollView
            ref={carouselRef}
            style={[styles.slidesContainer, { height: slideHeight }]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={({ nativeEvent }) => {
              if (slideWidth > 0) {
                setCurrentSlide(Math.max(0, Math.min(
                  slides.length - 1,
                  Math.round(nativeEvent.contentOffset.x / slideWidth),
                )));
              }
            }}
          >
            {slides.map((slide) => renderSlide(slide))}
          </ScrollView>

          {renderDots()}
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentSlide(previous => Math.max(0, previous - 1))}
              disabled={currentSlide === 0}
              accessibilityRole="button"
              accessibilityLabel="Back"
              accessibilityState={{ disabled: currentSlide === 0 }}
            >
              <Text style={[styles.secondaryButtonText, currentSlide === 0 && styles.disabledText]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={currentSlide === slides.length - 1
                ? handleGetStarted
                : () => setCurrentSlide(previous => previous + 1)}
              accessibilityRole="button"
              accessibilityLabel={currentSlide === slides.length - 1 ? 'Get started' : 'Next slide'}
            >
              {currentSlide === slides.length - 1 && <Text style={styles.primaryButtonText}>Get started</Text>}
              <ArrowRight size={24} color={COLORS.actionText} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  logoText: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.8,
  },
  themeButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
  },
  slidesContainer: {
    flexGrow: 0,
    overflow: 'hidden',
  },
  carousel: {
    position: 'relative',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideCard: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    maxWidth: 280,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.surfaceSecondary,
  },
  iconContainer: {
    width: 148,
    height: 148,
    borderRadius: 36,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: '-6deg' }],
  },
  checkBadge: {
    position: 'absolute',
    right: 28,
    bottom: 40,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.action,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  illustrationBase: {
    position: 'absolute',
    bottom: 0,
    width: 120,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
    fontFamily: 'Inter-Bold',
  },
  slideDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  dotsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    padding: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSecondary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.action,
  },
  actionButtons: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
    minWidth: 56,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 999,
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
    paddingRight: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.4,
  },
});
