import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listPrompts, getPrompt, updatePrompt } from '../lib/api';
import './ManagePrompts.scss';

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
        <h2 key={i} className="manage-prompts__md-h2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="manage-prompts__md-h3">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="manage-prompts__md-h1">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={i} className="manage-prompts__md-bullet">
          <span className="manage-prompts__md-bullet-dot" />
          <span className="manage-prompts__md-bullet-text">{renderInline(line.slice(2))}</span>
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
        <pre key={i} className="manage-prompts__md-code">
          {codeLines.join('\n')}
        </pre>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="manage-prompts__md-spacer" />);
    } else {
      elements.push(
        <p key={i} className="manage-prompts__md-p">
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
        <code key={key++} className="manage-prompts__md-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('"')) {
      parts.push(
        <span key={key++} className="manage-prompts__md-inline-quote">{token}</span>
      );
    } else if (token.startsWith('{')) {
      parts.push(
        <code key={key++} className="manage-prompts__md-inline-template">
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
      <div className="manage-prompts__editor">
        <IOSStatusBar />

        {/* Header */}
        <div className="manage-prompts__editor-header">
          <button onClick={() => setEditing(null)} className="manage-prompts__back-btn">
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
          <h1 className="manage-prompts__editor-title">
            {label}
          </h1>
          {saved && <span className="manage-prompts__saved-indicator">Salvo ✓</span>}
        </div>

        {/* View mode toggle */}
        <div className="manage-prompts__view-toggle">
          <button
            onClick={() => setViewMode('formatted')}
            className={`manage-prompts__view-toggle-btn ${viewMode === 'formatted' ? 'manage-prompts__view-toggle-btn--active' : 'manage-prompts__view-toggle-btn--inactive'}`}
          >Formatado</button>
          <button
            onClick={() => setViewMode('raw')}
            className={`manage-prompts__view-toggle-btn ${viewMode === 'raw' ? 'manage-prompts__view-toggle-btn--active' : 'manage-prompts__view-toggle-btn--inactive'}`}
          >Código</button>
        </div>

        {/* Content area */}
        <div className="manage-prompts__editor-content no-scrollbar">
          {viewMode === 'formatted' ? (
            <div className="manage-prompts__formatted">
              {renderedMarkdown}
            </div>
          ) : (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="manage-prompts__textarea"
            />
          )}
        </div>

        {/* Save button */}
        <div className="manage-prompts__editor-footer">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`manage-prompts__save-btn ${saving ? 'manage-prompts__save-btn--disabled' : 'manage-prompts__save-btn--active'}`}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-prompts">
      <div className="manage-prompts__status-bar">
        <IOSStatusBar />
      </div>
      <div className="manage-prompts__scroll no-scrollbar">
        <div className="manage-prompts__header">
          {onBack && (
            <button onClick={onBack} className="manage-prompts__back-btn">
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 className="manage-prompts__title">
            Prompts de AI
          </h1>
        </div>

        {loading ? (
          <div className="manage-prompts__loading">
            Carregando...
          </div>
        ) : (
          <div className="manage-prompts__list">
            {FEATURES.map((f) => {
              const content = prompts[f.key] ?? '';
              const lineCount = content.split('\n').length;
              const charCount = content.length;
              return (
                <div
                  key={f.key}
                  onClick={() => openEditor(f.key)}
                  className="manage-prompts__item"
                >
                  <div className="manage-prompts__item-info">
                    <div className="manage-prompts__item-label">{f.label}</div>
                    <div className="manage-prompts__item-meta">
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
