import React from 'react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { apiService, setUnauthorizedHandler } from '@/services/api';
import { migrateLegacyAuthToken } from '@/services/tokenStorage';
import { setNotificationAccount } from '@/services/notificationInbox';

jest.mock('@/services/api', () => ({
  apiService: { setAuthToken: jest.fn(), clearAuthToken: jest.fn(), getUserProfile: jest.fn() },
  setUnauthorizedHandler: jest.fn(),
}));
jest.mock('@/services/tokenStorage', () => ({ migrateLegacyAuthToken: jest.fn() }));
jest.mock('@/services/notificationInbox', () => ({ setNotificationAccount: jest.fn() }));

let auth;
function Consumer() {
  auth = useAuth();
  return null;
}

describe('notification account lifecycle', () => {
  let renderer;
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    migrateLegacyAuthToken.mockResolvedValue(null);
    setNotificationAccount.mockResolvedValue(undefined);
    apiService.getUserProfile.mockResolvedValue({ id: 'user-1' });
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = null;
  });
  const mount = async () => {
    await act(async () => { renderer = create(<AuthProvider><Consumer /></AuthProvider>); });
  };

  it('clears the device binding without credentials and binds restored sessions', async () => {
    await mount();
    expect(setNotificationAccount).toHaveBeenCalledWith(null);
    await act(async () => renderer.unmount());
    migrateLegacyAuthToken.mockResolvedValue('stored-token');
    await mount();
    expect(setNotificationAccount).toHaveBeenLastCalledWith('user-1');
    expect(auth.status).toBe('authenticated');
  });

  it('binds logins with and without a provided profile, and unbinds sign-out', async () => {
    await mount();
    await act(async () => auth.signIn('token', { id: 'user-2' }));
    expect(setNotificationAccount).toHaveBeenLastCalledWith('user-2');
    expect(apiService.getUserProfile).not.toHaveBeenCalled();
    await act(async () => auth.signIn('otp-token'));
    expect(setNotificationAccount).toHaveBeenLastCalledWith('user-1');
    expect(auth.user.id).toBe('user-1');
    await act(async () => auth.signOut());
    expect(setNotificationAccount).toHaveBeenLastCalledWith(null);
    expect(auth.status).toBe('unauthenticated');
  });

  it('clears the notification binding when the authenticated session expires', async () => {
    await mount();
    await act(async () => auth.signIn('token', { id: 'user-1' }));
    await act(async () => setUnauthorizedHandler.mock.calls[0][0]());
    expect(setNotificationAccount).toHaveBeenLastCalledWith(null);
    expect(auth.user).toBe(null);
  });

  it('still clears auth when notification storage fails during sign-out', async () => {
    await mount();
    await act(async () => auth.signIn('token', { id: 'user-1' }));
    setNotificationAccount.mockRejectedValueOnce(new Error('Storage unavailable'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => auth.signOut());
    expect(apiService.clearAuthToken).toHaveBeenCalled();
    expect(auth.status).toBe('unauthenticated');
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('does not destroy a valid restored session when inbox binding fails', async () => {
    migrateLegacyAuthToken.mockResolvedValue('stored-token');
    setNotificationAccount.mockRejectedValueOnce(new Error('Storage unavailable'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    await mount();
    expect(auth.status).toBe('authenticated');
    expect(apiService.clearAuthToken).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('finishes sign-in when only notification storage is unavailable', async () => {
    await mount();
    setNotificationAccount.mockRejectedValueOnce(new Error('Storage unavailable'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => auth.signIn('token', { id: 'user-1' }));
    expect(auth.status).toBe('authenticated');
    expect(auth.user.id).toBe('user-1');
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
