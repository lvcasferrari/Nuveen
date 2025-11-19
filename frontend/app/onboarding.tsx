import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Wake with\nintention',
    description: 'Start your day mindfully with beautiful dawn rituals',
  },
  {
    id: '2',
    title: 'Stop alarms by\nscanning your tag',
    description: 'Place your NFC tag away from bed to ensure you get up',
  },
  {
    id: '3',
    title: 'Build a peaceful\nmorning ritual',
    description: 'Create a calm, consistent start to every day',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderSlide = ({ item, index }: { item: typeof ONBOARDING_SLIDES[0]; index: number }) => (
    <View style={styles.slide}>
      <GradientBackground theme="dawn" animated>
        <SafeAreaView style={styles.slideContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    </View>
  );

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/nfc-setup');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEnabled={true}
      />

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.pagination}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient
            colors={['#F4C07A', '#EAA85B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  slide: {
    width,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '500',
    color: '#0C0C0C',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -1,
  },
  description: {
    fontSize: 18,
    color: '#0C0C0C',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 26,
    paddingHorizontal: 16,
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
    shadowColor: '#F4C07A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0C0C',
    letterSpacing: 0.5,
  },
});