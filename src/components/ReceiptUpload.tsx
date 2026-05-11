import React, { useState, useRef } from 'react';
import { Icons } from './icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount } from '../utils/formatters';
import { aiExtractReceipt } from '../lib/api';
import type { Transaction, CurrencyCode } from '../types';
import './ReceiptUpload.scss';

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
        const rawBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
        const result = await aiExtractReceipt(
          [{ base64: rawBase64, mimeType: file.type }],
          '',
        );
        const tx = result.transactions[0];
        if (tx) {
          setExtracted({
            desc: tx.desc,
            amount: tx.amount,
            currency: tx.currency,
            cat: tx.cat,
            date: tx.date,
          });
        }
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
    <div className="receipt-upload">
      {/* Backdrop */}
      <div onClick={onClose} className="receipt-upload__backdrop" />

      {/* Modal */}
      <div className="receipt-upload__modal">
        {/* Header */}
        <div className="receipt-upload__header">
          <span className="receipt-upload__title">
            Escanear documento
          </span>
          <button onClick={onClose} className="receipt-upload__close-btn">
            <Icons.x size={20} color="var(--text-3)" />
          </button>
        </div>

        {/* Upload stage */}
        {stage === 'upload' && (
          <div
            onClick={() => fileRef.current?.click()}
            className="receipt-upload__dropzone"
          >
            <div className="receipt-upload__dropzone-icons">
              <Icons.download size={28} color="var(--text-3)" />
              <Icons.search size={28} color="var(--text-3)" />
            </div>
            <span className="receipt-upload__dropzone-text">
              Tire uma foto ou envie um arquivo
            </span>
            <span className="receipt-upload__dropzone-hint">
              JPG, PNG ou PDF
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={onFileChange}
              className="receipt-upload__file-input"
            />
          </div>
        )}

        {/* Loading stage */}
        {stage === 'loading' && (
          <div className="receipt-upload__loading">
            {preview && (
              <img src={preview} alt="preview" className="receipt-upload__loading-preview" />
            )}
            <div className="receipt-upload__spinner" />
            <span className="receipt-upload__loading-text">
              Analisando documento... (pode levar até 2 minutos)
            </span>
          </div>
        )}

        {/* Review stage */}
        {stage === 'review' && extracted && (
          <div className="receipt-upload__review">
            {preview && (
              <img src={preview} alt="preview" className="receipt-upload__review-preview" />
            )}

            <div className="receipt-upload__review-card">
              <div className="receipt-upload__review-row">
                <span className="receipt-upload__review-label">Descrição</span>
                <span className="receipt-upload__review-value">
                  {extracted.desc}
                </span>
              </div>
              <div className="receipt-upload__divider" />
              <div className="receipt-upload__review-row">
                <span className="receipt-upload__review-label">Valor</span>
                <span className={`money receipt-upload__review-amount ${(extracted.amount ?? 0) < 0 ? 'receipt-upload__review-amount--negative' : 'receipt-upload__review-amount--positive'}`}>
                  {fmtAmount(extracted.amount ?? 0, (extracted.currency ?? 'BRL') as CurrencyCode)}
                </span>
              </div>
              <div className="receipt-upload__divider" />
              <div className="receipt-upload__review-row">
                <span className="receipt-upload__review-label">Categoria</span>
                <span className="receipt-upload__review-value">
                  {extracted.cat && CATS[extracted.cat] ? CATS[extracted.cat].label : extracted.cat}
                </span>
              </div>
            </div>

            <div className="receipt-upload__actions">
              <button onClick={retry} className="receipt-upload__retry-btn">
                Tentar novamente
              </button>
              <button onClick={() => onExtracted(extracted)} className="receipt-upload__confirm-btn">
                <Icons.check size={16} color="var(--bg-0)" stroke={2.4} />
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
