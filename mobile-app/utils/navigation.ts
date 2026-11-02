import type { Href } from 'expo-router';

export const resolvePostAuthRoute = (redirect?: string | string[]): Href => {
  const target = Array.isArray(redirect) ? redirect[0] : redirect;

  return (target && target.startsWith('/') ? target : '/(tabs)') as Href;
};
