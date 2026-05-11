import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { FX } from '../data/constants';
import { NumericKeypad } from '../components/NumericKeypad';
import { Chip } from '../components/Chip';
import { SegmentedToggle } from '../components/SegmentedToggle';
import type { Account, CurrencyCode } from '../types';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { BRL: 'R$', USD: '$', EUR: '€' };
const CURRENCY_FX: Record<CurrencyCode, number> = { BRL: 1, USD: FX, EUR: FX * 1.08 };

interface AddSheetSaveData {
  desc: string;
  cat: string;
  amount: number;
  currency: CurrencyCode;
  fxRate: number;
  account: string;
}

interface AddSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddSheetSaveData) => void;
  accounts: Account[];
}

export function AddSheet({ open, onClose, onSave, accounts }: AddSheetProps) {
  const [kind, setKind] = useState<'out' | 'in' | 'tr'>('out');
  const [amount, setAmount] = useState('0,00');
  const [cat, setCat] = useState('mercado');
  const [desc, setDesc] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');

  const selectedAccount = accounts.find(a => a.id === accountId);

  const reset = () => {
    setAmount('0,00');
    setDesc('');
    setCat('mercado');
    setAccountId(accounts[0]?.id ?? '');
    setCurrency(accounts[0]?.currency ?? 'BRL');
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  useEffect(() => {
    if (selectedAccount) setCurrency(selectedAccount.currency);
  }, [accountId]);

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

  const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  const positive = kind === 'in';
  const valColor = positive ? 'var(--pos)' : 'var(--text-1)';
  const symbol = CURRENCY_SYMBOLS[currency];
  const fxRate = CURRENCY_FX[currency];

  const secondaryCurrency: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
  const secondarySymbol = CURRENCY_SYMBOLS[secondaryCurrency];
  const secondaryAmount = currency === 'BRL'
    ? numAmount / FX
    : numAmount * fxRate;

  const handleSave = (andAnother: boolean) => {
    if (numAmount <= 0) return;
    const signedAmount = positive ? numAmount : -numAmount;
    const c = positive ? 'salario' : cat;
    onSave({
      desc: desc || (positive ? 'Entrada' : CATS[c].label),
      cat: c,
      amount: signedAmount,
      currency,
      fxRate,
      account: selectedAccount?.name ?? accounts[0]?.name ?? 'Cash',
    });
    if (andAnother) reset();
    else onClose();
  };

  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn .2s ease' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--bg-1)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border-1)',
        padding: '10px 16px 24px',
        animation: 'sheetIn .25s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--bg-4)', borderRadius: 2, margin: '0 auto 14px' }} />
        <SegmentedToggle value={kind} options={[
          { id: 'out', label: 'Saída', color: 'var(--neg)' },
          { id: 'in', label: 'Entrada', color: 'var(--pos)' },
          { id: 'tr', label: 'Transferência' },
        ]} onChange={(id) => setKind(id as 'out' | 'in' | 'tr')} />

        <div style={{ textAlign: 'center', padding: '22px 0 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            {kind === 'in' ? 'ENTRADA' : kind === 'tr' ? 'TRANSFERÊNCIA' : 'SAÍDA'}
          </div>
          <div className="money" style={{
            fontSize: 54, fontWeight: 600, letterSpacing: -2, lineHeight: 1,
            color: valColor, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-3)' }}>{symbol}</span>
            <span>{amount}</span>
            <span style={{ display: 'inline-block', width: 2, height: 36, background: valColor, marginLeft: 2, animation: 'blink 1s infinite' }} />
          </div>
          <div className="money" style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            ≈ {secondarySymbol} {secondaryAmount.toFixed(2)}
          </div>
        </div>

        {/* category chips */}
        <div style={{ padding: '0 0 12px', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {!positive && ['mercado', 'restaurante', 'transporte', 'casa', 'lazer', 'assinaturas', 'saude'].map(c => (
            <Chip key={c} leadingDot color={`var(--cat-${c})`} active={cat === c} onClick={() => setCat(c)}>
              {CATS[c].label}
            </Chip>
          ))}
        </div>

        {/* account + currency + date chips */}
        <div style={{ padding: '4px 0 10px', display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {accounts.map(acc => (
            <Chip key={acc.id} leadingIcon="wallet" active={accountId === acc.id} onClick={() => setAccountId(acc.id)}>
              {acc.name}
            </Chip>
          ))}
        </div>
        <div style={{ padding: '0 0 10px', display: 'flex', gap: 6, justifyContent: 'center' }}>
          {(['BRL', 'USD'] as CurrencyCode[]).map(c => (
            <Chip key={c} active={currency === c} onClick={() => setCurrency(c)}>
              {CURRENCY_SYMBOLS[c]} {c}
            </Chip>
          ))}
          <Chip>Hoje · 14 mai</Chip>
        </div>

        {/* keypad */}
        <div style={{ padding: '4px 0' }}>
          <NumericKeypad onPress={press} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => handleSave(true)} disabled={numAmount <= 0} style={{
            flex: 1, padding: '14px 0', borderRadius: 'var(--r-input)',
            background: 'transparent', border: '1px solid var(--border-2)', color: numAmount <= 0 ? 'var(--text-4)' : 'var(--text-2)',
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, cursor: numAmount <= 0 ? 'not-allowed' : 'pointer',
          }}>+ Salvar e add outra</button>
          <button onClick={() => handleSave(false)} disabled={numAmount <= 0} style={{
            flex: 1.4, padding: '14px 0', borderRadius: 'var(--r-input)',
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
