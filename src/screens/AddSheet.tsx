import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { FX } from '../data/constants';
import { NumericKeypad } from '../components/NumericKeypad';
import { aiExtractReceipt, getUploadUrl, uploadFileToS3, updateTransaction } from '../lib/api';
import type { Account, CurrencyCode } from '../types';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { BRL: 'R$', USD: '$', EUR: '€' };
const CURRENCY_FX: Record<CurrencyCode, number> = { BRL: 1, USD: FX, EUR: FX * 1.08 };
const PT_WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dateToFields(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return { date: dateStr, day: String(d.getDate()), wd: PT_WEEKDAYS[d.getDay()] };
}

const fieldStyle: React.CSSProperties = {
  padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
  borderRadius: 8, color: 'var(--text-1)', fontFamily: 'var(--font-sans)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', width: '100%',
};

const selectStyle: React.CSSProperties = {
  ...fieldStyle,
  appearance: 'none' as const, WebkitAppearance: 'none' as const,
  backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'><path fill=\'%2371717A\' d=\'M0 0h10L5 6z\'/></svg>")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

interface AddSheetSaveData {
  desc: string; cat: string; amount: number; currency: CurrencyCode;
  fxRate: number; account: string; date: string; day: string; wd: string;
}

interface AddSheetProps {
  open: boolean; onClose: () => void; onSave: (data: AddSheetSaveData) => Promise<string | undefined>; accounts: Account[];
}

export function AddSheet({ open, onClose, onSave, accounts }: AddSheetProps) {
  const [kind, setKind] = useState<'out' | 'in'>('out');
  const [amount, setAmount] = useState('0,00');
  const [cat, setCat] = useState('mercado');
  const [desc, setDesc] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // AI state
  const [files, setFiles] = useState<{ name: string; base64: string; mimeType: string }[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Receipt attachment state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const allCatKeys = Object.keys(CATS).filter(k => k !== 'salario' && k !== 'freelance');

  const reset = () => {
    setAmount('0,00'); setDesc(''); setCat('mercado'); setKind('out');
    setAccountId(accounts[0]?.id ?? ''); setCurrency(accounts[0]?.currency ?? 'BRL');
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setFiles([]); setAiText(''); setAiExpanded(false); setAiLoading(false); setAiDone(false);
    setReceiptFile(null); setReceiptUploading(false);
  };

  useEffect(() => { if (open) reset(); }, [open]);
  useEffect(() => { if (selectedAccount) setCurrency(selectedAccount.currency); }, [accountId]);

  const press = (k: string) => {
    setAmount(prev => {
      let s = prev.replace(',', '').replace(/^0+/, '') || '0';
      if (k === '⌫') s = s.slice(0, -1) || '0';
      else if (k === ',') return prev;
      else s = s + k;
      if (s.length < 3) s = s.padStart(3, '0');
      return s.slice(0, -2) + ',' + s.slice(-2);
    });
  };

  // File handling
  const readFileAsBase64 = (file: File): Promise<{ name: string; base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ name: file.name, base64, mimeType: file.type });
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
    if (!aiExpanded && newFiles.length > 0) setAiExpanded(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // AI auto-fill
  const handleAiFill = async () => {
    if (files.length === 0 && !aiText.trim()) return;
    setAiLoading(true);
    try {
      const result = await aiExtractReceipt(
        files.length > 0 ? files[0].base64 : '',
        files.length > 0 ? files[0].mimeType : 'text/plain',
      );

      // Auto-fill form from AI response
      if (result.desc) setDesc(result.desc as string);
      if (result.cat) {
        const catStr = result.cat as string;
        setCat(allCatKeys.includes(catStr) ? catStr : 'outros');
      }
      if (result.amount != null) {
        const amt = result.amount as number;
        setKind(amt >= 0 ? 'in' : 'out');
        const absAmt = Math.abs(amt);
        const formatted = absAmt.toFixed(2).replace('.', ',');
        setAmount(formatted);
      }
      if (result.currency) {
        const cur = result.currency as string;
        if (['BRL', 'USD', 'EUR'].includes(cur)) setCurrency(cur as CurrencyCode);
      }
      if (result.date) {
        const dateStr = result.date as string;
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) setSelectedDate(dateStr);
      }
      setAiDone(true);
    } catch {
      // AI failed — user fills manually
    } finally {
      setAiLoading(false);
    }
  };

  const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  const positive = kind === 'in';
  const valColor = positive ? 'var(--pos)' : 'var(--text-1)';
  const symbol = CURRENCY_SYMBOLS[currency];
  const fxRate = CURRENCY_FX[currency];
  const secondaryCurrency: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
  const secondaryAmount = currency === 'BRL' ? numAmount / FX : numAmount * fxRate;

  const handleSave = async (andAnother: boolean) => {
    if (numAmount <= 0) return;
    const signedAmount = positive ? numAmount : -numAmount;
    const finalCat = positive ? 'salario' : cat;
    const txId = await onSave({
      desc: desc || (positive ? 'Entrada' : CATS[finalCat]?.label ?? finalCat),
      cat: finalCat, amount: signedAmount, currency, fxRate,
      account: selectedAccount?.name ?? accounts[0]?.name ?? 'Cash',
      ...dateToFields(selectedDate),
    });
    // Upload receipt if attached
    if (txId && receiptFile) {
      setReceiptUploading(true);
      try {
        const { uploadUrl, key } = await getUploadUrl(txId, receiptFile.name, receiptFile.type);
        await uploadFileToS3(uploadUrl, receiptFile);
        const month = selectedDate.slice(0, 7);
        await updateTransaction(txId, month, { receiptKey: key, receiptName: receiptFile.name });
      } catch {
        // Receipt upload failed but transaction was saved
      } finally {
        setReceiptUploading(false);
      }
    }
    if (andAnother) reset(); else onClose();
  };

  if (!open) return null;

  const hasAiContent = files.length > 0 || aiText.trim().length > 0;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn .2s ease' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--bg-1)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border-1)', padding: '10px 16px 24px',
        maxHeight: '94vh', overflowY: 'auto',
        animation: 'sheetIn .25s cubic-bezier(0.32, 0.72, 0, 1)',
      }} className="no-scrollbar">
        <div style={{ width: 36, height: 4, background: 'var(--bg-4)', borderRadius: 2, margin: '0 auto 14px' }} />

        {/* AI Section */}
        <div style={{
          border: '1px solid var(--border-1)', borderRadius: 12,
          background: 'var(--bg-0)', marginBottom: 14, overflow: 'hidden',
        }}>
          {/* AI Header — always visible */}
          <button
            onClick={() => setAiExpanded(!aiExpanded)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 14px', background: 'none', border: 'none',
              color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            <Icons.alert size={16} color="var(--pos)" />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600 }}>
              Preencher com AI
            </span>
            {aiDone && <span style={{ fontSize: 11, color: 'var(--pos)', fontFamily: 'var(--font-mono)' }}>preenchido ✓</span>}
            <Icons.chevD size={14} color="var(--text-3)" />
          </button>

          {/* AI Body — collapsable */}
          {aiExpanded && (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Drop zone */}
              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--border-2)', borderRadius: 10,
                  padding: files.length > 0 ? '10px' : '20px',
                  textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
              >
                {files.length === 0 ? (
                  <>
                    <Icons.download size={20} color="var(--text-3)" />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
                      Arraste recibos, extratos ou fotos
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                      PDF, JPG, PNG
                    </span>
                  </>
                ) : (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {files.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 8,
                      }}>
                        <Icons.check size={14} color="var(--pos)" />
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.name}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                        }}>
                          <Icons.x size={14} color="var(--text-4)" />
                        </button>
                      </div>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                      + adicionar mais
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
                style={{ display: 'none' }}
              />

              {/* AI text instructions */}
              <textarea
                placeholder="Cole um texto de extrato, recibo ou instruções pra AI..."
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                rows={3}
                style={{
                  ...fieldStyle, resize: 'vertical', minHeight: 60,
                  fontFamily: 'var(--font-sans)', fontSize: 13,
                }}
              />

              {/* AI button */}
              <button
                onClick={handleAiFill}
                disabled={!hasAiContent || aiLoading}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
                  background: (!hasAiContent || aiLoading) ? 'var(--bg-3)' : 'var(--pos)',
                  color: (!hasAiContent || aiLoading) ? 'var(--text-4)' : '#0A0A0A',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
                  cursor: (!hasAiContent || aiLoading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {aiLoading ? (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Analisando...</span>
                ) : (
                  <>
                    <Icons.alert size={16} />
                    Preencher formulário
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Receipt attachment */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', marginBottom: 14,
          border: '1px solid var(--border-1)', borderRadius: 12,
          background: 'var(--bg-0)', cursor: 'pointer',
        }} onClick={() => receiptInputRef.current?.click()}>
          <Icons.download size={16} color={receiptFile ? 'var(--pos)' : 'var(--text-3)'} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: receiptFile ? 'var(--text-1)' : 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
            {receiptUploading ? 'Enviando...' : receiptFile ? receiptFile.name : 'Anexar comprovante'}
          </span>
          {receiptFile && (
            <button onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <Icons.x size={14} color="var(--text-4)" />
            </button>
          )}
        </div>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={e => { if (e.target.files?.[0]) setReceiptFile(e.target.files[0]); }}
          style={{ display: 'none' }}
        />

        {/* Amount display */}
        <div style={{ textAlign: 'center', padding: '10px 0 12px' }}>
          <div className="money" style={{
            fontSize: 44, fontWeight: 600, letterSpacing: -2, lineHeight: 1,
            color: valColor, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-3)' }}>{symbol}</span>
            <span>{amount}</span>
            <span style={{ display: 'inline-block', width: 2, height: 28, background: valColor, marginLeft: 2, animation: 'blink 1s infinite' }} />
          </div>
          <div className="money" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            ≈ {CURRENCY_SYMBOLS[secondaryCurrency]} {secondaryAmount.toFixed(2)}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 0 8px' }}>
          <input type="text" placeholder="Descrição (opcional)" value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ ...fieldStyle }} />

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Type dropdown */}
            <select value={kind} onChange={e => setKind(e.target.value as 'out' | 'in')} style={{ ...selectStyle, flex: 0.5 }}>
              <option value="out">Saída</option>
              <option value="in">Entrada</option>
            </select>
            {/* Category dropdown */}
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
              {kind === 'in' ? (
                <>
                  <option value="salario">Salário</option>
                  <option value="freelance">Freelance</option>
                  {allCatKeys.map(k => <option key={k} value={k}>{CATS[k]?.label ?? k}</option>)}
                </>
              ) : (
                allCatKeys.map(k => <option key={k} value={k}>{CATS[k]?.label ?? k}</option>)
              )}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={selectedDate} max={new Date().toISOString().slice(0, 10)}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ ...fieldStyle, flex: 1, colorScheme: 'dark' }} />
            <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}
              style={{ ...selectStyle, flex: 0.6 }}>
              <option value="BRL">R$ BRL</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>

          {accounts.length > 0 && (
            <select value={accountId} onChange={e => setAccountId(e.target.value)} style={selectStyle}>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
              ))}
            </select>
          )}
        </div>

        {/* Keypad */}
        <div style={{ padding: '2px 0' }}>
          <NumericKeypad onPress={press} />
        </div>

        {/* Save */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => handleSave(true)} disabled={numAmount <= 0} style={{
            flex: 1, padding: '14px 0', borderRadius: 8,
            background: 'transparent', border: '1px solid var(--border-2)',
            color: numAmount <= 0 ? 'var(--text-4)' : 'var(--text-2)',
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
            cursor: numAmount <= 0 ? 'not-allowed' : 'pointer',
          }}>+ Salvar e add outra</button>
          <button onClick={() => handleSave(false)} disabled={numAmount <= 0} style={{
            flex: 1.4, padding: '14px 0', borderRadius: 8,
            background: numAmount <= 0 ? 'var(--bg-3)' : (positive ? 'var(--pos)' : 'var(--text-1)'),
            color: numAmount <= 0 ? 'var(--text-4)' : (positive ? '#0A0A0A' : 'var(--bg-0)'),
            border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
            cursor: numAmount <= 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icons.check size={16} stroke={2.4} color={numAmount <= 0 ? 'var(--text-4)' : (positive ? '#0A0A0A' : 'var(--bg-0)')} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
