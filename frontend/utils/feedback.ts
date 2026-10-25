import * as Haptics from 'expo-haptics';

// Play a medium impact feedback
export const playMediumFeedback = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};
