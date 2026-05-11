import './BalanceCard.scss';
import { Icons } from './icons/Icons';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { currentMonthKey, monthLabel } from '../utils/dates';
import type { CurrencyCode } from '../types';

interface BalanceCardProps {
  value: number;
  delta: number;
  currency?: CurrencyCode;
  month?: string;
  kind?: 'a' | 'b';
}

export function BalanceCard({ value, delta, currency = 'BRL', month = monthLabel(currentMonthKey()), kind = 'a' }: BalanceCardProps) {
  const positive = value >= 0;
  const secondaryCurrency: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
  const secondaryValue = convertAmount(value, currency, secondaryCurrency);

  if (kind === 'b') {
    return (
      <div className="balance-card balance-card--b">
        <div className="balance-card__header balance-card__header--b">
          <span className="balance-card__label balance-card__label--b">Saldo do mês</span>
          {delta !== 0 && (
            <span className={`balance-card__badge tabular ${delta >= 0 ? 'balance-card__badge--positive' : 'balance-card__badge--negative'}`}>
              {delta>=0?'+':'−'}{Math.abs(delta).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%
            </span>
          )}
        </div>
        <div className="money balance-card__amount--b">
          {fmtAmount(value, currency)}
        </div>
        <div className="money balance-card__secondary--b">
          ≈ {fmtAmount(secondaryValue, secondaryCurrency, {decimals:0})}
        </div>
      </div>
    );
  }
  return (
    <div className="balance-card balance-card--a">
      <div className="balance-card__header">
        <div>
          <div className="balance-card__label">SALDO · {month.toUpperCase()}</div>
        </div>
        {delta !== 0 && (
          <div className={`balance-card__delta tabular ${delta >= 0 ? 'balance-card__delta--positive' : 'balance-card__delta--negative'}`}>
            {delta>=0? <Icons.arrowUp size={11} stroke={2.4}/> : <Icons.arrowDown size={11} stroke={2.4}/>}
            {Math.abs(delta).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%
          </div>
        )}
      </div>
      <div className={`money balance-card__amount ${positive ? 'balance-card__amount--positive' : 'balance-card__amount--negative'}`}>
        {fmtAmount(value, currency)}
      </div>
      <div className="balance-card__divider-row">
        <div className="balance-card__divider"/>
        <span className="money balance-card__secondary">
          ≈ {fmtAmount(secondaryValue, secondaryCurrency, {decimals:0})}
        </span>
      </div>
    </div>
  );
}
