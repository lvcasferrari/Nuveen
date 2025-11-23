import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

/**
 * Provide haptic and audio feedback for user interactions
 */

// Play a light tap feedback sound
export const playTapSound = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};

// Play a medium impact feedback
export const playMediumFeedback = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};

// Play a success feedback (for alarm saved, NFC configured, etc.)
export const playSuccessFeedback = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};

// Play an error feedback
export const playErrorFeedback = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};

// Play a warning feedback
export const playWarningFeedback = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};

// Play a selection change feedback (for switches, pickers, etc.)
export const playSelectionFeedback = async () => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.warn('Haptic feedback unavailable:', error);
  }
};
