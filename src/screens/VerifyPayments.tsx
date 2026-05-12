import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const isTextFile = (f: File) =>
    f.type === 'text/csv' ||
    f.name.endsWith('.csv') ||
    f.name.endsWith('.tsv');

  const isSpreadsheet = (f: File) =>
    f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    f.name.endsWith('.xlsx') ||
    f.name.endsWith('.xls');

  const isSupported = (f: File) =>
    f.type.startsWith('image/') ||
    f.type === 'application/pdf' ||
    isTextFile(f) ||
    isSpreadsheet(f);

  const readXlsxAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const wb = XLSX.read(reader.result, { type: 'array' });
        const lines: string[] = [];
        for (const name of wb.SheetNames) {
          lines.push(`[${name}]`);
          lines.push(XLSX.utils.sheet_to_csv(wb.Sheets[name]));
        }
        resolve(lines.join('\n'));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFiles = async (fileList: FileList) => {
    const arr = Array.from(fileList).filter(isSupported);
    for (const f of arr) {
      if (isTextFile(f)) {
        const text = await readFileAsText(f);
        setAiText(prev => prev ? `${prev}\n\n--- ${f.name} ---\n${text}` : `--- ${f.name} ---\n${text}`);
      } else if (isSpreadsheet(f)) {
        const text = await readXlsxAsText(f);
        setAiText(prev => prev ? `${prev}\n\n--- ${f.name} ---\n${text}` : `--- ${f.name} ---\n${text}`);
      } else {
        const b64 = await readFileAsBase64(f);
        setFiles(prev => [...prev, b64]);
      }
    }
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
                  <span className="verify-payments__dropzone-formats">PDF, JPG, PNG, CSV, XLSX</span>
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
              accept="image/*,application/pdf,.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
