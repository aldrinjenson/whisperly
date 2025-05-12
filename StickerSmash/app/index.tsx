import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { toast } from 'sonner-native';
import * as FileSystem from 'expo-file-system';
import TranscriptionBox from '../components/TranscriptionBox';
import RecordButton from '../components/RecordButton';

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
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'audio/m4a',
            name: 'recording.m4a',
          } as any);
                
          console.log('Sending request to transcription API...');
          console.log('Request URL:', 'https://aj-development.athenaintelligence.ai/transcribe');
          console.log('FormData:', JSON.stringify(formData));
          
          const response = await fetch('https://aj-development.athenaintelligence.ai/transcribe', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Response:', response);
          const data = await response.json();
          if (data.transcription) {
            setTranscribedText(data.transcription);
            toast.success('Transcription complete');
          } else {
            toast.error('Transcription failed');
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
