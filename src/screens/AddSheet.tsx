import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { FX } from '../data/constants';
import { NumericKeypad } from '../components/NumericKeypad';
import { SegmentedToggle } from '../components/SegmentedToggle';
import type { Account, CurrencyCode } from '../types';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { BRL: 'R$', USD: '$', EUR: '€' };
const CURRENCY_FX: Record<CurrencyCode, number> = { BRL: 1, USD: FX, EUR: FX * 1.08 };
const PT_WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dateToFields(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return { date: dateStr, day: String(d.getDate()), wd: PT_WEEKDAYS[d.getDay()] };
}

const selectStyle: React.CSSProperties = {
  padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border-1)',
  borderRadius: 'var(--r-input, 8px)', color: 'var(--text-1)', fontFamily: 'var(--font-sans)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', width: '100%',
  appearance: 'none', WebkitAppearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'><path fill=\'%2371717A\' d=\'M0 0h10L5 6z\'/></svg>")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

interface AddSheetSaveData {
  desc: string; cat: string; amount: number; currency: CurrencyCode;
  fxRate: number; account: string; date: string; day: string; wd: string;
}

interface AddSheetProps {
  open: boolean; onClose: () => void; onSave: (data: AddSheetSaveData) => void; accounts: Account[];
}

export function AddSheet({ open, onClose, onSave, accounts }: AddSheetProps) {
  const [kind, setKind] = useState<'out' | 'in'>('out');
  const [amount, setAmount] = useState('0,00');
  const [cat, setCat] = useState('mercado');
  const [desc, setDesc] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedAccount = accounts.find(a => a.id === accountId);
  const allCatKeys = Object.keys(CATS).filter(k => k !== 'salario' && k !== 'freelance');

  const reset = () => {
    setAmount('0,00'); setDesc(''); setCat('mercado');
    setAccountId(accounts[0]?.id ?? ''); setCurrency(accounts[0]?.currency ?? 'BRL');
    setSelectedDate(new Date().toISOString().slice(0, 10));
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

  const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  const positive = kind === 'in';
  const valColor = positive ? 'var(--pos)' : 'var(--text-1)';
  const symbol = CURRENCY_SYMBOLS[currency];
  const fxRate = CURRENCY_FX[currency];
  const secondaryCurrency: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
  const secondaryAmount = currency === 'BRL' ? numAmount / FX : numAmount * fxRate;

  const handleSave = (andAnother: boolean) => {
    if (numAmount <= 0) return;
    const signedAmount = positive ? numAmount : -numAmount;
    const finalCat = positive ? 'salario' : cat;
    onSave({
      desc: desc || (positive ? 'Entrada' : CATS[finalCat]?.label ?? finalCat),
      cat: finalCat, amount: signedAmount, currency, fxRate,
      account: selectedAccount?.name ?? accounts[0]?.name ?? 'Cash',
      ...dateToFields(selectedDate),
    });
    if (andAnother) reset(); else onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn .2s ease' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--bg-1)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border-1)', padding: '10px 16px 24px',
        maxHeight: '92vh', overflowY: 'auto',
        animation: 'sheetIn .25s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--bg-4)', borderRadius: 2, margin: '0 auto 14px' }} />

        <SegmentedToggle value={kind} options={[
          { id: 'out', label: 'Saída', color: 'var(--neg)' },
          { id: 'in', label: 'Entrada', color: 'var(--pos)' },
        ]} onChange={(id) => setKind(id as 'out' | 'in')} />

        {/* Amount */}
        <div style={{ textAlign: 'center', padding: '18px 0 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            {kind === 'in' ? 'ENTRADA' : 'SAÍDA'}
          </div>
          <div className="money" style={{
            fontSize: 48, fontWeight: 600, letterSpacing: -2, lineHeight: 1,
            color: valColor, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6,
          }}>
            <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-3)' }}>{symbol}</span>
            <span>{amount}</span>
            <span style={{ display: 'inline-block', width: 2, height: 32, background: valColor, marginLeft: 2, animation: 'blink 1s infinite' }} />
          </div>
          <div className="money" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            ≈ {CURRENCY_SYMBOLS[secondaryCurrency]} {secondaryAmount.toFixed(2)}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 0 10px' }}>
          {/* Description */}
          <input type="text" placeholder="Descrição (opcional)" value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ ...selectStyle, backgroundImage: 'none' }} />

          {/* Category dropdown */}
          {!positive && (
            <select value={cat} onChange={e => setCat(e.target.value)} style={selectStyle}>
              {allCatKeys.map(k => (
                <option key={k} value={k}>{CATS[k]?.label ?? k}</option>
              ))}
            </select>
          )}

          {/* Date + Currency + Account row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={selectedDate} max={new Date().toISOString().slice(0, 10)}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ ...selectStyle, flex: 1, backgroundImage: 'none', colorScheme: 'dark' }} />
            <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}
              style={{ ...selectStyle, flex: 0.7 }}>
              <option value="BRL">R$ BRL</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>

          {/* Account dropdown */}
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
            flex: 1, padding: '14px 0', borderRadius: 'var(--r-input)',
            background: 'transparent', border: '1px solid var(--border-2)',
            color: numAmount <= 0 ? 'var(--text-4)' : 'var(--text-2)',
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13,
            cursor: numAmount <= 0 ? 'not-allowed' : 'pointer',
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
