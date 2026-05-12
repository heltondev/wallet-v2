import { useMemo } from 'react';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { monthlyAmount } from '../utils/recurring';
import { currentMonthKey, monthLabelUpper } from '../utils/dates';
import type { RecurringTransaction, CurrencyCode } from '../types';
import './CategoriasScreen.scss';

interface CategoriasScreenProps {
  recurring: RecurringTransaction[];
  currency: CurrencyCode;
  workspaceId?: string | null;
  fxRates?: Record<string, number>;
}

export function CategoriasScreen({ recurring, currency, workspaceId, fxRates }: CategoriasScreenProps) {
  const activeRecurring = useMemo(() =>
    recurring.filter(r => r.active && (!workspaceId || r.workspaceId === workspaceId)),
  [recurring, workspaceId]);

  const data = useMemo(() => {
    const byCat: Record<string, { expense: number; income: number; count: number }> = {};
    for (const r of activeRecurring) {
      const monthly = monthlyAmount(r.amount, r.frequency, r.customDays);
      const converted = convertAmount(monthly, r.currency, currency, fxRates);
      const cat = r.cat || 'outros';
      if (!byCat[cat]) byCat[cat] = { expense: 0, income: 0, count: 0 };
      if (converted < 0) {
        byCat[cat].expense += Math.abs(converted);
      } else {
        byCat[cat].income += converted;
      }
      byCat[cat].count++;
    }
    return Object.entries(byCat)
      .map(([cat, { expense, income, count }]) => ({ cat, expense, income, count }))
      .sort((a, b) => b.expense - a.expense || b.income - a.income);
  }, [activeRecurring, currency, fxRates]);

  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const label = monthLabelUpper(currentMonthKey());

  return (
    <div className="phone-surface categories-screen" data-screen-label="Categories">
      <div className="categories-screen__status-bar"><IOSStatusBar /></div>
      <div className="categories-screen__scroll no-scrollbar">
        <div className="categories-screen__header">
          <h1 className="categories-screen__title">Categorias</h1>
          <span className="categories-screen__month">{label}</span>
        </div>

        {data.length > 0 && (
          <div className="categories-screen__totals">
            <div className="categories-screen__total">
              <span className="categories-screen__total-label">Despesas</span>
              <span className="categories-screen__total-value categories-screen__total-value--neg">
                {fmtAmount(totalExpense, currency, { decimals: 0 })}
              </span>
            </div>
            {totalIncome > 0 && (
              <div className="categories-screen__total">
                <span className="categories-screen__total-label">Receitas</span>
                <span className="categories-screen__total-value categories-screen__total-value--pos">
                  {fmtAmount(totalIncome, currency, { decimals: 0 })}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="categories-screen__grid">
          {data.map(d => {
            const catMeta = CATS[d.cat];
            const mainAmount = d.expense > 0 ? d.expense : d.income;
            const isIncome = d.expense === 0 && d.income > 0;
            const pct = totalExpense > 0 && d.expense > 0
              ? Math.round((d.expense / totalExpense) * 100)
              : 0;
            return (
              <div key={d.cat} className="categories-screen__card">
                <div className="categories-screen__card-top">
                  <CategoryIcon cat={d.cat} size={32} radius={8} />
                  {pct > 0 && <span className="categories-screen__card-pct">{pct}%</span>}
                </div>
                <div className="categories-screen__card-label">{catMeta?.label ?? d.cat}</div>
                <div className={`categories-screen__card-amount ${isIncome ? 'categories-screen__card-amount--pos' : ''}`}>
                  {fmtAmount(mainAmount, currency, { decimals: 0 })}
                </div>
                <div className="categories-screen__card-count">
                  {d.count} {d.count === 1 ? 'conta' : 'contas'}
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="categories-screen__empty">
              Nenhuma conta recorrente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
