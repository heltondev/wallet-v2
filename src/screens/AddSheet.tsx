import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { FX } from '../data/constants';
import { NumericKeypad } from '../components/NumericKeypad';
import { aiExtractReceipt, aiLearnCategory, getUploadUrl, uploadFileToS3, updateTransaction } from '../lib/api';
import type { Account, Workspace, CurrencyCode, ExtractedTransaction, AiExtractResult } from '../types';
import './AddSheet.scss';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { BRL: 'R$', USD: '$', EUR: '€' };
const CURRENCY_FX: Record<CurrencyCode, number> = { BRL: 1, USD: FX, EUR: FX * 1.08 };
const PT_WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dateToFields(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return { date: dateStr, day: String(d.getDate()), wd: PT_WEEKDAYS[d.getDay()] };
}

interface AddSheetSaveData {
  desc: string; cat: string; amount: number; currency: CurrencyCode;
  fxRate: number; account: string; date: string; day: string; wd: string;
  workspaceId?: string | null;
}

interface AddSheetProps {
  open: boolean; onClose: () => void; onSave: (data: AddSheetSaveData) => Promise<string | undefined>; accounts: Account[];
  activeWorkspace?: string | null; workspaces?: Workspace[];
}

export function AddSheet({ open, onClose, onSave, accounts, activeWorkspace = null, workspaces = [] }: AddSheetProps) {
  const [kind, setKind] = useState<'out' | 'in'>('out');
  const [amount, setAmount] = useState('0,00');
  const [cat, setCat] = useState('mercado');
  const [desc, setDesc] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workspaceId, setWorkspaceId] = useState<string>(activeWorkspace ?? '');

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

  // AI-suggested category tracking (for learning)
  const [aiSuggestedCat, setAiSuggestedCat] = useState<string | null>(null);
  const [aiSuggestedDesc, setAiSuggestedDesc] = useState<string | null>(null);

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
    setAiSuggestedCat(null); setAiSuggestedDesc(null); setWorkspaceId(activeWorkspace ?? '');
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
        const tx = result.transactions[0];
        if (tx.desc) { setDesc(tx.desc); setAiSuggestedDesc(tx.desc); }
        if (tx.cat) {
          const resolvedCat = allCatKeys.includes(tx.cat) ? tx.cat : 'outros';
          setCat(resolvedCat);
          setAiSuggestedCat(resolvedCat);
        }
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
          workspaceId: workspaceId || null,
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
      workspaceId: workspaceId || null,
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
  const saveDisabled = numAmount <= 0;
  const aiBtnDisabled = !hasAiContent || aiLoading;

  return (
    <div className="add-sheet">
      <div onClick={onClose} className="add-sheet__backdrop" />
      <div className="add-sheet__panel no-scrollbar">
        <div className="add-sheet__handle" />

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
        <div className="add-sheet__ai-section">
          {/* AI Header — always visible */}
          <button
            onClick={() => setAiExpanded(!aiExpanded)}
            className="add-sheet__ai-header"
          >
            <Icons.alert size={16} color="var(--pos)" />
            <span className="add-sheet__ai-header-label">
              Preencher com AI
            </span>
            {aiDone && <span className="add-sheet__ai-done">preenchido ✓</span>}
            <Icons.chevD size={14} color="var(--text-3)" />
          </button>

          {/* AI Body — collapsable */}
          {aiExpanded && (
            <div className="add-sheet__ai-body">

              {/* Drop zone */}
              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`add-sheet__dropzone ${files.length > 0 ? 'add-sheet__dropzone--has-files' : 'add-sheet__dropzone--empty'}`}
              >
                {files.length === 0 ? (
                  <>
                    <Icons.download size={20} color="var(--text-3)" />
                    <span className="add-sheet__dropzone-label">
                      Arraste recibos, extratos ou fotos
                    </span>
                    <span className="add-sheet__dropzone-formats">
                      PDF, JPG, PNG
                    </span>
                  </>
                ) : (
                  <div className="add-sheet__file-list">
                    {files.map((f, i) => (
                      <div key={i} className="add-sheet__file-item">
                        <Icons.check size={14} color="var(--pos)" />
                        <span className="add-sheet__file-name">
                          {f.name}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="add-sheet__file-remove">
                          <Icons.x size={14} color="var(--text-4)" />
                        </button>
                      </div>
                    ))}
                    <span className="add-sheet__file-add-more">
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
                className="add-sheet__hidden-input"
              />

              {/* AI text instructions */}
              <textarea
                placeholder="Cole um texto de extrato, recibo ou instruções pra AI..."
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                rows={3}
                className="add-sheet__ai-textarea"
              />

              {/* AI button */}
              <button
                onClick={handleAiFill}
                disabled={aiBtnDisabled}
                className={`add-sheet__ai-btn ${aiBtnDisabled ? 'add-sheet__ai-btn--disabled' : 'add-sheet__ai-btn--active'}`}
              >
                {aiLoading ? (
                  <span className="add-sheet__ai-loading-text">Analisando...</span>
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
        <div className="add-sheet__receipt" onClick={() => receiptInputRef.current?.click()}>
          <Icons.download size={16} color={receiptFile ? 'var(--pos)' : 'var(--text-3)'} />
          <span className={`add-sheet__receipt-label ${receiptFile ? 'add-sheet__receipt-label--active' : 'add-sheet__receipt-label--empty'}`}>
            {receiptUploading ? 'Enviando...' : receiptFile ? receiptFile.name : 'Anexar comprovante'}
          </span>
          {receiptFile && (
            <button onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }} className="add-sheet__receipt-remove">
              <Icons.x size={14} color="var(--text-4)" />
            </button>
          )}
        </div>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={e => { if (e.target.files?.[0]) setReceiptFile(e.target.files[0]); }}
          className="add-sheet__hidden-input"
        />

        {/* Amount display */}
        <div className="add-sheet__amount-area">
          <div className="money add-sheet__amount-display" style={{ color: valColor }}>
            <span className="add-sheet__amount-symbol">{symbol}</span>
            <span>{amount}</span>
            <span className="add-sheet__amount-cursor" style={{ background: valColor }} />
          </div>
          <div className="money add-sheet__amount-secondary">
            ≈ {CURRENCY_SYMBOLS[secondaryCurrency]} {secondaryAmount.toFixed(2)}
          </div>
        </div>

        {/* Form fields */}
        <div className="add-sheet__form">
          <input type="text" placeholder="Descrição (opcional)" value={desc}
            onChange={e => setDesc(e.target.value)}
            className="add-sheet__field" />

          <div className="add-sheet__row">
            {/* Type dropdown */}
            <select value={kind} onChange={e => setKind(e.target.value as 'out' | 'in')} className="add-sheet__select add-sheet__type-select">
              <option value="out">Saída</option>
              <option value="in">Entrada</option>
            </select>
            {/* Category dropdown */}
            <select value={cat} onChange={e => {
              const newCat = e.target.value;
              setCat(newCat);
              if (aiSuggestedCat && newCat !== aiSuggestedCat && (aiSuggestedDesc || desc)) {
                aiLearnCategory(aiSuggestedDesc || desc, aiSuggestedCat, newCat).catch(() => {});
              }
            }} className="add-sheet__select add-sheet__cat-select">
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

          <div className="add-sheet__row">
            <input type="date" value={selectedDate} max={new Date().toISOString().slice(0, 10)}
              onChange={e => setSelectedDate(e.target.value)}
              className="add-sheet__field add-sheet__date-input" />
            <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}
              className="add-sheet__select add-sheet__currency-select">
              <option value="BRL">R$ BRL</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>

          {accounts.length > 0 && (
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="add-sheet__select">
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
              ))}
            </select>
          )}

          {workspaces.length > 0 && (
            activeWorkspace ? (
              <div className="add-sheet__workspace-label">
                {(() => { const ws = workspaces.find(w => w.id === activeWorkspace); return ws ? `${ws.icon} ${ws.name}` : 'Espaço selecionado'; })()}
              </div>
            ) : (
              <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} className="add-sheet__select">
                <option value="">Sem espaço</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.icon} {ws.name}</option>
                ))}
              </select>
            )
          )}
        </div>

        {/* Keypad */}
        <div className="add-sheet__keypad">
          <NumericKeypad onPress={press} />
        </div>

        {/* Save */}
        <div className="add-sheet__actions">
          <button onClick={() => handleSave(true)} disabled={saveDisabled}
            className={`add-sheet__save-another ${saveDisabled ? 'add-sheet__save-another--disabled' : 'add-sheet__save-another--active'}`}>
            + Salvar e add outra
          </button>
          <button onClick={() => handleSave(false)} disabled={saveDisabled}
            className={`add-sheet__save-btn ${saveDisabled ? 'add-sheet__save-btn--disabled' : ''}`}
            style={saveDisabled ? undefined : { background: positive ? 'var(--pos)' : 'var(--text-1)', color: positive ? '#0A0A0A' : 'var(--bg-0)' }}>
            <Icons.check size={16} stroke={2.4} color={saveDisabled ? 'var(--text-4)' : (positive ? '#0A0A0A' : 'var(--bg-0)')} />
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
  const approveDisabled = checkedCount === 0 || saving;
  return (
    <div className="review-panel">
      {/* Header */}
      <div className="review-panel__header">
        <div>
          <div className="review-panel__title">
            {result.transactions.length} transações encontradas
          </div>
          <div className="review-panel__subtitle">
            {result.document.type} — {result.document.language}
          </div>
        </div>
        <button onClick={onCancel} className="review-panel__back-btn">
          Voltar
        </button>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="review-panel__warnings">
          {result.warnings.map((w, i) => (
            <div key={i} className="review-panel__warning-item">
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Transaction list */}
      <div className="review-panel__tx-list">
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
        <div className="review-panel__suggestions">
          {result.suggestions.map((s, i) => (
            <div key={i} className="review-panel__suggestion-item">
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="review-panel__actions">
        <button onClick={onCancel} className="review-panel__cancel-btn">
          Cancelar
        </button>
        <button onClick={onApprove} disabled={approveDisabled}
          className={`review-panel__approve-btn ${approveDisabled ? 'review-panel__approve-btn--disabled' : 'review-panel__approve-btn--active'}`}>
          {saving ? (
            <span className="review-panel__saving-text">Salvando...</span>
          ) : (
            <>
              <Icons.check size={16} stroke={2.4} color={checkedCount === 0 ? 'var(--text-4)' : '#0A0A0A'} />
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
      className={`review-row ${checked ? 'review-row--checked' : 'review-row--unchecked'}`}
    >
      {/* Checkbox */}
      <div className={`review-row__checkbox ${checked ? 'review-row__checkbox--checked' : 'review-row__checkbox--unchecked'}`}>
        {checked && <Icons.check size={12} stroke={2.5} color="#0A0A0A" />}
      </div>

      {/* Content */}
      <div className="review-row__content">
        <div className="review-row__top-row">
          <span className="review-row__desc">
            {tx.desc}
          </span>
          <span className="money review-row__amount" style={{ color: amtColor }}>
            {sym} {absAmt}
          </span>
        </div>

        <div className="review-row__meta">
          {/* Date */}
          <span className="review-row__date">
            {tx.date}
          </span>

          {/* Account */}
          {tx.account && (
            <span className="review-row__account-badge">
              {tx.account}
            </span>
          )}

          {/* Category badge */}
          {lowConfidence ? (
            <select
              value={category}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); onChangeCategory(e.target.value); }}
              className="review-row__cat-select"
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
            <span className="review-row__cat-badge" style={{
              background: catMeta?.color ? `${catMeta.color}22` : 'var(--bg-3)',
              color: catMeta?.color ?? 'var(--text-2)',
            }}>
              {catMeta?.label ?? category}
            </span>
          )}

          {/* Confidence indicator for low/medium */}
          {lowConfidence && (
            <span className="review-row__confidence">
              {tx.catConfidence}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {tx.notes && (
          <div className="review-row__notes">
            {tx.notes}
          </div>
        )}

        {/* Payment method */}
        {tx.payment?.method && (
          <span className="review-row__payment">
            {tx.payment.method}{tx.payment.cardLast4 ? ` ****${tx.payment.cardLast4}` : ''}
            {tx.payment.installments ? ` ${tx.payment.installmentNumber}/${tx.payment.installments}x` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
