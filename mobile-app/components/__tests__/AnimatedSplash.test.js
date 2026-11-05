import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create } from 'react-test-renderer';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import AnimatedSplash from '../AnimatedSplash';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';

const mockListeners = {};
const mockPlayer = {
  status: 'readyToPlay',
  currentTime: 0,
  play: jest.fn(),
  addListener: jest.fn((event, listener) => {
    mockListeners[event] = listener;
    return { remove: jest.fn() };
  }),
};
const mockVideoView = jest.fn(() => null);

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: (...args) => mockVideoView(...args),
}));
jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Success: 'success' },
  notificationAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('AnimatedSplash', () => {
  let renderer;
  let reduceMotionSpy;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    mockVideoView.mockClear();
    Object.keys(mockListeners).forEach(key => delete mockListeners[key]);
    mockPlayer.status = 'readyToPlay';
    reduceMotionSpy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    renderer = undefined;
    reduceMotionSpy.mockRestore();
  });

  it('fires the success haptic once when playback reaches the glow timestamp', async () => {
    await act(async () => {
      renderer = create(React.createElement(AnimatedSplash, { onFinish: jest.fn() }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    await act(async () => mockListeners.timeUpdate({ currentTime: 3.04 }));
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    await act(async () => mockListeners.timeUpdate({ currentTime: 3.05 }));
    await act(async () => mockListeners.timeUpdate({ currentTime: 3.1 }));

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('keeps the native splash visible until the video renders its first frame', async () => {
    await act(async () => {
      renderer = create(React.createElement(AnimatedSplash, {
        onFinish: jest.fn(),
        manageNativeSplash: true,
      }));
      await Promise.resolve();
    });

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    mockVideoView.mock.calls[mockVideoView.mock.calls.length - 1][0].onFirstFrameRender();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});
