import { resolvePostAuthRoute } from '../navigation';

describe('resolvePostAuthRoute', () => {
  it('defaults to the tabs route', () => {
    expect(resolvePostAuthRoute()).toBe('/(tabs)');
  });

  it('keeps an absolute app route', () => {
    expect(resolvePostAuthRoute('/join/abc')).toBe('/join/abc');
  });

  it('uses the first value of an array', () => {
    expect(resolvePostAuthRoute(['/join/abc', '/other'])).toBe('/join/abc');
  });

  it('rejects external and relative targets', () => {
    expect(resolvePostAuthRoute('https://evil.test')).toBe('/(tabs)');
    expect(resolvePostAuthRoute('join/abc')).toBe('/(tabs)');
  });
});
