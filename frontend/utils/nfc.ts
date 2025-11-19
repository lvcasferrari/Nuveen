import { Platform } from 'react-native';

// NFC is only available on native platforms
let NfcManager: any = null;

if (Platform.OS !== 'web') {
  try {
    NfcManager = require('react-native-nfc-manager').default;
  } catch (e) {
    console.warn('react-native-nfc-manager not available');
  }
}

export const isNFCAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web' || !NfcManager) {
    return false;
  }

  try {
    const isSupported = await NfcManager.isSupported();
    if (!isSupported) {
      return false;
    }
    
    // Try to start NFC manager
    await NfcManager.start();
    const isEnabled = await NfcManager.isEnabled();
    return isEnabled;
  } catch (error) {
    console.error('Error checking NFC availability:', error);
    return false;
  }
};

export const readNFCTag = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || !NfcManager) {
    throw new Error('NFC is not available on this platform');
  }

  try {
    const available = await isNFCAvailable();
    if (!available) {
      throw new Error('NFC is not available on this device');
    }

    // Start NFC manager if not already started
    await NfcManager.start();

    // Request NFC technology
    await NfcManager.requestTechnology([NfcManager.NfcTech.Ndef, NfcManager.NfcTech.IsoDep]);

    // Get tag
    const tag = await NfcManager.getTag();
    
    // Cancel technology request
    await NfcManager.cancelTechnologyRequest();

    // Return tag ID
    if (tag && tag.id) {
      return tag.id;
    }

    return Date.now().toString();
  } catch (error) {
    console.error('Error reading NFC tag:', error);
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (e) {
      // Ignore cancellation errors
    }
    return null;
  }
};

export const requestNFCPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web' || !NfcManager) {
    return false;
  }

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