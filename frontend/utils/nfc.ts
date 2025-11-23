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

    // Request NFC technology with timeout
    const techList = Platform.OS === 'ios' 
      ? [NfcManager.NfcTech.Ndef]
      : [NfcManager.NfcTech.Ndef, NfcManager.NfcTech.IsoDep, NfcManager.NfcTech.NfcA];
    
    await NfcManager.requestTechnology(techList, {
      isAlertDialogEnabled: true,
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
    } catch (e) {
      console.warn('Error cancelling technology request:', e);
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

/**
 * Generate a secure checksum for NFC tag validation
 * This helps ensure only properly configured tags can be used
 */
export const generateNFCChecksum = (tagId: string): string => {
  let hash = 0;
  for (let i = 0; i < tagId.length; i++) {
    const char = tagId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Validate if scanned tag matches configured tag
 * Returns detailed validation result for security logging
 */
export const validateNFCTag = (
  scannedTagId: string | null,
  configuredTagId: string | null,
  enabledMode: 'strict' | 'lenient' = 'lenient'
): { valid: boolean; reason: string } => {
  if (!scannedTagId) {
    return { valid: false, reason: 'No tag data read' };
  }

  if (!configuredTagId) {
    return { valid: true, reason: 'No tag configured - any tag accepted' };
  }

  // Exact match
  if (scannedTagId === configuredTagId) {
    return { valid: true, reason: 'Tag matches exactly' };
  }

  // Checksum match (for lenient mode)
  if (enabledMode === 'lenient') {
    const scannedChecksum = generateNFCChecksum(scannedTagId);
    const configuredChecksum = generateNFCChecksum(configuredTagId);
    
    if (scannedChecksum === configuredChecksum) {
      return { valid: true, reason: 'Tag checksum matches' };
    }
  }

  return { valid: false, reason: 'Tag does not match configured tag' };
};