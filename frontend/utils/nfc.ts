import { Platform } from 'react-native';

// NFC is only available on native platforms
let NFC: any = null;

if (Platform.OS !== 'web') {
  try {
    NFC = require('expo-nfc');
  } catch (e) {
    console.warn('expo-nfc not available');
  }
}

export const isNFCAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web' || !NFC) {
    return false;
  }

  try {
    const isSupported = await NFC.hasHardwareAsync();
    if (!isSupported) {
      return false;
    }
    const isEnabled = await NFC.isEnabledAsync();
    return isEnabled;
  } catch (error) {
    console.error('Error checking NFC availability:', error);
    return false;
  }
};

export const readNFCTag = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || !NFC) {
    throw new Error('NFC is not available on this platform');
  }

  try {
    const available = await isNFCAvailable();
    if (!available) {
      throw new Error('NFC is not available on this device');
    }

    return new Promise((resolve, reject) => {
      const subscription = NFC.addNdefListener((event: any) => {
        if (event.ndefMessage && event.ndefMessage.length > 0) {
          // Get the tag ID
          const tagId = event.ndefMessage[0]?.id || Date.now().toString();
          subscription.remove();
          resolve(tagId);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        subscription.remove();
        reject(new Error('NFC scan timeout'));
      }, 30000);
    });
  } catch (error) {
    console.error('Error reading NFC tag:', error);
    return null;
  }
};

export const requestNFCPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Android NFC doesn't require runtime permissions
      return true;
    } else if (Platform.OS === 'ios') {
      // iOS requires NFC usage description in Info.plist
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting NFC permissions:', error);
    return false;
  }
};