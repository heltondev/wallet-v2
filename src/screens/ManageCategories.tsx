import React, { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listCategories } from '../lib/api';
import { CATS } from '../data/categories';
import type { CategoryMeta } from '../types';

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

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text-1)',
    fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none',
  };

  const defaultEntries = Object.entries(CATS);

  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--bg-0)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar />
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100, overflow: 'auto', paddingTop: 54, paddingBottom: 20 }} className="no-scrollbar">
        {/* Header */}
        <div style={{ padding: '8px 16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: 'var(--text-1)' }}>
            Categorias
          </h1>
        </div>

        {/* Default categories */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', padding: '0 16px 6px' }}>
            PADRÃO
          </div>
          <div style={{ margin: '0 16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', overflow: 'hidden' }}>
            {defaultEntries.map(([slug, cat], i) => (
              <div
                key={slug}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: i < defaultEntries.length - 1 ? '1px solid var(--border-1)' : 'none',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: cat.color, opacity: 0.85,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {renderCategoryIcon(cat.icon, '#fff')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{cat.label}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{slug}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom categories */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', padding: '0 16px 6px' }}>
            PERSONALIZADAS
          </div>
          {loading ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Carregando...
            </div>
          ) : customCats.length === 0 && !showForm ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
              Nenhuma categoria personalizada
            </div>
          ) : (
            <div style={{ margin: '0 16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', overflow: 'hidden' }}>
              {customCats.map((cat, i) => (
                <div
                  key={cat.slug}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < customCats.length - 1 ? '1px solid var(--border-1)' : 'none',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: cat.color, opacity: 0.85,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {renderCategoryIcon(cat.icon, '#fff')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{cat.label}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{cat.slug}</span>
                  <button
                    onClick={() => handleDelete(cat.slug)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
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

        {/* Add form */}
        {showForm && (
          <div style={{ margin: '0 16px 18px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Nova categoria</div>
            <input
              type="text"
              placeholder="Nome da categoria"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={inputStyle}
            />
            {label.trim() && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                slug: {slugify(label)}
              </div>
            )}

            {/* Color picker */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Cor</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLOR_TOKENS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: c,
                      outline: selectedColor === c ? '2px solid var(--text-1)' : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Ícone</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {ICON_NAMES.map(name => {
                  const Ic = Icons[name as keyof typeof Icons];
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedIcon(name)}
                      style={{
                        width: 34, height: 34, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: selectedIcon === name ? 'var(--bg-3)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        outline: selectedIcon === name ? '1px solid var(--border-2)' : 'none',
                      }}
                    >
                      <Ic size={16} color={selectedIcon === name ? 'var(--text-1)' : 'var(--text-3)'} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border-2)',
                  background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !label.trim()}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: label.trim() ? 'var(--accent)' : 'var(--bg-3)',
                  color: label.trim() ? '#fff' : 'var(--text-4)',
                  fontSize: 14, fontWeight: 600, cursor: label.trim() ? 'pointer' : 'default',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Add button */}
        {!showForm && (
          <div style={{ margin: '0 16px' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 'var(--r-card-sm)',
                border: '1px dashed var(--border-2)', background: 'transparent',
                color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
              }}
            >
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar categoria
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
