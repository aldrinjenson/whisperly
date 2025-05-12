import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { toast } from 'sonner-native';
import * as FileSystem from 'expo-file-system';
import TranscriptionBox from '../components/TranscriptionBox';
import RecordButton from '../components/RecordButton';

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        toast.error('Microphone permission not granted');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
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
    if (!recording) return;
    try {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      console.log('Recording URI:', uri);
      
      if (uri) {
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'audio/m4a',
            name: 'recording.m4a',
          } as any);
          
          console.log('Sending request to transcription API...');
          console.log('Request URL:', 'https://aj-development.athenaintelligence.ai/transcribe');
          console.log('FormData:', JSON.stringify(formData));
          
          const apiUrl = 'https://aj-development.athenaintelligence.ai/transcribe';
          
          try {
            // First, test if the server is reachable
            console.log('Testing server connectivity...');
            const testResponse = await fetch(apiUrl, { 
              method: 'HEAD',
              headers: { 'Accept': 'application/json' }
            }).catch(e => {
              console.error('Server connectivity test failed:', e);
              throw e;
            });
            
            console.log('Server connectivity test result:', testResponse.status);
          } catch (error) {
            console.error('Server unreachable:', error);
          }
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('Response status:', response.status);
          console.log('Response headers:', JSON.stringify(response.headers));
          
          const data = await response.json();
          console.log('Response data:', data);
          
          if (data.transcription) {
            setTranscribedText(data.transcription);
            toast.success('Transcription complete');
          } else {
            console.error('No transcription in response:', data);
            toast.error('Transcription failed');
          }
        } catch (error) {
          console.error('Transcription error details:', error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
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
        <Text style={styles.title}>Voice Transcription</Text>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  recordingTime: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 5,
  },
});