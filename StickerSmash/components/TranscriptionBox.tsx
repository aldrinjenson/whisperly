import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

interface Props {
  isTranscribing: boolean;
  transcribedText: string;
}

const TranscriptionBox: React.FC<Props> = ({ isTranscribing, transcribedText }) => {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(transcribedText);
    toast.success('Copied to clipboard!');
  };

  return (
    <View style={styles.transcriptionContainer}>
      {isTranscribing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Transcribing your audio...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.transcriptionText}>
            {transcribedText || 'Your transcription will appear here...'}
          </Text>
          {transcribedText ? (
            <Pressable style={styles.copyButton} onPress={handleCopy}>
              <MaterialIcons name="content-copy" size={20} color="#007AFF" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  transcriptionContainer: {
    flex: 1,
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    marginTop: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  copyButtonText: {
    marginLeft: 4,
    color: '#007AFF',
    fontSize: 14,
  },
});

export default TranscriptionBox; 