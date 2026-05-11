import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Icons } from './icons/Icons';
import type { Transaction, CurrencyCode } from '../types';
import './TransactionRow.scss';

interface TransactionRowProps {
  tx: Transaction;
  compact?: boolean;
  onClick?: () => void;
  displayCurrency?: CurrencyCode;
}

export function TransactionRow({ tx, compact = false, onClick, displayCurrency = 'BRL' }: TransactionRowProps) {
  const c = CATS[tx.cat] || CATS.outros;
  const positive = tx.amount > 0;
  const showConversion = tx.currency !== displayCurrency;
  const convertedAmount = showConversion ? convertAmount(tx.amount, tx.currency, displayCurrency) : null;

  return (
    <div
      onClick={onClick}
      className={`transaction-row ${compact ? 'transaction-row--compact' : 'transaction-row--default'} ${onClick ? 'transaction-row--clickable' : ''}`}
    >
      <CategoryIcon cat={tx.cat} size={compact?34:38}/>
      <div className="transaction-row__body">
        <div className="transaction-row__desc">{tx.desc}</div>
        <div className="transaction-row__meta">
          <span>{c.label}</span>
          {tx.account && <><span className="transaction-row__meta-dot">&middot;</span><span>{tx.account}</span></>}
        </div>
      </div>
      <div className="transaction-row__amounts">
        <div className={`money transaction-row__amount ${positive ? 'transaction-row__amount--positive' : 'transaction-row__amount--negative'}`}>
          {tx.receiptKey && <Icons.download size={12} color="var(--text-4)" />}
          <span>{positive?'+':'−'}{fmtAmount(Math.abs(tx.amount), tx.currency).replace('−','')}</span>
        </div>
        {showConversion && convertedAmount !== null && (
          <div className="money transaction-row__converted">
            ≈ {fmtAmount(Math.abs(convertedAmount), displayCurrency, { decimals: 0 })}
          </div>
        )}
      </div>
    </div>
  );
}
