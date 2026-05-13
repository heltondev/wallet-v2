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
import type { CategoryMeta } from '../types';
import {
  FONT_SANS,
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

interface CategoryEntry extends CategoryMeta {
  slug: string;
  hidden?: boolean;
  isDefault?: boolean;
}

const ICON_NAMES = Object.keys(Icons);

const COLOR_PRESETS = [
  '#4CAF50', '#E57373', '#5C6BC0', '#AB47BC', '#EC407A',
  '#FFB74D', '#78909C', '#AED581', '#4DD0E1', '#90A4AE',
  '#FF8A65', '#CE93D8', '#4DB6AC', '#FFAB91', '#A1887F',
];

function slugify(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function ManageCategoriesScreen() {
  const { colors } = useTheme();
  const nav = useNavigation();

  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const apiCats = await api.listCategories() as unknown as (CategoryMeta & { slug: string; hidden?: boolean })[];
      const overrides: Record<string, CategoryMeta & { hidden?: boolean }> = {};
      for (const c of apiCats) overrides[c.slug] = c;
      const all: CategoryEntry[] = [];
      for (const [slug, cat] of Object.entries(CATS)) {
        const override = overrides[slug];
        if (override?.hidden) continue;
        all.push({ slug, label: override?.label ?? cat.label, labelEn: override?.labelEn ?? cat.labelEn, color: override?.color ?? cat.color, icon: override?.icon ?? cat.icon, isDefault: true });
        delete overrides[slug];
      }
      for (const [slug, cat] of Object.entries(overrides)) {
        if (cat.hidden) continue;
        all.push({ slug, label: cat.label, labelEn: cat.labelEn ?? cat.label, color: cat.color, icon: cat.icon, isDefault: false });
      }
      setCategories(all);
    } catch {
      setCategories(Object.entries(CATS).map(([slug, cat]) => ({ slug, ...cat, isDefault: true })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const resetForm = () => { setLabel(''); setLabelEn(''); setSelectedColor(COLOR_PRESETS[0]); setSelectedIcon('wallet'); setEditingSlug(null); setShowForm(false); };

  const startEdit = (cat: CategoryEntry) => {
    setEditingSlug(cat.slug); setLabel(cat.label); setLabelEn(cat.labelEn); setSelectedColor(cat.color); setSelectedIcon(cat.icon); setShowForm(true);
  };

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const slug = editingSlug ?? slugify(label);
      const data = { slug, label: label.trim(), labelEn: labelEn.trim() || label.trim(), color: selectedColor, icon: selectedIcon };
      if (editingSlug) await api.updateCategory(slug, data);
      else await api.createCategory(data);
      await loadCategories();
      resetForm();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (slug: string) => {
    if (confirmDelete !== slug) { setConfirmDelete(slug); return; }
    setConfirmDelete(null);
    try {
      const cat = categories.find(c => c.slug === slug);
      if (cat?.isDefault) await api.updateCategory(slug, { slug, label: cat.label, labelEn: cat.labelEn, color: cat.color, icon: cat.icon, hidden: true });
      else await api.deleteCategory(slug);
      setCategories(prev => prev.filter(c => c.slug !== slug));
    } catch {}
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
    slugPreview: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text4, marginBottom: S3 },
    pickerLabel: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, fontWeight: FW_MEDIUM, color: colors.text3, marginBottom: S2 },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S2, marginBottom: S4 },
    colorBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
    colorBtnSelected: { borderColor: colors.text1 },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S2, marginBottom: S4 },
    iconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg2 },
    iconBtnSelected: { backgroundColor: colors.bg4 },
    formActions: { flexDirection: 'row', gap: S3 },
    cancelBtn: { flex: 1, backgroundColor: colors.bg2, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    cancelBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, color: colors.text2 },
    saveBtn: { flex: 1, backgroundColor: colors.pos, borderRadius: R_INPUT, paddingVertical: S3, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_SEMIBOLD, color: colors.bg0 },
    loadingText: { fontFamily: FONT_SANS, fontSize: FS_BODY, color: colors.text3, textAlign: 'center', paddingVertical: S6 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg1, borderRadius: R_CARD_SM, borderWidth: 1, borderColor: colors.border1, padding: S3, marginBottom: S2 },
    iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: S3 },
    itemInfo: { flex: 1 },
    itemLabel: { fontFamily: FONT_SANS, fontSize: FS_SMALL, fontWeight: FW_MEDIUM, color: colors.text1 },
    itemLabelEn: { fontFamily: FONT_SANS, fontSize: FS_CAPTION, color: colors.text3, marginTop: 2 },
    editBtn: { padding: S2 },
    deleteBtn: { padding: S2 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
            <Icons.chevL size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.title}>Categorias</Text>
        </View>

        {!showForm ? (
          <View style={styles.addWrap}>
            <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowForm(true); }}>
              <Icons.plus size={16} color={colors.text2} />
              <Text style={styles.addBtnText}>Adicionar categoria</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingSlug ? 'Editar categoria' : 'Nova categoria'}</Text>
            <TextInput style={styles.input} placeholder="Nome (PT-BR)" placeholderTextColor={colors.text4} value={label} onChangeText={setLabel} />
            <TextInput style={styles.input} placeholder="Name (EN)" placeholderTextColor={colors.text4} value={labelEn} onChangeText={setLabelEn} />
            {!editingSlug && label.trim() ? <Text style={styles.slugPreview}>slug: {slugify(label)}</Text> : null}

            <Text style={styles.pickerLabel}>Cor</Text>
            <View style={styles.colorGrid}>
              {COLOR_PRESETS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorBtn, { backgroundColor: c }, selectedColor === c && styles.colorBtnSelected]} onPress={() => setSelectedColor(c)} />
              ))}
            </View>

            <Text style={styles.pickerLabel}>Icone</Text>
            <View style={styles.iconGrid}>
              {ICON_NAMES.slice(0, 30).map(name => {
                const Ic = Icons[name as keyof typeof Icons];
                return (
                  <TouchableOpacity key={name} style={[styles.iconBtn, selectedIcon === name && styles.iconBtnSelected]} onPress={() => setSelectedIcon(name)}>
                    <Ic size={16} color={selectedIcon === name ? colors.text1 : colors.text3} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, (!label.trim() || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={!label.trim() || saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : (
          categories.map(cat => {
            const Ic = Icons[cat.icon as keyof typeof Icons];
            return (
              <View key={cat.slug} style={styles.item}>
                <View style={[styles.iconBox, { backgroundColor: cat.color }]}>
                  {Ic && <Ic size={14} color="#fff" stroke={1.8} />}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{cat.label}</Text>
                  <Text style={styles.itemLabelEn}>{cat.labelEn}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(cat)}>
                  <Icons.pencil size={15} color={colors.text4} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(cat.slug)}>
                  <Icons.trash size={15} color={confirmDelete === cat.slug ? colors.neg : colors.text4} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
