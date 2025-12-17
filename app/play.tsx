
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
import { colors } from '@/styles/commonStyles';

const PIN_KEY = 'baby_play_pad_pin';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef(0);
  const accelerometerSubscription = useRef<any>(null);

  useEffect(() => {
    setupAccelerometer();
    return () => {
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, []);

  const setupAccelerometer = () => {
    Accelerometer.setUpdateInterval(100);
    accelerometerSubscription.current = Accelerometer.addListener((data) => {
      const { x, y, z } = data;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      if (acceleration > 2.5) {
        handleShake();
      }
    });
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

  const handleTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const newColor = getRandomColor();
    setCurrentColor(newColor);
    setCurrentPath(`M ${locationX} ${locationY}`);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTouchMove = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths((prev) => [...prev, { path: currentPath, color: currentColor }]);
      setCurrentPath('');
    }
  };

  const handleScreenTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setTapCount((prev) => prev + 1);
    } else {
      setTapCount(1);
    }
    lastTapRef.current = now;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 500);

    spawnAnimatedElement(locationX, locationY);
  };

  const spawnAnimatedElement = (x: number, y: number) => {
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
    const now = Date.now();
    if (now - lastTapRef.current < 500) {
      setTapCount((prev) => prev + 1);
      
      if (tapCount >= 2) {
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
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      if (storedPin === pinInput) {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.hiddenExitButton}
        onPress={handleTopRightTap}
        activeOpacity={1}
      />

      <View
        style={styles.canvas}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
      >
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
    backgroundColor: colors.background,
  },
  canvas: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  hiddenExitButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    zIndex: 1000,
  },
  animatedElement: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
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
