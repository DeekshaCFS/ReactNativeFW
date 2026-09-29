// src/screens/technician/drawer/AIScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/theme';
import { ms, sp, scale, hp, vs } from '../../../utils/responsive';
import { getAIAnswer } from '../../../api';

const SAMPLE_QUESTIONS = [
  'How to change capacitor in motor ?',
  'How to change gas in AC ?',
  'How to change phone setting in android ?',
  'How to change NAND card in lift ?',
];

interface ChatEntry {
  question: string;
  answer: string;
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [errored, setErrored] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const inputBarBottom = insets.bottom + ms(12);

  const handleSend = async (question?: string) => {
    const text = (question ?? inputText).trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);
    setErrored(false);

    try {
      const response = await getAIAnswer({ Question: text });
      const answer = response?.ResultData?.Answer?.trim();
      if (answer) {
        setChat(prev => [...prev, { question: text, answer }]);
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      } else {
        setErrored(true);
      }
    } catch (e) {
      setErrored(true);
    } finally {
      setSending(false);
    }
  };

  const renderQuestion = (text: string) => (
    <Pressable
      style={({ pressed }) => [styles.questionPill, pressed && { opacity: 0.7 }]}
      key={text}
      onPress={() => handleSend(text)}
    >
      <Text style={styles.questionText} numberOfLines={2}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.redBg, { height: vs(8) }]} />

      <View style={styles.whiteSheet}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: ms(90) + inputBarBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* AI Intro Banner */}
          <View style={styles.chatRow}>
            <Image
              source={require('../../../../assets/images/favicon.png')}
              style={styles.aiIcon}
            />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>How can I help you today?</Text>
            </View>
          </View>

          {chat.length === 0 && !sending && (
            <>
              <Text style={styles.sampleTitle}>Some sample questions you can ask ...</Text>
              {SAMPLE_QUESTIONS.map(renderQuestion)}
            </>
          )}

          {chat.map((entry, index) => (
            <View key={index}>
              <View style={styles.userRow}>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{entry.question}</Text>
                </View>
              </View>
              <View style={styles.chatRow}>
                <Image
                  source={require('../../../../assets/images/favicon.png')}
                  style={styles.aiIcon}
                />
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>{entry.answer}</Text>
                </View>
              </View>
            </View>
          ))}

          {sending && (
            <View style={styles.chatRow}>
              <Image
                source={require('../../../../assets/images/favicon.png')}
                style={styles.aiIcon}
              />
              <View style={[styles.bubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            </View>
          )}

          {errored && (
            <Text style={styles.errorText}>
              Something went wrong. Please try again.
            </Text>
          )}
        </ScrollView>

        {/* Bottom Input Bar — not absolute, use KeyboardAvoidingView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? ms(90) : 0}
        >
          <View style={[styles.inputContainer, { marginBottom: inputBarBottom }]}>
            <TextInput
              placeholder="Ask your question..."
              placeholderTextColor="#888"
              style={styles.input}
              cursorColor={COLORS.primary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              editable={!sending}
              multiline
            />
            <Pressable
              style={styles.sendButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => handleSend()}
              disabled={sending || !inputText.trim()}
            >
              <Ionicons
                name="paper-plane-outline"
                size={scale(24)}
                color={sending || !inputText.trim() ? '#ccc' : COLORS.primary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    backgroundColor: COLORS.primary,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
  },
  content: {
    paddingTop: ms(16),
    paddingHorizontal: ms(20),
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  aiIcon: {
    width: ms(44),
    height: ms(44),
  },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: ms(16),
    marginLeft: ms(10),
  },
  loadingBubble: {
    flex: 0,
    paddingHorizontal: ms(20),
  },
  bubbleText: {
    color: '#fff',
    fontSize: sp(15),
    fontWeight: '500',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: ms(12),
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: ms(16),
  },
  userBubbleText: {
    color: '#111',
    fontSize: sp(15),
  },
  errorText: {
    color: '#c0392b',
    fontSize: sp(13),
    textAlign: 'center',
    marginBottom: ms(12),
  },
  sampleTitle: {
    fontSize: sp(15),
    color: '#333',
    marginBottom: ms(12),
  },
  questionPill: {
    backgroundColor: '#5a5a5a',
    paddingHorizontal: ms(14),
    paddingVertical: ms(8),
    borderRadius: ms(10),
    alignSelf: 'flex-start',
    marginBottom: ms(12),
  },
  questionText: {
    color: '#fff',
    fontSize: sp(14),
    lineHeight: sp(20),
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: ms(30),
    alignItems: 'center',
    paddingHorizontal: ms(14),
    marginHorizontal: ms(12),
    minHeight: ms(50),
  },
  input: {
    flex: 1,
    fontSize: sp(16),
    maxHeight: ms(100),
    color: '#111',
    paddingVertical: ms(10),
  },
  sendButton: {
    padding: ms(8),
  },
});
