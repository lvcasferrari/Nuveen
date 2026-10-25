import { Platform } from 'react-native';

// NFC is only available on native platforms
let NfcManager: any = null;
let NfcTech: any = null;

if (Platform.OS !== 'web') {
  try {
    const nfcModule = require('react-native-nfc-manager');
    NfcManager = nfcModule.default;
    NfcTech = nfcModule.NfcTech;
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

    await NfcManager.start();

    // isEnabled() only exists on Android; on iOS NFC is always available if supported
    if (Platform.OS === 'android') {
      const isEnabled = await NfcManager.isEnabled();
      return isEnabled;
    }

    return true;
  } catch (error) {
    console.error('Error checking NFC availability:', error);
    return false;
  }
};

export const readNFCTag = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || !NfcManager || !NfcTech) {
    throw new Error('NFC is not available on this platform');
  }

  try {
    // Ensure NFC manager is started (idempotent)
    await NfcManager.start().catch(() => {});

    // On Android, try multiple technologies for broader tag compatibility
    const techList = Platform.OS === 'ios'
      ? [NfcTech.Ndef]
      : [NfcTech.NfcA, NfcTech.Ndef, NfcTech.IsoDep];

    await NfcManager.requestTechnology(techList, {
      isAlertDialogEnabled: Platform.OS === 'ios',
      alertMessage: 'Hold your Nuveen tag near your phone to scan',
    });

    // Get tag with retries
    let tag = null;
    let retries = 3;

    while (!tag && retries > 0) {
      tag = await NfcManager.getTag();
      if (!tag) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Cancel technology request
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Ignore cancellation errors
    }

    // Return tag ID with fallback
    if (tag && tag.id) {
      return tag.id;
    }

    // If no tag ID, try to generate from NDEF or other data
    if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
      return JSON.stringify(tag.ndefMessage[0]);
    }

    return null;
  } catch (error: any) {
    console.error('Error reading NFC tag:', error);
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Ignore cancellation errors
    }
    // Re-throw user-cancelled errors so UI can differentiate
    if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
      throw new Error('Scan cancelled. Tap to try again.');
    }
    return null;
  }
};

/**
 * Validate a scanned tag against a configured tag.
 * Exact match only. A null configured tag means none is set — caller decides policy.
 */
export const validateNFCTag = (
  scannedTagId: string | null,
  configuredTagId: string | null
): boolean => {
  if (!scannedTagId) return false;
  if (!configuredTagId) return true; // no tag configured — any tag accepted
  return scannedTagId === configuredTagId;
};
