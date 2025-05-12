import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  isRecording: boolean;
  onPress: () => void;
}

const RecordButton: React.FC<Props> = ({ isRecording, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.recordButton, isRecording && styles.recordingActive]}
      onPress={onPress}
    >
      <MaterialIcons
        name={isRecording ? 'stop' : 'mic'}
        size={32}
        color="white"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recordButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
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
  },
  recordingActive: {
    backgroundColor: '#FF3B30',
  },
});

export default RecordButton; 