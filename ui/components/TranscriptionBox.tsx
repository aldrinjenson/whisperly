import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Share, Platform, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

interface Props {
  isTranscribing: boolean;
  transcribedText: string;
  onChangeText?: (t: string) => void;
  onClear?: () => void;
  style?: any;
}

const TranscriptionBox: React.FC<Props> = ({ isTranscribing, transcribedText, onChangeText, onClear, style }) => {
  // Auto-copy to clipboard when transcription is complete
  useEffect(() => {
    if (transcribedText && !isTranscribing) {
      Clipboard.setStringAsync(transcribedText);
    }
  }, [transcribedText, isTranscribing]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(transcribedText);
    toast.success('Copied to clipboard!');
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: transcribedText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
      toast.success('Transcription cleared');
    }
  };

  return (
    <View style={[styles.transcriptionContainer, style]}>
      {isTranscribing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Transcribing your audio...</Text>
        </View>
      ) : (
        <>
          <View style={styles.scrollWrapper}>
            <TextInput
              style={styles.transcriptionText}
              multiline
              scrollEnabled
              value={transcribedText}
              onChangeText={onChangeText}
              placeholder="Your transcription will appear here..."
            />
          </View>
          {transcribedText ? (
            <View style={styles.actionsContainer}>
              <Pressable style={styles.actionButton} onPress={handleCopy}>
                <MaterialIcons name="content-copy" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </Pressable>
              
              <Pressable style={styles.actionButton} onPress={handleShare}>
                <MaterialIcons name="share" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Share</Text>
              </Pressable>
              
              <Pressable style={[styles.actionButton, styles.clearButton]} onPress={handleClear}>
                <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  transcriptionContainer: {
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
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    minHeight: 120,
  },
  scrollWrapper: {
    maxHeight: 250,
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
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    marginLeft: 6,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#FFEBEB',
    borderColor: '#FF3B30',
  },
  clearButtonText: {
    color: '#FF3B30',
  },
});

export default TranscriptionBox; 