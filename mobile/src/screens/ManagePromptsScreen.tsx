import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import * as api from '../services/apiService';
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
} from '../styles/typography';
import { S1, S2, S3, S4, S5, S6, R_CARD_SM, R_INPUT, R_PILL } from '../styles/spacing';

const FEATURES = [
  { key: 'extract-receipt', label: 'Extrair recibo' },
  { key: 'extract-recurring', label: 'Extrair recorrentes' },
  { key: 'categorize', label: 'Categorizar' },
  { key: 'insights', label: 'Insights' },
  { key: 'forecast', label: 'Previsao' },
  { key: 'chat', label: 'Chat' },
];

export function ManagePromptsScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.listPrompts()
      .then(items => {
        const map: Record<string, string> = {};
        for (const item of items) {
          const sk = item.SK as string;
          const feature = sk.replace('PROMPT#', '');
          map[feature] = (item.content as string) ?? '';
        }
        setPrompts(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openEditor = async (feature: string) => {
    if (prompts[feature] !== undefined) {
      setEditContent(prompts[feature]);
    } else {
      try {
        const item = await api.getPrompt(feature) as { content?: string };
        setEditContent(item.content ?? '');
      } catch { setEditContent(''); }
    }
    setEditing(feature);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.updatePrompt(editing, editContent);
      setPrompts(prev => ({ ...prev, [editing]: editContent }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1 },
    loadingText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, textAlign: 'center', paddingVertical: S6 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S4, marginBottom: S2 },
    itemInfo: { flex: 1 },
    itemLabel: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    itemMeta: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    editorHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    editorTitle: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginLeft: S3 },
    savedIndicator: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.pos },
    textarea: { fontFamily: FONT_MONO, fontSize: FS_SMALL, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, padding: S3, minHeight: 300, textAlignVertical: 'top', marginBottom: S4 },
    saveBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
  });

  if (editing) {
    const featureLabel = FEATURES.find(f => f.key === editing)?.label ?? editing;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.editorHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setEditing(null)}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.editorTitle}>{featureLabel}</Text>
          {saved && <Text style={styles.savedIndicator}>Salvo</Text>}
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingHorizontal: S4, paddingBottom: S6 }} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.textarea}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            placeholderTextColor={colors.text4}
          />
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.title}>Prompts de AI</Text>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : (
          FEATURES.map(f => {
            const content = prompts[f.key] ?? '';
            const lineCount = content.split('\n').length;
            const charCount = content.length;
            return (
              <TouchableOpacity key={f.key} style={styles.item} onPress={() => openEditor(f.key)} activeOpacity={0.6}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{f.label}</Text>
                  <Text style={styles.itemMeta}>
                    {content ? `${lineCount} linhas \u00b7 ${charCount} chars` : 'Nao configurado'}
                  </Text>
                </View>
                <Icons.chevR size={14} color={colors.text4} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
