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
import { useSettingsStore } from '../store/useSettingsStore';
import { Icons } from '../components/icons/Icons';
import { fmtAmount } from '../utils/formatters';
import * as api from '../services/apiService';
import type { AiVerifyPaymentsMatch, AiVerifyPaymentsResult } from '../types';
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
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT, R_PILL } from '../styles/spacing';

export function VerifyPaymentsScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();
  const currency = useSettingsStore(s => s.currency);

  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiVerifyPaymentsResult | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!aiText.trim()) return;
    setLoading(true);
    try {
      const res = await api.aiVerifyPayments([], aiText);
      setResult(res);
      setChecked(res.matches.map(() => true));
    } catch {
      // AI failed
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (!result) return;
    setSaving(true);
    const selected = result.matches.filter((_, i) => checked[i]);
    // Process selected matches - create payments
    Promise.all(
      selected.map(m => {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return api.createPayment({
          recurringId: m.recurringId,
          month,
          amount: -Math.abs(m.amount),
          currency: m.currency,
          paidDate: m.paidDate,
        });
      }),
    )
      .then(() => nav.goBack())
      .catch(() => setSaving(false));
  };

  const checkedCount = checked.filter(Boolean).length;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1 },
    intro: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text3, marginBottom: S4, lineHeight: 20 },
    textarea: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, padding: S3, minHeight: 100, textAlignVertical: 'top', marginBottom: S4 },
    analyzeBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: S2 },
    analyzeBtnDisabled: { opacity: 0.5 },
    analyzeBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    resultTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginTop: S5, marginBottom: S3 },
    warningBox: { backgroundColor: colors.warnBg, borderRadius: R_INPUT, padding: S3, marginBottom: S3 },
    warningText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.warn },
    matchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    matchItemChecked: { borderColor: colors.pos },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center', marginRight: S3 },
    checkboxChecked: { backgroundColor: colors.pos, borderColor: colors.pos },
    matchInfo: { flex: 1 },
    matchDesc: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    matchMeta: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    matchAmount: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS], marginRight: S2 },
    confidenceBadge: { paddingHorizontal: S2, paddingVertical: 2, borderRadius: R_PILL },
    confidenceHigh: { backgroundColor: colors.posBg },
    confidenceMedium: { backgroundColor: colors.warnBg },
    confidenceLow: { backgroundColor: colors.negBg },
    confidenceText: { fontFamily: FONT_MONO, fontSize: 10, fontWeight: FW_SEMIBOLD },
    confidenceTextHigh: { color: colors.pos },
    confidenceTextMedium: { color: colors.warn },
    confidenceTextLow: { color: colors.neg },
    unmatchedSection: { marginTop: S4 },
    unmatchedTitle: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.text3, marginBottom: S2 },
    unmatchedItem: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2, marginBottom: S1, paddingLeft: S3 },
    actionsRow: { flexDirection: 'row', gap: S3, marginTop: S5 },
    cancelBtn: { flex: 1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center' },
    cancelBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_MEDIUM, color: colors.text2 },
    approveBtn: { flex: 2, backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center' },
    approveBtnDisabled: { opacity: 0.5 },
    approveBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
  });

  const confidenceStyle = (c: string) => {
    if (c === 'high') return { badge: styles.confidenceHigh, text: styles.confidenceTextHigh };
    if (c === 'medium') return { badge: styles.confidenceMedium, text: styles.confidenceTextMedium };
    return { badge: styles.confidenceLow, text: styles.confidenceTextLow };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.title}>Verificar pagamentos</Text>
        </View>

        {!result ? (
          <>
            <Text style={styles.intro}>
              Cole texto de extrato bancario ou comprovante. A AI vai identificar quais contas foram pagas.
            </Text>

            <TextInput
              style={styles.textarea}
              placeholder="Cole texto de extrato ou comprovante..."
              placeholderTextColor={colors.text4}
              value={aiText}
              onChangeText={setAiText}
              multiline
            />

            <TouchableOpacity
              style={[styles.analyzeBtn, (!aiText.trim() || loading) && styles.analyzeBtnDisabled]}
              onPress={handleAnalyze}
              disabled={!aiText.trim() || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={colors.bg0} size="small" />
                  <Text style={styles.analyzeBtnText}>Analisando...</Text>
                </>
              ) : (
                <>
                  <Icons.alert size={16} color={colors.bg0} />
                  <Text style={styles.analyzeBtnText}>Verificar pagamentos</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.resultTitle}>
              {result.matches.length > 0
                ? `Encontramos ${result.matches.length} pagamento${result.matches.length > 1 ? 's' : ''}`
                : 'Nenhum pagamento identificado'}
            </Text>

            {result.warnings.length > 0 &&
              result.warnings.map((w, i) => (
                <View key={i} style={styles.warningBox}>
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}

            {result.matches.map((m, idx) => {
              const cs = confidenceStyle(m.confidence);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.matchItem, checked[idx] && styles.matchItemChecked]}
                  onPress={() => setChecked(prev => prev.map((v, i) => (i === idx ? !v : v)))}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked[idx] && styles.checkboxChecked]}>
                    {checked[idx] && <Icons.check size={12} stroke={2.5} color={colors.bg0} />}
                  </View>
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchDesc}>{m.recurringDesc}</Text>
                    <Text style={styles.matchMeta}>
                      {m.paidDate} {'\u00b7'} {m.matchReason}
                    </Text>
                  </View>
                  <Text style={styles.matchAmount}>
                    {fmtAmount(Math.abs(m.amount), currency, { decimals: 2 })}
                  </Text>
                  <View style={[styles.confidenceBadge, cs.badge]}>
                    <Text style={[styles.confidenceText, cs.text]}>{m.confidence}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {result.unmatched.length > 0 && (
              <View style={styles.unmatchedSection}>
                <Text style={styles.unmatchedTitle}>Nao identificados</Text>
                {result.unmatched.map((u, i) => (
                  <Text key={i} style={styles.unmatchedItem}>{u}</Text>
                ))}
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setResult(null);
                  setAiText('');
                }}
              >
                <Text style={styles.cancelBtnText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveBtn, (checkedCount === 0 || saving) && styles.approveBtnDisabled]}
                onPress={handleApprove}
                disabled={checkedCount === 0 || saving}
                activeOpacity={0.7}
              >
                <Text style={styles.approveBtnText}>
                  {saving ? 'Salvando...' : `Confirmar ${checkedCount} pagamento${checkedCount !== 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
