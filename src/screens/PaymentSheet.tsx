import { useState, useRef } from 'react';
import { Icons } from '../components/icons/Icons';
import { fmtAmount } from '../utils/formatters';
import { getUploadUrl, uploadFileToS3 } from '../lib/api';
import type { RecurringTransaction, Account, CurrencyCode } from '../types';
import './PaymentSheet.scss';

interface PaymentSheetProps {
  open: boolean;
  recurring: RecurringTransaction;
  accounts: Account[];
  onClose: () => void;
  onConfirm: (data: {
    recurringId: string;
    amount: number;
    currency: CurrencyCode;
    paidDate: string;
    account: string;
    notes?: string;
    receiptKey?: string;
    receiptName?: string;
    workspaceId?: string;
  }) => void;
}

export function PaymentSheet({ open, recurring, accounts, onClose, onConfirm }: PaymentSheetProps) {
  const [amount, setAmount] = useState(String(Math.abs(recurring.amount)));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState(recurring.account || accounts[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;
  const disabled = numAmount <= 0 || saving;

  const handleConfirm = async () => {
    if (disabled) return;
    setSaving(true);

    let receiptKey: string | undefined;
    let receiptName: string | undefined;

    if (receiptFile) {
      try {
        const tempId = `payment-${Date.now()}`;
        const { uploadUrl, key } = await getUploadUrl(tempId, receiptFile.name, receiptFile.type);
        await uploadFileToS3(uploadUrl, receiptFile);
        receiptKey = key;
        receiptName = receiptFile.name;
      } catch {
        // Receipt upload failed, proceed without
      }
    }

    onConfirm({
      recurringId: recurring.id,
      amount: -Math.abs(numAmount),
      currency: recurring.currency,
      paidDate,
      account,
      notes: notes.trim() || undefined,
      receiptKey,
      receiptName,
      workspaceId: recurring.workspaceId,
    });
    setSaving(false);
  };

  return (
    <div className="payment-sheet">
      <div className="payment-sheet__backdrop" onClick={onClose} />
      <div className="payment-sheet__panel">
        <div className="payment-sheet__handle" />

        <div className="payment-sheet__header">
          <span className="payment-sheet__title">Confirmar pagamento</span>
          <button className="payment-sheet__close" onClick={onClose}>
            <Icons.x size={18} color="var(--text-3)" />
          </button>
        </div>

        <div className="payment-sheet__bill-name">{recurring.desc}</div>
        <div className="payment-sheet__bill-expected">
          Valor esperado: {fmtAmount(Math.abs(recurring.amount), recurring.currency, { decimals: 2 })}
        </div>

        <div className="payment-sheet__field-group">
          <label className="payment-sheet__label">Valor pago</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="payment-sheet__input"
          />
        </div>

        <div className="payment-sheet__field-group">
          <label className="payment-sheet__label">Data do pagamento</label>
          <input
            type="date"
            value={paidDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setPaidDate(e.target.value)}
            className="payment-sheet__input"
          />
        </div>

        <div className="payment-sheet__field-group">
          <label className="payment-sheet__label">Conta</label>
          <select
            value={account}
            onChange={e => setAccount(e.target.value)}
            className="payment-sheet__select"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.name}>{acc.name}</option>
            ))}
          </select>
        </div>

        <div className="payment-sheet__field-group">
          <label className="payment-sheet__label">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: pago com desconto"
            className="payment-sheet__input"
          />
        </div>

        <div
          className="payment-sheet__receipt"
          onClick={() => receiptRef.current?.click()}
        >
          <Icons.download size={16} color={receiptFile ? 'var(--pos)' : 'var(--text-3)'} />
          <span className={`payment-sheet__receipt-label ${receiptFile ? 'payment-sheet__receipt-label--active' : ''}`}>
            {receiptFile ? receiptFile.name : 'Anexar comprovante'}
          </span>
          {receiptFile && (
            <button
              onClick={e => { e.stopPropagation(); setReceiptFile(null); }}
              className="payment-sheet__receipt-remove"
            >
              <Icons.x size={14} color="var(--text-4)" />
            </button>
          )}
        </div>
        <input
          ref={receiptRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={e => { if (e.target.files?.[0]) setReceiptFile(e.target.files[0]); }}
          className="payment-sheet__hidden-input"
        />

        <button
          onClick={handleConfirm}
          disabled={disabled}
          className={`payment-sheet__confirm ${disabled ? 'payment-sheet__confirm--disabled' : ''}`}
        >
          {saving ? 'Salvando...' : 'Confirmar pagamento'}
        </button>
      </div>
    </div>
  );
}
