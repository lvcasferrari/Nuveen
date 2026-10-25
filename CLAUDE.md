# Nuveen

React Native (Expo) alarm app. You can only dismiss a ringing alarm by scanning an NFC tag. Alarms are stored on-device (AsyncStorage); ringing is driven by an in-app JS timer when alive and by scheduled local notifications when closed.

## Layout
- App code lives in `frontend/` (not the repo root). Routing is file-based via `expo-router` under `frontend/app/`.
- Root holds docs (`NUVEEN_README.md`, Portuguese status docs) and a `tests/` Python stub (not real tests).

## Commands (run inside `frontend/`)
- Start: `yarn start`
- iOS / Android dev build: `yarn ios` / `yarn android`
- Lint: `yarn lint`
- Type check: `npx tsc --noEmit`
- Tests: none yet (no test runner configured).

## Stack
- Expo SDK 54, React Native 0.81, React 19, TypeScript, yarn 1.22.
- Native deps: `react-native-nfc-manager`, `react-native-volume-manager`, `expo-notifications`, `expo-av` (deprecated — migrate to `expo-audio`), `@react-native-async-storage/async-storage`.

## Known issues (see `Obsidian/Nuveen` vault audit)
- One-time alarms re-ring daily via the background monitor (`utils/backgroundAlarm.ts`).
- iOS 64-pending-notification cap vs. burst scheduling (`utils/notifications.ts`).
- Android can't register an NFC tag (`Alert.prompt` is iOS-only, `app/settings.tsx`).
- Onboarding/NFC-setup screens are unreachable (`app/index.tsx`).

## Conventions
- Keep changes minimal and match surrounding style. Fix root causes once in shared code.
- Validation at trust boundaries, error handling, security, and accessibility are not optional.
