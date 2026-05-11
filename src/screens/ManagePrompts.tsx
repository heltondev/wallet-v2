import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listPrompts, getPrompt, updatePrompt } from '../lib/api';

interface ManagePromptsProps {
  onBack?: () => void;
}

const FEATURES = [
  { key: 'extract-receipt', label: 'Extrair recibo' },
  { key: 'categorize', label: 'Categorizar' },
  { key: 'insights', label: 'Insights' },
  { key: 'forecast', label: 'Previsao' },
  { key: 'chat', label: 'Chat' },
];

interface PromptData {
  content?: string;
}

export function ManagePrompts({ onBack }: ManagePromptsProps) {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listPrompts()
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
        const item = await getPrompt(feature) as PromptData;
        setEditContent(item.content ?? '');
      } catch {
        setEditContent('');
      }
    }
    setEditing(feature);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updatePrompt(editing, editContent);
      setPrompts(prev => ({ ...prev, [editing]: editContent }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    const label = FEATURES.find(f => f.key === editing)?.label ?? editing;
    return (
      <div style={{ height: '100%', position: 'relative', background: 'var(--bg-0)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <IOSStatusBar />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100, overflow: 'auto', paddingTop: 54, paddingBottom: 20 }} className="no-scrollbar">
          <div style={{ padding: '8px 16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: 'var(--text-1)', flex: 1 }}>
              {label}
            </h1>
            {saved && (
              <span style={{ fontSize: 13, color: 'var(--pos)', fontFamily: 'var(--font-mono)' }}>Salvo</span>
            )}
          </div>
          <div style={{ margin: '0 16px' }}>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 300,
                background: 'var(--bg-1)', border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-card-sm)', padding: 16, color: 'var(--text-1)',
                fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.5,
                outline: 'none', resize: 'vertical',
              }}
            />
          </div>
          <div style={{ margin: '18px 16px 0' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 'var(--r-card-sm)',
                border: 'none', background: 'var(--accent)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--bg-0)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100, overflow: 'auto', paddingTop: 54, paddingBottom: 20 }} className="no-scrollbar">
        <div style={{ padding: '8px 16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: 'var(--text-1)' }}>
            Prompts de AI
          </h1>
        </div>

        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Carregando...
          </div>
        ) : (
          <div style={{ margin: '0 16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', overflow: 'hidden' }}>
            {FEATURES.map((f, i) => {
              const preview = prompts[f.key]?.slice(0, 50) ?? 'Nao configurado';
              return (
                <div
                  key={f.key}
                  onClick={() => openEditor(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderBottom: i < FEATURES.length - 1 ? '1px solid var(--border-1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text-1)' }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preview}{prompts[f.key] && prompts[f.key].length > 50 ? '...' : ''}
                    </div>
                  </div>
                  <Icons.chevR size={14} color="var(--text-4)" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
