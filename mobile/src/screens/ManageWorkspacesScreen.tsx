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
import type { Workspace, WorkspaceShare, CurrencyCode } from '../types';
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

interface WorkspaceForm {
  name: string; currency: CurrencyCode; monthlyBudget: string; icon: string; order: string;
}
const EMPTY_FORM: WorkspaceForm = { name: '', currency: 'BRL', monthlyBudget: '', icon: '', order: '0' };

export function ManageWorkspacesScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkspaceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('viewer');
  const [shares, setShares] = useState<Record<string, WorkspaceShare[]>>({});
  const [shareSaving, setShareSaving] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const fetchWorkspaces = () => {
    setLoading(true);
    api.listWorkspaces()
      .then(data => setWorkspaces((data as unknown as Workspace[]).sort((a, b) => a.order - b.order)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); setError(null); };
  const openEdit = (ws: Workspace) => {
    setEditingId(ws.id);
    setForm({ name: ws.name, currency: ws.currency, monthlyBudget: String(ws.monthlyBudget), icon: ws.icon, order: String(ws.order) });
    setShowForm(true); setError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setError(null);
    const budget = parseFloat(form.monthlyBudget.replace(/\./g, '').replace(',', '.'));
    const payload = { name: form.name.trim(), currency: form.currency, monthlyBudget: isNaN(budget) ? 0 : budget, icon: form.icon.trim(), order: parseInt(form.order) || 0 };
    try {
      if (editingId) await api.updateWorkspace(editingId, payload);
      else await api.createWorkspace(payload);
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); fetchWorkspaces();
    } catch { setError('Erro ao salvar'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null); setError(null);
    try { await api.deleteWorkspace(id); setWorkspaces(prev => prev.filter(w => w.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao excluir'); }
  };

  const openShare = async (wsId: string) => {
    if (sharingId === wsId) { setSharingId(null); return; }
    setSharingId(wsId); setShareEmail(''); setShareError(null);
    try { const data = await api.listShares(wsId); setShares(prev => ({ ...prev, [wsId]: data as unknown as WorkspaceShare[] })); } catch {}
  };

  const handleShare = async () => {
    if (!sharingId || !shareEmail.trim()) return;
    setShareSaving(true); setShareError(null);
    try {
      await api.shareWorkspace(sharingId, { email: shareEmail.trim(), role: shareRole });
      setShareEmail('');
      const data = await api.listShares(sharingId);
      setShares(prev => ({ ...prev, [sharingId]: data as unknown as WorkspaceShare[] }));
    } catch (err) { setShareError(err instanceof Error ? err.message : 'Erro ao compartilhar'); }
    finally { setShareSaving(false); }
  };

  const ownedWorkspaces = workspaces.filter(w => w.ownership !== 'shared');
  const sharedWorkspaces = workspaces.filter(w => w.ownership === 'shared');

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: S4, paddingBottom: S6 + S6 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: S4 },
    backBtn: { marginRight: S3 },
    title: { fontFamily: FONT_SANS, fontSize: FS_H1, fontWeight: FW_BOLD, color: colors.text1 },
    errorBox: { backgroundColor: colors.negBg, borderRadius: R_INPUT, padding: S3, marginBottom: S3 },
    errorText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.neg },
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
    formActions: { flexDirection: 'row', gap: S3 },
    cancelBtn: { flex: 1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    cancelBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2 },
    saveBtn: { flex: 1, backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    loadingText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, textAlign: 'center', paddingVertical: S6 },
    empty: { alignItems: 'center', paddingVertical: S6 + S6 },
    emptyText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, marginTop: S3 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    itemIcon: { fontFamily: FONT_SANS, fontSize: FS_H3, marginRight: S3 },
    itemInfo: { flex: 1 },
    itemName: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    itemMeta: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    iconBtn: { padding: S2 },
    sharePanel: { backgroundColor: colors.bg2, borderRadius: R_CARD_SM, padding: S3, marginBottom: S3, marginTop: -S1 },
    shareInput: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text1, backgroundColor: colors.bg1, borderRadius: R_INPUT, paddingHorizontal: S3, paddingVertical: S2, borderWidth: 1, borderColor: colors.border1, marginBottom: S2 },
    shareRoleRow: { flexDirection: 'row', gap: S2, marginBottom: S2 },
    shareRoleBtn: { paddingHorizontal: S3, paddingVertical: S2, borderRadius: R_PILL, borderWidth: 1, borderColor: colors.border1 },
    shareRoleBtnActive: { borderColor: colors.pos, backgroundColor: colors.posBg },
    shareRoleBtnText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    shareRoleBtnTextActive: { color: colors.pos },
    shareAddBtn: { backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S2 + 2, alignItems: 'center' },
    shareAddBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    shareItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: S2 },
    shareEmail: { flex: 1, fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text2 },
    shareSelect: { fontFamily: FONT_MONO, fontSize: FS_CAPTION, color: colors.text3, marginRight: S2 },
    sharedHeader: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_SEMIBOLD, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginTop: S5, marginBottom: S3 },
    leaveBtn: { paddingHorizontal: S3, paddingVertical: S1, borderRadius: R_INPUT, borderWidth: 1, borderColor: colors.neg },
    leaveBtnText: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.neg },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.title}>Espacos</Text>
        </View>

        {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        {!showForm && (
          <View style={styles.addWrap}>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Icons.plus size={16} color={colors.text2} />
              <Text style={styles.addBtnText}>Adicionar espaco</Text>
            </TouchableOpacity>
          </View>
        )}

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingId ? 'Editar espaco' : 'Novo espaco'}</Text>
            <TextInput style={styles.input} placeholder="Nome (ex: Brasil, EUA)" placeholderTextColor={colors.text4} value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <TextInput style={styles.input} placeholder="Icone (emoji)" placeholderTextColor={colors.text4} value={form.icon} onChangeText={v => setForm({ ...form, icon: v })} />
            <View style={styles.currencyRow}>
              {CURRENCIES.map(c => (
                <TouchableOpacity key={c} style={[styles.currencyBtn, form.currency === c && styles.currencyBtnActive]} onPress={() => setForm({ ...form, currency: c })}>
                  <Text style={[styles.currencyBtnText, form.currency === c && styles.currencyBtnTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Orcamento mensal" placeholderTextColor={colors.text4} keyboardType="decimal-pad" value={form.monthlyBudget} onChangeText={v => setForm({ ...form, monthlyBudget: v })} />
            <TextInput style={styles.input} placeholder="Ordem (0, 1, 2...)" placeholderTextColor={colors.text4} keyboardType="number-pad" value={form.order} onChangeText={v => setForm({ ...form, order: v })} />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setEditingId(null); }}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, (!form.name.trim() || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={!form.name.trim() || saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : workspaces.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Icons.grid size={36} color={colors.text4} />
            <Text style={styles.emptyText}>Nenhum espaco cadastrado</Text>
          </View>
        ) : (
          <>
            {ownedWorkspaces.map(ws => (
              <View key={ws.id}>
                <View style={styles.item}>
                  <Text style={styles.itemIcon}>{ws.icon}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{ws.name}</Text>
                    <Text style={styles.itemMeta}>{ws.currency} {'\u00b7'} {ws.currency === 'BRL' ? 'R$' : ws.currency === 'USD' ? '$' : '\u20ac'} {ws.monthlyBudget.toLocaleString('pt-BR')}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openShare(ws.id)}>
                    <Icons.users size={16} color={sharingId === ws.id ? colors.pos : colors.text4} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(ws)}>
                    <Icons.pencil size={16} color={colors.text4} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(ws.id)}>
                    <Icons.trash size={16} color={confirmDelete === ws.id ? colors.neg : colors.text4} />
                  </TouchableOpacity>
                </View>

                {sharingId === ws.id && (
                  <View style={styles.sharePanel}>
                    <TextInput style={styles.shareInput} placeholder="Email do usuario" placeholderTextColor={colors.text4} keyboardType="email-address" value={shareEmail} onChangeText={setShareEmail} />
                    <View style={styles.shareRoleRow}>
                      <TouchableOpacity style={[styles.shareRoleBtn, shareRole === 'editor' && styles.shareRoleBtnActive]} onPress={() => setShareRole('editor')}>
                        <Text style={[styles.shareRoleBtnText, shareRole === 'editor' && styles.shareRoleBtnTextActive]}>Editor</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.shareRoleBtn, shareRole === 'viewer' && styles.shareRoleBtnActive]} onPress={() => setShareRole('viewer')}>
                        <Text style={[styles.shareRoleBtnText, shareRole === 'viewer' && styles.shareRoleBtnTextActive]}>Viewer</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.shareAddBtn} onPress={handleShare} disabled={shareSaving || !shareEmail.trim()}>
                      <Text style={styles.shareAddBtnText}>{shareSaving ? 'Compartilhando...' : 'Compartilhar'}</Text>
                    </TouchableOpacity>
                    {shareError && <Text style={[styles.errorText, { marginTop: S2 }]}>{shareError}</Text>}
                    {(shares[ws.id] ?? []).map(s => (
                      <View key={s.sharedUserId} style={styles.shareItem}>
                        <Text style={styles.shareEmail}>{s.sharedEmail}</Text>
                        <Text style={styles.shareSelect}>{s.role}</Text>
                        <TouchableOpacity onPress={() => api.removeShare(ws.id, s.sharedUserId)}>
                          <Icons.x size={14} color={colors.neg} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {sharedWorkspaces.length > 0 && (
              <>
                <Text style={styles.sharedHeader}>Compartilhados comigo</Text>
                {sharedWorkspaces.map(ws => (
                  <View key={ws.id} style={styles.item}>
                    <Text style={styles.itemIcon}>{ws.icon}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{ws.name}</Text>
                      <Text style={styles.itemMeta}>{ws.ownerEmail} {'\u00b7'} {ws.role}</Text>
                    </View>
                    <TouchableOpacity style={styles.leaveBtn} onPress={() => api.removeShare(ws.id, '')}>
                      <Text style={styles.leaveBtnText}>Sair</Text>
                    </TouchableOpacity>
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
