import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Switch } from 'react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { toast } from 'sonner-native';
import * as FileSystem from 'expo-file-system';
import TranscriptionBox from '../components/TranscriptionBox';
import RecordButton from '../components/RecordButton';

// API endpoint configuration
const BASE_URL = 'https://aj-development.athenaintelligence.ai';
const API_URL = `${BASE_URL}/transcribe`; // Without trailing slash
const HEALTH_URL = `${BASE_URL}/health`;
const DEBUG_URL = `${BASE_URL}/debug`;

export default function Index() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [useAlternativeUpload, setUseAlternativeUpload] = useState(false);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request microphone permissions on component mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
      
      // Test API connectivity on mount
      testApiConnectivity();
    })();
  }, []);
  
  // Function to test API connectivity
  async function testApiConnectivity() {
    try {
      console.log('Testing API connectivity...');
      console.log('Health check URL:', HEALTH_URL);
      
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow', // Follow redirects
      });
      
      console.log('Health check status:', response.status);
      console.log('Health check URL after potential redirect:', response.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Health check response:', JSON.stringify(data));
        toast.success('API connection successful');
        
        // Also test debug endpoint
        testDebugEndpoint();
      } else {
        console.log('Health check failed with status:', response.status);
        toast.error('API connection failed');
      }
    } catch (error) {
      console.error('API connectivity test failed:', error);
      toast.error('API connectivity test failed');
    }
  }
  
  // Function to test debug endpoint
  async function testDebugEndpoint() {
    try {
      console.log('Testing debug endpoint...');
      console.log('Debug URL:', DEBUG_URL);
      
      // Test GET debug endpoint
      const getResponse = await fetch(DEBUG_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      });
      
      console.log('Debug GET status:', getResponse.status);
      console.log('Debug GET URL after redirect:', getResponse.url);
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('Debug GET response:', JSON.stringify(getData));
      }
      
      // Test POST debug endpoint
      const postResponse = await fetch(DEBUG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
        redirect: 'follow',
      });
      
      console.log('Debug POST status:', postResponse.status);
      console.log('Debug POST URL after redirect:', postResponse.url);
      
      if (postResponse.ok) {
        const postData = await postResponse.json();
        console.log('Debug POST response:', JSON.stringify(postData));
      }
    } catch (error) {
      console.error('Debug endpoint test failed:', error);
    }
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
        // Log file info
        console.log('Recording URI:', uri);
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          console.log('File exists:', fileInfo.exists);
          console.log('File info:', JSON.stringify(fileInfo));
          
          // Check file size
          if (fileInfo.exists && fileInfo.size === 0) {
            console.error('Recording file is empty');
            toast.error('Recording file is empty');
            return;
          }
          
          // Fix for Android file URI
          let fileUri = uri;
          if (Platform.OS === 'android' && !uri.startsWith('file://')) {
            fileUri = `file://${uri}`;
            console.log('Modified URI for Android:', fileUri);
          }
        } catch (fileError) {
          console.error('Error checking file:', fileError);
        }
        
        setIsTranscribing(true);
        
        if (useAlternativeUpload) {
          // Alternative approach using base64
          try {
            console.log('Using alternative upload method (base64)');
            
            // Read the file as base64
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            console.log('File read as base64, length:', base64Audio.length);
            
            // Send the base64 data
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                audio_data: base64Audio,
                file_name: 'recording.m4a',
              }),
              redirect: 'follow', // Follow redirects
            });
            
            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);
            console.log('Final URL after redirects:', response.url);
            
            const data = await response.json();
            console.log('Response data:', JSON.stringify(data));
            
            if (data.transcription) {
              setTranscribedText(data.transcription);
              toast.success('Transcription complete');
            } else {
              console.log('No transcription in response data');
              toast.error('Transcription failed');
            }
          } catch (error) {
            console.error('Alternative upload error:', error);
            toast.error('Error during alternative upload');
          } finally {
            setIsTranscribing(false);
          }
        } else {
          // Original FormData approach
          try {
            const formData = new FormData();
            
            // Use the proper file URI based on platform
            const fileUri = Platform.OS === 'android' && !uri.startsWith('file://') 
              ? `file://${uri}` 
              : uri;
            
            console.log('Final URI to upload:', fileUri);
              
            formData.append('file', {
              uri: fileUri,
              type: 'audio/m4a',
              name: 'recording.m4a',
            } as any);
             
            // Log content type explicitly
            console.log('Content-Type being sent:', 'audio/m4a');
            
            console.log('Sending request to transcription API...');
            console.log('Request URL:', API_URL);
            console.log('FormData:', JSON.stringify(formData));
            
            try {
              console.log('Starting fetch request...');
              const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
                headers: {
                  'Accept': 'application/json',
                  // Remove Content-Type header to let the browser set it correctly with boundary
                },
                redirect: 'follow', // Follow redirects
              });
              console.log('Response status:', response.status);
              console.log('Response status text:', response.statusText);
              console.log('Final URL after redirects:', response.url);
              console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));
              
              const data = await response.json();
              console.log('Response data:', JSON.stringify(data));
              if (data.transcription) {
                setTranscribedText(data.transcription);
                toast.success('Transcription complete');
              } else {
                console.log('No transcription in response data');
                toast.error('Transcription failed');
              }
            } catch (fetchError) {
              console.error('Fetch error details:', fetchError);
              if (fetchError instanceof TypeError) {
                console.log('Network error type:', fetchError.name);
                console.log('Network error message:', fetchError.message);
              }
              throw fetchError;
            }
          } catch (error) {
            console.error('Transcription error:', error);
            console.log('Error:', error);
            toast.error('Error during transcription');
          } finally {
            setIsTranscribing(false);
          }
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
        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testApiConnectivity}
          >
            <Text style={styles.testButtonText}>Test API Connection</Text>
          </TouchableOpacity>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Use Base64</Text>
            <Switch
              value={useAlternativeUpload}
              onValueChange={setUseAlternativeUpload}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={useAlternativeUpload ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>
        </View>
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
});
