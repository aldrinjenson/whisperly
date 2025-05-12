import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Clipboard, TextInput, ScrollView } from 'react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { toast } from 'sonner-native';
import * as FileSystem from 'expo-file-system';
import TranscriptionBox from '../components/TranscriptionBox';
import RecordButton from '../components/RecordButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API endpoint configuration
const BASE_URL = 'https://aj-development.athenaintelligence.ai';
// const BASE_URL = 'https://whisperly.onrender.com';
const API_URL = `${BASE_URL}/transcribe`;

export default function Index() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Load keywords from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('whisperly_keywords');
        if (stored) setKeywords(JSON.parse(stored));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  // Save keywords to AsyncStorage whenever they change
  useEffect(() => {
    AsyncStorage.setItem('whisperly_keywords', JSON.stringify(keywords));
  }, [keywords]);

  function addKeyword() {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setKeywordInput('');
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter(k => k !== kw));
  }

  function clearTranscription() {
    setTranscribedText('');
  }

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
          if (keywords.length > 0) {
            formData.append('keywords', keywords.join(', '));
          }
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
      {/* Keyword Stack UI */}
      <View style={styles.keywordSection}>
        <Text style={styles.keywordLabel}>Keywords / Names to Remember:</Text>
        <View style={styles.keywordInputRow}>
          <TextInput
            style={styles.keywordInput}
            placeholder="Add keyword (e.g. names, terms)"
            value={keywordInput}
            onChangeText={setKeywordInput}
            onSubmitEditing={addKeyword}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={addKeyword}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {keywords.map((kw, idx) => (
            <View key={kw + idx} style={styles.chip}>
              <Text style={styles.chipText}>{kw}</Text>
              <TouchableOpacity onPress={() => removeKeyword(kw)}>
                <Text style={styles.chipRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
      {/* Add clear transcription button here */}
      <TouchableOpacity disabled={!transcribedText} style={[styles.clearTranscriptionButton, !transcribedText && styles.clearTranscriptionButtonDisabled]} onPress={clearTranscription}>
        <Text style={styles.clearTranscriptionButtonText}>Clear</Text>
      </TouchableOpacity>
      <TranscriptionBox
        isTranscribing={isTranscribing}
        transcribedText={transcribedText}
        style={styles.transcriptionBoxMargin}
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
  keywordSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  keywordLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  keywordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  keywordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFF',
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  chipScroll: {
    flexDirection: 'row',
    marginTop: 4,
    minHeight: 36,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F0FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 15,
    marginRight: 6,
  },
  chipRemove: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 2,
  },
  transcriptionBoxMargin: {
    marginTop: 40,
  },
  clearTranscriptionButton: {
    alignSelf: 'center',
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearTranscriptionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearTranscriptionButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});
