import { useMemo } from 'react';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { MonthSelector } from '../components/MonthSelector';
import { BalanceCard } from '../components/BalanceCard';
import { BudgetBar } from '../components/BudgetBar';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';
import { CategoryIcon } from '../components/CategoryIcon';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { currentMonth, currentYear, currentMonthKey, monthLabel, daysRemainingInMonth } from '../utils/dates';
import { WorkspaceSelector } from '../components/WorkspaceSelector';
import type { Transaction, RecurringTransaction, Workspace, TabId, CurrencyCode } from '../types';
import './LiveHome.scss';

interface LiveHomeProps {
  tx: Transaction[];
  recurring: RecurringTransaction[];
  currency: CurrencyCode;
  monthlyBudget: number;
  onTabChange: (tab: TabId) => void;
  workspaces?: Workspace[];
  activeWorkspace?: string | null;
  onWorkspaceChange?: (id: string | null) => void;
}

export function LiveHome({ tx, recurring, currency, monthlyBudget, onTabChange, workspaces = [], activeWorkspace = null, onWorkspaceChange }: LiveHomeProps) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  const activeRecurring = useMemo(() =>
    recurring.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
  [recurring, activeWorkspace]);

  const txStats = useMemo(() => {
    let ins = 0;
    let outs = 0;
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted > 0) ins += converted;
      else outs += Math.abs(converted);
    }
    return { ins, outs, balance: ins - outs };
  }, [tx, currency]);

  const recStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const r of activeRecurring) {
      const converted = convertAmount(r.amount, r.currency, currency);
      if (converted > 0) income += converted;
      else expenses += Math.abs(converted);
    }
    return { income, expenses };
  }, [activeRecurring, currency]);

  const month = currentMonth();
  const year = currentYear();
  const label = monthLabel(currentMonthKey());
  const daysLeft = daysRemainingInMonth();

  const totalIncome = txStats.ins + recStats.income;
  const totalExpenses = txStats.outs + recStats.expenses;
  const projectedBalance = totalIncome - totalExpenses;

  return (
    <div className="phone-surface live-home">
      <div className="live-home__status-bar"><IOSStatusBar dark={dark} /></div>
      <div className="live-home__scroll no-scrollbar">
        {workspaces.length > 0 && onWorkspaceChange && (
          <WorkspaceSelector workspaces={workspaces} activeId={activeWorkspace} onChange={onWorkspaceChange} />
        )}
        <MonthSelector month={month} year={year} />
        <div className="live-home__balance-wrap" key={projectedBalance}>
          <div className="live-home__balance-anim">
            <BalanceCard value={txStats.balance} delta={0} month={label} currency={currency} kind="a" />
          </div>
        </div>
        <div className="live-home__budget-wrap">
          <BudgetBar spent={txStats.outs} budget={monthlyBudget} label="Orçamento mensal" />
        </div>
        <div className="live-home__stats-grid">
          <StatCard label="Entradas" value={fmtAmount(txStats.ins, currency, { decimals: 0 })} sub="realizadas" accent="pos" icon="arrowDown" />
          <StatCard label="Saídas" value={fmtAmount(txStats.outs, currency, { decimals: 0 })} sub="realizadas" accent="neg" icon="arrowUp" />
          <StatCard label="Previsto restante" value={fmtAmount(monthlyBudget - totalExpenses, currency, { decimals: 0 })} sub={`${daysLeft} dias restantes`} accent="neutral" />
          <StatCard label="Sobra projetada" value={fmtAmount(projectedBalance, currency, { decimals: 0 })} sub={`${activeRecurring.length} recorrentes`} accent={projectedBalance >= 0 ? 'pos' : 'neg'} />
        </div>

        {/* Recurring section */}
        {activeRecurring.length > 0 && (
          <>
            <div className="live-home__section-header">
              <h3 className="live-home__section-title">Recorrentes do mês</h3>
              <span className="live-home__recurring-count">{activeRecurring.length} itens</span>
            </div>
            <div className="live-home__recurring-list">
              {activeRecurring.map(r => {
                const converted = convertAmount(r.amount, r.currency, currency);
                return (
                  <div key={r.id} className="live-home__recurring-item">
                    <CategoryIcon cat={r.cat} size={28} radius={8} />
                    <div className="live-home__recurring-desc">{r.desc}</div>
                    <span className={`money live-home__recurring-amount ${converted > 0 ? 'live-home__recurring-amount--pos' : ''}`}>
                      {converted > 0 ? '+' : '−'}{fmtAmount(Math.abs(converted), currency, { decimals: 0 }).replace('−', '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Transactions section */}
        <div className="live-home__section-header">
          <h3 className="live-home__section-title">Últimas transações</h3>
          <button onClick={() => onTabChange('list')} className="live-home__see-all">Ver todas →</button>
        </div>
        <div className="live-home__tx-list">
          {tx.length === 0 ? (
            <div className="live-home__tx-empty">Nenhuma transação este mês</div>
          ) : tx.slice(0, 5).map(row => (
            <div key={row.id} className="live-home__tx-item">
              <TransactionRow tx={row} compact displayCurrency={currency} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
