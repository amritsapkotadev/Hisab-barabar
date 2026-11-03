import React from 'react';
import { act, create } from 'react-test-renderer';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import WelcomeScreen from '../../app/welcome';

let mockDark = false;
let mockDimensions;
const mockSetPreference = jest.fn();
jest.mock('expo-blur', () => {
  throw new Error('Welcome must render without a native blur module');
});
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockDimensions,
}));
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: mockDark, setPreference: mockSetPreference }),
  useThemedStyles: createStyles => {
    const { COLORS, DARK_COLORS } = require('@/constants/theme');
    const colors = mockDark ? DARK_COLORS : COLORS;
    return { colors, styles: createStyles(colors) };
  },
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('welcome screen', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.useFakeTimers();
    mockDark = false;
    jest.clearAllMocks();
    mockSetPreference.mockImplementation(async preference => {
      mockDark = preference === 'dark';
      return true;
    });
    AsyncStorage.getItem.mockResolvedValue(null);
    mockDimensions = { width: 360, height: 640, scale: 1, fontScale: 1 };
    jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const progress = () => renderer.root.findByProps({ accessibilityLabel: 'Welcome progress' });
  const next = async () => {
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Next slide' }).props.onPress());
  };

  it('redirects returning visitors to login before showing welcome', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    await act(async () => { renderer = create(<WelcomeScreen />); });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('hasSeenWelcome');
    expect(router.replace).toHaveBeenCalledWith('/login');
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Next slide' })).toHaveLength(0);
  });

  it('shows a retry action when it cannot read the welcome flag', async () => {
    const error = new Error('Storage unavailable');
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValueOnce(error).mockResolvedValueOnce(null);

    await act(async () => { renderer = create(<WelcomeScreen />); });
    expect(log).toHaveBeenCalledWith('Failed to check welcome status:', error);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Welcome',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Retry' })]),
    );
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Next slide' })).toHaveLength(0);

    await act(async () => {
      Alert.alert.mock.calls[0][2][0].onPress();
      await Promise.resolve();
    });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Next slide' })).toBeDefined();
  });

  it.each([false, true])('shows five focused slides with compact progress (dark=%s)', async dark => {
    mockDark = dark;
    await act(async () => { renderer = create(<WelcomeScreen />); });

    expect(progress().props.accessibilityValue).toEqual({ min: 1, max: 5, now: 1, text: 'Slide 1 of 5' });
    const { COLORS, DARK_COLORS } = require('@/constants/theme');
    const colors = dark ? DARK_COLORS : COLORS;
    const slideCard = renderer.root.findAllByType(View).find(node => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.width === '100%' && style?.flex === 1 && style?.borderRadius === 24;
    });
    expect(StyleSheet.flatten(renderer.root.findAllByType(ScrollView)[0].props.style).backgroundColor)
      .toBe(colors.background);
    expect(StyleSheet.flatten(slideCard.props.style).backgroundColor)
      .toBe(colors.card);
    expect(StyleSheet.flatten(renderer.root.findByProps({ accessibilityLabel: 'Next slide' }).props.style).backgroundColor)
      .toBe(colors.action);
    expect(StyleSheet.flatten(progress().props.style)).toMatchObject({
      position: 'absolute', top: 20, right: 20, gap: 5,
    });
    expect(progress().findAllByType(View)
      .filter(node => StyleSheet.flatten(node.props.style)?.height === 6)).toHaveLength(5);
    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(2);
    expect(renderer.root.findByType(Image).props.source).toEqual(require('../../assets/images/new_logo.png'));
    const text = renderer.root.findAllByType(Text).map(node => node.props.children).join(' ');
    expect(text).toContain('Save expenses offline');
    expect(text).toContain('Choose English or Nepali');
    expect(text).toContain('percentages or shares');
    expect(text).not.toMatch(/Why choose|Bank-level|eSewa|Made with|Web, iOS|A little clarity|A lot less hassle|simplified/);
  });

  it('selects slides accessibly and resizes them within the side gutters', async () => {
    await act(async () => { renderer = create(<WelcomeScreen />); });
    await next();
    await next();
    expect(progress().props.accessibilityValue.now).toBe(3);
    expect(ScrollView.prototype.scrollTo).toHaveBeenLastCalledWith({ x: 624, animated: true });

    const slides = () => renderer.root.findAllByType(View)
      .filter(node => node.props.importantForAccessibility !== undefined);
    expect(slides().filter(node => node.props.importantForAccessibility === 'auto')).toHaveLength(1);
    expect(StyleSheet.flatten(slides()[0].props.style).width).toBe(312);
    expect(StyleSheet.flatten(slides()[0].props.style).height).toBeGreaterThanOrEqual(400);
    mockDimensions = { ...mockDimensions, width: 768 };
    await act(async () => renderer.update(<WelcomeScreen />));
    expect(StyleSheet.flatten(slides()[0].props.style).width).toBe(720);
    expect(ScrollView.prototype.scrollTo).toHaveBeenLastCalledWith({ x: 1440, animated: true });
  });

  it.each([false, true])('switches the saved theme without changing slides (dark=%s)', async dark => {
    mockDark = dark;
    await act(async () => { renderer = create(<WelcomeScreen />); });
    await next();
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    const button = renderer.root.findByProps({ accessibilityLabel: label });
    expect(button.props.accessibilityRole).toBe('button');
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({ minWidth: 44, minHeight: 44 });

    await act(async () => button.props.onPress());
    expect(mockSetPreference).toHaveBeenCalledWith(dark ? 'light' : 'dark');
    await act(async () => renderer.update(<WelcomeScreen />));

    const { COLORS, DARK_COLORS } = require('@/constants/theme');
    expect(StyleSheet.flatten(renderer.root.findAllByType(ScrollView)[0].props.style).backgroundColor)
      .toBe(dark ? COLORS.background : DARK_COLORS.background);
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe(dark ? 'dark-content' : 'light-content');
    expect(renderer.root.findByProps({
      accessibilityLabel: dark ? 'Switch to dark mode' : 'Switch to light mode',
    })).toBeDefined();
    expect(progress().props.accessibilityValue.now).toBe(2);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('updates the dots after a swipe and never automatically advances', async () => {
    await act(async () => { renderer = create(<WelcomeScreen />); });
    const carousel = renderer.root.findAllByType(ScrollView).find(node => node.props.horizontal);
    expect(carousel.props.pagingEnabled).toBe(true);
    await act(async () => carousel.props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: 936 } },
    }));
    expect(progress().props.accessibilityValue.now).toBe(4);
    await act(async () => jest.advanceTimersByTime(60000));
    expect(progress().props.accessibilityValue.now).toBe(4);
  });

  it.each([
    ['Get started', '/login'],
  ])('preserves the %s action', async (label, route) => {
    await act(async () => { renderer = create(<WelcomeScreen />); });
    if (label === 'Get started') {
      for (let index = 0; index < 4; index += 1) await next();
    }
    await act(async () => renderer.root.findByProps({ accessibilityLabel: label }).props.onPress());
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasSeenWelcome', 'true');
    expect(router.replace).toHaveBeenCalledWith(route);
  });

  it('advances with the bottom arrow and offers signup on the last slide', async () => {
    await act(async () => { renderer = create(<WelcomeScreen />); });
    for (let index = 1; index < 5; index += 1) {
      await next();
      expect(progress().props.accessibilityValue.now).toBe(index + 1);
    }
    expect(renderer.root.findByProps({ accessibilityLabel: 'Get started' })).toBeDefined();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('goes back one slide without navigating to login and disables Back on the first slide', async () => {
    await act(async () => { renderer = create(<WelcomeScreen />); });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Back' }).props.disabled).toBe(true);
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Next slide' }).props.onPress());
    expect(renderer.root.findByProps({ accessibilityLabel: 'Back' }).props.disabled).toBe(false);
    await act(async () => renderer.root.findByProps({ accessibilityLabel: 'Back' }).props.onPress());
    expect(progress().props.accessibilityValue.now).toBe(1);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
