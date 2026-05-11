import { useState, useEffect, useMemo } from 'react';
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
  { key: 'forecast', label: 'Previsão' },
  { key: 'chat', label: 'Chat' },
];

interface PromptData {
  content?: string;
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: '20px 0 8px', letterSpacing: -0.3 }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: 'var(--pos)', margin: '16px 0 6px', fontFamily: 'var(--font-mono)', letterSpacing: 0.3 }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '16px 0 10px', letterSpacing: -0.5 }}>
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0', marginLeft: 4 }}>
          <span style={{ color: 'var(--text-3)', marginTop: 6, width: 5, height: 5, borderRadius: '50%', background: 'var(--text-3)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{
          background: 'var(--bg-2)', border: '1px solid var(--border-1)',
          borderRadius: 8, padding: 12, margin: '8px 0',
          fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
          overflowX: 'auto', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {codeLines.join('\n')}
        </pre>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '4px 0' }}>
          {renderInline(line)}
        </p>
      );
    }
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|"[^"]+"|{[^}]+})/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <code key={key++} style={{ background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--pos)' }}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('"')) {
      parts.push(
        <span key={key++} style={{ color: 'var(--text-1)', fontWeight: 500 }}>{token}</span>
      );
    } else if (token.startsWith('{')) {
      parts.push(
        <code key={key++} style={{ background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>
          {token}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function ManagePrompts({ onBack }: ManagePromptsProps) {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

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
    setViewMode('formatted');
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

  const renderedMarkdown = useMemo(() => {
    if (viewMode !== 'formatted') return null;
    return renderMarkdown(editContent);
  }, [editContent, viewMode]);

  if (editing) {
    const label = FEATURES.find(f => f.key === editing)?.label ?? editing;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
        <IOSStatusBar />

        {/* Header */}
        <div style={{
          padding: '8px 16px 10px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border-1)', background: 'var(--bg-1)', flexShrink: 0,
        }}>
          <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.4, margin: 0, color: 'var(--text-1)', flex: 1 }}>
            {label}
          </h1>
          {saved && <span style={{ fontSize: 12, color: 'var(--pos)', fontFamily: 'var(--font-mono)' }}>Salvo ✓</span>}
        </div>

        {/* View mode toggle */}
        <div style={{
          display: 'flex', gap: 0, margin: '10px 16px 0',
          border: '1px solid var(--border-1)', borderRadius: 8, overflow: 'hidden', flexShrink: 0,
        }}>
          <button
            onClick={() => setViewMode('formatted')}
            style={{
              flex: 1, padding: '8px 0', border: 'none', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              background: viewMode === 'formatted' ? 'var(--text-1)' : 'var(--bg-1)',
              color: viewMode === 'formatted' ? 'var(--bg-0)' : 'var(--text-3)',
            }}
          >Formatado</button>
          <button
            onClick={() => setViewMode('raw')}
            style={{
              flex: 1, padding: '8px 0', border: 'none', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              background: viewMode === 'raw' ? 'var(--text-1)' : 'var(--bg-1)',
              color: viewMode === 'raw' ? 'var(--bg-0)' : 'var(--text-3)',
            }}
          >Código</button>
        </div>

        {/* Content area — full remaining space */}
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }} className="no-scrollbar">
          {viewMode === 'formatted' ? (
            <div style={{ padding: '4px 0' }}>
              {renderedMarkdown}
            </div>
          ) : (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{
                width: '100%', height: '100%', minHeight: 'calc(100vh - 250px)',
                boxSizing: 'border-box',
                background: 'var(--bg-1)', border: '1px solid var(--border-1)',
                borderRadius: 8, padding: 14, color: 'var(--text-1)',
                fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
                outline: 'none', resize: 'none',
              }}
            />
          )}
        </div>

        {/* Save button — fixed at bottom */}
        <div style={{ padding: '10px 16px 20px', flexShrink: 0, background: 'var(--bg-0)' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 10,
              border: 'none', background: saving ? 'var(--bg-3)' : 'var(--pos)',
              color: saving ? 'var(--text-4)' : '#0A0A0A',
              fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-sans)',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
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
              const content = prompts[f.key] ?? '';
              const lineCount = content.split('\n').length;
              const charCount = content.length;
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
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {content ? `${lineCount} linhas · ${charCount} chars` : 'Não configurado'}
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
