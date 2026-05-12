import './BudgetBar.scss';
import { fmtAmount } from '../utils/formatters';
import type { CurrencyCode } from '../types';

interface BudgetBarProps {
  spent: number;
  budget: number;
  label?: string;
  currency?: CurrencyCode;
}

export function BudgetBar({ spent, budget, label = 'Orçamento', currency = 'BRL' }: BudgetBarProps) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const color = pct > 90 ? 'var(--neg)' : pct > 70 ? 'var(--warn)' : 'var(--pos)';
  return (
    <div className="budget-bar">
      <div className="budget-bar__header">
        <span className="budget-bar__label">{label}</span>
        <span className="money budget-bar__amounts">
          <span className="budget-bar__spent">{fmtAmount(spent, currency, {decimals:0})}</span>
          <span className="budget-bar__budget"> / {fmtAmount(budget, currency, {decimals:0})}</span>
        </span>
      </div>
      <div className="budget-bar__track">
        <div className="budget-bar__fill" style={{ width: `${pct}%`, background: color }}/>
        {[25,50,75].map(m=>(
          <div key={m} className="budget-bar__marker" style={{ left: `${m}%` }}/>
        ))}
      </div>
      <div className="budget-bar__footer">
        <span className="money budget-bar__pct" style={{ color }}>{pct.toFixed(0)}% consumido</span>
        <span className="money budget-bar__remaining">Resta {fmtAmount(budget-spent, currency, {decimals:0})}</span>
      </div>
    </div>
  );
}
