import Constants from 'expo-constants';

const APP_DOMAIN = (Constants.expoConfig?.extra?.APP_DOMAIN || 'hisabbarabar.qzz.io')
  .replace(/^https?:\/\//i, '')
  .replace(/\/+$/, '');

export const buildInviteUrl = (groupId: string, inviteLink?: string) => {
  if (inviteLink && !/localhost|127\.0\.0\.1/i.test(inviteLink)) {
    return /^https?:\/\//i.test(inviteLink)
      ? inviteLink
      : `https://${inviteLink.replace(/^\/+/, '')}`;
  }

  return `https://${APP_DOMAIN}/join/${groupId}`;
};

export const normalizeInviteCode = (code: string) => code.trim().toUpperCase();
