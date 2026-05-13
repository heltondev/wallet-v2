import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { monthlyAmount } from '../utils/recurring';
import { nextMonthLabel, currentMonth, currentYear } from '../utils/dates';
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
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

export function PrevisaoScreen() {
  const { colors } = useTheme();
  const currency = useSettingsStore(s => s.currency);
  const { tx, recurringItems, workspaces, activeWorkspace, fxRates } = useWalletStore();

  const activeWs = useMemo(() => workspaces.find(w => w.id === activeWorkspace), [workspaces, activeWorkspace]);
  const monthlyBudget = activeWs?.monthlyBudget ?? 0;

  const activeRecurring = useMemo(
    () => recurringItems.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
    [recurringItems, activeWorkspace],
  );

  const recurringStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const r of activeRecurring) {
      const monthly = monthlyAmount(r.amount, r.frequency, r.customDays);
      const converted = convertAmount(monthly, r.currency, currency, fxRates);
      if (converted > 0) income += converted;
      else expenses += Math.abs(converted);
    }
    return { income, expenses, net: income - expenses };
  }, [activeRecurring, currency, fxRates]);

  const txStats = useMemo(() => {
    let ins = 0;
    let outs = 0;
    const byCat: Record<string, number> = {};
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency, fxRates);
      if (converted > 0) ins += converted;
      else {
        const abs = Math.abs(converted);
        outs += abs;
        const cat = item.cat || 'outros';
        byCat[cat] = (byCat[cat] || 0) + abs;
      }
    }
    const categories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { ins, outs, balance: ins - outs, categories };
  }, [tx, currency, fxRates]);

  const hasData = tx.length > 0 || activeRecurring.length > 0;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    headerSection: { paddingVertical: S4 },
    headerLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1, marginTop: S1 },
    emptyCard: { backgroundColor: colors.bg1, borderRadius: R_CARD, borderWidth: 1, borderColor: colors.border1, padding: S5, alignItems: 'center', marginTop: S4 },
    emptyTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginBottom: S2 },
    emptyText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text3, textAlign: 'center' },
    balanceCard: { backgroundColor: colors.bg1, borderRadius: R_CARD, borderWidth: 1, borderColor: colors.border1, padding: S4, marginTop: S4 },
    balanceLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginBottom: S2 },
    balanceValue: { fontFamily: FONT_MONO, fontSize: FS_H1 + 4, fontWeight: FW_BOLD, fontVariant: [...TABULAR_NUMS] },
    balanceValuePos: { color: colors.pos },
    balanceValueNeg: { color: colors.neg },
    balanceSub: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, marginTop: S2 },
    summaryCard: { backgroundColor: colors.bg1, borderRadius: R_CARD, borderWidth: 1, borderColor: colors.border1, padding: S4, marginTop: S3 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S4 },
    summaryItem: { width: '45%' },
    summaryLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginBottom: S1 },
    summaryValue: { fontFamily: FONT_MONO, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, fontVariant: [...TABULAR_NUMS], color: colors.text1 },
    summaryValuePos: { color: colors.pos },
    summaryValueNeg: { color: colors.neg },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S5, marginBottom: S3 },
    sectionTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1 },
    sectionCount: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3 },
    recurringRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    catIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: S3 },
    recurringDesc: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text1 },
    recurringAmount: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, fontVariant: [...TABULAR_NUMS] },
    recurringAmountPos: { color: colors.pos },
    recurringAmountNeg: { color: colors.text1 },
    catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    catName: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text1, marginLeft: S3 },
    catAmount: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS] },
  });

  const renderCatIcon = (cat: string, size: number) => {
    const meta = CATS[cat];
    const bgColor = meta?.color ?? colors.bg3;
    const iconName = meta?.icon ?? 'wallet';
    const Ic = Icons[iconName as keyof typeof Icons];
    return (
      <View style={[styles.catIcon, { backgroundColor: bgColor, width: size, height: size }]}>
        {Ic && <Ic size={size * 0.5} color="#fff" stroke={1.8} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.headerLabel}>PREVISAO PARA</Text>
          <Text style={styles.headerTitle}>{nextMonthLabel()}</Text>
        </View>

        {!hasData ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sem dados para previsao</Text>
            <Text style={styles.emptyText}>
              Adicione transacoes ou configure recorrentes para ver a previsao do proximo mes.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Projecao {nextMonthLabel()}</Text>
              <Text style={[styles.balanceValue, recurringStats.net >= 0 ? styles.balanceValuePos : styles.balanceValueNeg]}>
                {fmtAmount(recurringStats.net, currency, { decimals: 0 })}
              </Text>
              <Text style={styles.balanceSub}>
                baseado em {activeRecurring.length} recorrentes ativas
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Receita prevista</Text>
                  <Text style={[styles.summaryValue, styles.summaryValuePos]}>
                    {fmtAmount(recurringStats.income, currency, { decimals: 0 })}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Despesa prevista</Text>
                  <Text style={[styles.summaryValue, styles.summaryValueNeg]}>
                    {fmtAmount(recurringStats.expenses, currency, { decimals: 0 })}
                  </Text>
                </View>
                {monthlyBudget > 0 && (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Orcamento</Text>
                      <Text style={styles.summaryValue}>
                        {fmtAmount(monthlyBudget, currency, { decimals: 0 })}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Sobra projetada</Text>
                      <Text style={[styles.summaryValue, (monthlyBudget - recurringStats.expenses) >= 0 ? styles.summaryValuePos : styles.summaryValueNeg]}>
                        {fmtAmount(monthlyBudget - recurringStats.expenses, currency, { decimals: 0 })}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {activeRecurring.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recorrentes confirmadas</Text>
                  <Text style={styles.sectionCount}>{activeRecurring.length} itens</Text>
                </View>
                {activeRecurring.map(r => {
                  const monthly = monthlyAmount(r.amount, r.frequency, r.customDays);
                  const converted = convertAmount(monthly, r.currency, currency, fxRates);
                  return (
                    <View key={r.id} style={styles.recurringRow}>
                      {renderCatIcon(r.cat, 28)}
                      <Text style={styles.recurringDesc}>{r.desc}</Text>
                      <Text style={[styles.recurringAmount, converted > 0 ? styles.recurringAmountPos : styles.recurringAmountNeg]}>
                        {converted > 0 ? '+' : '\u2212'}
                        {fmtAmount(Math.abs(converted), currency, { decimals: 0 }).replace('\u2212', '')}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

            {txStats.categories.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Gastos {currentMonth()} {currentYear()}</Text>
                  <Text style={styles.sectionCount}>{txStats.categories.length} categorias</Text>
                </View>
                {txStats.categories.map(([cat, amount]) => (
                  <View key={cat} style={styles.catRow}>
                    {renderCatIcon(cat, 28)}
                    <Text style={styles.catName}>{CATS[cat]?.label ?? cat}</Text>
                    <Text style={styles.catAmount}>
                      {'\u2212'}{fmtAmount(amount, currency, { decimals: 0 }).replace('\u2212', '')}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
