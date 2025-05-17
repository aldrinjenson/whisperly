import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

interface Props {
  originalText: string;
}

type FormatOption = 'email' | 'slack' | 'grammar' | 'custom';

const FORMAT_OPTIONS: { label: string; value: FormatOption }[] = [
  { label: 'Email', value: 'email' },
  { label: 'Slack', value: 'slack' },
  { label: 'Fix Grammar', value: 'grammar' },
  { label: 'Custom', value: 'custom' },
];

const BASE_URL = 'https://aj-development.athenaintelligence.ai';
const FORMAT_API_URL = `${BASE_URL}/format`;

const FormattingSection: React.FC<Props> = ({ originalText }) => {
  const [option, setOption] = useState<FormatOption>('email');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedText, setFormattedText] = useState('');

  const handleFormat = async () => {
    if (!originalText) {
      toast.error('Nothing to format');
      return;
    }
    if (option === 'custom' && !customInstruction.trim()) {
      toast.error('Please provide a custom instruction');
      return;
    }

    setIsFormatting(true);
    setFormattedText('');

    try {
      const response = await fetch(FORMAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          mode: option,
          instruction: option === 'custom' ? customInstruction.trim() : undefined,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.formatted) {
          setFormattedText(data.formatted);
          await Clipboard.setStringAsync(data.formatted);
          toast.success('Formatted text copied to clipboard');
        } else {
          toast.error('Formatting failed');
        }
      } else {
        toast.error(`Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Formatting error:', error);
      toast.error('Error during formatting');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleCopy = async () => {
    if (!formattedText) return;
    await Clipboard.setStringAsync(formattedText);
    toast.success('Copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Refine with AI</Text>

      {/* Options */}
      <View style={styles.optionsRow}>
        {FORMAT_OPTIONS.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.optionButton,
              option === value && styles.optionButtonActive,
            ]}
            onPress={() => setOption(value)}
          >
            <Text
              style={[
                styles.optionButtonText,
                option === value && styles.optionButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {option === 'custom' && (
        <TextInput
          style={styles.customInput}
          placeholder="Enter custom instruction..."
          value={customInstruction}
          onChangeText={setCustomInstruction}
          multiline
        />
      )}

      <TouchableOpacity
        style={[styles.formatButton, isFormatting && { opacity: 0.6 }]}
        onPress={handleFormat}
        disabled={isFormatting}
      >
        {isFormatting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.formatButtonText}>Format Text</Text>
        )}
      </TouchableOpacity>

      {/* Result */}
      {isFormatting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Formatting your text...</Text>
        </View>
      ) : formattedText ? (
        <>
          <Text style={styles.resultText}>{formattedText}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  optionButtonTextActive: {
    color: '#FFF',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 15,
    backgroundColor: '#F9F9F9',
    marginBottom: 12,
  },
  formatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  formatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 12,
  },
  copyButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  copyButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FormattingSection; 