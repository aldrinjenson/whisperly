import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Clipboard } from 'react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { toast } from 'sonner-native';
import * as FileSystem from 'expo-file-system';
import TranscriptionBox from '../components/TranscriptionBox';
import RecordButton from '../components/RecordButton';

// API endpoint configuration
// const BASE_URL = 'https://aj-development.athenaintelligence.ai';
const BASE_URL = 'https://whisperly.onrender.com';
const API_URL = `${BASE_URL}/transcribe`;

export default function Index() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request microphone permissions on component mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

  async function startRecording() {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingDuration(0);
      durationTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      toast.success('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      toast.error('Failed to start recording');
    }
  }

  async function stopRecording() {
    try {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      setIsRecording(false);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      
      if (uri) {
        setIsTranscribing(true);
        
        try {
          // Prepare file URI
          const fileUri = Platform.OS === 'android' && !uri.startsWith('file://') 
            ? `file://${uri}` : uri;
          
          const formData = new FormData();
          formData.append('file', {
            uri: fileUri,
            type: 'audio/m4a',
            name: 'recording.m4a',
          } as any);
          
          const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
            redirect: 'follow',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.transcription) {
              setTranscribedText(data.transcription);
              await Clipboard.setString(data.transcription);
              toast.success('Transcription copied to clipboard');
            } else {
              toast.error('Transcription failed');
            }
          } else {
            toast.error(`Error: ${response.status}`);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Error during transcription');
        } finally {
          setIsTranscribing(false);
        }
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast.error('Failed to stop recording');
      setIsRecording(false);
      setIsTranscribing(false);
    }
  }

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Whisperly</Text>
        <Text style={styles.subtitle}>Voice to Text Transcription</Text>
        {isRecording && (
          <Text style={styles.recordingTime}>
            Recording... {formatDuration(recordingDuration)}
          </Text>
        )}
      </View>
      <TranscriptionBox
        isTranscribing={isTranscribing}
        transcribedText={transcribedText}
      />
      <RecordButton
        isRecording={isRecording}
        onPress={isRecording ? stopRecording : startRecording}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  recordingTime: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 10,
    fontWeight: '500',
  },
});
