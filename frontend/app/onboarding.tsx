import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { OnboardingArt, ArtKind } from '../components/OnboardingArt';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestNotificationPermissions } from '../utils/notifications';
import nuveenAlarm, { isAlarmKitLinked } from '../modules/nuveen-alarm';
import { playMediumFeedback } from '../utils/feedback';

const { width } = Dimensions.get('window');

const SLIDES: { id: string; art: ArtKind; title: string; description: string }[] = [
  {
    id: 'wake',
    art: 'sunrise',
    title: 'Wake with\nintention',
    description: 'A calm, warm start to every day. No snooze, no streaks.',
  },
  {
    id: 'tag',
    art: 'tag',
    title: 'Walk to your\ntag to stop it',
    description: 'Put your NFC tag across the room. The alarm stops only when you scan it.',
  },
  {
    id: 'volume',
    art: 'volume',
    title: 'Choose how\nloud it rings',
    description: 'Pick a level for each alarm and preview it before you sleep.',
  },
  {
    id: 'notify',
    art: 'bell',
    title: 'Let Nuveen\nreach you',
    description: 'Allow alarms and notifications so Nuveen rings on the lock screen, in Silent mode and in Focus, even when the app is closed.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    playMediumFeedback();
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
      return;
    }
    await requestNotificationPermissions();
    // AlarmKit is what makes the alarm ring on the lock screen, in Silent mode and in Focus.
    if (isAlarmKitLinked() && nuveenAlarm.getAuthorizationState() === 'notDetermined') {
      await nuveenAlarm.requestAuthorization().catch(() => {});
    }
    router.replace('/nfc-setup');
  };

  return (
    <GradientBackground theme="dark">
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index }) => (
          <SafeAreaView style={styles.slide} edges={['top']}>
            {/* Only the visible slide animates. */}
            <View style={styles.art}>{index === currentIndex && <OnboardingArt kind={item.art} />}</View>
            <Text style={styles.title} accessibilityRole="header">{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </SafeAreaView>
        )}
      />

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.pagination}>
          {SLIDES.map((s, index) => (
            <View key={s.id} style={[styles.dot, index === currentIndex && styles.activeDot]} />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.8} accessibilityRole="button">
          <LinearGradient
            colors={['#F4C07A', '#EAA85B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{isLast ? 'Allow alarms' : 'Next'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  art: { height: 280, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: 38,
    fontWeight: '300',
    color: '#F4C07A',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    color: '#D7D3CC',
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 25,
    paddingHorizontal: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 192, 122, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#F4C07A',
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0C0C',
    letterSpacing: 0.5,
  },
});
