import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount, freqLabel } from '../utils/formatters';
import { monthlyAmount, getRecurringStatuses } from '../utils/recurring';
import type { RecurringStatus } from '../utils/recurring';
import { currentMonthKey, monthLabel } from '../utils/dates';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  FONT_SANS,
  FONT_MONO,
  FS_H1,
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
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT, R_PILL } from '../styles/spacing';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<Nav>();
  const currency = useSettingsStore(s => s.currency);
  const { tx, recurringItems, payments, workspaces, activeWorkspace, fxRates, loading, loadData } =
    useWalletStore();

  const activeRecurring = useMemo(
    () => recurringItems.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
    [recurringItems, activeWorkspace],
  );

  const activeWs = useMemo(
    () => workspaces.find(w => w.id === activeWorkspace),
    [workspaces, activeWorkspace],
  );

  const monthlyBudget = activeWs?.monthlyBudget ?? 0;

  const recStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const r of activeRecurring) {
      const monthly = monthlyAmount(r.amount, r.frequency, r.customDays);
      const converted = convertAmount(monthly, r.currency, currency, fxRates);
      if (converted > 0) income += converted;
      else expenses += Math.abs(converted);
    }
    return { income, expenses };
  }, [activeRecurring, currency, fxRates]);

  const billStatuses = useMemo(
    () => getRecurringStatuses(activeRecurring, tx, currency, fxRates, payments),
    [activeRecurring, tx, currency, fxRates, payments],
  );

  const pendingBills = useMemo(() => billStatuses.filter(s => s.status !== 'paid'), [billStatuses]);
  const paidBills = useMemo(() => billStatuses.filter(s => s.status === 'paid'), [billStatuses]);
  const pendingTotal = useMemo(() => pendingBills.reduce((sum, b) => sum + Math.abs(b.monthlyConverted), 0), [pendingBills]);
  const paidTotal = useMemo(() => paidBills.reduce((sum, b) => sum + Math.abs(b.monthlyConverted), 0), [paidBills]);
  const progressPct = billStatuses.length > 0 ? Math.round((paidBills.length / billStatuses.length) * 100) : 0;
  const label = monthLabel(currentMonthKey());

  const onRefresh = useCallback(() => { loadData(); }, [loadData]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    // Workspace selector
    wsRow: { flexDirection: 'row', gap: S2, paddingVertical: S3, paddingHorizontal: S1 },
    wsChip: { paddingHorizontal: S3, paddingVertical: S1 + 2, borderRadius: R_PILL, borderWidth: 1, borderColor: colors.border1, backgroundColor: colors.bg2 },
    wsChipActive: { borderColor: colors.pos, backgroundColor: colors.posBg },
    wsChipText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    wsChipTextActive: { color: colors.pos },
    // Summary card
    summaryCard: { backgroundColor: colors.bg1, borderRadius: R_CARD, borderWidth: 1, borderColor: colors.border1, padding: S4, marginTop: S3 },
    summaryMonth: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: S3 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: S4 },
    summaryBlock: { flex: 1 },
    summaryLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginBottom: S1 },
    summaryValue: { fontFamily: FONT_MONO, fontSize: FS_H2, fontWeight: FW_BOLD, fontVariant: [...TABULAR_NUMS] },
    summaryValuePending: { color: colors.warn },
    summaryValuePaid: { color: colors.pos },
    summaryValueDefault: { color: colors.text1 },
    summaryDivider: { width: 1, height: 36, backgroundColor: colors.border1 },
    progressTrack: { height: 4, backgroundColor: colors.bg3, borderRadius: 2, marginTop: S3, overflow: 'hidden' },
    progressFill: { height: 4, backgroundColor: colors.pos, borderRadius: 2 },
    progressLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: S2 },
    // Quick stats
    statsRow: { flexDirection: 'row', gap: S3, marginTop: S4 },
    statCard: { flex: 1, backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3 },
    statLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginBottom: S1 },
    statValue: { fontFamily: FONT_MONO, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, fontVariant: [...TABULAR_NUMS] },
    statValuePos: { color: colors.pos },
    statValueNeg: { color: colors.neg },
    statSub: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, marginTop: S1 },
    // Verify btn
    verifyBtn: { flexDirection: 'row', alignItems: 'center', gap: S2, backgroundColor: colors.posBg, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S4, marginTop: S4 },
    verifyText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.pos },
    // Quick links
    linksRow: { flexDirection: 'row', gap: S3, marginTop: S4 },
    linkBtn: { flex: 1, backgroundColor: colors.bg1, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, paddingVertical: S3, paddingHorizontal: S3 },
    linkText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    // Bills section
    billsSection: { marginTop: S5 },
    billsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S3 },
    billsTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1 },
    billsBadge: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.warn, backgroundColor: colors.warnBg, paddingHorizontal: S2, paddingVertical: 2, borderRadius: R_PILL },
    billItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    billItemOverdue: { borderColor: colors.neg },
    billIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: S3 },
    billInfo: { flex: 1 },
    billDesc: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    billMeta: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    billAmount: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS], marginRight: S2 },
    payBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S1 + 2 },
    payBtnText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    undoBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.negBg, alignItems: 'center', justifyContent: 'center' },
    checkMark: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.pos },
    billsDivider: { height: 1, backgroundColor: colors.border1, marginVertical: S3 },
    billGroupLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3, marginBottom: S2, marginTop: S2 },
  });

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

  const renderBillItem = (item: RecurringStatus, showPayBtn: boolean) => (
    <View
      key={item.recurring.id}
      style={[styles.billItem, item.status === 'overdue' && styles.billItemOverdue]}
    >
      {renderCategoryIcon(item.recurring.cat)}
      <View style={styles.billInfo}>
        <Text style={styles.billDesc}>{item.recurring.desc}</Text>
        <Text style={styles.billMeta}>
          {item.recurring.dayOfMonth ? `Dia ${item.recurring.dayOfMonth}` : freqLabel(item.recurring.frequency)}
          {item.status === 'overdue' ? ' \u00b7 Atrasado' : ''}
          {item.status === 'paid' && item.matchingPayment
            ? ` \u00b7 Pago ${item.matchingPayment.paidDate.slice(8, 10)}/${item.matchingPayment.paidDate.slice(5, 7)}`
            : ''}
          {item.status === 'paid' && !item.matchingPayment && item.matchingTx
            ? ` \u00b7 Pago ${item.matchingTx.date.slice(8, 10)}/${item.matchingTx.date.slice(5, 7)}`
            : ''}
        </Text>
      </View>
      <Text style={styles.billAmount}>
        {fmtAmount(Math.abs(item.monthlyConverted), currency, { decimals: 0 })}
      </Text>
      {showPayBtn && item.status !== 'paid' ? (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => nav.navigate('PaymentSheet', { recurring: item.recurring })}
          activeOpacity={0.7}
        >
          <Text style={styles.payBtnText}>
            {item.recurring.amount > 0 ? 'Receber' : 'Pagar'}
          </Text>
        </TouchableOpacity>
      ) : item.status === 'paid' && item.matchingPayment ? (
        <TouchableOpacity style={styles.undoBtn} activeOpacity={0.7}>
          <Icons.x size={14} color={colors.neg} />
        </TouchableOpacity>
      ) : item.status === 'paid' ? (
        <Text style={styles.checkMark}>{'\u2713'}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.pos} />}
      >
        {/* Workspace selector */}
        {workspaces.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wsRow}>
            <TouchableOpacity
              style={[styles.wsChip, !activeWorkspace && styles.wsChipActive]}
              onPress={() => useWalletStore.getState().setActiveWorkspace(null)}
            >
              <Text style={[styles.wsChipText, !activeWorkspace && styles.wsChipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {workspaces.map(ws => (
              <TouchableOpacity
                key={ws.id}
                style={[styles.wsChip, activeWorkspace === ws.id && styles.wsChipActive]}
                onPress={() => {
                  useWalletStore.getState().setActiveWorkspace(ws.id);
                  loadData(ws.id);
                }}
              >
                <Text style={[styles.wsChipText, activeWorkspace === ws.id && styles.wsChipTextActive]}>
                  {ws.icon} {ws.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Month summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryMonth}>{label}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Pendente</Text>
              <Text style={[styles.summaryValue, styles.summaryValuePending]}>
                {fmtAmount(pendingTotal, currency, { decimals: 0 })}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>Pago</Text>
              <Text style={[styles.summaryValue, styles.summaryValuePaid]}>
                {fmtAmount(paidTotal, currency, { decimals: 0 })}
              </Text>
            </View>
            {monthlyBudget > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryLabel}>Orcamento</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueDefault]}>
                    {fmtAmount(monthlyBudget, currency, { decimals: 0 })}
                  </Text>
                </View>
              </>
            )}
          </View>
          {billStatuses.length > 0 && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          )}
          <Text style={styles.progressLabel}>
            {paidBills.length} de {billStatuses.length} contas pagas
          </Text>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => nav.navigate('MainTabs', { screen: 'ContasTab' } as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.statLabel}>Receita mensal</Text>
            <Text style={[styles.statValue, styles.statValuePos]}>
              {fmtAmount(recStats.income, currency, { decimals: 0 })}
            </Text>
            <Text style={styles.statSub}>
              {activeRecurring.filter(r => r.amount > 0).length} entradas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => nav.navigate('MainTabs', { screen: 'ContasTab' } as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.statLabel}>Despesa mensal</Text>
            <Text style={[styles.statValue, styles.statValueNeg]}>
              {fmtAmount(recStats.expenses, currency, { decimals: 0 })}
            </Text>
            <Text style={styles.statSub}>
              {activeRecurring.filter(r => r.amount < 0).length} saidas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify payments */}
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={() => nav.navigate('VerifyPayments')}
          activeOpacity={0.7}
        >
          <Icons.alert size={18} color={colors.pos} />
          <Text style={styles.verifyText}>Verificar pagamento</Text>
        </TouchableOpacity>

        {/* Quick links */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => nav.navigate('MainTabs', { screen: 'ContasTab' } as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Ver todas as contas {'\u2192'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => nav.navigate('ManageRecurring')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Gerenciar recorrentes {'\u2192'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bills section */}
        {billStatuses.length > 0 && (
          <View style={styles.billsSection}>
            <View style={styles.billsHeader}>
              <Text style={styles.billsTitle}>Contas do mes</Text>
              {pendingBills.length > 0 && (
                <Text style={styles.billsBadge}>
                  {pendingBills.length} pendente{pendingBills.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {pendingBills.length > 0 && pendingBills.map(item => renderBillItem(item, true))}

            {pendingBills.length > 0 && paidBills.length > 0 && <View style={styles.billsDivider} />}

            {paidBills.length > 0 && (
              <>
                <Text style={styles.billGroupLabel}>Pagas</Text>
                {paidBills.map(item => renderBillItem(item, false))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
