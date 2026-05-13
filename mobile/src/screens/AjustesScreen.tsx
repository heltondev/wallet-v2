import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWalletStore } from '../store/useWalletStore';
import { Icons } from '../components/icons/Icons';
import { cognitoService } from '../services/cognitoService';
import * as api from '../services/apiService';
import { CATS } from '../data/categories';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { CurrencyCode } from '../types';
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
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AjustesScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<Nav>();
  const isDarkMode = useSettingsStore(s => s.isDarkMode);
  const currency = useSettingsStore(s => s.currency);
  const setDarkMode = useSettingsStore(s => s.setDarkMode);
  const setCurrency = useSettingsStore(s => s.setCurrency);
  const { tx, workspaces, activeWorkspace } = useWalletStore();

  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [accountCount, setAccountCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(Object.keys(CATS).length);
  const [showAbout, setShowAbout] = useState(false);

  const isOwner = true; // determined by user role

  const activeWs = workspaces.find(w => w.id === activeWorkspace);
  const sharedOwner = activeWs?.ownership === 'shared' && activeWs.ownerId ? activeWs.ownerId : undefined;
  const sharedWorkspace = activeWs?.ownership === 'shared' ? activeWs.id : undefined;

  useEffect(() => {
    cognitoService.syncSession().then(session => {
      if (session) {
        setUserEmail(session.email ?? '');
        setUserName(session.name ?? '');
      }
    });
    api.listAccounts(sharedOwner, sharedWorkspace)
      .then(a => setAccountCount(a.length))
      .catch(() => {});
    api.listCategories(sharedOwner, sharedWorkspace)
      .then(c => setCategoryCount(Object.keys(CATS).length + c.length))
      .catch(() => setCategoryCount(Object.keys(CATS).length));
  }, []);

  const toggleTheme = async () => {
    const next = !isDarkMode;
    setDarkMode(next);
    await api.updateSettings({ theme: next ? 'dark' : 'light' }).catch(() => {});
  };

  const toggleCurrency = async () => {
    const next: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
    setCurrency(next);
    await api.updateSettings({ currency: next }).catch(() => {});
  };

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || userEmail.slice(0, 2).toUpperCase();

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    pageTitle: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1, paddingVertical: S4 },
    profile: { flexDirection: 'row', alignItems: 'center', gap: S3, backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S4, marginBottom: S5 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_BOLD, color: colors.text1 },
    profileInfo: { flex: 1 },
    profileName: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.text1 },
    profileEmail: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    sectionTitle: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: S2, marginTop: S5 },
    sectionBody: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: S3, paddingHorizontal: S4, borderBottomWidth: 1, borderBottomColor: colors.border1 },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { marginRight: S3 },
    rowLabel: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text1 },
    rowLabelDanger: { color: colors.neg },
    rowDetail: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, marginRight: S2 },
    aboutBlock: { padding: S4, backgroundColor: colors.bg2 },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S2 },
    aboutLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3 },
    aboutValue: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text2 },
  });

  const Row = ({
    label,
    detail,
    icon,
    last,
    danger,
    onPress,
  }: {
    label: string;
    detail?: string;
    icon?: string;
    last?: boolean;
    danger?: boolean;
    onPress?: () => void;
  }) => {
    const Ic = icon ? Icons[icon as keyof typeof Icons] : null;
    return (
      <TouchableOpacity
        style={[styles.row, last && styles.rowLast]}
        onPress={onPress}
        activeOpacity={onPress ? 0.6 : 1}
        disabled={!onPress}
      >
        {Ic && (
          <View style={styles.rowIcon}>
            <Ic size={17} color={danger ? colors.neg : colors.text2} stroke={1.8} />
          </View>
        )}
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
        {onPress && <Icons.chevR size={14} color={colors.text4} />}
      </TouchableOpacity>
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Ajustes</Text>

        {/* Profile */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName || 'Usuario'}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
        </View>

        <Section title="CONTA">
          <Row label="Carteiras e contas" detail={String(accountCount)} icon="wallet" onPress={() => nav.navigate('ManageAccounts')} />
          <Row label="Categorias" detail={String(categoryCount)} icon="grid" onPress={() => nav.navigate('ManageCategories')} />
          <Row label="Recorrentes" icon="repeat" onPress={() => nav.navigate('ManageRecurring')} />
          {isOwner && (
            <Row label="Espacos" icon="grid" last onPress={() => nav.navigate('ManageWorkspaces')} />
          )}
        </Section>

        <Section title="APARENCIA">
          <Row label="Tema" detail={isDarkMode ? 'Escuro' : 'Claro'} icon="moon" onPress={toggleTheme} />
          <Row label="Moeda principal" detail={currency} last onPress={toggleCurrency} />
        </Section>

        <Section title="INTELIGENCIA ARTIFICIAL">
          <Row label="Assistente financeiro" detail="Chat" icon="alert" onPress={() => nav.navigate('AiChat')} />
          <Row label="Insights do mes" icon="trending" onPress={() => nav.navigate('AiInsights')} />
          <Row label="Escanear recibo" icon="search" last onPress={() => nav.navigate('Receipt')} />
        </Section>

        {userEmail === 'holiver.usa@gmail.com' && (
          <Section title="ADMIN">
            <Row label="Custos de infraestrutura" icon="trending" onPress={() => nav.navigate('AdminCosts')} />
            <Row label="Prompts de AI" icon="alert" last onPress={() => nav.navigate('ManagePrompts')} />
          </Section>
        )}

        <Section title="SUPORTE">
          <Row label="Sobre" icon="alert" onPress={() => setShowAbout(!showAbout)} />
          {showAbout && (
            <View style={styles.aboutBlock}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Stack</Text>
                <Text style={styles.aboutValue}>React Native</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Backend</Text>
                <Text style={styles.aboutValue}>AWS Lambda / DynamoDB</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>AI</Text>
                <Text style={styles.aboutValue}>OpenAI GPT-4o</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Auth</Text>
                <Text style={styles.aboutValue}>Cognito / Google OAuth</Text>
              </View>
            </View>
          )}
          <Row label="Sair" icon="x" danger last onPress={() => cognitoService.signOut()} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
