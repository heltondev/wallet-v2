import './BudgetBar.scss';
import { fmtBRL } from '../utils/formatters';

interface BudgetBarProps {
  spent: number;
  budget: number;
  label?: string;
}

export function BudgetBar({ spent, budget, label = 'Orçamento' }: BudgetBarProps) {
  const pct = Math.min(100, (spent / budget) * 100);
  const color = pct > 90 ? 'var(--neg)' : pct > 70 ? 'var(--warn)' : 'var(--pos)';
  return (
    <div className="budget-bar">
      <div className="budget-bar__header">
        <span className="budget-bar__label">{label}</span>
        <span className="money budget-bar__amounts">
          <span className="budget-bar__spent">{fmtBRL(spent,{decimals:0})}</span>
          <span className="budget-bar__budget"> / {fmtBRL(budget,{decimals:0})}</span>
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
        <span className="money budget-bar__remaining">Resta {fmtBRL(budget-spent,{decimals:0})}</span>
      </div>
    </div>
  );
}
