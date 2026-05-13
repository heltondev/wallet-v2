import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import * as api from '../services/apiService';
import { currentMonthKey, monthLabelShort } from '../utils/dates';
import {
  FONT_SANS,
  FS_H3,
  FS_BODY,
  FS_SMALL,
  FS_CAPTION,
  FW_SEMIBOLD,
  FW_MEDIUM,
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM } from '../styles/spacing';

interface InsightsData {
  summary: string;
  patterns: string[];
  alerts: string[];
  tips: string[];
}

export function AiInsightsScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();
  const [data, setData] = useState<InsightsData | null>(null);
  const monthKey = currentMonthKey();

  useEffect(() => {
    api.aiInsights(monthKey).then(setData);
  }, [monthKey]);

  const headerLabel = `Insights \u00b7 ${monthLabelShort(monthKey)}`;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    headerTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginLeft: S2 },
    loading: { alignItems: 'center', paddingVertical: S6 + S6 },
    card: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S4, marginBottom: S3 },
    cardAlerts: { borderColor: colors.neg },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: S2, marginBottom: S3 },
    cardLabel: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD },
    summary: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text2, lineHeight: 22 },
    bulletList: { gap: S2 },
    bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: S2 },
    bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
    bulletText: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2, lineHeight: 20 },
    skeletonCard: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S4, marginBottom: S3 },
    skeletonBar: { height: 10, borderRadius: 5, backgroundColor: colors.bg3, marginBottom: S2 },
    skeletonShort: { width: '40%' },
    skeletonLong: { width: '90%' },
    skeletonMedium: { width: '65%' },
  });

  const BulletList = ({ items, color }: { items: string[]; color: string }) => (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletItem}>
          <View style={[styles.bulletDot, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonBar, styles.skeletonShort]} />
      <View style={[styles.skeletonBar, styles.skeletonLong]} />
      <View style={[styles.skeletonBar, styles.skeletonMedium]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Icons.alert size={20} color={colors.pos} />
          <Text style={styles.headerTitle}>{headerLabel}</Text>
        </View>

        {!data ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icons.trending size={18} color={colors.pos} />
                <Text style={[styles.cardLabel, { color: colors.text1 }]}>Resumo</Text>
              </View>
              <Text style={styles.summary}>{data.summary}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icons.search size={18} color={colors.text2} />
                <Text style={[styles.cardLabel, { color: colors.text1 }]}>Padroes</Text>
              </View>
              <BulletList items={data.patterns} color={colors.pos} />
            </View>

            <View style={[styles.card, styles.cardAlerts]}>
              <View style={styles.cardHeader}>
                <Icons.alert size={18} color={colors.neg} />
                <Text style={[styles.cardLabel, { color: colors.neg }]}>Alertas</Text>
              </View>
              <BulletList items={data.alerts} color={colors.neg} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icons.trending size={18} color={colors.pos} />
                <Text style={[styles.cardLabel, { color: colors.pos }]}>Dicas</Text>
              </View>
              <BulletList items={data.tips} color={colors.pos} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
