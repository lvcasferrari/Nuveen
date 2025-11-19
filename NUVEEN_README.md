# Nuveen - NFC Alarm Ritual App

**Wake with intention** ☀️

Nuveen is a beautiful, minimalistic NFC-activated alarm app inspired by the Auro lamp aesthetics. It combines mindful morning rituals with an intelligent alarm system that requires you to scan your NFC tag to stop the alarm.

---

## 🌅 Features

### Core Functionality
- **NFC-Activated Alarms**: Place your NFC tag away from your bed - you must physically get up and scan it to stop the alarm
- **Beautiful Dawn Gradients**: Warm amber-to-orange transitions that simulate a peaceful sunrise
- **Customizable Alarms**: 
  - Set custom alarm names
  - Choose which days to repeat
  - Select from 3 gradient themes (Dawn, Amber, Warm)
- **Morning Ritual Focus**: No clutter, no gamification - just a calm start to your day
- **Local-First**: Everything stored on device, no backend required

### Technical Features
- **Cross-Platform**: Works on iOS and Android via Expo Go
- **NFC Support**: Uses NFC213 tags (NTAG213)
- **Offline-First**: All data stored locally using AsyncStorage
- **Beautiful Animations**: Smooth pulsing glows and gradient transitions using React Native Reanimated
- **Native Feel**: Built with React Native and Expo for authentic mobile experience

---

## 📱 Testing the App

### Quick Start with Expo Go

1. **Install Expo Go** on your mobile device:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Open Expo Go** and scan this QR code (or enter the URL manually):
   ```
   exp://dawn-alarm-1.preview.emergentagent.com:443
   ```

3. **First Launch**:
   - You'll see 3 onboarding screens introducing the app
   - Next, you'll be prompted to scan your NFC tag
   - You can skip NFC setup for now and configure it later in Settings

4. **Testing NFC**:
   - NFC only works on physical devices (not in simulator)
   - Make sure NFC is enabled in your device settings
   - Hold your NFC213 tag near the back of your phone when prompted
   - The app will register the tag ID and link it to your device

---

## 🎨 Design Philosophy

### Brand Identity
- **Name**: Nuveen (nu·veen) - evokes new mornings and serene beginnings
- **Colors**:
  - Warm dawn amber: `#F4C07A → #EAA85B`
  - Deep charcoal: `#0C0C0C`
  - Soft gray-beige: `#D7D3CC`
- **Typography**: Clean, minimal, wide letter-spacing
- **Aesthetic**: Inspired by Auro lamp - soft glows, breathing animations, calming transitions

### UI/UX Principles
- **Minimal & Calm**: No visual clutter or overwhelming elements
- **Touch-Friendly**: Large tap targets (44px minimum)
- **Smooth Transitions**: Gentle fade and scale animations
- **Responsive**: Works on all phone sizes
- **Thumb Navigation**: Primary actions within easy reach

---

## 📂 App Structure

### Screens
1. **Onboarding** (`/onboarding`) - 3-slide introduction
2. **NFC Setup** (`/nfc-setup`) - Initial tag configuration
3. **Home** (`/home`) - Main screen showing next alarm
4. **Alarms List** (`/alarms`) - Manage all your alarms
5. **Add Alarm** (`/add-alarm`) - Create new alarm
6. **Edit Alarm** (`/edit-alarm`) - Modify existing alarm
7. **Alarm Ringing** (`/alarm-ringing`) - Full-screen dawn animation with NFC scan requirement
8. **Settings** (`/settings`) - Configure NFC tag, preferences, and view app info

### Key Components
- **GradientBackground**: Animated dawn gradients
- **PulsingGlow**: Breathing light effect for alarm screens
- **AlarmContext**: State management for all alarms

---

## 🔧 Technical Stack

### Frontend
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage (local persistence)
- **NFC**: react-native-nfc-manager
- **Animations**: react-native-reanimated
- **UI Components**:
  - expo-linear-gradient (gradient backgrounds)
  - @react-native-community/datetimepicker (time selection)
  - expo-haptics (tactile feedback)
  - expo-av (alarm sounds)

### Data Models
```typescript
interface Alarm {
  id: string;
  name: string;
  time: string; // HH:mm format
  repeatDays: number[]; // 0-6 (Sun-Sat)
  enabled: boolean;
  nfcRequired: boolean;
  gradientTheme: 'dawn' | 'amber' | 'warm';
}

interface Settings {
  nfcTagId: string | null;
  theme: 'light' | 'dark' | 'auto';
  vibrationEnabled: boolean;
}

interface WakeLog {
  id: string;
  date: string;
  alarmId: string;
  wakeTime: string;
}
```

---

## 🚀 Development

### Project Structure
```
/app/frontend/
├── app/                    # Screens (file-based routing)
│   ├── index.tsx          # Splash/redirect screen
│   ├── onboarding.tsx     # Onboarding slides
│   ├── nfc-setup.tsx      # NFC tag setup
│   ├── home.tsx           # Main home screen
│   ├── alarms.tsx         # Alarms list
│   ├── add-alarm.tsx      # Create new alarm
│   ├── edit-alarm.tsx     # Edit existing alarm
│   ├── alarm-ringing.tsx  # Active alarm screen
│   ├── settings.tsx       # App settings
│   └── _layout.tsx        # Root layout & providers
├── components/            # Reusable components
│   ├── GradientBackground.tsx
│   └── PulsingGlow.tsx
├── contexts/              # React contexts
│   └── AlarmContext.tsx
├── utils/                 # Utility functions
│   ├── storage.ts         # AsyncStorage helpers
│   ├── nfc.ts             # NFC functions
│   └── notifications.ts   # Alarm scheduling
└── assets/                # Static assets
```

