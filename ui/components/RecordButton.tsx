import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  isRecording: boolean;
  onPress: () => void;
}

const RecordButton: React.FC<Props> = ({ isRecording, onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, pulseAnim]);

  return (
    <View style={styles.buttonContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          isRecording && styles.pulseRingActive,
          { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.6 : 0 },
        ]}
      />
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={isRecording ? 'stop' : 'mic'}
          size={32}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    opacity: 0,
  },
  pulseRingActive: {
    backgroundColor: '#FF3B30',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  recordingActive: {
    backgroundColor: '#FF3B30',
  },
});

export default RecordButton; 