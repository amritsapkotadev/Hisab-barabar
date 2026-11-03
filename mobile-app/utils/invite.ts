import Constants from 'expo-constants';

const APP_DOMAIN = (Constants.expoConfig?.extra?.APP_DOMAIN || 'hisabbarabar.qzz.io')
  .replace(/^https?:\/\//i, '')
  .replace(/\/+$/, '');

export const buildInviteQrUrl = (groupId: string) => `https://${APP_DOMAIN}/join/${groupId}`;

export const buildInviteUrl = (groupId: string, inviteLink?: string) => {
  if (inviteLink && !/localhost|127\.0\.0\.1/i.test(inviteLink)) {
    return /^https?:\/\//i.test(inviteLink)
      ? inviteLink
      : `https://${inviteLink.replace(/^\/+/, '')}`;
  }

  return buildInviteQrUrl(groupId);
};

export const normalizeInviteCode = (code: string) => code.trim().toUpperCase();

export const getGroupIdFromInviteQr = (value: string): string | null => {
  try {
    const url = new URL(value);
    const groupId = url.protocol === 'hisabbarabar:'
      ? url.hostname === 'join' && /^\/[a-f\d]{24}$/i.test(url.pathname)
        ? url.pathname.slice(1)
        : null
      : url.protocol === 'https:' &&
          url.hostname === new URL(`https://${APP_DOMAIN}`).hostname &&
          !url.port &&
          /^\/join\/[a-f\d]{24}$/i.test(url.pathname)
        ? url.pathname.split('/')[2]
        : null;

    return url.search || url.hash || url.username || url.password ? null : groupId;
  } catch {
    return null;
  }
};
