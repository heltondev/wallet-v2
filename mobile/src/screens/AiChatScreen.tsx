import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import * as api from '../services/apiService';
import {
  FONT_SANS,
  FONT_MONO,
  FS_H3,
  FS_BODY,
  FS_SMALL,
  FS_CAPTION,
  FW_BOLD,
  FW_SEMIBOLD,
  FW_MEDIUM,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function AiChatScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const nextId = useRef(1);

  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: 'Ola! Sou seu assistente financeiro. Pergunte sobre seus gastos, orcamento ou dicas de economia.', time: now() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    const userMsg: Message = { id: nextId.current++, role: 'user', text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const { reply } = await api.aiChat(text);
      const aiMsg: Message = { id: nextId.current++, role: 'assistant', text: reply, time: now() };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setTyping(false);
    }
  };

  const canSend = input.trim().length > 0 && !typing;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S4, paddingVertical: S3, borderBottomWidth: 1, borderBottomColor: colors.border1 },
    backBtn: { marginRight: S3 },
    headerTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginLeft: S2 },
    list: { flex: 1, paddingHorizontal: S4 },
    msgWrapper: { marginVertical: S2 },
    msgWrapperUser: { alignItems: 'flex-end' },
    msgWrapperAssistant: { alignItems: 'flex-start' },
    bubbleUser: { backgroundColor: colors.pos, borderRadius: R_CARD_SM, borderBottomRightRadius: S1, padding: S3, maxWidth: '80%' },
    bubbleAssistant: { backgroundColor: colors.bg2, borderRadius: R_CARD_SM, borderBottomLeftRadius: S1, padding: S3, maxWidth: '80%' },
    msgText: { fontFamily: FONT_SANS, fontSize: FS_BODY, lineHeight: 20 },
    msgTextUser: { color: colors.bg0 },
    msgTextAssistant: { color: colors.text1 },
    msgTime: { fontFamily: FONT_MONO, fontSize: 10, marginTop: S1 },
    msgTimeUser: { color: colors.bg0, opacity: 0.6 },
    msgTimeAssistant: { color: colors.text4 },
    typingRow: { flexDirection: 'row', gap: S1, padding: S3, alignSelf: 'flex-start' },
    typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text3 },
    inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S4, paddingVertical: S2, borderTopWidth: 1, borderTopColor: colors.border1, backgroundColor: colors.bg1 },
    inputField: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S2 + 2, marginRight: S2 },
    sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    sendBtnActive: { backgroundColor: colors.pos },
    sendBtnDisabled: { backgroundColor: colors.bg3 },
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.msgWrapperUser : styles.msgWrapperAssistant]}>
        <View style={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
          <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAssistant]}>{item.text}</Text>
          <Text style={[styles.msgTime, isUser ? styles.msgTimeUser : styles.msgTimeAssistant]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icons.chevL size={20} color={colors.text2} />
        </TouchableOpacity>
        <Icons.alert size={20} color={colors.pos} />
        <Text style={styles.headerTitle}>Assistente</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderMessage}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            typing ? (
              <View style={styles.typingRow}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, { opacity: 0.6 }]} />
                <View style={[styles.typingDot, { opacity: 0.3 }]} />
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.inputField}
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte sobre suas financas..."
            placeholderTextColor={colors.text4}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
            onPress={send}
            disabled={!canSend}
          >
            <Icons.arrowUp size={18} color={canSend ? colors.bg0 : colors.text4} stroke={2.2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
