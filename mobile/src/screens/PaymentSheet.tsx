import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/useWalletStore';
import { Icons } from '../components/icons/Icons';
import { fmtAmount } from '../utils/formatters';
import * as api from '../services/apiService';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { CurrencyCode } from '../types';
import {
  FONT_SANS,
  FONT_MONO,
  FS_H2,
  FS_H3,
  FS_BODY,
  FS_SMALL,
  FS_CAPTION,
  FW_BOLD,
  FW_SEMIBOLD,
  FW_MEDIUM,
  FW_REGULAR,
  TABULAR_NUMS,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PaymentSheet'>;

export function PaymentSheet() {
  const { colors } = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { recurring } = route.params;
  const { accounts, loadData } = useWalletStore();

  const [amount, setAmount] = useState(String(Math.abs(recurring.amount)));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState(recurring.account || accounts[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;
  const disabled = numAmount <= 0 || saving;

  const handleConfirm = async () => {
    if (disabled) return;
    setSaving(true);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await api.createPayment({
        recurringId: recurring.id,
        month,
        amount: -Math.abs(numAmount),
        currency: recurring.currency,
        paidDate,
        account,
        notes: notes.trim() || undefined,
        workspaceId: recurring.workspaceId,
      });
      await loadData();
      nav.goBack();
    } catch {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { padding: S4 },
    handle: { width: 40, height: 4, backgroundColor: colors.bg3, borderRadius: 2, alignSelf: 'center', marginBottom: S4 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S5 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H2, fontWeight: FW_BOLD, color: colors.text1 },
    closeBtn: { padding: S2 },
    billName: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.text1, marginBottom: S1 },
    billExpected: { fontFamily: FONT_MONO, fontSize: FS_SMALL, color: colors.text3, fontVariant: [...TABULAR_NUMS], marginBottom: S5 },
    fieldGroup: { marginBottom: S4 },
    label: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3, marginBottom: S1 },
    input: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S3, borderWidth: 1, borderColor: colors.border1 },
    accountRow: { flexDirection: 'row', gap: S2, flexWrap: 'wrap' },
    accountChip: { paddingHorizontal: S3, paddingVertical: S2, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, backgroundColor: colors.bg2 },
    accountChipActive: { borderColor: colors.pos, backgroundColor: colors.posBg },
    accountChipText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    accountChipTextActive: { color: colors.pos },
    confirmBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center', marginTop: S5 },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Confirmar pagamento</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => nav.goBack()}>
            <Icons.x size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>

        <Text style={styles.billName}>{recurring.desc}</Text>
        <Text style={styles.billExpected}>
          Valor esperado: {fmtAmount(Math.abs(recurring.amount), recurring.currency, { decimals: 2 })}
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Valor pago</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.text4}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Data do pagamento</Text>
          <TextInput
            style={styles.input}
            value={paidDate}
            onChangeText={setPaidDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text4}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Conta</Text>
          <View style={styles.accountRow}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.accountChip, account === acc.name && styles.accountChipActive]}
                onPress={() => setAccount(acc.name)}
              >
                <Text style={[styles.accountChipText, account === acc.name && styles.accountChipTextActive]}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: pago com desconto"
            placeholderTextColor={colors.text4}
          />
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, disabled && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmBtnText}>
            {saving ? 'Salvando...' : 'Confirmar pagamento'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
