
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { colors } from '@/styles/commonStyles';

const PIN_KEY = 'baby_play_pad_pin';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Storage wrapper to handle web vs native
const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  }
};

interface PathData {
  path: string;
  color: string;
}

interface AnimatedElement {
  id: string;
  type: 'ball' | 'bubble' | 'star';
  x: number;
  y: number;
  animation: Animated.Value;
}

const BRIGHT_COLORS = [
  '#FF69B4',
  '#FFD700',
  '#FF6347',
  '#00CED1',
  '#FF1493',
  '#00FF00',
  '#FF4500',
  '#9370DB',
  '#FFB6C1',
  '#00BFFF',
];

export default function PlayScreen() {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [currentColor, setCurrentColor] = useState(BRIGHT_COLORS[0]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [animatedElements, setAnimatedElements] = useState<AnimatedElement[]>([]);
  const [accelerometerAvailable, setAccelerometerAvailable] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef(0);
  const accelerometerSubscription = useRef<any>(null);
  const welcomeOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('🎮 Play screen mounted successfully!');
    console.log('Screen dimensions:', SCREEN_WIDTH, 'x', SCREEN_HEIGHT);
    setupAccelerometer();
    
    // Hide welcome message after 3 seconds
    setTimeout(() => {
      Animated.timing(welcomeOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowWelcome(false);
      });
    }, 3000);
    
    return () => {
      if (accelerometerSubscription.current) {
        console.log('Cleaning up accelerometer subscription');
        accelerometerSubscription.current.remove();
      }
    };
  }, []);

  const setupAccelerometer = async () => {
    try {
      console.log('Setting up accelerometer...');
      
      // Check if accelerometer is available
      const isAvailable = await Accelerometer.isAvailableAsync();
      console.log('Accelerometer available:', isAvailable);
      
      if (!isAvailable) {
        console.log('Accelerometer not available on this device/platform');
        setAccelerometerAvailable(false);
        return;
      }

      // On web, request permissions
      if (Platform.OS === 'web') {
        console.log('Requesting accelerometer permissions for web...');
        const { status } = await Accelerometer.requestPermissionsAsync();
        console.log('Permission status:', status);
        
        if (status !== 'granted') {
          console.log('Accelerometer permission not granted');
          setAccelerometerAvailable(false);
          return;
        }
      }

      // Set up the accelerometer listener
      Accelerometer.setUpdateInterval(100);
      accelerometerSubscription.current = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        if (acceleration > 2.5) {
          handleShake();
        }
      });
      
      setAccelerometerAvailable(true);
      console.log('✅ Accelerometer set up successfully!');
    } catch (error) {
      console.log('❌ Error setting up accelerometer:', error);
      setAccelerometerAvailable(false);
    }
  };

  const handleShake = () => {
    console.log('Shake detected - clearing canvas');
    setPaths([]);
    setAnimatedElements([]);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getRandomColor = () => {
    return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)];
  };

  const spawnAnimatedElement = (x: number, y: number) => {
    console.log('Spawning animated element at', x, y);
    const types: ('ball' | 'bubble' | 'star')[] = ['ball', 'bubble', 'star'];
    const type = types[Math.floor(Math.random() * types.length)];
    const animation = new Animated.Value(0);
    
    const element: AnimatedElement = {
      id: Date.now().toString() + Math.random(),
      type,
      x,
      y,
      animation,
    };

    setAnimatedElements((prev) => [...prev, element]);

    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimatedElements((prev) => prev.filter((el) => el.id !== element.id));
    });

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleTopRightTap = () => {
    console.log('Top right corner tapped');
    const now = Date.now();
    if (now - lastTapRef.current < 500) {
      setTapCount((prev) => prev + 1);
      
      if (tapCount >= 2) {
        console.log('Triple tap detected - showing PIN modal');
        setShowPinModal(true);
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    lastTapRef.current = now;
  };

  const handlePinSubmit = async () => {
    if (pinInput.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN');
      return;
    }

    try {
      const storedPin = await storage.getItem(PIN_KEY);
      if (storedPin === pinInput) {
        console.log('PIN verified - navigating back to index');
        router.replace('/');
      } else {
        Alert.alert('Incorrect PIN', 'Please try again.');
        setPinInput('');
      }
    } catch (error) {
      console.log('Error verifying PIN:', error);
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
    }
  };

  const renderAnimatedElement = (element: AnimatedElement) => {
    const scale = element.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1.5, 0],
    });

    const opacity = element.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    });

    return (
      <Animated.View
        key={element.id}
        style={[
          styles.animatedElement,
          {
            left: element.x - 30,
            top: element.y - 30,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        {element.type === 'ball' && (
          <View style={[styles.ball, { backgroundColor: getRandomColor() }]} />
        )}
        {element.type === 'bubble' && (
          <View style={[styles.bubble, { borderColor: getRandomColor() }]} />
        )}
        {element.type === 'star' && (
          <Text style={[styles.star, { color: getRandomColor() }]}>⭐</Text>
        )}
      </Animated.View>
    );
  };

  // Create pan gesture for drawing
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      console.log('Drawing started at:', event.x, event.y);
      const newColor = getRandomColor();
      setCurrentColor(newColor);
      setCurrentPath(`M ${event.x} ${event.y}`);
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Spawn an animated element on touch
      spawnAnimatedElement(event.x, event.y);
    })
    .onUpdate((event) => {
      setCurrentPath((prev) => `${prev} L ${event.x} ${event.y}`);
    })
    .onEnd(() => {
      console.log('Drawing ended - saving path');
      if (currentPath) {
        setPaths((prev) => [...prev, { path: currentPath, color: currentColor }]);
        setCurrentPath('');
      }
    });

  return (
    <View style={styles.container}>
      {/* Hidden exit button in top-right corner */}
      <TouchableOpacity
        style={styles.hiddenExitButton}
        onPress={handleTopRightTap}
        activeOpacity={1}
      />

      {/* Drawing canvas */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.canvas}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            {paths.map((pathData, index) => (
              <Path
                key={index}
                d={pathData.path}
                stroke={pathData.color}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={currentColor}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>

          {animatedElements.map(renderAnimatedElement)}
        </View>
      </GestureDetector>

      {/* Welcome message */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeContainer, { opacity: welcomeOpacity }]}>
          <Text style={styles.welcomeText}>🎨 Touch anywhere to draw! 🎨</Text>
          <Text style={styles.welcomeSubtext}>Shake to clear • Triple-tap top-right to exit</Text>
        </Animated.View>
      )}

      {/* PIN exit modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter PIN to Exit</Text>
            
            <View style={styles.pinDotsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    pinInput.length > index && styles.pinDotFilled,
                  ]}
                />
              ))}
            </View>

            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={(text) => {
                if (text.length <= 4 && /^\d*$/.test(text)) {
                  setPinInput(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handlePinSubmit}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  canvas: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  hiddenExitButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  welcomeContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'none',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  animatedElement: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  ball: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  bubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    backgroundColor: 'transparent',
  },
  star: {
    fontSize: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    marginHorizontal: 10,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
  },
  pinInput: {
    fontSize: 24,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
});
