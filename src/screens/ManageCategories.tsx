import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listCategories } from '../lib/api';
import { CATS } from '../data/categories';
import type { CategoryMeta } from '../types';
import './ManageCategories.scss';

interface ManageCategoriesProps {
  onBack?: () => void;
}

interface CustomCategory extends CategoryMeta {
  slug: string;
  custom?: boolean;
}

const ICON_NAMES = Object.keys(Icons);

const COLOR_TOKENS = [
  'var(--cat-mercado)', 'var(--cat-restaurante)', 'var(--cat-transporte)',
  'var(--cat-casa)', 'var(--cat-saude)', 'var(--cat-lazer)',
  'var(--cat-trabalho)', 'var(--cat-assinaturas)', 'var(--cat-educacao)',
  'var(--cat-outros)',
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ManageCategories({ onBack }: ManageCategoriesProps) {
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_TOKENS[0]);
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    listCategories()
      .then(data => {
        const cats = (data as unknown as (CategoryMeta & { slug: string })[])
          .filter(c => !CATS[c.slug])
          .map(c => ({ ...c, labelEn: c.labelEn ?? c.label, custom: true }));
        setCustomCats(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const slug = slugify(label);
    const newCat: CustomCategory = {
      slug,
      label: label.trim(),
      labelEn: label.trim(),
      color: selectedColor,
      icon: selectedIcon,
      custom: true,
    };
    setCustomCats(prev => [...prev, newCat]);
    setLabel('');
    setSelectedColor(COLOR_TOKENS[0]);
    setSelectedIcon('wallet');
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = (slug: string) => {
    if (confirmDelete !== slug) {
      setConfirmDelete(slug);
      return;
    }
    setConfirmDelete(null);
    setCustomCats(prev => prev.filter(c => c.slug !== slug));
  };

  const renderCategoryIcon = (iconName: string, color: string) => {
    const Ic = Icons[iconName as keyof typeof Icons];
    if (!Ic) return null;
    return <Ic size={17} color={color} stroke={1.8} />;
  };

  const defaultEntries = Object.entries(CATS);

  return (
    <div className="manage-categories">
      <div className="manage-categories__status-bar">
        <IOSStatusBar />
      </div>

      <div className="manage-categories__scroll no-scrollbar">
        {/* Header */}
        <div className="manage-categories__header">
          {onBack && (
            <button onClick={onBack} className="manage-categories__back-btn">
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 className="manage-categories__title">
            Categorias
          </h1>
        </div>

        {/* Add button + form — at top */}
        {!showForm && (
          <div className="manage-categories__add-wrap">
            <button
              onClick={() => setShowForm(true)}
              className="manage-categories__add-btn"
            >
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar categoria
            </button>
          </div>
        )}

        {showForm && (
          <div className="manage-categories__form">
            <div className="manage-categories__form-title">Nova categoria</div>
            <input
              type="text"
              placeholder="Nome da categoria"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="manage-categories__input"
            />
            {label.trim() && (
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
              <button onClick={() => setShowForm(false)} className="manage-categories__cancel-btn">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !label.trim()}
                className={`manage-categories__save-btn ${label.trim() ? 'manage-categories__save-btn--active' : 'manage-categories__save-btn--disabled'} ${saving ? 'manage-categories__save-btn--saving' : ''}`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Default categories */}
        <div className="manage-categories__section">
          <div className="manage-categories__section-label">
            PADRÃO
          </div>
          <div className="manage-categories__list">
            {defaultEntries.map(([slug, cat]) => (
              <div key={slug} className="manage-categories__item">
                <div className="manage-categories__icon-box" style={{ background: cat.color }}>
                  {renderCategoryIcon(cat.icon, '#fff')}
                </div>
                <div className="manage-categories__item-info">
                  <div className="manage-categories__item-label">{cat.label}</div>
                </div>
                <span className="manage-categories__item-slug">{slug}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom categories */}
        <div className="manage-categories__section">
          <div className="manage-categories__section-label">
            PERSONALIZADAS
          </div>
          {loading ? (
            <div className="manage-categories__loading">
              Carregando...
            </div>
          ) : customCats.length === 0 && !showForm ? (
            <div className="manage-categories__empty">
              Nenhuma categoria personalizada
            </div>
          ) : (
            <div className="manage-categories__list">
              {customCats.map((cat) => (
                <div key={cat.slug} className="manage-categories__item">
                  <div className="manage-categories__icon-box" style={{ background: cat.color }}>
                    {renderCategoryIcon(cat.icon, '#fff')}
                  </div>
                  <div className="manage-categories__item-info">
                    <div className="manage-categories__item-label">{cat.label}</div>
                  </div>
                  <span className="manage-categories__item-slug">{cat.slug}</span>
                  <button
                    onClick={() => handleDelete(cat.slug)}
                    className="manage-categories__delete-btn"
                  >
                    <Icons.trash
                      size={16}
                      color={confirmDelete === cat.slug ? 'var(--neg)' : 'var(--text-4)'}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
