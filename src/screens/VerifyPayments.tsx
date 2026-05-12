import React, { useState, useRef } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { fmtAmount } from '../utils/formatters';
import { aiVerifyPayments } from '../lib/api';
import type { AiVerifyPaymentsMatch, AiVerifyPaymentsResult, CurrencyCode } from '../types';
import './VerifyPayments.scss';

interface VerifyPaymentsProps {
  onBack: () => void;
  onConfirm: (matches: AiVerifyPaymentsMatch[]) => void;
  currency: CurrencyCode;
}

export function VerifyPayments({ onBack, onConfirm, currency }: VerifyPaymentsProps) {
  const [files, setFiles] = useState<{ name: string; base64: string; mimeType: string }[]>([]);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiVerifyPaymentsResult | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const readFileAsBase64 = (file: File): Promise<{ name: string; base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(',')[1];
        resolve({ name: file.name, base64: b64, mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles = await Promise.all(
      Array.from(fileList)
        .filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
        .map(readFileAsBase64)
    );
    setFiles(prev => [...prev, ...newFiles]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleAnalyze = async () => {
    if (files.length === 0 && !aiText.trim()) return;
    setLoading(true);
    try {
      const payload = files.map(f => ({ base64: f.base64, mimeType: f.mimeType }));
      const res = await aiVerifyPayments(payload, aiText);
      setResult(res);
      setChecked(res.matches.map(() => true));
    } catch {
      // AI failed
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (!result) return;
    setSaving(true);
    const selected = result.matches.filter((_, i) => checked[i]);
    onConfirm(selected);
  };

  const hasContent = files.length > 0 || aiText.trim().length > 0;
  const checkedCount = checked.filter(Boolean).length;

  return (
    <div className="verify-payments">
      <div className="verify-payments__status-bar"><IOSStatusBar /></div>
      <div className="verify-payments__scroll no-scrollbar">
        <div className="verify-payments__header">
          <button onClick={onBack} className="verify-payments__back-btn">
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
          <h1 className="verify-payments__title">Verificar pagamentos</h1>
        </div>

        {!result && (
          <>
            <div className="verify-payments__intro">
              Envie um extrato bancario ou comprovante. A AI vai identificar quais contas foram pagas.
            </div>

            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`verify-payments__dropzone ${files.length > 0 ? 'verify-payments__dropzone--has-files' : ''}`}
            >
              {files.length === 0 ? (
                <>
                  <Icons.download size={24} color="var(--text-3)" />
                  <span className="verify-payments__dropzone-label">Arraste extratos ou comprovantes</span>
                  <span className="verify-payments__dropzone-formats">PDF, JPG, PNG</span>
                </>
              ) : (
                <div className="verify-payments__file-list">
                  {files.map((f, i) => (
                    <div key={i} className="verify-payments__file-item">
                      <Icons.check size={14} color="var(--pos)" />
                      <span className="verify-payments__file-name">{f.name}</span>
                      <button onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter((_, j) => j !== i)); }} className="verify-payments__file-remove">
                        <Icons.x size={14} color="var(--text-4)" />
                      </button>
                    </div>
                  ))}
                  <span className="verify-payments__file-add">+ adicionar mais</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
              className="verify-payments__hidden-input"
            />

            <textarea
              placeholder="Cole texto de extrato ou comprovante..."
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              rows={3}
              className="verify-payments__textarea"
            />

            <button
              onClick={handleAnalyze}
              disabled={!hasContent || loading}
              className={`verify-payments__analyze-btn ${(!hasContent || loading) ? 'verify-payments__analyze-btn--disabled' : ''}`}
            >
              {loading ? (
                <span>Analisando... (pode levar ate 2 minutos)</span>
              ) : (
                <>
                  <Icons.alert size={16} />
                  Verificar pagamentos
                </>
              )}
            </button>
          </>
        )}

        {result && (
          <>
            <div className="verify-payments__result-header">
              {result.matches.length > 0 ? (
                <span className="verify-payments__result-title">
                  Encontramos {result.matches.length} pagamento{result.matches.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="verify-payments__result-title">Nenhum pagamento identificado</span>
              )}
            </div>

            {result.warnings.length > 0 && (
              <div className="verify-payments__warnings">
                {result.warnings.map((w, i) => (
                  <div key={i} className="verify-payments__warning">{w}</div>
                ))}
              </div>
            )}

            <div className="verify-payments__match-list">
              {result.matches.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => setChecked(prev => prev.map((v, i) => i === idx ? !v : v))}
                  className={`verify-payments__match-item ${checked[idx] ? 'verify-payments__match-item--checked' : ''}`}
                >
                  <div className={`verify-payments__match-checkbox ${checked[idx] ? 'verify-payments__match-checkbox--checked' : ''}`}>
                    {checked[idx] && <Icons.check size={12} stroke={2.5} color="#0A0A0A" />}
                  </div>
                  <div className="verify-payments__match-info">
                    <span className="verify-payments__match-desc">{m.recurringDesc}</span>
                    <span className="verify-payments__match-meta">
                      {m.paidDate} · {m.matchReason}
                    </span>
                  </div>
                  <span className="verify-payments__match-amount">
                    {fmtAmount(Math.abs(m.amount), currency, { decimals: 2 })}
                  </span>
                  <span className={`verify-payments__match-confidence verify-payments__match-confidence--${m.confidence}`}>
                    {m.confidence}
                  </span>
                </div>
              ))}
            </div>

            {result.unmatched.length > 0 && (
              <div className="verify-payments__unmatched">
                <div className="verify-payments__unmatched-title">Nao identificados</div>
                {result.unmatched.map((u, i) => (
                  <div key={i} className="verify-payments__unmatched-item">{u}</div>
                ))}
              </div>
            )}

            <div className="verify-payments__actions">
              <button onClick={() => { setResult(null); setFiles([]); setAiText(''); }} className="verify-payments__cancel-btn">
                Voltar
              </button>
              <button
                onClick={handleApprove}
                disabled={checkedCount === 0 || saving}
                className={`verify-payments__approve-btn ${checkedCount > 0 && !saving ? '' : 'verify-payments__approve-btn--disabled'}`}
              >
                {saving ? 'Salvando...' : `Confirmar ${checkedCount} pagamento${checkedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
