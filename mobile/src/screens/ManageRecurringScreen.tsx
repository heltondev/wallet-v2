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
import { CATS } from '../data/categories';
import * as api from '../services/apiService';
import type { RecurringTransaction, RecurringFrequency, CurrencyCode, Account } from '../types';
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
import { S1, S2, S3, S4, S5, S6, R_CARD_SM, R_INPUT, R_PILL } from '../styles/spacing';

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'yearly', label: 'Anual' },
  { value: 'custom', label: 'Personalizado' },
];
const CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR'];

interface FormData {
  desc: string; amount: string; type: 'expense' | 'income'; cat: string;
  account: string; currency: CurrencyCode; frequency: RecurringFrequency;
  dayOfMonth: string; notes: string; active: boolean;
}

const emptyForm = (): FormData => ({
  desc: '', amount: '', type: 'expense', cat: 'outros', account: '',
  currency: 'BRL', frequency: 'monthly', dayOfMonth: '', notes: '', active: true,
});

export function ManageRecurringScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const catSlugs = Object.keys(CATS);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rec, acc] = await Promise.all([api.listRecurring(), api.listAccounts()]);
      setItems(rec as unknown as RecurringTransaction[]);
      setAccounts(acc as unknown as Account[]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setShowForm(true); };

  const openEdit = (r: RecurringTransaction) => {
    setEditingId(r.id);
    setForm({
      desc: r.desc, amount: String(Math.abs(r.amount)),
      type: r.amount >= 0 ? 'income' : 'expense', cat: r.cat, account: r.account,
      currency: r.currency, frequency: r.frequency,
      dayOfMonth: r.dayOfMonth != null ? String(r.dayOfMonth) : '',
      notes: r.notes ?? '', active: r.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.desc.trim() || !form.amount.trim()) return;
    setSaving(true);
    const rawAmount = parseFloat(form.amount.replace(',', '.'));
    const amount = form.type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const payload: Record<string, unknown> = {
      desc: form.desc.trim(), amount, currency: form.currency, cat: form.cat,
      account: form.account, frequency: form.frequency,
      dayOfMonth: (form.frequency === 'monthly' || form.frequency === 'yearly') && form.dayOfMonth ? parseInt(form.dayOfMonth) : null,
      fxRate: 1, notes: form.notes.trim() || null, active: form.active,
    };
    try {
      if (editingId) await api.updateRecurring(editingId, payload);
      else await api.createRecurring(payload);
      setShowForm(false); setEditingId(null); await fetchData();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    try { await api.deleteRecurring(id); setItems(prev => prev.filter(r => r.id !== id)); } catch {}
  };

  const handleToggleActive = async (r: RecurringTransaction) => {
    const newActive = !r.active;
    setItems(prev => prev.map(x => x.id === r.id ? { ...x, active: newActive } : x));
    try { await api.updateRecurring(r.id, { active: newActive }); } catch {
      setItems(prev => prev.map(x => x.id === r.id ? { ...x, active: r.active } : x));
    }
  };

  const freqLabel = (f: RecurringFrequency) => FREQUENCIES.find(x => x.value === f)?.label ?? f;

  const filteredItems = items.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.desc.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q);
  });

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
    row2: { flexDirection: 'row', gap: S3, marginBottom: S3 },
    rowItem: { flex: 1 },
    chipRow: { flexDirection: 'row', gap: S2, marginBottom: S3, flexWrap: 'wrap' },
    chip: { paddingHorizontal: S3, paddingVertical: S2, borderRadius: R_PILL, borderWidth: 1, borderColor: colors.border1 },
    chipActive: { borderColor: colors.pos, backgroundColor: colors.posBg },
    chipText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    chipTextActive: { color: colors.pos },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S3 },
    toggleLabel: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text1 },
    toggleBtn: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
    toggleOn: { backgroundColor: colors.pos },
    toggleOff: { backgroundColor: colors.bg3 },
    toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bg0 },
    toggleKnobOn: { alignSelf: 'flex-end' },
    toggleKnobOff: { alignSelf: 'flex-start' },
    formActions: { flexDirection: 'row', gap: S3 },
    cancelBtn: { flex: 1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    cancelBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2 },
    saveBtn: { flex: 1, backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    searchInput: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S2 + 2, borderWidth: 1, borderColor: colors.border1, marginBottom: S3 },
    loadingText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, textAlign: 'center', paddingVertical: S6 },
    empty: { alignItems: 'center', paddingVertical: S6 + S6 },
    emptyText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, marginTop: S3 },
    item: { backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    itemInactive: { opacity: 0.5 },
    itemRow1: { flexDirection: 'row', alignItems: 'center' },
    catIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: S2 },
    itemDesc: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    itemAmount: { fontFamily: FONT_MONO, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, fontVariant: [...TABULAR_NUMS] },
    itemAmountIncome: { color: colors.pos },
    itemAmountExpense: { color: colors.text1 },
    itemRow2: { flexDirection: 'row', gap: S2, marginTop: S2, flexWrap: 'wrap' },
    badge: { paddingHorizontal: S2, paddingVertical: 1, borderRadius: R_PILL, backgroundColor: colors.bg3 },
    badgeText: { fontFamily: FONT_SANS, fontSize: 10, color: colors.text3 },
    itemRow3: { flexDirection: 'row', alignItems: 'center', marginTop: S3, gap: S2 },
    toggleSm: { width: 32, height: 18, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 2 },
    toggleSmKnob: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.bg0 },
    statusText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, flex: 1 },
    iconBtn: { padding: S1 },
  });

  const renderCatIcon = (slug: string) => {
    const meta = CATS[slug];
    const bg = meta?.color ?? colors.bg3;
    const iconName = meta?.icon ?? 'wallet';
    const Ic = Icons[iconName as keyof typeof Icons];
    return (
      <View style={[styles.catIcon, { backgroundColor: bg }]}>
        {Ic && <Ic size={12} color="#fff" stroke={1.8} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.title}>Recorrentes</Text>
        </View>

        {!showForm && (
          <View style={styles.addWrap}>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Icons.plus size={16} color={colors.text2} />
              <Text style={styles.addBtnText}>Adicionar recorrente</Text>
            </TouchableOpacity>
          </View>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingId ? 'Editar recorrente' : 'Nova recorrente'}</Text>
            <TextInput style={styles.input} placeholder="Descricao" placeholderTextColor={colors.text4} value={form.desc} onChangeText={v => setField('desc', v)} />
            <View style={styles.row2}>
              <TextInput style={[styles.input, styles.rowItem, { marginBottom: 0 }]} placeholder="Valor" placeholderTextColor={colors.text4} keyboardType="decimal-pad" value={form.amount} onChangeText={v => setField('amount', v)} />
              <View style={[styles.chipRow, styles.rowItem, { marginBottom: 0 }]}>
                <TouchableOpacity style={[styles.chip, form.type === 'expense' && styles.chipActive]} onPress={() => setField('type', 'expense')}>
                  <Text style={[styles.chipText, form.type === 'expense' && styles.chipTextActive]}>Saida</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, form.type === 'income' && styles.chipActive]} onPress={() => setField('type', 'income')}>
                  <Text style={[styles.chipText, form.type === 'income' && styles.chipTextActive]}>Entrada</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {catSlugs.map(slug => (
                  <TouchableOpacity key={slug} style={[styles.chip, form.cat === slug && styles.chipActive]} onPress={() => setField('cat', slug)}>
                    <Text style={[styles.chipText, form.cat === slug && styles.chipTextActive]}>{CATS[slug].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {accounts.map(acc => (
                  <TouchableOpacity key={acc.id} style={[styles.chip, form.account === acc.name && styles.chipActive]} onPress={() => setField('account', acc.name)}>
                    <Text style={[styles.chipText, form.account === acc.name && styles.chipTextActive]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.row2}>
              <View style={[styles.chipRow, styles.rowItem, { marginBottom: 0 }]}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity key={c} style={[styles.chip, form.currency === c && styles.chipActive]} onPress={() => setField('currency', c)}>
                    <Text style={[styles.chipText, form.currency === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.chipRow, styles.rowItem, { marginBottom: 0 }]}>
                {FREQUENCIES.map(f => (
                  <TouchableOpacity key={f.value} style={[styles.chip, form.frequency === f.value && styles.chipActive]} onPress={() => setField('frequency', f.value)}>
                    <Text style={[styles.chipText, form.frequency === f.value && styles.chipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(form.frequency === 'monthly' || form.frequency === 'yearly') && (
              <TextInput style={styles.input} placeholder="Dia do mes (1-31)" placeholderTextColor={colors.text4} keyboardType="number-pad" value={form.dayOfMonth} onChangeText={v => setField('dayOfMonth', v)} />
            )}

            <TextInput style={styles.input} placeholder="Notas (opcional)" placeholderTextColor={colors.text4} value={form.notes} onChangeText={v => setField('notes', v)} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Ativa</Text>
              <TouchableOpacity style={[styles.toggleBtn, form.active ? styles.toggleOn : styles.toggleOff]} onPress={() => setField('active', !form.active)}>
                <View style={[styles.toggleKnob, form.active ? styles.toggleKnobOn : styles.toggleKnobOff]} />
              </TouchableOpacity>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setEditingId(null); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, (!form.desc.trim() || !form.amount.trim() || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={!form.desc.trim() || !form.amount.trim() || saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : items.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Icons.repeat size={36} color={colors.text4} />
            <Text style={styles.emptyText}>Nenhuma recorrente cadastrada</Text>
          </View>
        ) : !showForm && (
          <>
            {items.length > 3 && (
              <TextInput style={styles.searchInput} placeholder="Buscar recorrente..." placeholderTextColor={colors.text4} value={searchQuery} onChangeText={setSearchQuery} />
            )}
            {filteredItems.map(r => (
              <View key={r.id} style={[styles.item, !r.active && styles.itemInactive]}>
                <View style={styles.itemRow1}>
                  {renderCatIcon(r.cat)}
                  <Text style={styles.itemDesc}>{r.desc}</Text>
                  <Text style={[styles.itemAmount, r.amount >= 0 ? styles.itemAmountIncome : styles.itemAmountExpense]}>
                    {r.amount >= 0 ? '+' : ''}{r.currency === 'BRL' ? 'R$ ' : r.currency === 'USD' ? '$ ' : '\u20ac '}
                    {Math.abs(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.itemRow2}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{freqLabel(r.frequency)}</Text></View>
                  {r.dayOfMonth != null && <View style={styles.badge}><Text style={styles.badgeText}>dia {r.dayOfMonth}</Text></View>}
                  <View style={styles.badge}><Text style={styles.badgeText}>{r.currency}</Text></View>
                </View>
                <View style={styles.itemRow3}>
                  <TouchableOpacity style={[styles.toggleSm, r.active ? styles.toggleOn : styles.toggleOff]} onPress={() => handleToggleActive(r)}>
                    <View style={[styles.toggleSmKnob, r.active ? styles.toggleKnobOn : styles.toggleKnobOff]} />
                  </TouchableOpacity>
                  <Text style={styles.statusText}>{r.active ? 'Ativo' : 'Pausado'}</Text>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(r)}>
                    <Icons.pencil size={15} color={colors.text3} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(r.id)}>
                    <Icons.trash size={15} color={confirmDelete === r.id ? colors.neg : colors.text4} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
