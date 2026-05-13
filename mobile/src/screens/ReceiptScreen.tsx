import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, types } from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../hooks/useTheme';
import { Icons } from '../components/icons/Icons';
import { fmtAmount } from '../utils/formatters';
import * as api from '../services/apiService';
import type { CurrencyCode, Transaction } from '../types';
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
import { S1, S2, S3, S4, S5, S6, R_CARD, R_CARD_SM, R_INPUT } from '../styles/spacing';

interface UploadedFile {
  name: string;
  base64: string;
  mimeType: string;
  uri?: string;
}

async function readFileAsBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function readFileAsText(uri: string): Promise<string> {
  const response = await fetch(uri);
  return response.text();
}

function isTextFile(name: string, mimeType: string): boolean {
  return mimeType === 'text/csv' || name.endsWith('.csv') || name.endsWith('.tsv');
}

export function ReceiptScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<Partial<Transaction> | null>(null);

  const handleCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
    });

    if (result.assets) {
      for (const asset of result.assets) {
        if (!asset.base64 || !asset.fileName) continue;
        setFiles(prev => [
          ...prev,
          {
            name: asset.fileName!,
            base64: asset.base64!,
            mimeType: asset.type ?? 'image/jpeg',
            uri: asset.uri,
          },
        ]);
      }
    }
  };

  const handlePickImages = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 5,
      includeBase64: true,
    });

    if (result.assets) {
      for (const asset of result.assets) {
        if (!asset.base64 || !asset.fileName) continue;
        setFiles(prev => [
          ...prev,
          {
            name: asset.fileName!,
            base64: asset.base64!,
            mimeType: asset.type ?? 'image/jpeg',
            uri: asset.uri,
          },
        ]);
      }
    }
  };

  const handlePickFiles = async () => {
    try {
      const results = await pick({
        allowMultiSelection: true,
        type: [types.pdf, types.csv, types.images],
      });

      for (const doc of results) {
        if (!doc.uri || !doc.name) continue;
        const name = doc.name;
        const mimeType = doc.type ?? 'application/octet-stream';

        if (isTextFile(name, mimeType)) {
          const text = await readFileAsText(doc.uri);
          setAiText(prev => prev ? `${prev}\n\n--- ${name} ---\n${text}` : `--- ${name} ---\n${text}`);
        } else {
          const base64 = await readFileAsBase64(doc.uri);
          setFiles(prev => [...prev, { name, base64, mimeType }]);
        }
      }
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Erro', 'Falha ao selecionar arquivo');
      }
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const canExtract = files.length > 0 || aiText.trim().length > 0;

  const handleExtract = async () => {
    if (!canExtract || loading) return;
    setLoading(true);
    try {
      const payload = files.map(f => ({ base64: f.base64, mimeType: f.mimeType }));
      const result = await api.aiExtractReceipt(payload, aiText);
      if (result.transactions.length > 0) {
        const extracted = result.transactions[0];
        const txData: Partial<Transaction> = {
          desc: extracted.desc,
          amount: extracted.amount,
          currency: extracted.currency as CurrencyCode,
          cat: extracted.cat,
          date: extracted.date,
          account: extracted.account ?? '',
        };
        await api.createTransaction(txData as Record<string, unknown>);
        setSaved(txData);
      }
    } catch {
      // extraction failed
    } finally {
      setLoading(false);
    }
  };

  const imageFile = files.find(f => f.uri && f.mimeType.startsWith('image/'));

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    headerTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginLeft: S2 },
    body: { flex: 1 },
    savedCard: { alignItems: 'center', paddingVertical: S6 },
    savedIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.pos, alignItems: 'center', justifyContent: 'center', marginBottom: S4 },
    savedTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_BOLD, color: colors.text1, marginBottom: S2 },
    savedDesc: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text2, marginBottom: S2 },
    savedAmount: { fontFamily: FONT_MONO, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.pos, fontVariant: [...TABULAR_NUMS], marginBottom: S5 },
    savedActions: { flexDirection: 'row', gap: S3 },
    scanAgainBtn: { backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S5 },
    scanAgainText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text2 },
    backActionBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S5 },
    backActionText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    uploadArea: { borderWidth: 1, borderColor: colors.border1, borderStyle: 'dashed', borderRadius: R_INPUT, padding: S4, alignItems: 'center', marginBottom: S3 },
    uploadRow: { flexDirection: 'row', gap: S3, flexWrap: 'wrap', justifyContent: 'center' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: S2, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, paddingHorizontal: S4, borderWidth: 1, borderColor: colors.border1 },
    uploadBtnPrimary: { backgroundColor: colors.pos, borderColor: colors.pos },
    uploadBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2 },
    uploadBtnTextPrimary: { color: colors.bg0, fontWeight: FW_SEMIBOLD },
    uploadHint: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, marginTop: S2 },
    fileList: { marginBottom: S3 },
    fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S2, paddingHorizontal: S3, marginBottom: S2 },
    fileName: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    fileRemoveBtn: { padding: S1 },
    preview: { width: '100%', height: 200, borderRadius: R_INPUT, marginBottom: S3, backgroundColor: colors.bg2 },
    textarea: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, padding: S3, minHeight: 150, textAlignVertical: 'top', marginBottom: S4 },
    extractBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S4, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: S2 },
    extractBtnDisabled: { opacity: 0.5 },
    extractBtnText: { fontFamily: FONT_SANS, fontSize: FS_BODY, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    hint: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, textAlign: 'center', marginTop: S3 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Icons.search size={20} color={colors.pos} />
          <Text style={styles.headerTitle}>Escanear Recibo</Text>
        </View>

        <View style={styles.body}>
          {saved ? (
            <View style={styles.savedCard}>
              <View style={styles.savedIconCircle}>
                <Icons.check size={28} color={colors.bg0} stroke={2.4} />
              </View>
              <Text style={styles.savedTitle}>Transacao salva!</Text>
              <Text style={styles.savedDesc}>{saved.desc}</Text>
              <Text style={styles.savedAmount}>
                {fmtAmount(Math.abs(saved.amount ?? 0), (saved.currency ?? 'BRL') as CurrencyCode)}
              </Text>
              <View style={styles.savedActions}>
                <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setSaved(null); setAiText(''); setFiles([]); }}>
                  <Text style={styles.scanAgainText}>Escanear outro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backActionBtn} onPress={() => nav.goBack()}>
                  <Text style={styles.backActionText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.uploadArea}>
                <View style={styles.uploadRow}>
                  <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnPrimary]} onPress={handleCamera}>
                    <Icons.camera size={16} color={colors.bg0} />
                    <Text style={[styles.uploadBtnText, styles.uploadBtnTextPrimary]}>Tirar foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImages}>
                    <Icons.upload size={16} color={colors.text2} />
                    <Text style={styles.uploadBtnText}>Galeria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handlePickFiles}>
                    <Icons.fileText size={16} color={colors.text2} />
                    <Text style={styles.uploadBtnText}>Selecionar arquivo</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.uploadHint}>PDF, JPG, PNG, CSV</Text>
              </View>

              {imageFile?.uri && (
                <Image source={{ uri: imageFile.uri }} style={styles.preview} resizeMode="contain" />
              )}

              {files.length > 0 && (
                <View style={styles.fileList}>
                  {files.map((f, idx) => (
                    <View key={idx} style={styles.fileItem}>
                      <Icons.fileText size={14} color={colors.text3} />
                      <Text style={styles.fileName} numberOfLines={1}> {f.name}</Text>
                      <TouchableOpacity style={styles.fileRemoveBtn} onPress={() => removeFile(idx)}>
                        <Icons.x size={14} color={colors.text4} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TextInput
                style={styles.textarea}
                placeholder="Cole o texto do recibo ou nota fiscal..."
                placeholderTextColor={colors.text4}
                value={aiText}
                onChangeText={setAiText}
                multiline
              />
              <TouchableOpacity
                style={[styles.extractBtn, (!canExtract || loading) && styles.extractBtnDisabled]}
                onPress={handleExtract}
                disabled={!canExtract || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color={colors.bg0} size="small" />
                    <Text style={styles.extractBtnText}>Analisando...</Text>
                  </>
                ) : (
                  <>
                    <Icons.search size={16} color={colors.bg0} />
                    <Text style={styles.extractBtnText}>Extrair dados</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.hint}>A AI vai extrair automaticamente os dados do recibo</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
