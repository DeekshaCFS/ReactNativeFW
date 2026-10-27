// src/screens/technician/drawer/AIScreen.tsx
//
// Java OpenAIFragment (open_ai_fragment.xml / open_ai_response_item.xml). Shared by admin and
// technician; both draw the main toolbar (menu + help + bell) above it and hide the bottom bar.
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/theme';
import { ms, sp, useAppHeaderHeight } from '../../../utils/responsive';
import { getAIAnswer } from '../../../api';

import {useTranslation} from 'react-i18next';
const SAMPLE_QUESTION_KEYS = ['ask1', 'ask2', 'ask3', 'ask4'];

interface ChatEntry {
  question: string;
  answer: string;
}

// ic_openai_send.xml
const SendIcon = ({ color }: { color: string }) => (
  <Svg width={ms(24)} height={ms(24)} viewBox="0 0 24 24">
    <Path d="M22,2L11,13" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22,2l-7,20l-4,-9l-9,-4l20,-7z" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AiLogo = () => <Image source={require('../../../../assets/images/ai_fw_logo.png')} style={styles.aiIcon} />;

export default function AIScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useAppHeaderHeight();
  const [inputText, setInputText] = useState('');
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [errored, setErrored] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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

  const canSend = !sending && !!inputText.trim();

  return (
    <View style={[styles.root, { paddingTop: headerHeight }]}>
      <View style={styles.whiteSheet}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: ms(100) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* aiView: 40dp logo + red bubble with the pointed corner towards the logo */}
          <View style={styles.aiRow}>
            <AiLogo />
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={styles.bubbleText}>{t('defaultquestion')}</Text>
            </View>
          </View>

          {chat.length === 0 && !sending && (
            <View style={styles.hints}>
              <Text style={styles.sampleTitle}>{t('samplequestion')}</Text>
              {SAMPLE_QUESTION_KEYS.map(key => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [styles.hint, pressed && { opacity: 0.7 }]}
                  onPress={() => handleSend(t(key))}
                >
                  <Text style={styles.hintText}>{t(key)}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {chat.map((entry, index) => (
            <View key={index}>
              <View style={styles.userRow}>
                <View style={[styles.bubble, styles.userBubble]}>
                  <Text style={styles.bubbleText}>{entry.question}</Text>
                </View>
              </View>
              <View style={styles.aiRow}>
                <AiLogo />
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Text style={styles.bubbleText}>{entry.answer}</Text>
                </View>
              </View>
            </View>
          ))}

          {sending && (
            <View style={styles.aiRow}>
              <AiLogo />
              <View style={[styles.bubble, styles.aiBubble, { paddingRight: ms(20) }]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            </View>
          )}

          {errored && (
            <Text style={styles.errorText}>{t('rn_something_went_wrong_please_try_again')}</Text>
          )}
        </ScrollView>

        {/* bottom: 5dp side margins, 40dp bottom margin, #EDEDED pill radius 34 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? ms(90) : 0}
        >
          <View style={[styles.inputContainer, { marginBottom: Math.max(insets.bottom, ms(40)) }]}>
            <TextInput
              placeholder={t('hinttext')}
              placeholderTextColor="#757575"
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
              disabled={!canSend}
            >
              <SendIcon color={COLORS.primary} />
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
  // CardView: marginTop 20dp, corner radius 30dp
  whiteSheet: {
    flex: 1,
    marginTop: ms(30),
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  content: {
    paddingTop: 0,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: ms(8),
    paddingBottom: ms(4),
  },
  aiIcon: {
    width: ms(40),
    height: ms(40),
  },
  // background_left / background_right: 8dp radius, pointed corner on the side of the avatar
  bubble: {
    borderRadius: ms(8),
    paddingTop: ms(4),
    paddingBottom: ms(10),
    maxWidth: '78%',
  },
  aiBubble: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 0,
    paddingLeft: ms(20),
    paddingRight: ms(30),
    marginLeft: ms(4),
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: ms(10),
    paddingTop: ms(10),
  },
  userBubble: {
    backgroundColor: '#353935',
    borderTopRightRadius: 0,
    paddingHorizontal: ms(20),
  },
  bubbleText: {
    color: '#fff',
    fontSize: sp(14),
  },
  errorText: {
    color: '#c0392b',
    fontSize: sp(13),
    textAlign: 'center',
    marginTop: ms(12),
  },
  // aihint: marginLeft 60dp, title 14sp black, pills #555 radius 10 padding 5dp, 10dp gaps
  hints: {
    marginLeft: ms(60),
    marginTop: ms(22),
    alignItems: 'flex-start',
  },
  sampleTitle: {
    fontSize: sp(14),
    color: '#000',
    padding: ms(2),
    marginBottom: ms(10),
  },
  hint: {
    backgroundColor: '#555555',
    borderRadius: ms(10),
    padding: ms(5),
    marginBottom: ms(10),
  },
  hintText: {
    color: '#fff',
    fontSize: sp(14),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    borderRadius: ms(34),
    marginHorizontal: ms(5),
    paddingRight: ms(10),
  },
  input: {
    flex: 1,
    marginLeft: ms(10),
    marginRight: ms(20),
    padding: ms(10),
    fontSize: sp(16),
    maxHeight: ms(100),
    color: '#212121',
  },
  sendButton: {
    padding: ms(10),
  },
});
