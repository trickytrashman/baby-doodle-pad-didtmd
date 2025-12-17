
# Baby Play Pad - User Guide

## Overview

Baby Play Pad is a safe, interactive drawing and play app designed specifically for babies and toddlers. The app features a full-screen drawing canvas with colorful lines, fun animations, and a secure PIN-based lock system to prevent accidental exits.

## Features

### 🎨 Drawing Canvas
- **Touch and drag** to draw colorful lines
- **Random bright colors** for each stroke (10 vibrant colors)
- **Smooth drawing** with rounded lines
- **Full-screen canvas** for maximum play area

### ✨ Interactive Elements
- **Tap anywhere** on the screen to spawn playful animations:
  - 🔴 Bouncing balls
  - 🫧 Popping bubbles
  - ⭐ Animated stars
- **Haptic feedback** on iOS for tactile response
- **Animated elements** that appear and disappear smoothly

### 🔒 Lock Mode
- **4-digit PIN** setup on first launch
- **Secure storage** using iOS Keychain (expo-secure-store)
- **Triple-tap** the top-right corner to access exit PIN screen
- **PIN verification** required to exit the app

### 🔄 Clear Canvas
- **Shake gesture** to clear all drawings
- **Haptic feedback** confirms the clear action
- **Instant reset** of all animated elements

### 📱 Device Support
- **iPhone** - Portrait and landscape
- **iPad** - Full tablet support with larger canvas
- **Optimized** for older devices

## How to Use

### First Launch

1. **Set Your PIN**
   - Enter a 4-digit PIN when prompted
   - Confirm your PIN by entering it again
   - Remember this PIN - you'll need it to exit the app!

2. **Start Playing**
   - The app automatically enters play mode
   - Let your child draw and explore!

### During Play

- **Draw**: Touch and drag anywhere on the screen
- **Animate**: Tap to spawn fun animations
- **Clear**: Shake the device to clear the canvas

### Exiting the App

1. **Triple-tap** the top-right corner of the screen (hidden button)
2. **Enter your PIN** in the modal that appears
3. **Tap Submit** to exit

## iOS Guided Access (Recommended)

For maximum security and true kiosk mode, enable iOS Guided Access:

### Setup Instructions

1. **Open Settings** on your iPhone/iPad
2. Go to **Accessibility**
3. Scroll down to **Guided Access**
4. **Enable Guided Access**
5. Set a **Passcode** (different from app PIN)
6. Enable **Accessibility Shortcut**

### Using Guided Access

1. **Open Baby Play Pad**
2. **Triple-click** the side button (or home button on older devices)
3. **Tap Start** to begin Guided Access
4. The child cannot exit the app or access other features
5. **Triple-click** again and enter your passcode to exit

## Technical Details

### Permissions Required

- **Motion Sensors** (iOS): For shake gesture detection
- **Vibration** (Android): For haptic feedback

### Storage

- PIN is stored securely using:
  - **iOS**: Keychain Services
  - **Android**: Encrypted SharedPreferences with Keystore

### Performance

- Optimized for smooth drawing on older devices
- Efficient animation system
- Minimal memory footprint
- No ads or in-app purchases

## Color Palette

The app uses bright, engaging colors:
- Hot Pink (#FF69B4)
- Gold (#FFD700)
- Tomato Red (#FF6347)
- Dark Turquoise (#00CED1)
- Deep Pink (#FF1493)
- Lime Green (#00FF00)
- Orange Red (#FF4500)
- Medium Purple (#9370DB)
- Light Pink (#FFB6C1)
- Deep Sky Blue (#00BFFF)

## Troubleshooting

### Can't Exit the App
- Make sure you're **triple-tapping** the top-right corner
- Wait for the PIN modal to appear
- Enter your 4-digit PIN correctly

### Forgot PIN
- If you forget your PIN, you'll need to:
  1. Force close the app (if not in Guided Access)
  2. Uninstall and reinstall the app
  3. Set a new PIN

### Shake Not Working
- Make sure motion permissions are granted
- Shake more vigorously
- Check device settings for motion access

### Drawing Not Smooth
- Close other apps to free up memory
- Restart the device
- Update to the latest iOS version

## Safety Features

✅ **No external links** - Child cannot navigate away
✅ **No in-app purchases** - No accidental purchases
✅ **No ads** - Distraction-free experience
✅ **PIN protection** - Secure exit mechanism
✅ **Guided Access compatible** - Full kiosk mode support
✅ **Offline capable** - Works without internet

## Build Instructions

### For Development

```bash
# Install dependencies
npm install

# Run on iOS simulator
npx expo start --ios

# Run on iOS device
npx expo start --tunnel
```

### For Production (Xcode)

1. **Prebuild for iOS**:
   ```bash
   npx expo prebuild -p ios
   ```

2. **Open in Xcode**:
   ```bash
   open ios/BabyPlayPad.xcworkspace
   ```

3. **Configure Signing**:
   - Select your development team
   - Set bundle identifier

4. **Build and Run**:
   - Select your device
   - Click Run (⌘R)

### For App Store

1. **Update app.json**:
   - Set correct bundle identifier
   - Update version number
   - Add app icon

2. **Build with EAS**:
   ```bash
   eas build --platform ios
   ```

3. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review iOS Guided Access documentation
- Ensure all permissions are granted

## Version

Current Version: 1.0.0

## License

This app is designed for personal use. Modify and distribute as needed.

---

**Enjoy safe, creative play with Baby Play Pad! 🎨✨**
