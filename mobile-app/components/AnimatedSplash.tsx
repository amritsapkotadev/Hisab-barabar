import React, { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

// Tune these in Expo Go. Fast Refresh applies them on save.
const CONFIG = {
  hapticAt: 3.05, // seconds: the moment the green glow starts
  fadeOutMs: 350, // fade into the app after the video ends
  maxWaitMs: 7000, // safety: never block the app longer than this
};

type Props = { onFinish: () => void; replayOnTap?: boolean; manageNativeSplash?: boolean };

export default function AnimatedSplash({
  onFinish,
  replayOnTap = false,
  manageNativeSplash = false,
}: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const hapticFired = useRef(false);
  const finished = useRef(false);
  const nativeSplashHidden = useRef(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const player = useVideoPlayer(require("../assets/Coins_falling_into_scale_pan_368b9b62_1080p.mp4"), (p) => {
    p.loop = false;
    p.muted = true;
    p.timeUpdateEventInterval = 0.03;
  });

  const hideNativeSplash = useCallback(() => {
    if (!manageNativeSplash) return;
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    SplashScreen.hideAsync().catch(error => {
      nativeSplashHidden.current = false;
      console.error("Failed to hide native splash screen:", error);
    });
  }, [manageNativeSplash]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    hideNativeSplash();
    Animated.timing(opacity, {
      toValue: 0,
      duration: CONFIG.fadeOutMs,
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [hideNativeSplash, onFinish, opacity]);

  // Respect the system "reduce motion" setting: skip straight into the app.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      setReduceMotion(on);
      if (on) {
        hideNativeSplash();
        finish();
      }
    }).catch(error => {
      console.error("Failed to read reduced motion preference:", error);
      setReduceMotion(false);
    });
  }, [finish, hideNativeSplash]);

  useEffect(() => {
    const statusSub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "readyToPlay") {
        setVideoReady(true);
      }
      if (status === "error") {
        console.error("Splash video failed to load:", error);
        finish();
      }
    });

    const timeSub = player.addListener("timeUpdate", ({ currentTime }) => {
      if (reduceMotion === false && !hapticFired.current && currentTime >= CONFIG.hapticAt) {
        hapticFired.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(error => {
          console.error("Could not play splash haptic feedback:", error);
        });
      }
    });

    const endSub = player.addListener("playToEnd", finish);
    const guard = setTimeout(() => {
      console.warn("Splash video exceeded its playback timeout.");
      finish();
    }, CONFIG.maxWaitMs);
    if (player.status === "readyToPlay") {
      setVideoReady(true);
    } else if (player.status === "error") {
      console.error("Splash video failed to load.");
      finish();
    }

    return () => {
      statusSub.remove();
      timeSub.remove();
      endSub.remove();
      clearTimeout(guard);
    };
  }, [finish, player, reduceMotion]);

  useEffect(() => {
    if (reduceMotion === false && videoReady && !finished.current) {
      player.play();
    }
  }, [player, reduceMotion, videoReady]);

  const replay = () => {
    if (!__DEV__ || !replayOnTap) return;
    finished.current = false;
    hapticFired.current = false;
    opacity.setValue(1);
    player.currentTime = 0;
    player.play();
  };

  return (
    <Animated.View
      style={[styles.root, { opacity }]}
      pointerEvents={replayOnTap || !finished.current ? "auto" : "none"}
    >
      <StatusBar style="light" backgroundColor="#000000" />
      <Pressable style={StyleSheet.absoluteFill} onPress={replay}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          onFirstFrameRender={hideNativeSplash}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 999,
  },
});
