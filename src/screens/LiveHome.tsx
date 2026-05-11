import { useMemo } from 'react';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { MonthSelector } from '../components/MonthSelector';
import { BalanceCard } from '../components/BalanceCard';
import { BudgetBar } from '../components/BudgetBar';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { currentMonth, currentYear, currentMonthKey, monthLabel, daysRemainingInMonth } from '../utils/dates';
import { WorkspaceSelector } from '../components/WorkspaceSelector';
import type { Transaction, Workspace, TabId, CurrencyCode } from '../types';
import './LiveHome.scss';

interface LiveHomeProps {
  tx: Transaction[];
  currency: CurrencyCode;
  monthlyBudget: number;
  onTabChange: (tab: TabId) => void;
  workspaces?: Workspace[];
  activeWorkspace?: string | null;
  onWorkspaceChange?: (id: string | null) => void;
}

export function LiveHome({ tx, currency, monthlyBudget, onTabChange, workspaces = [], activeWorkspace = null, onWorkspaceChange }: LiveHomeProps) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const m = useMemo(() => {
    let ins = 0;
    let outs = 0;
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted > 0) ins += converted;
      else outs += Math.abs(converted);
    }
    return { ins, outs, balance: ins - outs };
  }, [tx, currency]);

  const month = currentMonth();
  const year = currentYear();
  const label = monthLabel(currentMonthKey());
  const daysLeft = daysRemainingInMonth();

  return (
    <div className="phone-surface live-home">
      <div className="live-home__status-bar"><IOSStatusBar dark={dark} /></div>
      <div className="live-home__scroll no-scrollbar">
        {workspaces.length > 0 && onWorkspaceChange && (
          <WorkspaceSelector workspaces={workspaces} activeId={activeWorkspace} onChange={onWorkspaceChange} />
        )}
        <MonthSelector month={month} year={year} />
        <div className="live-home__balance-wrap" key={m.balance}>
          <div className="live-home__balance-anim">
            <BalanceCard value={m.balance} delta={0} month={label} currency={currency} kind="a" />
          </div>
        </div>
        <div className="live-home__budget-wrap">
          <BudgetBar spent={m.outs} budget={monthlyBudget} label="Orçamento mensal" />
        </div>
        <div className="live-home__stats-grid">
          <StatCard label="Entradas" value={fmtAmount(m.ins, currency, { decimals: 0 })} sub="este mês" accent="pos" icon="arrowDown" />
          <StatCard label="Saídas" value={fmtAmount(m.outs, currency, { decimals: 0 })} sub="este mês" accent="neg" icon="arrowUp" />
          <StatCard label="Previsto restante" value={fmtAmount(monthlyBudget - m.outs, currency, { decimals: 0 })} sub={`${daysLeft} dias restantes`} accent="neutral" />
          <StatCard label="Sobra projetada" value={fmtAmount(m.balance, currency, { decimals: 0 })} sub="projeção" accent="pos" />
        </div>
        <div className="live-home__section-header">
          <h3 className="live-home__section-title">Últimas transações</h3>
          <button onClick={() => onTabChange('list')} className="live-home__see-all">Ver todas →</button>
        </div>
        <div className="live-home__tx-list">
          {tx.slice(0, 5).map(row => (
            <div key={row.id} className="live-home__tx-item">
              <TransactionRow tx={row} compact displayCurrency={currency} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
