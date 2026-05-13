import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import { currentMonthKey, monthLabelUpper } from '../utils/dates';
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
  TABULAR_NUMS,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

interface ServiceCost { service: string; cost: number; trend: number; }
interface AiUsage { feature: string; calls: number; cost: number; }
interface CostsData {
  totalMonthly: number; projectedMonthly: number; trend: number;
  services: ServiceCost[]; aiUsage: AiUsage[];
}

const MOCK_COSTS: CostsData = {
  totalMonthly: 12.47, projectedMonthly: 14.20, trend: -8.3,
  services: [
    { service: 'Lambda', cost: 3.21, trend: -12 },
    { service: 'DynamoDB', cost: 2.85, trend: 5 },
    { service: 'S3', cost: 0.42, trend: 0 },
    { service: 'CloudFront', cost: 1.18, trend: 15 },
    { service: 'Cognito', cost: 0.00, trend: 0 },
    { service: 'API Gateway', cost: 1.56, trend: -3 },
  ],
  aiUsage: [
    { feature: 'Categorizacao', calls: 47, cost: 0.12 },
    { feature: 'OCR Recibos', calls: 8, cost: 0.89 },
    { feature: 'Insights', calls: 3, cost: 0.34 },
    { feature: 'Previsao', calls: 1, cost: 0.45 },
    { feature: 'Chat', calls: 22, cost: 1.45 },
  ],
};

export function AdminCostsScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();
  const [data, setData] = useState<CostsData | null>(null);

  useEffect(() => {
    setTimeout(() => setData(MOCK_COSTS), 400);
  }, []);

  const totalAi = data?.aiUsage.reduce((s, u) => s + u.cost, 0) ?? 0;
  const totalAws = data?.services.reduce((s, sv) => s + sv.cost, 0) ?? 0;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    headerTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginLeft: S2 },
    loadingText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, textAlign: 'center', paddingVertical: S6 },
    totalCard: { backgroundColor: colors.bg1, borderRadius: R_CARD, borderWidth: 1, borderColor: colors.border1, padding: S4, marginBottom: S4 },
    totalLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: S2 },
    totalValue: { fontFamily: FONT_MONO, fontSize: FS_H1 + 4, fontWeight: FW_BOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS], marginBottom: S2 },
    totalMeta: { flexDirection: 'row', alignItems: 'center', gap: S2, flexWrap: 'wrap' },
    trendPos: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    trendText: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, fontVariant: [...TABULAR_NUMS] },
    trendTextPositive: { color: colors.pos },
    trendTextNegative: { color: colors.neg },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.text4 },
    projection: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, fontVariant: [...TABULAR_NUMS] },
    section: { marginBottom: S4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S3 },
    sectionLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1 },
    sectionTotal: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS] },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    rowName: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text1 },
    rowTrend: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, fontVariant: [...TABULAR_NUMS], marginRight: S3 },
    rowCost: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.text1, fontVariant: [...TABULAR_NUMS] },
    rowCalls: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, fontVariant: [...TABULAR_NUMS], marginRight: S3 },
    budgetSection: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginTop: S2 },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S2 },
    budgetLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3 },
    budgetValue: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, fontVariant: [...TABULAR_NUMS] },
    budgetTrack: { height: 6, backgroundColor: colors.bg3, borderRadius: 3, overflow: 'hidden' },
    budgetFill: { height: 6, borderRadius: 3 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Icons.trending size={20} color={colors.text2} />
          <Text style={styles.headerTitle}>Custos de Infraestrutura</Text>
        </View>

        {!data ? (
          <Text style={styles.loadingText}>Carregando custos...</Text>
        ) : (
          <>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>CUSTO MENSAL {'\u00b7'} {monthLabelUpper(currentMonthKey())}</Text>
              <Text style={styles.totalValue}>${data.totalMonthly.toFixed(2)}</Text>
              <View style={styles.totalMeta}>
                <View style={styles.trendPos}>
                  {data.trend <= 0 ? <Icons.arrowDown size={11} color={colors.pos} stroke={2.4} /> : <Icons.arrowUp size={11} color={colors.neg} stroke={2.4} />}
                  <Text style={[styles.trendText, data.trend <= 0 ? styles.trendTextPositive : styles.trendTextNegative]}>
                    {Math.abs(data.trend).toFixed(1)}% vs mes anterior
                  </Text>
                </View>
                <View style={styles.dot} />
                <Text style={styles.projection}>Projecao: ${data.projectedMonthly.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>AWS SERVICES</Text>
                <Text style={styles.sectionTotal}>${totalAws.toFixed(2)}</Text>
              </View>
              {data.services.map(svc => (
                <View key={svc.service} style={styles.row}>
                  <Text style={styles.rowName}>{svc.service}</Text>
                  <Text style={[styles.rowTrend, { color: svc.trend <= 0 ? colors.pos : colors.neg }]}>
                    {svc.trend > 0 ? '+' : ''}{svc.trend}%
                  </Text>
                  <Text style={styles.rowCost}>${svc.cost.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>OPENAI {'\u00b7'} USAGE</Text>
                <Text style={styles.sectionTotal}>${totalAi.toFixed(2)}</Text>
              </View>
              {data.aiUsage.map(u => (
                <View key={u.feature} style={styles.row}>
                  <Text style={styles.rowName}>{u.feature}</Text>
                  <Text style={styles.rowCalls}>{u.calls} calls</Text>
                  <Text style={styles.rowCost}>${u.cost.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.budgetSection}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetLabel}>BUDGET</Text>
                  <Text style={styles.budgetValue}>${totalAi.toFixed(2)} / $5.00</Text>
                </View>
                <View style={styles.budgetTrack}>
                  <View
                    style={[
                      styles.budgetFill,
                      {
                        width: `${Math.min(100, (totalAi / 5) * 100)}%`,
                        backgroundColor: totalAi > 4 ? colors.neg : totalAi > 3 ? colors.warn : colors.pos,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
