import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount, freqLabel } from '../utils/formatters';
import { getRecurringStatuses } from '../utils/recurring';
import type { RecurringStatus } from '../utils/recurring';
import type { RootStackParamList } from '../navigation/AppNavigator';
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
  FW_REGULAR,
  TABULAR_NUMS,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD_SM, R_INPUT, R_PILL } from '../styles/spacing';

type FilterMode = 'all' | 'pending' | 'paid' | 'overdue';
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ContasScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<Nav>();
  const currency = useSettingsStore(s => s.currency);
  const { tx, recurringItems, payments, activeWorkspace, fxRates } = useWalletStore();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeRecurring = useMemo(
    () => recurringItems.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
    [recurringItems, activeWorkspace],
  );

  const billStatuses = useMemo(
    () => getRecurringStatuses(activeRecurring, tx, currency, fxRates, payments),
    [activeRecurring, tx, currency, fxRates, payments],
  );

  const filtered = useMemo(() => {
    let result = billStatuses;
    if (filter === 'pending') result = result.filter(s => s.status === 'pending');
    if (filter === 'paid') result = result.filter(s => s.status === 'paid');
    if (filter === 'overdue') result = result.filter(s => s.status === 'overdue');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.recurring.desc.toLowerCase().includes(q) ||
        s.recurring.cat.toLowerCase().includes(q) ||
        s.recurring.account.toLowerCase().includes(q),
      );
    }
    return result;
  }, [billStatuses, filter, searchQuery]);

  const counts = useMemo(() => ({
    all: billStatuses.length,
    pending: billStatuses.filter(s => s.status === 'pending').length,
    paid: billStatuses.filter(s => s.status === 'paid').length,
    overdue: billStatuses.filter(s => s.status === 'overdue').length,
  }), [billStatuses]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: S4 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1 },
    searchBtn: { padding: S2 },
    searchInput: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S2 + 2, borderWidth: 1, borderColor: colors.border1, marginBottom: S3 },
    chipsRow: { flexDirection: 'row', gap: S2, marginBottom: S4 },
    chip: { paddingHorizontal: S3, paddingVertical: S1 + 2, borderRadius: R_PILL, borderWidth: 1, borderColor: colors.border1, backgroundColor: colors.bg2 },
    chipActive: { borderColor: colors.pos, backgroundColor: colors.posBg },
    chipText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    chipTextActive: { color: colors.pos },
    verifyBtn: { flexDirection: 'row', alignItems: 'center', gap: S2, backgroundColor: colors.posBg, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S4, marginBottom: S4 },
    verifyText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.pos },
    billItem: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    billItemOverdue: { borderColor: colors.neg },
    billRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: S2 },
    dotPending: { backgroundColor: colors.warn },
    dotOverdue: { backgroundColor: colors.neg },
    billIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: S3 },
    billInfo: { flex: 1 },
    billDesc: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    billMeta: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    billAmount: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS], marginRight: S2 },
    payBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S1 + 2 },
    payBtnText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    expanded: { marginTop: S3, paddingTop: S3, borderTopWidth: 1, borderTopColor: colors.border1 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S2 },
    detailLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3 },
    detailValue: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text1, fontVariant: [...TABULAR_NUMS] },
    actionRow: { flexDirection: 'row', gap: S2, marginTop: S3 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: S1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S2 },
    actionBtnPay: { backgroundColor: colors.pos },
    actionBtnUndo: { borderWidth: 1, borderColor: colors.neg },
    actionBtnText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    actionBtnTextPay: { color: colors.bg0 },
    actionBtnTextUndo: { color: colors.neg },
    empty: { alignItems: 'center', paddingVertical: S6 + S6 },
    emptyText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, marginTop: S3 },
  });

  const renderChip = (mode: FilterMode, label: string) => (
    <TouchableOpacity
      key={mode}
      style={[styles.chip, filter === mode && styles.chipActive]}
      onPress={() => setFilter(mode)}
    >
      <Text style={[styles.chipText, filter === mode && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderCategoryIcon = (cat: string) => {
    const meta = CATS[cat];
    const bgColor = meta?.color ?? colors.bg3;
    const iconName = meta?.icon ?? 'wallet';
    const Ic = Icons[iconName as keyof typeof Icons];
    return (
      <View style={[styles.billIcon, { backgroundColor: bgColor }]}>
        {Ic && <Ic size={16} color="#fff" stroke={1.8} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Contas</Text>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}
          >
            <Icons.search size={17} color={searchOpen ? colors.pos : colors.text2} />
          </TouchableOpacity>
        </View>

        {searchOpen && (
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conta..."
            placeholderTextColor={colors.text4}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
          <View style={styles.chipsRow}>
            {renderChip('all', `Todas (${counts.all})`)}
            {renderChip('pending', `Pendentes (${counts.pending})`)}
            {renderChip('paid', `Pagas (${counts.paid})`)}
            {counts.overdue > 0 && renderChip('overdue', `Atrasadas (${counts.overdue})`)}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.verifyBtn} onPress={() => nav.navigate('VerifyPayments')} activeOpacity={0.7}>
          <Icons.alert size={16} color={colors.pos} />
          <Text style={styles.verifyText}>Verificar pagamento</Text>
        </TouchableOpacity>

        {filtered.map((item: RecurringStatus) => (
          <TouchableOpacity
            key={item.recurring.id}
            style={[styles.billItem, item.status === 'overdue' && styles.billItemOverdue]}
            onPress={() => setExpandedId(expandedId === item.recurring.id ? null : item.recurring.id)}
            activeOpacity={0.7}
          >
            <View style={styles.billRow}>
              {item.status === 'paid' ? (
                <View style={{ marginRight: S2 }}>
                  <Icons.check size={12} color={colors.pos} />
                </View>
              ) : (
                <View style={[styles.statusDot, item.status === 'pending' ? styles.dotPending : styles.dotOverdue]} />
              )}
              {renderCategoryIcon(item.recurring.cat)}
              <View style={styles.billInfo}>
                <Text style={styles.billDesc}>{item.recurring.desc}</Text>
                <Text style={styles.billMeta}>
                  {item.recurring.dayOfMonth ? `Dia ${item.recurring.dayOfMonth}` : freqLabel(item.recurring.frequency)}
                  {item.status === 'overdue' ? ' \u00b7 Atrasado' : ''}
                  {item.status === 'paid' && item.matchingPayment ? ` \u00b7 Pago ${item.matchingPayment.paidDate.slice(8, 10)}/${item.matchingPayment.paidDate.slice(5, 7)}` : ''}
                  {item.status === 'paid' && !item.matchingPayment && item.matchingTx ? ` \u00b7 Pago ${item.matchingTx.date.slice(8, 10)}/${item.matchingTx.date.slice(5, 7)}` : ''}
                </Text>
              </View>
              <Text style={styles.billAmount}>
                {fmtAmount(Math.abs(item.monthlyConverted), currency, { decimals: 0 })}
              </Text>
              {item.status !== 'paid' && (
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => nav.navigate('PaymentSheet', { recurring: item.recurring })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.payBtnText}>{item.recurring.amount > 0 ? 'Receber' : 'Pagar'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {expandedId === item.recurring.id && (
              <View style={styles.expanded}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Conta</Text>
                  <Text style={styles.detailValue}>{item.recurring.account}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Frequencia</Text>
                  <Text style={styles.detailValue}>{freqLabel(item.recurring.frequency)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valor original</Text>
                  <Text style={styles.detailValue}>
                    {fmtAmount(Math.abs(item.recurring.amount), item.recurring.currency, { decimals: 2 })}
                  </Text>
                </View>
                {item.matchingPayment?.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notas</Text>
                    <Text style={styles.detailValue}>{item.matchingPayment.notes}</Text>
                  </View>
                )}
                <View style={styles.actionRow}>
                  {item.status !== 'paid' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPay]}
                      onPress={() => nav.navigate('PaymentSheet', { recurring: item.recurring })}
                    >
                      <Icons.check size={14} color={colors.bg0} />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextPay]}>
                        {item.recurring.amount > 0 ? 'Marcar como recebido' : 'Marcar como pago'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'paid' && item.matchingPayment && (
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnUndo]}>
                      <Icons.x size={14} color={colors.neg} />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextUndo]}>Desfazer pagamento</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => nav.navigate('ManageRecurring')}>
                    <Icons.pencil size={14} color={colors.text2} />
                    <Text style={styles.actionBtnText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Icons.repeat size={24} color={colors.text3} />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'Nenhuma conta cadastrada.' : 'Nenhuma conta neste filtro.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
