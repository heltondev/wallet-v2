import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { FX } from '../data/constants';
import { NumericKeypad } from '../components/NumericKeypad';
import { aiExtractReceipt, getUploadUrl, uploadFileToS3, updateTransaction } from '../lib/api';
import type { Account, CurrencyCode, ExtractedTransaction, AiExtractResult } from '../types';

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

  // Review mode state
  const [reviewMode, setReviewMode] = useState(false);
  const [extractResult, setExtractResult] = useState<AiExtractResult | null>(null);
  const [checkedTx, setCheckedTx] = useState<boolean[]>([]);
  const [txCategories, setTxCategories] = useState<string[]>([]);
  const [savingReview, setSavingReview] = useState(false);

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
    setReviewMode(false); setExtractResult(null); setCheckedTx([]); setTxCategories([]); setSavingReview(false);
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
      const payload = files.map(f => ({ base64: f.base64, mimeType: f.mimeType }));
      const result = await aiExtractReceipt(payload, aiText);

      if (result.transactions.length === 1) {
        // Single transaction — auto-fill the form directly
        const tx = result.transactions[0];
        if (tx.desc) setDesc(tx.desc);
        if (tx.cat) setCat(allCatKeys.includes(tx.cat) ? tx.cat : 'outros');
        if (tx.amount != null) {
          setKind(tx.amount >= 0 ? 'in' : 'out');
          setAmount(Math.abs(tx.amount).toFixed(2).replace('.', ','));
        }
        if (tx.currency && ['BRL', 'USD', 'EUR'].includes(tx.currency)) {
          setCurrency(tx.currency);
        }
        if (tx.date?.match(/^\d{4}-\d{2}-\d{2}$/)) setSelectedDate(tx.date);
        if (tx.account) {
          const matched = accounts.find(a => a.name.toLowerCase() === tx.account?.toLowerCase());
          if (matched) setAccountId(matched.id);
        }
        setAiDone(true);
      } else if (result.transactions.length > 1) {
        // Multiple transactions — enter review mode
        setExtractResult(result);
        setCheckedTx(result.transactions.map(() => true));
        setTxCategories(result.transactions.map(tx => tx.cat));
        setReviewMode(true);
        setAiDone(true);
      }
    } catch {
      // AI failed — user fills manually
    } finally {
      setAiLoading(false);
    }
  };

  const toggleTx = (idx: number) => {
    setCheckedTx(prev => prev.map((v, i) => i === idx ? !v : v));
  };

  const changeTxCategory = (idx: number, newCat: string) => {
    setTxCategories(prev => prev.map((v, i) => i === idx ? newCat : v));
  };

  const handleApproveReview = async () => {
    if (!extractResult) return;
    setSavingReview(true);
    try {
      for (let i = 0; i < extractResult.transactions.length; i++) {
        if (!checkedTx[i]) continue;
        const tx = extractResult.transactions[i];
        const finalCat = txCategories[i] || tx.cat;
        const positive = tx.amount >= 0;
        const matchedAccount = tx.account
          ? accounts.find(a => a.name.toLowerCase() === tx.account?.toLowerCase())
          : null;
        const txCurrency = (['BRL', 'USD', 'EUR'].includes(tx.currency) ? tx.currency : 'BRL') as CurrencyCode;

        await onSave({
          desc: tx.desc || (positive ? 'Entrada' : CATS[finalCat]?.label ?? finalCat),
          cat: positive ? 'salario' : finalCat,
          amount: tx.amount,
          currency: txCurrency,
          fxRate: CURRENCY_FX[txCurrency],
          account: matchedAccount?.name ?? selectedAccount?.name ?? accounts[0]?.name ?? 'Cash',
          ...dateToFields(tx.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? tx.date : new Date().toISOString().slice(0, 10)),
        });
      }
    } finally {
      setSavingReview(false);
    }
    onClose();
  };

  const checkedCount = checkedTx.filter(Boolean).length;

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

        {/* Review Mode */}
        {reviewMode && extractResult && (
          <ReviewPanel
            result={extractResult}
            checkedTx={checkedTx}
            txCategories={txCategories}
            onToggle={toggleTx}
            onChangeCategory={changeTxCategory}
            onApprove={handleApproveReview}
            onCancel={() => { setReviewMode(false); setExtractResult(null); }}
            checkedCount={checkedCount}
            saving={savingReview}
            accounts={accounts}
            allCatKeys={allCatKeys}
          />
        )}

        {/* AI Section — hidden during review */}
        {!reviewMode && (
        <>
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
        </>
        )}
      </div>
    </div>
  );
}

/* ─── Review Panel Component ─── */

const REVIEW_CURRENCY_SYMBOLS: Record<string, string> = { BRL: 'R$', USD: '$', EUR: '€' };

interface ReviewPanelProps {
  result: AiExtractResult;
  checkedTx: boolean[];
  txCategories: string[];
  onToggle: (idx: number) => void;
  onChangeCategory: (idx: number, cat: string) => void;
  onApprove: () => void;
  onCancel: () => void;
  checkedCount: number;
  saving: boolean;
  accounts: Account[];
  allCatKeys: string[];
}

