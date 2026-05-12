import { useMemo } from 'react';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { MonthSelector } from '../components/MonthSelector';
import { BalanceCard } from '../components/BalanceCard';
import { BudgetBar } from '../components/BudgetBar';
import { StatCard } from '../components/StatCard';
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
  onNavigateRecurring?: () => void;
  fxRates?: Record<string, number>;
}

export function LiveHome({ tx, recurring, currency, monthlyBudget, onTabChange, workspaces = [], activeWorkspace = null, onWorkspaceChange, onNavigateRecurring, fxRates }: LiveHomeProps) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  const activeRecurring = useMemo(() =>
    recurring.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
  [recurring, activeWorkspace]);

  const txStats = useMemo(() => {
    let ins = 0;
    let outs = 0;
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency, fxRates);
      if (converted > 0) ins += converted;
      else outs += Math.abs(converted);
    }
    return { ins, outs, balance: ins - outs };
  }, [tx, currency, fxRates]);

  const recStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const r of activeRecurring) {
      const converted = convertAmount(r.amount, r.currency, currency, fxRates);
      if (converted > 0) income += converted;
      else expenses += Math.abs(converted);
    }
    return { income, expenses };
  }, [activeRecurring, currency, fxRates]);

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
          <BudgetBar spent={txStats.outs} budget={monthlyBudget} label="Orçamento mensal" currency={currency} />
        </div>
        <div className="live-home__stats-grid">
          <StatCard label="Entradas" value={fmtAmount(txStats.ins, currency, { decimals: 0 })} sub="realizadas" accent="pos" icon="arrowDown" />
          <StatCard label="Saídas" value={fmtAmount(txStats.outs, currency, { decimals: 0 })} sub="realizadas" accent="neg" icon="arrowUp" />
          <StatCard label="Previsto restante" value={fmtAmount(monthlyBudget - totalExpenses, currency, { decimals: 0 })} sub={`${daysLeft} dias restantes`} accent="neutral" />
          <StatCard label="Sobra projetada" value={fmtAmount(projectedBalance, currency, { decimals: 0 })} sub={`${activeRecurring.length} recorrentes`} accent={projectedBalance >= 0 ? 'pos' : 'neg'} />
        </div>

        {/* Quick access cards — same grid as stats above */}
        <div className="live-home__stats-grid">
          <div className="live-home__clickable-card" onClick={() => onTabChange('list')}>
            <StatCard label="Transações" value={String(tx.length)} sub="ver todas →" accent="neutral" icon="list" />
          </div>
          <div className="live-home__clickable-card" onClick={() => onNavigateRecurring?.()}>
            <StatCard label="Recorrentes" value={String(activeRecurring.length)} sub="gerenciar →" accent="neutral" icon="repeat" />
          </div>
        </div>
      </div>
    </div>
  );
}
