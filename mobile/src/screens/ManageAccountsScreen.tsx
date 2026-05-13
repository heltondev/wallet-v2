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
import type { Account, CurrencyCode } from '../types';
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

const CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR'];

export function ManageAccountsScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    api.listAccounts()
      .then(data => setAccounts(data as unknown as Account[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createAccount({ name: name.trim(), institution: institution.trim(), currency });
      setName('');
      setInstitution('');
      setCurrency('BRL');
      setShowForm(false);
      fetchAccounts();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1 },
    addWrap: { marginBottom: S4 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: S2, backgroundColor: colors.bg2, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.border1, paddingVertical: S3, paddingHorizontal: S4 },
    addBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2 },
    form: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S4, marginBottom: S4 },
    formTitle: { fontFamily: FONT_SANS, fontSize: FS_H3, fontWeight: FW_SEMIBOLD, color: colors.text1, marginBottom: S3 },
    input: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S3, borderWidth: 1, borderColor: colors.border1, marginBottom: S3 },
    currencyRow: { flexDirection: 'row', gap: S2, marginBottom: S3 },
    currencyBtn: { paddingHorizontal: S4, paddingVertical: S2, borderRadius: R_PILL, borderWidth: 1, borderColor: colors.border1 },
    currencyBtnActive: { borderColor: colors.pos, backgroundColor: colors.posBg },
    currencyBtnText: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text2 },
    currencyBtnTextActive: { color: colors.pos },
    formActions: { flexDirection: 'row', gap: S3, marginTop: S2 },
    cancelBtn: { flex: 1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    cancelBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2 },
    saveBtn: { flex: 1, backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    loadingText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, textAlign: 'center', paddingVertical: S6 },
    empty: { alignItems: 'center', paddingVertical: S6 + S6 },
    emptyText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, marginTop: S3 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    itemInfo: { flex: 1, marginLeft: S3 },
    itemName: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    itemInstitution: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    itemCurrency: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, marginRight: S3 },
    deleteBtn: { padding: S2 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.title}>Carteiras e contas</Text>
        </View>

        {!showForm && (
          <View style={styles.addWrap}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Icons.plus size={16} color={colors.text2} />
              <Text style={styles.addBtnText}>Adicionar conta</Text>
            </TouchableOpacity>
          </View>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Nova conta</Text>
            <TextInput style={styles.input} placeholder="Nome da conta" placeholderTextColor={colors.text4} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Instituicao (opcional)" placeholderTextColor={colors.text4} value={institution} onChangeText={setInstitution} />
            <View style={styles.currencyRow}>
              {CURRENCIES.map(c => (
                <TouchableOpacity key={c} style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]} onPress={() => setCurrency(c)}>
                  <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={!name.trim() || saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : accounts.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Icons.wallet size={36} color={colors.text4} />
            <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
          </View>
        ) : (
          accounts.map(acc => (
            <View key={acc.id} style={styles.item}>
              <Icons.wallet size={17} color={colors.text2} stroke={1.8} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{acc.name}</Text>
                {acc.institution ? <Text style={styles.itemInstitution}>{acc.institution}</Text> : null}
              </View>
              <Text style={styles.itemCurrency}>{acc.currency}</Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(acc.id)}>
                <Icons.trash size={16} color={confirmDelete === acc.id ? colors.neg : colors.text4} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
