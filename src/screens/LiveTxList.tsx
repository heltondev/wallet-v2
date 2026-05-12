import { useState, useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { Chip } from '../components/Chip';
import { CategoryIcon } from '../components/CategoryIcon';
import { fmtAmount } from '../utils/formatters';
import { getRecurringStatuses } from '../utils/recurring';
import type { RecurringStatus } from '../utils/recurring';
import { WorkspaceSelector } from '../components/WorkspaceSelector';
import type { Transaction, RecurringTransaction, Payment, Workspace, CurrencyCode } from '../types';
import './LiveTxList.scss';

type FilterMode = 'all' | 'pending' | 'paid' | 'overdue';

interface LiveTxListProps {
  tx: Transaction[];
  recurring: RecurringTransaction[];
  payments: Payment[];
  displayCurrency: CurrencyCode;
  workspaces?: Workspace[];
  activeWorkspace?: string | null;
  onWorkspaceChange?: (id: string | null) => void;
  onMarkPaid?: (recurring: RecurringTransaction) => void;
  onUndoPayment?: (paymentId: string) => void;
  onVerifyPayments?: () => void;
  onNavigateRecurring?: () => void;
  fxRates?: Record<string, number>;
}

export function LiveTxList({ tx, recurring, payments, displayCurrency, workspaces = [], activeWorkspace = null, onWorkspaceChange, onMarkPaid, onUndoPayment, onVerifyPayments, onNavigateRecurring, fxRates }: LiveTxListProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeRecurring = useMemo(() =>
    recurring.filter(r => r.active && (!activeWorkspace || r.workspaceId === activeWorkspace)),
  [recurring, activeWorkspace]);

  const billStatuses = useMemo(() =>
    getRecurringStatuses(activeRecurring, tx, displayCurrency, fxRates, payments),
  [activeRecurring, tx, displayCurrency, fxRates, payments]);

  const filtered = useMemo(() => {
    let result = billStatuses;
    if (filter === 'pending') result = result.filter(s => s.status === 'pending');
    if (filter === 'paid') result = result.filter(s => s.status === 'paid');
    if (filter === 'overdue') result = result.filter(s => s.status === 'overdue');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.recurring.desc.toLowerCase().includes(q) ||
        s.recurring.cat.toLowerCase().includes(q) ||
        s.recurring.account.toLowerCase().includes(q)
      );
    }
    return result;
  }, [billStatuses, filter, searchQuery]);

  const counts = useMemo(() => ({
    all: billStatuses.length,
    pending: billStatuses.filter(s => s.status === 'pending').length,
    paid: billStatuses.filter(s => s.status === 'paid').length,
    overdue: billStatuses.filter(s => s.status === 'overdue').length,
  }), [billStatuses]);

  return (
    <div className="phone-surface live-tx-list">
      <div className="live-tx-list__status-bar"><IOSStatusBar /></div>
      <div className="live-tx-list__scroll no-scrollbar">
        {workspaces.length > 0 && onWorkspaceChange && (
          <WorkspaceSelector workspaces={workspaces} activeId={activeWorkspace} onChange={onWorkspaceChange} />
        )}
        <div className="live-tx-list__header">
          <h1 className="live-tx-list__title">Contas</h1>
          <div className="live-tx-list__header-actions">
            <button className="live-tx-list__search-btn" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}>
              <Icons.search size={17} color={searchOpen ? 'var(--pos)' : 'var(--text-2)'} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="live-tx-list__search">
            <input
              type="text"
              placeholder="Buscar conta..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="live-tx-list__search-input"
            />
          </div>
        )}

        <div className="live-tx-list__chips no-scrollbar">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>Todas ({counts.all})</Chip>
          <Chip active={filter === 'pending'} onClick={() => setFilter('pending')}>Pendentes ({counts.pending})</Chip>
          <Chip active={filter === 'paid'} onClick={() => setFilter('paid')}>Pagas ({counts.paid})</Chip>
          {counts.overdue > 0 && (
            <Chip active={filter === 'overdue'} onClick={() => setFilter('overdue')}>Atrasadas ({counts.overdue})</Chip>
          )}
        </div>

        {/* Verify payments button */}
        {onVerifyPayments && (
          <button className="live-tx-list__verify-btn" onClick={onVerifyPayments}>
            <Icons.alert size={16} color="var(--pos)" />
            Verificar pagamento
          </button>
        )}

        {/* Bill list */}
        <div className="live-tx-list__bill-list">
          {filtered.map((item: RecurringStatus) => (
            <div key={item.recurring.id}>
              <div
                className={`live-tx-list__bill-item live-tx-list__bill-item--${item.status}`}
                onClick={() => setExpandedId(expandedId === item.recurring.id ? null : item.recurring.id)}
              >
                <div className="live-tx-list__bill-status-dot">
                  {item.status === 'paid' && <Icons.check size={12} color="var(--pos)" />}
                  {item.status === 'pending' && <span className="live-tx-list__dot live-tx-list__dot--pending" />}
                  {item.status === 'overdue' && <span className="live-tx-list__dot live-tx-list__dot--overdue" />}
                </div>
                <div className="live-tx-list__bill-icon">
                  <CategoryIcon cat={item.recurring.cat} size={32} radius={8} />
                </div>
                <div className="live-tx-list__bill-info">
                  <span className="live-tx-list__bill-desc">{item.recurring.desc}</span>
                  <span className="live-tx-list__bill-meta">
                    {item.recurring.dayOfMonth ? `Dia ${item.recurring.dayOfMonth}` : item.recurring.frequency}
                    {item.status === 'overdue' && ' · Atrasado'}
                    {item.status === 'paid' && item.matchingPayment && ` · Pago ${item.matchingPayment.paidDate.slice(8, 10)}/${item.matchingPayment.paidDate.slice(5, 7)}`}
                    {item.status === 'paid' && !item.matchingPayment && item.matchingTx && ` · Pago ${item.matchingTx.date.slice(8, 10)}/${item.matchingTx.date.slice(5, 7)}`}
                  </span>
                </div>
                <div className="live-tx-list__bill-amount">
                  {fmtAmount(Math.abs(item.monthlyConverted), displayCurrency, { decimals: 0 })}
                </div>
                {item.status !== 'paid' && onMarkPaid && (
                  <button
                    className="live-tx-list__bill-pay-btn"
                    onClick={e => { e.stopPropagation(); onMarkPaid(item.recurring); }}
                  >
                    {item.recurring.amount > 0 ? 'Receber' : 'Pagar'}
                  </button>
                )}
              </div>

              {expandedId === item.recurring.id && (
                <div className="live-tx-list__bill-expanded">
                  <div className="live-tx-list__bill-detail">
                    <span className="live-tx-list__bill-detail-label">Conta</span>
                    <span className="live-tx-list__bill-detail-value">{item.recurring.account}</span>
                  </div>
                  <div className="live-tx-list__bill-detail">
                    <span className="live-tx-list__bill-detail-label">Frequencia</span>
                    <span className="live-tx-list__bill-detail-value">{item.recurring.frequency}</span>
                  </div>
                  <div className="live-tx-list__bill-detail">
                    <span className="live-tx-list__bill-detail-label">Valor original</span>
                    <span className="live-tx-list__bill-detail-value">
                      {fmtAmount(Math.abs(item.recurring.amount), item.recurring.currency, { decimals: 2 })}
                    </span>
                  </div>
                  {item.matchingPayment?.notes && (
                    <div className="live-tx-list__bill-detail">
                      <span className="live-tx-list__bill-detail-label">Notas</span>
                      <span className="live-tx-list__bill-detail-value">{item.matchingPayment.notes}</span>
                    </div>
                  )}
                  <div className="live-tx-list__bill-actions">
                    {item.status !== 'paid' && onMarkPaid && (
                      <button className="live-tx-list__action-btn live-tx-list__action-btn--pay" onClick={() => onMarkPaid(item.recurring)}>
                        <Icons.check size={14} color="#0A0A0A" />
                        {item.recurring.amount > 0 ? 'Marcar como recebido' : 'Marcar como pago'}
                      </button>
                    )}
                    {item.status === 'paid' && item.matchingPayment && onUndoPayment && (
                      <button className="live-tx-list__action-btn live-tx-list__action-btn--undo" onClick={() => onUndoPayment(item.matchingPayment!.id)}>
                        <Icons.x size={14} color="var(--neg)" />
                        Desfazer pagamento
                      </button>
                    )}
                    <button className="live-tx-list__action-btn" onClick={onNavigateRecurring}>
                      <Icons.pencil size={14} color="var(--text-2)" />
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="live-tx-list__empty">
            <Icons.repeat size={24} color="var(--text-3)" />
            <p className="live-tx-list__empty-text">
              {filter === 'all' ? 'Nenhuma conta cadastrada.' : 'Nenhuma conta neste filtro.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
