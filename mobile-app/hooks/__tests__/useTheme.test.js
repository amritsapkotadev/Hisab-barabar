import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { ThemeProvider, useTheme, useThemedStyles } from '../useTheme';
import { COLORS, DARK_COLORS } from '../../constants/theme';

let mockScheme = 'light';
const mockThemedAlert = jest.fn(() => null);
jest.mock('react-native', () => ({
  useColorScheme: () => mockScheme,
  Appearance: { setColorScheme: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('@/i18n', () => ({ t: key => key }));
jest.mock('@/components/ThemedAlert', () => ({
  __esModule: true,
  default: props => {
    mockThemedAlert(props);
    return null;
  },
}));

const createStyles = colors => ({ backgroundColor: colors.background });
let theme;
let styles;
function Probe() {
  theme = useTheme();
  styles = useThemedStyles(createStyles).styles;
  return null;
}

describe('ThemeProvider', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    mockScheme = 'light';
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    jest.restoreAllMocks();
  });

  async function mount() {
    await act(async () => {
      renderer = create(<ThemeProvider><Probe /></ThemeProvider>);
    });
  }

  it('defaults to light on first use and follows the device when System is selected', async () => {
    mockScheme = 'dark';
    await mount();
    expect(theme.preference).toBe('light');
    expect(theme.isDark).toBe(false);
    expect(styles.backgroundColor).toBe(COLORS.background);
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('light');

    await act(async () => { await theme.setPreference('system'); });
    expect(theme.preference).toBe('system');
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith(null);
    expect(styles.backgroundColor).toBe(DARK_COLORS.background);

    mockScheme = 'light';
    await act(async () => renderer.update(<ThemeProvider><Probe /></ThemeProvider>));
    expect(styles.backgroundColor).toBe(COLORS.background);
  });

  it('restores a previously saved System preference', async () => {
    AsyncStorage.getItem.mockResolvedValue('system');
    mockScheme = 'dark';
    await mount();
    expect(theme.preference).toBe('system');
    expect(theme.isDark).toBe(true);
    expect(styles.backgroundColor).toBe(DARK_COLORS.background);
    mockScheme = 'light';
    await act(async () => renderer.update(<ThemeProvider><Probe /></ThemeProvider>));
    expect(theme.isDark).toBe(false);
    expect(styles.backgroundColor).toBe(COLORS.background);
    expect(Appearance.setColorScheme).toHaveBeenCalledWith(null);
  });

  it('restores the saved override and persists subsequent selections', async () => {
    AsyncStorage.getItem.mockResolvedValue('dark');
    await mount();
    expect(theme.isDark).toBe(true);
    await act(async () => { await theme.setPreference('light'); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('appearance', 'light');
    expect(theme.isDark).toBe(false);
    expect(styles.backgroundColor).toBe(COLORS.background);
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('light');
    await act(async () => { await theme.setPreference('system'); });
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith(null);
  });

  it('reports storage failures without pretending to save the preference', async () => {
    await mount();
    const error = new Error('Storage unavailable');
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.setItem.mockRejectedValue(error);
    let saved;
    await act(async () => { saved = await theme.setPreference('dark'); });
    expect(saved).toBe(false);
    expect(theme.preference).toBe('light');
    expect(log).toHaveBeenCalledWith('Failed to save appearance:', error);
    expect(mockThemedAlert.mock.calls.at(-1)[0].alert).toMatchObject({
      title: 'settings.theme',
      message: 'settings.saveAppearanceFailed',
      buttons: [{ text: 'OK' }],
    });
  });

  it('reports restore failures and falls back to light', async () => {
    const error = new Error('Storage unavailable');
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    AsyncStorage.getItem.mockRejectedValue(error);
    mockScheme = 'dark';
    await mount();
    expect(theme.preference).toBe('light');
    expect(theme.isDark).toBe(false);
    expect(styles.backgroundColor).toBe(COLORS.background);
    expect(log).toHaveBeenCalledWith('Failed to restore appearance:', error);
    expect(mockThemedAlert.mock.calls.at(-1)[0].alert).toMatchObject({
      title: 'settings.theme',
      message: 'settings.restoreAppearanceFailed',
      buttons: [{ text: 'OK' }],
    });
  });
});
