
# Baby Play Pad 🎨

A safe, interactive drawing and play app for babies and toddlers on iOS.

## Features

- 🎨 Full-screen drawing canvas with random bright colors
- ✨ Interactive animations (balls, bubbles, stars)
- 🔒 PIN-protected exit to prevent accidental closing
- 🔄 Shake to clear canvas
- 📱 iPhone and iPad support
- 🎯 Optimized for young children

## Quick Start

```bash
# Install dependencies
npm install

# Run on iOS
npx expo start --ios
```

## Setup

1. Launch the app
2. Set a 4-digit PIN
3. Let your child play!

## Exit the App

1. Triple-tap the top-right corner
2. Enter your PIN
3. Tap Submit

## Recommended: Enable iOS Guided Access

For maximum security:
1. Settings → Accessibility → Guided Access
2. Enable and set a passcode
3. Use triple-click to start/stop Guided Access

## Documentation

See [BABY_PLAY_PAD_GUIDE.md](./BABY_PLAY_PAD_GUIDE.md) for complete documentation.

## Tech Stack

- React Native + Expo 54
- TypeScript
- expo-secure-store (PIN storage)
- expo-sensors (shake detection)
- expo-haptics (tactile feedback)
- react-native-svg (drawing)

## License

MIT
