
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { colors } from '@/styles/commonStyles';

const PIN_KEY = 'baby_play_pad_pin';

export default function PinSetupScreen() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(true);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);

  useEffect(() => {
    checkExistingPin();
  }, []);

  const checkExistingPin = async () => {
    try {
      const existingPin = await SecureStore.getItemAsync(PIN_KEY);
      console.log('Checking existing PIN:', existingPin ? 'Found' : 'Not found');
      if (existingPin) {
        setHasExistingPin(true);
        setIsSettingPin(false);
      }
    } catch (error) {
      console.log('Error checking existing PIN:', error);
    }
  };

  const handlePinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      if (hasExistingPin || isConfirmingPin) {
        setConfirmPin(value);
      } else {
        setPin(value);
      }
    }
  };

  const handleContinue = async () => {
    console.log('Continue button pressed');
    console.log('hasExistingPin:', hasExistingPin);
    console.log('isConfirmingPin:', isConfirmingPin);
    console.log('pin length:', pin.length);
    console.log('confirmPin length:', confirmPin.length);

    // If user has existing PIN, verify it
    if (hasExistingPin) {
      if (confirmPin.length !== 4) {
        Alert.alert('Invalid PIN', 'Please enter your 4-digit PIN');
        return;
      }

      try {
        const storedPin = await SecureStore.getItemAsync(PIN_KEY);
        console.log('Verifying PIN...');
        if (storedPin === confirmPin) {
          console.log('PIN verified successfully, navigating to play screen');
          router.replace('/play');
        } else {
          console.log('Incorrect PIN');
          Alert.alert('Incorrect PIN', 'Please try again.');
          setConfirmPin('');
        }
      } catch (error) {
        console.log('Error verifying PIN:', error);
        Alert.alert('Error', 'Failed to verify PIN. Please try again.');
      }
      return;
    }

    // If user is setting a new PIN
    if (!isConfirmingPin) {
      // First step: entering the PIN
      if (pin.length !== 4) {
        Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN');
        return;
      }
      console.log('Moving to confirmation step');
      setIsConfirmingPin(true);
      return;
    }

    // Second step: confirming the PIN
    if (confirmPin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please confirm your 4-digit PIN');
      return;
    }

    if (pin !== confirmPin) {
      console.log('PINs do not match');
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setIsConfirmingPin(false);
      return;
    }

    // Save the PIN and navigate to play screen
    try {
      console.log('Saving PIN...');
      await SecureStore.setItemAsync(PIN_KEY, pin);
      console.log('PIN saved successfully, navigating to play screen');
      router.replace('/play');
    } catch (error) {
      console.log('Error saving PIN:', error);
      Alert.alert('Error', 'Failed to save PIN. Please try again.');
    }
  };

  const handleDelete = () => {
    if (hasExistingPin || isConfirmingPin) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const renderPinDots = (value: string) => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              value.length > index && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>
    );
  };

  const getTitle = () => {
    if (hasExistingPin) {
      return 'Enter PIN to Continue';
    }
    if (isConfirmingPin) {
      return 'Confirm Your PIN';
    }
    return 'Set Your 4-Digit PIN';
  };

  const getSubtitle = () => {
    if (hasExistingPin) {
      return 'Enter your PIN to access the play area';
    }
    if (isConfirmingPin) {
      return 'Please enter your PIN again';
    }
    return 'This PIN will be required to exit the app';
  };

  const getButtonText = () => {
    if (hasExistingPin) {
      return 'Start Playing';
    }
    if (isConfirmingPin) {
      return 'Start Playing';
    }
    return 'Next';
  };

  const currentValue = (hasExistingPin || isConfirmingPin) ? confirmPin : pin;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{getTitle()}</Text>
        
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {renderPinDots(currentValue)}

        <TextInput
          style={styles.hiddenInput}
          value={currentValue}
          onChangeText={handlePinInput}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          autoFocus
        />

        <View style={styles.numpadContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.numpadButton}
              onPress={() => {
                if (currentValue.length < 4) {
                  handlePinInput(currentValue + num.toString());
                }
              }}
            >
              <Text style={styles.numpadText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.continueButton]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>

        {!hasExistingPin && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 To exit the app, triple-tap the top-right corner and enter your PIN
            </Text>
            <Text style={styles.infoText}>
              📱 For maximum security, enable Guided Access in iOS Settings
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
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
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  numpadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  numpadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  numpadText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: colors.secondary,
  },
  continueButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.highlight,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
});
