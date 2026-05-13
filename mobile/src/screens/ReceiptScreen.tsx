import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import { fmtAmount } from '../utils/formatters';
import * as api from '../services/apiService';
import type { CurrencyCode, Transaction } from '../types';
import {
  FONT_SANS,
  FONT_MONO,
  FS_H1,
  FS_H3,
  FS_BODY,
  FS_SMALL,
  FS_CAPTION,
  FW_BOLD,
  FW_SEMIBOLD,
  FW_MEDIUM,
  TABULAR_NUMS,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

export function ReceiptScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<Partial<Transaction> | null>(null);

  const handleExtract = async () => {
    if (!aiText.trim() || loading) return;
    setLoading(true);
    try {
      const result = await api.aiExtractReceipt([], aiText);
      if (result.transactions.length > 0) {
        const extracted = result.transactions[0];
        const txData: Partial<Transaction> = {
          desc: extracted.desc,
          amount: extracted.amount,
          currency: extracted.currency as CurrencyCode,
          cat: extracted.cat,
          date: extracted.date,
          account: extracted.account ?? '',
        };
        await api.createTransaction(txData as Record<string, unknown>);
        setSaved(txData);
      }
    } catch {
      // extraction failed
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    headerTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginLeft: S2 },
    body: { flex: 1 },
    savedCard: { alignItems: 'center', paddingVertical: S6 },
    savedIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.pos, alignItems: 'center', justifyContent: 'center', marginBottom: S4 },
    savedTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_BOLD, color: colors.text1, marginBottom: S2 },
    savedDesc: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text2, marginBottom: S2 },
    savedAmount: { fontFamily: FONT_MONO, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.pos, fontVariant: [...TABULAR_NUMS], marginBottom: S5 },
    savedActions: { flexDirection: 'row', gap: S3 },
    scanAgainBtn: { backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S5 },
    scanAgainText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text2 },
    backActionBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S5 },
    backActionText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    textarea: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, padding: S3, minHeight: 150, textAlignVertical: 'top', marginBottom: S4 },
    extractBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: S2 },
    extractBtnDisabled: { opacity: 0.5 },
    extractBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    hint: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, textAlign: 'center', marginTop: S3 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Icons.search size={20} color={colors.pos} />
          <Text style={styles.headerTitle}>Escanear Recibo</Text>
        </View>

        <View style={styles.body}>
          {saved ? (
            <View style={styles.savedCard}>
              <View style={styles.savedIconCircle}>
                <Icons.check size={28} color={colors.bg0} stroke={2.4} />
              </View>
              <Text style={styles.savedTitle}>Transacao salva!</Text>
              <Text style={styles.savedDesc}>{saved.desc}</Text>
              <Text style={styles.savedAmount}>
                {fmtAmount(Math.abs(saved.amount ?? 0), (saved.currency ?? 'BRL') as CurrencyCode)}
              </Text>
              <View style={styles.savedActions}>
                <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setSaved(null); setAiText(''); }}>
                  <Text style={styles.scanAgainText}>Escanear outro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backActionBtn} onPress={() => nav.goBack()}>
                  <Text style={styles.backActionText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.textarea}
                placeholder="Cole o texto do recibo ou nota fiscal..."
                placeholderTextColor={colors.text4}
                value={aiText}
                onChangeText={setAiText}
                multiline
              />
              <TouchableOpacity
                style={[styles.extractBtn, (!aiText.trim() || loading) && styles.extractBtnDisabled]}
                onPress={handleExtract}
                disabled={!aiText.trim() || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={colors.bg0} size="small" />
                    <Text style={styles.extractBtnText}>Analisando...</Text>
                  </>
                ) : (
                  <>
                    <Icons.search size={16} color={colors.bg0} />
                    <Text style={styles.extractBtnText}>Extrair dados</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.hint}>A AI vai extrair automaticamente os dados do recibo</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
