import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../lib/api';
import { CATS } from '../data/categories';
import type { CategoryMeta } from '../types';
import './ManageCategories.scss';

interface ManageCategoriesProps {
  onBack?: () => void;
}

interface CategoryEntry extends CategoryMeta {
  slug: string;
  hidden?: boolean;
  isDefault?: boolean;
}

const ICON_NAMES = Object.keys(Icons);

const COLOR_TOKENS = [
  'var(--cat-mercado)', 'var(--cat-restaurante)', 'var(--cat-transporte)',
  'var(--cat-casa)', 'var(--cat-saude)', 'var(--cat-lazer)',
  'var(--cat-trabalho)', 'var(--cat-assinaturas)', 'var(--cat-educacao)',
  'var(--cat-outros)', 'var(--cat-pets)', 'var(--cat-compras)',
  'var(--cat-viagem)', 'var(--cat-impostos)', 'var(--cat-seguros)',
  'var(--cat-investimentos)', 'var(--cat-doacoes)', 'var(--cat-presentes)',
  'var(--cat-servicos)', 'var(--cat-utilities)', 'var(--cat-alimentacao)',
  'var(--cat-transferencia)',
];

function slugify(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function ManageCategories({ onBack }: ManageCategoriesProps) {
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_TOKENS[0]);
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const apiCats = await listCategories() as unknown as (CategoryMeta & { slug: string; hidden?: boolean })[];
      const overrides: Record<string, CategoryMeta & { hidden?: boolean }> = {};
      for (const c of apiCats) {
        overrides[c.slug] = c;
      }

      const all: CategoryEntry[] = [];

      for (const [slug, cat] of Object.entries(CATS)) {
        const override = overrides[slug];
        if (override?.hidden) continue;
        all.push({
          slug,
          label: override?.label ?? cat.label,
          labelEn: override?.labelEn ?? cat.labelEn,
          color: override?.color ?? cat.color,
          icon: override?.icon ?? cat.icon,
          isDefault: true,
        });
        delete overrides[slug];
      }

      for (const [slug, cat] of Object.entries(overrides)) {
        if (cat.hidden) continue;
        all.push({
          slug,
          label: cat.label,
          labelEn: cat.labelEn ?? cat.label,
          color: cat.color,
          icon: cat.icon,
          isDefault: false,
        });
      }

      setCategories(all);
    } catch {
      const all = Object.entries(CATS).map(([slug, cat]) => ({
        slug, ...cat, isDefault: true,
      }));
      setCategories(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const resetForm = () => {
    setLabel(''); setLabelEn('');
    setSelectedColor(COLOR_TOKENS[0]); setSelectedIcon('wallet');
    setEditingSlug(null); setShowForm(false);
  };

  const startEdit = (cat: CategoryEntry) => {
    setEditingSlug(cat.slug);
    setLabel(cat.label);
    setLabelEn(cat.labelEn);
    setSelectedColor(cat.color);
    setSelectedIcon(cat.icon);
    setShowForm(true);
  };

  const startNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const slug = editingSlug ?? slugify(label);
      const data = { slug, label: label.trim(), labelEn: labelEn.trim() || label.trim(), color: selectedColor, icon: selectedIcon };

      if (editingSlug) {
        await updateCategory(slug, data);
      } else {
        await createCategory(data);
      }
      await loadCategories();
      resetForm();
    } catch {
      // failed
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (confirmDelete !== slug) {
      setConfirmDelete(slug);
      return;
    }
    setConfirmDelete(null);
    try {
      const cat = categories.find(c => c.slug === slug);
      if (cat?.isDefault) {
        await updateCategory(slug, { slug, label: cat.label, labelEn: cat.labelEn, color: cat.color, icon: cat.icon, hidden: true });
      } else {
        await deleteCategory(slug);
      }
      setCategories(prev => prev.filter(c => c.slug !== slug));
    } catch {
      // failed
    }
  };

  const renderIcon = (iconName: string, color: string) => {
    const Ic = Icons[iconName as keyof typeof Icons];
    if (!Ic) return null;
    return <Ic size={17} color={color} stroke={1.8} />;
  };

  return (
    <div className="manage-categories">
      <div className="manage-categories__status-bar">
        <IOSStatusBar />
      </div>

      <div className="manage-categories__scroll no-scrollbar">
        <div className="manage-categories__header">
          {onBack && (
            <button onClick={onBack} className="manage-categories__back-btn">
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 className="manage-categories__title">Categorias</h1>
        </div>

        {/* Add / Edit form */}
        {!showForm ? (
          <div className="manage-categories__add-wrap">
            <button onClick={startNew} className="manage-categories__add-btn">
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar categoria
            </button>
          </div>
        ) : (
          <div className="manage-categories__form">
            <div className="manage-categories__form-title">
              {editingSlug ? 'Editar categoria' : 'Nova categoria'}
            </div>
            <input
              type="text"
              placeholder="Nome (PT-BR)"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="manage-categories__input"
            />
            <input
              type="text"
              placeholder="Name (EN)"
              value={labelEn}
              onChange={e => setLabelEn(e.target.value)}
              className="manage-categories__input"
            />
            {!editingSlug && label.trim() && (
              <div className="manage-categories__slug-preview">
                slug: {slugify(label)}
              </div>
            )}

            <div>
              <div className="manage-categories__picker-label">Cor</div>
              <div className="manage-categories__color-grid">
                {COLOR_TOKENS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`manage-categories__color-btn ${selectedColor === c ? 'manage-categories__color-btn--selected' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="manage-categories__picker-label">Ícone</div>
              <div className="manage-categories__icon-grid">
                {ICON_NAMES.map(name => {
                  const Ic = Icons[name as keyof typeof Icons];
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedIcon(name)}
                      className={`manage-categories__icon-btn ${selectedIcon === name ? 'manage-categories__icon-btn--selected' : 'manage-categories__icon-btn--unselected'}`}
                    >
                      <Ic size={16} color={selectedIcon === name ? 'var(--text-1)' : 'var(--text-3)'} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="manage-categories__form-actions">
              <button onClick={resetForm} className="manage-categories__cancel-btn">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !label.trim()}
                className={`manage-categories__save-btn ${label.trim() ? 'manage-categories__save-btn--active' : 'manage-categories__save-btn--disabled'}`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Category list — unified */}
        {loading ? (
          <div className="manage-categories__loading">Carregando...</div>
        ) : (
          <div className="manage-categories__list">
            {categories.map((cat) => (
              <div key={cat.slug} className="manage-categories__item">
                <div className="manage-categories__icon-box" style={{ background: cat.color }}>
                  {renderIcon(cat.icon, '#fff')}
                </div>
                <div className="manage-categories__item-info">
                  <div className="manage-categories__item-label">{cat.label}</div>
                  <div className="manage-categories__item-label-en">{cat.labelEn}</div>
                </div>
                <button onClick={() => startEdit(cat)} className="manage-categories__edit-btn">
                  <Icons.pencil size={15} color="var(--text-4)" />
                </button>
                <button
                  onClick={() => handleDelete(cat.slug)}
                  className="manage-categories__delete-btn"
                >
                  <Icons.trash size={15} color={confirmDelete === cat.slug ? 'var(--neg)' : 'var(--text-4)'} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