function ReviewPanel({
  result, checkedTx, txCategories, onToggle, onChangeCategory,
  onApprove, onCancel, checkedCount, saving, allCatKeys,
}: ReviewPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
            {result.transactions.length} transações encontradas
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {result.document.type} — {result.document.language}
          </div>
        </div>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-sans)',
        }}>
          Voltar
        </button>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div style={{
          padding: '8px 12px', background: 'rgba(250, 204, 21, 0.08)',
          border: '1px solid rgba(250, 204, 21, 0.2)', borderRadius: 8,
        }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Transaction list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {result.transactions.map((tx, idx) => (
          <ReviewRow
            key={idx}
            tx={tx}
            checked={checkedTx[idx]}
            category={txCategories[idx]}
            onToggle={() => onToggle(idx)}
            onChangeCategory={(cat) => onChangeCategory(idx, cat)}
            allCatKeys={allCatKeys}
          />
        ))}
      </div>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div style={{ padding: '8px 12px', background: 'var(--bg-0)', borderRadius: 8, border: '1px solid var(--border-1)' }}>
          {result.suggestions.map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '14px 0', borderRadius: 8,
          background: 'transparent', border: '1px solid var(--border-2)',
          color: 'var(--text-2)', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
          cursor: 'pointer',
        }}>
          Cancelar
        </button>
        <button onClick={onApprove} disabled={checkedCount === 0 || saving} style={{
          flex: 1.4, padding: '14px 0', borderRadius: 8,
          background: (checkedCount === 0 || saving) ? 'var(--bg-3)' : 'var(--pos)',
          color: (checkedCount === 0 || saving) ? 'var(--text-4)' : '#0A0A0A',
          border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
          cursor: (checkedCount === 0 || saving) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {saving ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Salvando...</span>
          ) : (
            <>
              <Icons.check size={16} stroke={2.4} color={(checkedCount === 0) ? 'var(--text-4)' : '#0A0A0A'} />
              Aprovar {checkedCount} transaç{checkedCount === 1 ? 'ão' : 'ões'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Single Review Row ─── */

interface ReviewRowProps {
  tx: ExtractedTransaction;
  checked: boolean;
  category: string;
  onToggle: () => void;
  onChangeCategory: (cat: string) => void;
  allCatKeys: string[];
}

function ReviewRow({ tx, checked, category, onToggle, onChangeCategory, allCatKeys }: ReviewRowProps) {
  const isExpense = tx.amount < 0;
  const amtColor = isExpense ? 'var(--text-1)' : 'var(--pos)';
  const sym = REVIEW_CURRENCY_SYMBOLS[tx.currency] ?? '$';
  const absAmt = Math.abs(tx.amount).toFixed(2).replace('.', ',');
  const lowConfidence = tx.catConfidence === 'low' || tx.catConfidence === 'medium';
  const catMeta = CATS[category];

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px', background: checked ? 'var(--bg-0)' : 'var(--bg-2)',
        border: `1px solid ${checked ? 'var(--border-1)' : 'var(--border-0)'}`,
        borderRadius: 10, cursor: 'pointer',
        opacity: checked ? 1 : 0.5,
        transition: 'opacity 0.15s, background 0.15s',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, borderRadius: 6, marginTop: 2, flexShrink: 0,
        border: checked ? 'none' : '1.5px solid var(--border-2)',
        background: checked ? 'var(--pos)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Icons.check size={12} stroke={2.5} color="#0A0A0A" />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-sans)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {tx.desc}
          </span>
          <span className="money" style={{ fontSize: 14, fontWeight: 600, color: amtColor, flexShrink: 0 }}>
            {sym} {absAmt}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {/* Date */}
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {tx.date}
          </span>

          {/* Account */}
          {tx.account && (
            <span style={{
              fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
              background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 4,
            }}>
              {tx.account}
            </span>
          )}

          {/* Category badge */}
          {lowConfidence ? (
            <select
              value={category}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); onChangeCategory(e.target.value); }}
              style={{
                fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600,
                background: 'rgba(250, 204, 21, 0.12)', color: 'var(--text-2)',
                border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 4,
                padding: '1px 4px', cursor: 'pointer',
                appearance: 'none' as const, WebkitAppearance: 'none' as const,
              }}
            >
              <option value={tx.cat}>{CATS[tx.cat]?.label ?? tx.cat}</option>
              {tx.catAlternatives
                .filter(a => a !== tx.cat)
                .map(alt => (
                  <option key={alt} value={alt}>{CATS[alt]?.label ?? alt}</option>
                ))}
              {allCatKeys
                .filter(k => k !== tx.cat && !tx.catAlternatives.includes(k))
                .map(k => (
                  <option key={k} value={k}>{CATS[k]?.label ?? k}</option>
                ))}
            </select>
          ) : (
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600,
              background: catMeta?.color ? `${catMeta.color}22` : 'var(--bg-3)',
              color: catMeta?.color ?? 'var(--text-2)',
              padding: '1px 6px', borderRadius: 4,
            }}>
              {catMeta?.label ?? category}
            </span>
          )}

          {/* Confidence indicator for low/medium */}
          {lowConfidence && (
            <span style={{ fontSize: 9, color: 'rgba(250, 204, 21, 0.7)', fontFamily: 'var(--font-mono)' }}>
              {tx.catConfidence}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {tx.notes && (
          <div style={{
            fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-sans)',
            marginTop: 4, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {tx.notes}
          </div>
        )}

        {/* Payment method */}
        {tx.payment?.method && (
          <span style={{
            fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)',
            marginTop: 2, display: 'inline-block',
          }}>
            {tx.payment.method}{tx.payment.cardLast4 ? ` ****${tx.payment.cardLast4}` : ''}
            {tx.payment.installments ? ` ${tx.payment.installmentNumber}/${tx.payment.installments}x` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
