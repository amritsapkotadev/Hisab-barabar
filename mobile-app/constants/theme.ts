export const COLORS = {
  primary: '#6200EE',
  primaryLight: '#7C3AED',
  primaryDark: '#4C00B0',
  secondary: '#03DAC6',
  accent: '#FF6F00',

  success: '#0E7A5A',
  positive: '#0E7A5A',
  warning: '#E8A317',
  danger: '#C1272D',
  negative: '#C1272D',

  background: '#FFFEFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  surfaceSecondary: '#F6F5F0',
  surfaceMuted: '#EFEEE8',

  text: '#1A1B25',
  textSecondary: '#55565F',
  subtext: '#55565F',
  textTertiary: '#8B8C96',
  muted: '#6F707A',

  border: '#E6E5E0',
  borderLight: '#F0EFEA',
  borderStrong: '#D6D5D0',

  action: '#1A1B25',
  actionText: '#FFFFFF',
  actionPressed: '#33343E',
  switchTrackOn: '#1A1B25',
  switchTrackOff: '#D6D5D0',
  switchThumb: '#FFFFFF',

  shadow: 'rgba(26, 27, 37, 0.06)',
  glass: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(26, 27, 37, 0.08)',
  overlay: 'rgba(26, 27, 37, 0.45)',

  gradient1: ['#6200EE', '#7C3AED'],
  gradient2: ['#0E7A5A', '#14936D'],
  gradient3: ['#1A1B25', '#33343E'],
  gradient4: ['#E8A317', '#F2B93B'],
  gradient5: ['#C1272D', '#D9444A'],
  gradient6: ['#55565F', '#8B8C96'],
  headerGradient: ['#1A1B25', '#33343E'],
  summaryCard1: '#1A1B25',
  summaryCard2: '#33343E',
  summaryCard3: '#55565F',
  fab: ['#1A1B25', '#33343E'],
  chip: '#F0EDFA',
  progressBg: '#EFEEE8',
  toggleInactive: '#E6E5E0',
  greetingBg1: '#FFFEFB',
  greetingBg2: '#F6F5F0',
  gradientStart: '#1A1B25',
  gradientEnd: '#33343E',
  iconBackgrounds: ['#6200EE', '#0E7A5A', '#E8A317', '#C1272D', '#1A1B25', '#55565F'],
} as const;

export type ThemeColors = {
  [K in keyof typeof COLORS]: (typeof COLORS)[K] extends readonly string[] ? readonly string[] : string;
};

export const DARK_COLORS: ThemeColors = {
  ...COLORS,
  primary: '#B69AFF',
  primaryLight: '#C8B2FF',
  primaryDark: '#9575E8',
  success: '#63C99D',
  positive: '#63C99D',
  negative: '#FF8F98',
  danger: '#FF8F98',
  background: '#121318',
  surface: '#1C1D24',
  card: '#1C1D24',
  surfaceSecondary: '#272831',
  surfaceMuted: '#30313B',
  text: '#F3F2F7',
  textSecondary: '#C0BFCA',
  subtext: '#C0BFCA',
  textTertiary: '#A5A4B1',
  muted: '#A5A4B1',
  border: '#393A45',
  borderLight: '#2D2E38',
  borderStrong: '#4C4D5B',
  action: '#F3F2F7',
  actionText: '#1A1B25',
  actionPressed: '#D7D6DF',
  switchTrackOn: '#9575E8',
  switchTrackOff: '#4C4D5B',
  switchThumb: '#F3F2F7',
  shadow: 'rgba(0, 0, 0, 0.3)',
  glass: 'rgba(28, 29, 36, 0.95)',
  glassBorder: 'rgba(243, 242, 247, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.65)',
  chip: '#342C49',
  progressBg: '#30313B',
  toggleInactive: '#393A45',
  greetingBg1: '#121318',
  greetingBg2: '#272831',
};

export type ThemePreference = 'system' | 'light' | 'dark';

export function resolveTheme(preference: ThemePreference, system: 'light' | 'dark' | null | undefined) {
  return preference === 'system' ? system ?? 'light' : preference;
}
