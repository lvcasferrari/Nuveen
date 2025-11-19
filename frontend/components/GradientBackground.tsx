import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface GradientBackgroundProps {
  theme?: 'dawn' | 'amber' | 'warm' | 'dark';
  animated?: boolean;
  children?: React.ReactNode;
}

const GRADIENT_THEMES = {
  dawn: ['#F4C07A', '#EAA85B', '#F4C07A'],
  amber: ['#EAA85B', '#F4C07A', '#EAA85B'],
  warm: ['#F4C07A', '#D7D3CC', '#F4C07A'],
  dark: ['#0C0C0C', '#1A1A1A', '#0C0C0C'],
};

const { width, height } = Dimensions.get('window');

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  theme = 'dawn',
  animated = false,
  children,
}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withTiming(0.7, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, animated && animatedStyle]}>
        <LinearGradient
          colors={GRADIENT_THEMES[theme]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
});