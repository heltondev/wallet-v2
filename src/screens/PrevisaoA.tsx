import { useMemo } from 'react';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { nextMonthLabel, currentMonth, currentYear } from '../utils/dates';
import type { Transaction, RecurringTransaction, CurrencyCode } from '../types';
import './PrevisaoA.scss';

interface PrevisaoAProps {
  tx: Transaction[];
  recurring: RecurringTransaction[];
  currency: CurrencyCode;
  monthlyBudget: number;
  workspaceId?: string | null;
}

export function PrevisaoA({ tx, recurring, currency, monthlyBudget, workspaceId = null }: PrevisaoAProps) {
  const activeRecurring = useMemo(() =>
    recurring.filter(r => r.active && (!workspaceId || r.workspaceId === workspaceId)),
  [recurring, workspaceId]);

  const recurringStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const r of activeRecurring) {
      const converted = convertAmount(r.amount, r.currency, currency);
      if (converted > 0) income += converted;
      else expenses += Math.abs(converted);
    }
    return { income, expenses, net: income - expenses };
  }, [activeRecurring, currency]);

  const txStats = useMemo(() => {
    let ins = 0;
    let outs = 0;
    const byCat: Record<string, number> = {};
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted > 0) ins += converted;
      else {
        const abs = Math.abs(converted);
        outs += abs;
        const cat = item.cat || 'outros';
        byCat[cat] = (byCat[cat] || 0) + abs;
      }
    }
    const categories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { ins, outs, balance: ins - outs, categories };
  }, [tx, currency]);

  const hasData = tx.length > 0 || activeRecurring.length > 0;

  return (
    <div className="phone-surface forecast-screen" data-screen-label="Forecast A">
      <div className="forecast-screen__status-bar"><IOSStatusBar /></div>
      <div className="forecast-screen__scroll no-scrollbar">
        <div className="forecast-screen__header">
          <div className="forecast-screen__label">PREVISÃO PARA</div>
          <h1 className="forecast-screen__title">{nextMonthLabel()}</h1>
        </div>

        {!hasData ? (
          <div className="forecast-screen__empty-card">
            <div className="forecast-screen__empty-title">Sem dados para previsão</div>
            <div className="forecast-screen__empty-text">
              Adicione transações ou configure recorrentes para ver a previsão do próximo mês.
            </div>
          </div>
        ) : (
          <>
            {/* Projected balance card */}
            <div className="forecast-screen__balance-card">
              <div className="forecast-screen__balance-label">Projeção {nextMonthLabel()}</div>
              <div className="money forecast-screen__balance-value" style={{ color: recurringStats.net >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                {fmtAmount(recurringStats.net, currency, { decimals: 0 })}
              </div>
              <div className="forecast-screen__balance-sub">
                baseado em {activeRecurring.length} recorrentes ativas
              </div>
            </div>

            {/* Summary grid */}
            <div className="forecast-screen__summary-card">
              <div className="forecast-screen__summary-grid">
                <div>
                  <div className="forecast-screen__summary-label">Receita prevista</div>
                  <div className="money forecast-screen__summary-value forecast-screen__summary-value--pos">
                    {fmtAmount(recurringStats.income, currency, { decimals: 0 })}
                  </div>
                </div>
                <div>
                  <div className="forecast-screen__summary-label">Despesa prevista</div>
                  <div className="money forecast-screen__summary-value forecast-screen__summary-value--neg">
                    {fmtAmount(recurringStats.expenses, currency, { decimals: 0 })}
                  </div>
                </div>
                {monthlyBudget > 0 && (
                  <>
                    <div>
                      <div className="forecast-screen__summary-label">Orçamento</div>
                      <div className="money forecast-screen__summary-value">
                        {fmtAmount(monthlyBudget, currency, { decimals: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="forecast-screen__summary-label">Sobra projetada</div>
                      <div className="money forecast-screen__summary-value" style={{ color: (monthlyBudget - recurringStats.expenses) >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                        {fmtAmount(monthlyBudget - recurringStats.expenses, currency, { decimals: 0 })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recurring list */}
            {activeRecurring.length > 0 && (
              <>
                <div className="forecast-screen__section-header">
                  <h3 className="forecast-screen__section-title">Recorrentes confirmadas</h3>
                  <span className="forecast-screen__section-count">{activeRecurring.length} itens</span>
                </div>
                <div className="forecast-screen__recurring-list">
                  {activeRecurring.map(r => {
                    const converted = convertAmount(r.amount, r.currency, currency);
                    return (
                      <div key={r.id} className="forecast-screen__recurring-row">
                        <CategoryIcon cat={r.cat} size={28} radius={8} />
                        <div className="forecast-screen__recurring-desc">{r.desc}</div>
                        <span className={`money forecast-screen__recurring-amount ${converted > 0 ? 'forecast-screen__recurring-amount--pos' : ''}`}>
                          {converted > 0 ? '+' : '−'}{fmtAmount(Math.abs(converted), currency, { decimals: 0 }).replace('−', '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Current month category breakdown */}
            {txStats.categories.length > 0 && (
              <>
                <div className="forecast-screen__section-header">
                  <h3 className="forecast-screen__section-title">Gastos {currentMonth()} {currentYear()}</h3>
                  <span className="forecast-screen__section-count">{txStats.categories.length} categorias</span>
                </div>
                <div className="forecast-screen__cat-list">
                  {txStats.categories.map(([cat, amount]) => (
                    <div key={cat} className="forecast-screen__cat-row">
                      <CategoryIcon cat={cat} size={28} radius={8} />
                      <div className="forecast-screen__cat-name">{CATS[cat]?.label ?? cat}</div>
                      <span className="money forecast-screen__cat-amount">
                        −{fmtAmount(amount, currency, { decimals: 0 }).replace('−', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
