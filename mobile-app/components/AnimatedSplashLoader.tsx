import React, { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const AnimatedSplash = lazy(() => import('./AnimatedSplash'));

type Props = {
  onFinish: () => void;
  replayOnTap?: boolean;
  manageNativeSplash?: boolean;
  fallback?: ReactNode;
};

type State = { failed: boolean };

export default class AnimatedSplashLoader extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error('Animated splash could not load:', error);
    this.props.onFinish();
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;

    return (
      <Suspense
        fallback={
          <View style={styles.loading}>
            <StatusBar style="light" backgroundColor="#000000" />
          </View>
        }
      >
        <AnimatedSplash
          onFinish={this.props.onFinish}
          replayOnTap={this.props.replayOnTap}
          manageNativeSplash={this.props.manageNativeSplash}
        />
      </Suspense>
    );
  }
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999,
  },
});
