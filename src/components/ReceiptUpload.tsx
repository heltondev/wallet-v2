import React, { useState, useRef } from 'react';
import { Icons } from './icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount } from '../utils/formatters';
import { aiExtractReceipt } from '../utils/api';
import type { Transaction, CurrencyCode } from '../types';

type Stage = 'upload' | 'loading' | 'review';

interface ReceiptUploadProps {
  onExtracted: (data: Partial<Transaction>) => void;
  onClose: () => void;
}

export function ReceiptUpload({ onExtracted, onClose }: ReceiptUploadProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Partial<Transaction> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      if (file.type.startsWith('image/')) {
        setPreview(base64);
      } else {
        setPreview(null);
      }

      setStage('loading');

      try {
        const data = await aiExtractReceipt(base64, file.type);
        setExtracted(data);
        setStage('review');
      } catch {
        setStage('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const retry = () => {
    setStage('upload');
    setPreview(null);
    setExtracted(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 95,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

      {/* Modal */}
      <div style={{
        position: 'absolute', left: 16, right: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'var(--bg-1)', borderRadius: 'var(--r-card, 16px)',
        border: '1px solid var(--border-1)', padding: 20,
        animation: 'fadeIn .2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 16, color: 'var(--text-1)' }}>
            Escanear documento
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          }}>
            <Icons.x size={20} color="var(--text-3)" />
          </button>
        </div>

        {/* Upload stage */}
        {stage === 'upload' && (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              height: 200, borderRadius: 'var(--r-card, 16px)',
              border: '2px dashed var(--border-2)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <Icons.download size={28} color="var(--text-3)" />
              <Icons.search size={28} color="var(--text-3)" />
            </div>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-3)',
              textAlign: 'center', padding: '0 20px',
            }}>
              Tire uma foto ou envie um arquivo
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-4)',
            }}>
              JPG, PNG ou PDF
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Loading stage */}
        {stage === 'loading' && (
          <div style={{
            height: 200, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            {preview && (
              <img src={preview} alt="preview" style={{
                width: 80, height: 80, objectFit: 'cover', borderRadius: 12, opacity: 0.6,
              }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              border: '3px solid var(--border-2)',
              borderTopColor: 'var(--pos)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-3)',
            }}>
              Analisando documento...
            </span>
          </div>
        )}

        {/* Review stage */}
        {stage === 'review' && extracted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {preview && (
              <img src={preview} alt="preview" style={{
                width: '100%', height: 120, objectFit: 'cover', borderRadius: 12,
              }} />
            )}

            <div style={{
              background: 'var(--bg-0)', borderRadius: 12, padding: 16,
              border: '1px solid var(--border-1)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)' }}>Descrição</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>
                  {extracted.desc}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border-1)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)' }}>Valor</span>
                <span className="money" style={{
                  fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600,
                  color: (extracted.amount ?? 0) < 0 ? 'var(--neg)' : 'var(--pos)',
                }}>
                  {fmtAmount(extracted.amount ?? 0, (extracted.currency ?? 'BRL') as CurrencyCode)}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border-1)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)' }}>Categoria</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-1)' }}>
                  {extracted.cat && CATS[extracted.cat] ? CATS[extracted.cat].label : extracted.cat}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={retry} style={{
                flex: 1, padding: '12px 0', borderRadius: 'var(--r-input, 12px)',
                background: 'transparent', border: '1px solid var(--border-2)',
                color: 'var(--text-2)', fontFamily: 'var(--font-sans)', fontWeight: 500,
                fontSize: 13, cursor: 'pointer',
              }}>
                Tentar novamente
              </button>
              <button onClick={() => onExtracted(extracted)} style={{
                flex: 1.4, padding: '12px 0', borderRadius: 'var(--r-input, 12px)',
                background: 'var(--pos)', border: 'none',
                color: 'var(--bg-0)', fontFamily: 'var(--font-sans)', fontWeight: 600,
                fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icons.check size={16} color="var(--bg-0)" stroke={2.4} />
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
