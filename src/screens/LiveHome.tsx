import { useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { monthlyAmount, getRecurringStatuses } from '../utils/recurring';
import type { RecurringStatus } from '../utils/recurring';
import { currentMonthKey, monthLabel } from '../utils/dates';
import { WorkspaceSelector } from '../components/WorkspaceSelector';
import type { Transaction, RecurringTransaction, Payment, Workspace, CurrencyCode } from '../types';
import './LiveHome.scss';

interface LiveHomeProps {
  tx: Transaction[];
  recurring: RecurringTransaction[];
  payments: Payment[];
  currency: CurrencyCode;
  monthlyBudget: number;
  workspaces?: Workspace[];
  activeWorkspace?: string | null;
  onWorkspaceChange?: (id: string | null) => void;
  onNavigateRecurring?: () => void;
  onMarkPaid?: (recurring: RecurringTransaction) => void;
  onVerifyPayments?: () => void;
  onNavigateContas?: () => void;
  fxRates?: Record<string, number>;
}

export function LiveHome({ tx, recurring, payments, currency, monthlyBudget, workspaces = [], activeWorkspace = null, onWorkspaceChange, onNavigateRecurring, onMarkPaid, onVerifyPayments, onNavigateContas, fxRates }: LiveHomeProps) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  const activeRecurring = useMemo(() =>
    recurring.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
  [recurring, activeWorkspace]);

  const recStats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const r of activeRecurring) {
      const monthly = monthlyAmount(r.amount, r.frequency, r.customDays);
      const converted = convertAmount(monthly, r.currency, currency, fxRates);
      if (converted > 0) income += converted;
      else expenses += Math.abs(converted);
    }
    return { income, expenses };
  }, [activeRecurring, currency, fxRates]);

  const billStatuses = useMemo(() =>
    getRecurringStatuses(activeRecurring, tx, currency, fxRates, payments),
  [activeRecurring, tx, currency, fxRates, payments]);

  const pendingBills = useMemo(() =>
    billStatuses.filter((s: RecurringStatus) => s.status !== 'paid'),
  [billStatuses]);

  const paidBills = useMemo(() =>
    billStatuses.filter((s: RecurringStatus) => s.status === 'paid'),
  [billStatuses]);

  const pendingTotal = useMemo(() =>
    pendingBills.reduce((sum, b) => sum + Math.abs(b.monthlyConverted), 0),
  [pendingBills]);

  const paidTotal = useMemo(() =>
    paidBills.reduce((sum, b) => sum + Math.abs(b.monthlyConverted), 0),
  [paidBills]);

  const label = monthLabel(currentMonthKey());

  return (
    <div className="phone-surface live-home">
      <div className="live-home__status-bar"><IOSStatusBar dark={dark} /></div>
      <div className="live-home__scroll no-scrollbar">
        {workspaces.length > 0 && onWorkspaceChange && (
          <WorkspaceSelector workspaces={workspaces} activeId={activeWorkspace} onChange={onWorkspaceChange} />
        )}

        {/* Month summary card */}
        <div className="live-home__summary-card">
          <div className="live-home__summary-month">{label}</div>
          <div className="live-home__summary-row">
            <div className="live-home__summary-block">
              <span className="live-home__summary-label">Pendente</span>
              <span className="live-home__summary-value live-home__summary-value--pending">
                {fmtAmount(pendingTotal, currency, { decimals: 0 })}
              </span>
            </div>
            <div className="live-home__summary-divider" />
            <div className="live-home__summary-block">
              <span className="live-home__summary-label">Pago</span>
              <span className="live-home__summary-value live-home__summary-value--paid">
                {fmtAmount(paidTotal, currency, { decimals: 0 })}
              </span>
            </div>
            {monthlyBudget > 0 && (
              <>
                <div className="live-home__summary-divider" />
                <div className="live-home__summary-block">
                  <span className="live-home__summary-label">Orcamento</span>
                  <span className="live-home__summary-value">
                    {fmtAmount(monthlyBudget, currency, { decimals: 0 })}
                  </span>
                </div>
              </>
            )}
          </div>
          {billStatuses.length > 0 && (
            <div className="live-home__summary-progress">
              <div
                className="live-home__summary-progress-fill"
                style={{ width: `${billStatuses.length > 0 ? Math.round((paidBills.length / billStatuses.length) * 100) : 0}%` }}
              />
            </div>
          )}
          <div className="live-home__summary-progress-label">
            {paidBills.length} de {billStatuses.length} contas pagas
          </div>
        </div>

        {/* Bills section */}
        {billStatuses.length > 0 && (
          <div className="live-home__bills-section">
            <div className="live-home__bills-header">
              <span className="live-home__bills-title">Contas do mes</span>
              {pendingBills.length > 0 && (
                <span className="live-home__bills-badge">{pendingBills.length} pendente{pendingBills.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {pendingBills.length > 0 && (
              <div className="live-home__bills-group">
                {pendingBills.map((item: RecurringStatus) => (
                  <div key={item.recurring.id} className={`live-home__bill-item live-home__bill-item--${item.status}`}>
                    <div className="live-home__bill-icon">
                      <CategoryIcon cat={item.recurring.cat} size={32} radius={8} />
                    </div>
                    <div className="live-home__bill-info">
                      <span className="live-home__bill-desc">{item.recurring.desc}</span>
                      <span className="live-home__bill-meta">
                        {item.recurring.dayOfMonth ? `Dia ${item.recurring.dayOfMonth}` : item.recurring.frequency}
                        {item.status === 'overdue' && ' · Atrasado'}
                      </span>
                    </div>
                    <div className="live-home__bill-amount">
                      {fmtAmount(Math.abs(item.monthlyConverted), currency, { decimals: 0 })}
                    </div>
                    {onMarkPaid && (
                      <button className="live-home__bill-pay-btn" onClick={() => onMarkPaid(item.recurring)}>
                        Pagar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pendingBills.length > 0 && paidBills.length > 0 && (
              <div className="live-home__bills-divider" />
            )}

            {paidBills.length > 0 && (
              <div className="live-home__bills-group">
                {paidBills.map((item: RecurringStatus) => (
                  <div key={item.recurring.id} className="live-home__bill-item live-home__bill-item--paid">
                    <div className="live-home__bill-icon">
                      <CategoryIcon cat={item.recurring.cat} size={32} radius={8} />
                    </div>
                    <div className="live-home__bill-info">
                      <span className="live-home__bill-desc">{item.recurring.desc}</span>
                      <span className="live-home__bill-meta">
                        {item.matchingPayment
                          ? `Pago ${item.matchingPayment.paidDate.slice(8, 10)}/${item.matchingPayment.paidDate.slice(5, 7)}`
                          : item.matchingTx
                            ? `Pago ${item.matchingTx.date.slice(8, 10)}/${item.matchingTx.date.slice(5, 7)}`
                            : 'Pago'}
                      </span>
                    </div>
                    <div className="live-home__bill-amount">
                      {fmtAmount(Math.abs(item.monthlyConverted), currency, { decimals: 0 })}
                    </div>
                    <div className="live-home__bill-check">✓</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verify payments button */}
        {onVerifyPayments && (
          <button className="live-home__verify-btn" onClick={onVerifyPayments}>
            <Icons.alert size={18} color="var(--pos)" />
            <span>Verificar pagamento</span>
          </button>
        )}

        {/* Quick stats */}
        <div className="live-home__quick-stats">
          <div className="live-home__stat-card" onClick={onNavigateContas}>
            <span className="live-home__stat-label">Receita mensal</span>
            <span className="live-home__stat-value live-home__stat-value--pos">
              {fmtAmount(recStats.income, currency, { decimals: 0 })}
            </span>
            <span className="live-home__stat-sub">{activeRecurring.filter(r => r.amount > 0).length} entradas</span>
          </div>
          <div className="live-home__stat-card" onClick={onNavigateContas}>
            <span className="live-home__stat-label">Despesa mensal</span>
            <span className="live-home__stat-value live-home__stat-value--neg">
              {fmtAmount(recStats.expenses, currency, { decimals: 0 })}
            </span>
            <span className="live-home__stat-sub">{activeRecurring.filter(r => r.amount < 0).length} saidas</span>
          </div>
        </div>

        {/* Quick links */}
        <div className="live-home__quick-links">
          <button className="live-home__quick-link" onClick={onNavigateContas}>
            Ver todas as contas →
          </button>
          <button className="live-home__quick-link" onClick={onNavigateRecurring}>
            Gerenciar recorrentes →
          </button>
        </div>
      </div>
    </div>
  );
}

