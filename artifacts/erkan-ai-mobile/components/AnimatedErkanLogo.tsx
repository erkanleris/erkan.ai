import React, { useEffect } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import colors from '@/constants/colors';

type AnimatedErkanLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'main' | 'circular';
};

/**
 * The shared ERKAN AI mark. The web app uses a pulsing halo, a glass disc,
 * and a continuously rotating neon ring; keeping those layers together here
 * prevents individual screens from drifting into different logo treatments.
 */
export function AnimatedErkanLogo({ size = 154, style, testID, variant = 'main' }: AnimatedErkanLogoProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 5000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
    };
  }, [pulse, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.76 + pulse.value * 0.24,
    transform: [{ scale: 1 + pulse.value * 0.06 }],
  }));

  const haloSize = size + 28;
  const midSize = size - 8;
  const glassSize = Math.max(24, size - 38);
  const ringWidth = size >= 100 ? 2 : 1.5;

  return (
    <View testID={testID} style={[styles.root, { width: size, height: size }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.haloOuter,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            left: (size - haloSize) / 2,
            top: (size - haloSize) / 2,
          },
          haloStyle,
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.haloMid,
          {
            width: midSize,
            height: midSize,
            borderRadius: midSize / 2,
            left: (size - midSize) / 2,
            top: (size - midSize) / 2,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
            left: 0,
            top: 0,
          },
          ringStyle,
        ]}
      />
      <View
        style={[
          styles.glass,
          {
            width: glassSize,
            height: glassSize,
            borderRadius: glassSize / 2,
            left: (size - glassSize) / 2,
            top: (size - glassSize) / 2,
          },
        ]}
      >
        <Image
          source={variant === 'circular'
            ? require('../assets/images/erkan-ai-circular-logo.png')
            : require('../assets/images/erkan-ai-main-logo.png')}
          style={{ width: glassSize, height: glassSize, borderRadius: glassSize / 2 }}
          resizeMode="cover"
          accessible
          accessibilityLabel="شعار ERKAN AI"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    backgroundColor: '#a855f72e',
    shadowColor: colors.light.primary,
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  haloMid: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#a855f738',
    shadowColor: colors.light.primary,
    shadowOpacity: 0.7,
    shadowRadius: 20,
  },
  ring: {
    position: 'absolute',
    borderTopColor: colors.light.primary,
    borderRightColor: '#a855f7',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    shadowColor: colors.light.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  glass: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#10183aeb',
    borderWidth: 1,
    borderColor: '#1f8bff38',
    shadowColor: colors.light.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 5,
  },
});