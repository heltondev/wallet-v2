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
import { currentMonthKey, monthLabelUpper } from '../utils/dates';
import {
  FONT_SANS,
  FONT_MONO,
  FS_H1,
  FS_H3,
  FS_SMALL,
  FS_CAPTION,
  FW_BOLD,
  FW_SEMIBOLD,
  FW_MEDIUM,
  TABULAR_NUMS,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM } from '../styles/spacing';

export function CategoriasScreen() {
  const { colors } = useTheme();
  const currency = useSettingsStore(s => s.currency);
  const { recurringItems, activeWorkspace, fxRates } = useWalletStore();

  const activeRecurring = useMemo(
    () => recurringItems.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
    [recurringItems, activeWorkspace],
  );

  const data = useMemo(() => {
    const byCat: Record<string, { expense: number; income: number; count: number }> = {};
    for (const r of activeRecurring) {
      const monthly = monthlyAmount(r.amount, r.frequency, r.customDays);
      const converted = convertAmount(monthly, r.currency, currency, fxRates);
      const cat = r.cat || 'outros';
      if (!byCat[cat]) byCat[cat] = { expense: 0, income: 0, count: 0 };
      if (converted < 0) byCat[cat].expense += Math.abs(converted);
      else byCat[cat].income += converted;
      byCat[cat].count++;
    }
    return Object.entries(byCat)
      .map(([cat, { expense, income, count }]) => ({ cat, expense, income, count }))
      .sort((a, b) => b.expense - a.expense || b.income - a.income);
  }, [activeRecurring, currency, fxRates]);

  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const label = monthLabelUpper(currentMonthKey());

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: S4 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1 },
    month: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, fontVariant: [...TABULAR_NUMS] },
    totalsRow: { flexDirection: 'row', gap: S4, marginBottom: S4 },
    totalBlock: { flex: 1 },
    totalLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginBottom: S1 },
    totalValueNeg: { fontFamily: FONT_MONO, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.neg, fontVariant: [...TABULAR_NUMS] },
    totalValuePos: { fontFamily: FONT_MONO, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.pos, fontVariant: [...TABULAR_NUMS] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S3 },
    card: { width: '47%', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S2 },
    catIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    cardPct: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, fontVariant: [...TABULAR_NUMS] },
    cardLabel: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2, marginBottom: S1 },
    cardAmount: { fontFamily: FONT_MONO, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS] },
    cardAmountPos: { color: colors.pos },
    cardCount: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, marginTop: S1 },
    empty: { alignItems: 'center', paddingVertical: S6 + S6 },
    emptyText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text3 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Categorias</Text>
          <Text style={styles.month}>{label}</Text>
        </View>

        {data.length > 0 && (
          <View style={styles.totalsRow}>
            <View style={styles.totalBlock}>
              <Text style={styles.totalLabel}>Despesas</Text>
              <Text style={styles.totalValueNeg}>{fmtAmount(totalExpense, currency, { decimals: 0 })}</Text>
            </View>
            {totalIncome > 0 && (
              <View style={styles.totalBlock}>
                <Text style={styles.totalLabel}>Receitas</Text>
                <Text style={styles.totalValuePos}>{fmtAmount(totalIncome, currency, { decimals: 0 })}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.grid}>
          {data.map(d => {
            const catMeta = CATS[d.cat];
            const mainAmount = d.expense > 0 ? d.expense : d.income;
            const isIncome = d.expense === 0 && d.income > 0;
            const pct = totalExpense > 0 && d.expense > 0 ? Math.round((d.expense / totalExpense) * 100) : 0;
            const bgColor = catMeta?.color ?? colors.bg3;
            const iconName = catMeta?.icon ?? 'wallet';
            const Ic = Icons[iconName as keyof typeof Icons];

            return (
              <View key={d.cat} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.catIcon, { backgroundColor: bgColor }]}>
                    {Ic && <Ic size={16} color="#fff" stroke={1.8} />}
                  </View>
                  {pct > 0 && <Text style={styles.cardPct}>{pct}%</Text>}
                </View>
                <Text style={styles.cardLabel}>{catMeta?.label ?? d.cat}</Text>
                <Text style={[styles.cardAmount, isIncome && styles.cardAmountPos]}>
                  {fmtAmount(mainAmount, currency, { decimals: 0 })}
                </Text>
                <Text style={styles.cardCount}>
                  {d.count} {d.count === 1 ? 'conta' : 'contas'}
                </Text>
              </View>
            );
          })}
        </View>

        {data.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma conta recorrente</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