### Running Locally
```bash
cd /app/frontend

# Install dependencies
yarn install

# Start Expo development server
yarn start

# Clear cache if needed
rm -rf node_modules/.cache .expo
yarn start --clear
```

---

## 🔔 How Alarms Work

1. **Setting an Alarm**:
   - Choose a time using the time picker
   - Give it a meaningful name (e.g., "Morning Ritual")
   - Select which days it should repeat
   - Choose your preferred gradient theme
   - NFC requirement is enabled by default

2. **When Alarm Rings**:
   - Screen shows full-screen dawn gradient animation
   - Device vibrates with a pattern
   - Soft alarm sound plays
   - You must scan your registered NFC tag to dismiss
   - Wrong tag or failed scan = alarm keeps ringing

3. **After Dismissal**:
   - Success message appears
   - Wake event is logged
   - Return to home screen
   - Start your day with intention!

---

## 🎯 Differentiators

### vs. Standard Alarm Apps
- **Minimal Design**: No cluttered UI or confusing settings
- **Ritual-Focused**: Built around mindful morning routines
- **NFC Mandatory**: Forces physical movement to stop alarm
- **Beautiful Aesthetics**: Every screen is visually calming

### vs. Lasso Clock (Inspiration)
- **More Premium**: Higher quality animations and transitions
- **Gradient-Driven**: Dynamic dawn simulations
- **Smoother**: Better performance and animations
- **More Tactile**: Haptic feedback throughout
- **Calmer**: Emphasis on peace, not urgency

---

## 📋 NFC Tag Setup

### Recommended Tags
- **NTAG213** (NFC213) - ISO14443A standard
- Available on Amazon, AliExpress, etc.
- Typical range: ~4cm
- No battery required

### Setup Process
1. Go to Settings or complete onboarding
2. Tap "Scan NFC Tag"
3. Hold your tag near the back of your phone
4. Tag ID is registered and stored locally
5. Place tag in strategic location (e.g., bathroom, kitchen)

### Placement Tips
- Put it somewhere you need to physically get up to reach
- Not too close to bed!
- Common spots: bathroom mirror, kitchen counter, office desk
- Test the scanning distance first

---

## 🐛 Troubleshooting

### NFC Not Working
- **Check NFC is enabled**: Settings → Connected devices → Connection preferences → NFC
- **iOS**: Make sure app has NFC permission (it will prompt automatically)
- **Tag Position**: Hold tag near the NFC antenna (usually back center or top)
- **Tag Compatibility**: Ensure using NFC Forum Type 2 tags (NTAG213, NTAG215, NTAG216)

### Alarms Not Firing
- **Permissions**: Make sure notification permissions are granted
- **Battery Optimization**: Disable battery optimization for Expo Go
- **Background Refresh**: Enable background app refresh (iOS)

### App Issues
- **Clear Cache**: Close app, clear Expo Go cache, relaunch
- **Reinstall**: Uninstall Expo Go and reinstall
- **Check Logs**: View errors in Expo Go developer menu

---

## 🔒 Privacy & Data

- **100% Local**: All data stored on your device only
- **No Tracking**: Zero analytics or tracking
- **No Account**: No sign-up or login required
- **No Internet**: Works completely offline
- **Secure**: NFC tag ID stored in encrypted AsyncStorage

---

## 🎨 Color Palette

```css
/* Primary Gradient */
--dawn-start: #F4C07A;
--dawn-end: #EAA85B;

/* Backgrounds */
--charcoal: #0C0C0C;
--charcoal-light: #1A1A1A;
--beige: #D7D3CC;

/* Semantic Colors */
--success: #4CAF50;
--error: #FF4444;
--warning: #FFA726;
```

---

## 📝 Future Enhancements (Potential)

- [ ] Custom alarm sounds
- [ ] Smart wake window (wake up during light sleep)
- [ ] Sleep tracking integration
- [ ] Multiple NFC tags support
- [ ] Widget for quick alarm view
- [ ] Apple Watch complications
- [ ] Gentle wake-up light simulation (gradually increase screen brightness)
- [ ] Morning affirmations or quotes
- [ ] Weather integration for dawn colors

---

## 📄 License

This project is a demonstration of mobile app development using Expo and React Native. Built for Emergent platform.

---

## 🙏 Credits

- **Design Inspiration**: Auro lamp by Cotype Foundry
- **Concept Reference**: Lasso Clock (lassoclock.com)
- **Built with**: Expo, React Native, React Native Reanimated
- **NFC Library**: react-native-nfc-manager

---

## 📞 Support

For issues or questions:
- Check the Troubleshooting section above
- Review Expo Go documentation
- Ensure NFC is properly enabled on your device
- Try with a different NFC tag to rule out tag issues

---

**Nuveen** - Wake with intention. Start each day peacefully. ☀️
