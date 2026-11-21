import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PulsingGlow } from './PulsingGlow';

const AMBER = '#F4C07A';
const SIZE = 220;

export type ArtKind = 'sunrise' | 'tag' | 'volume' | 'bell';

// Brand signature: a half-sun rising over a horizon line.
const Sunrise = () => {
  const rise = useSharedValue(SIZE / 2);
  useEffect(() => {
    rise.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2600, easing: Easing.out(Easing.cubic) }),
        withDelay(1200, withTiming(SIZE / 2, { duration: 0 })),
      ),
      -1,
    );
  }, []);
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ translateY: rise.value }] }));
  return (
    <View style={styles.center}>
      <View style={[StyleSheet.absoluteFill, styles.center]}><PulsingGlow size={SIZE * 0.8} /></View>
      <View style={styles.horizonClip}>
        <Animated.View style={[styles.halfSun, sunStyle]} />
      </View>
      <View style={styles.horizon} />
    </View>
  );
};

// Phone walks to the tag; rings pulse on contact.
const Tag = () => {
  const x = useSharedValue(-60);
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withDelay(900, withTiming(-60, { duration: 900 })),
      ),
      -1,
    );
  }, []);
  const phoneStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { rotate: '-12deg' }] }));
  return (
    <View style={styles.center}>
      <View style={[StyleSheet.absoluteFill, styles.center, { left: 70 }]}>
        <PulsingGlow size={110} />
      </View>
      <View style={[styles.tag, { marginLeft: 70 }]}>
        <Ionicons name="radio-outline" size={34} color="#0C0C0C" />
      </View>
      <Animated.View style={[styles.phone, phoneStyle]}>
        <Ionicons name="phone-portrait-outline" size={96} color={AMBER} />
      </Animated.View>
    </View>
  );
};

// Bars fill one by one, like picking a level.
const Bar = ({ i }: { i: number }) => {
  const on = useSharedValue(0.25);
  useEffect(() => {
    on.value = withRepeat(
      withSequence(
        withDelay(i * 250, withTiming(1, { duration: 300 })),
        withDelay((4 - i) * 250 + 1200, withTiming(0.25, { duration: 400 })),
      ),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: on.value }));
  return <Animated.View style={[styles.bar, { height: 40 + i * 28 }, style]} />;
};

const Volume = () => (
  <View style={styles.center}>
    <View style={styles.bars}>
      {[0, 1, 2, 3, 4].map(i => <Bar key={i} i={i} />)}
    </View>
    <Ionicons name="volume-medium-outline" size={36} color={AMBER} style={{ marginTop: 20 }} />
  </View>
);

const Bell = () => {
  const swing = useSharedValue(0);
  useEffect(() => {
    swing.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 140 }),
        withTiming(-14, { duration: 280 }),
        withTiming(10, { duration: 240 }),
        withTiming(0, { duration: 160 }),
        withDelay(1400, withTiming(0, { duration: 0 })),
      ),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }] }));
  return (
    <View style={styles.center}>
      <View style={[StyleSheet.absoluteFill, styles.center]}><PulsingGlow size={SIZE * 0.7} /></View>
      <Animated.View style={style}>
        <Ionicons name="notifications" size={96} color="#0C0C0C" />
      </Animated.View>
    </View>
  );
};

export const OnboardingArt = ({ kind }: { kind: ArtKind }) => (
  <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {kind === 'sunrise' && <Sunrise />}
    {kind === 'tag' && <Tag />}
    {kind === 'volume' && <Volume />}
    {kind === 'bell' && <Bell />}
  </View>
);

const styles = StyleSheet.create({
  frame: { width: SIZE + 40, height: SIZE + 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  horizonClip: { width: SIZE, height: SIZE / 2, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center' },
  halfSun: {
    width: SIZE * 0.7,
    height: SIZE * 0.35,
    borderTopLeftRadius: SIZE * 0.35,
    borderTopRightRadius: SIZE * 0.35,
    backgroundColor: AMBER,
  },
  horizon: { width: SIZE, height: 2, backgroundColor: AMBER, opacity: 0.8 },
  tag: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: { position: 'absolute' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  bar: { width: 24, borderRadius: 8, backgroundColor: AMBER },
});
