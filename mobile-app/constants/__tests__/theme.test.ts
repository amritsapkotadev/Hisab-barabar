import { COLORS, DARK_COLORS, resolveTheme } from '../theme';

describe('appearance', () => {
  it('follows the device only in system mode', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('system', null)).toBe('light');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });

  it('keeps both palettes complete and readable', () => {
    expect(Object.keys(DARK_COLORS).sort()).toEqual(Object.keys(COLORS).sort());
    expect(DARK_COLORS.text).not.toBe(DARK_COLORS.background);
    expect(DARK_COLORS.action).not.toBe(DARK_COLORS.actionText);
  });
});
