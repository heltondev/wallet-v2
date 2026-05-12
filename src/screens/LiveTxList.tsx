import { useState, useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { Chip } from '../components/Chip';
import { TransactionGroup } from '../components/TransactionGroup';
import { TransactionRow } from '../components/TransactionRow';
import { convertAmount } from '../utils/formatters';
import { WorkspaceSelector } from '../components/WorkspaceSelector';
import type { Transaction, Workspace, CurrencyCode } from '../types';
import './LiveTxList.scss';

interface GroupedDay {
  day: string;
  wd: string;
  items: Transaction[];
  total: number;
}

interface LiveTxListProps {
  tx: Transaction[];
  displayCurrency: CurrencyCode;
  workspaces?: Workspace[];
  activeWorkspace?: string | null;
  onWorkspaceChange?: (id: string | null) => void;
  onDelete?: (txId: number) => void;
  onEdit?: (tx: Transaction) => void;
}

export function LiveTxList({ tx, displayCurrency, workspaces = [], activeWorkspace = null, onWorkspaceChange, onDelete, onEdit }: LiveTxListProps) {
  const [filter, setFilter] = useState<'all' | 'out' | 'in'>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const filtered = useMemo(()=>{
    let result = tx;
    if (filter==='out') result = result.filter(item=>item.amount<0);
    if (filter==='in') result = result.filter(item=>item.amount>0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.desc?.toLowerCase().includes(q) ||
        item.cat?.toLowerCase().includes(q) ||
        item.account?.toLowerCase().includes(q)
      );
    }
    return result;
  },[tx,filter,searchQuery]);
  const grouped = useMemo(()=>{
    const g: Record<string, GroupedDay> = {};
    filtered.forEach(item=>{
      const k = item.day+'_'+item.wd;
      if (!g[k]) g[k] = { day:item.day, wd:item.wd, items:[], total:0 };
      g[k].items.push(item);
      g[k].total += convertAmount(item.amount, item.currency, displayCurrency);
    });
    return Object.values(g);
  },[filtered]);

  return (
    <div className="phone-surface live-tx-list">
      <div className="live-tx-list__status-bar"><IOSStatusBar/></div>
      <div className="live-tx-list__scroll no-scrollbar">
        {workspaces.length > 0 && onWorkspaceChange && (
          <WorkspaceSelector workspaces={workspaces} activeId={activeWorkspace} onChange={onWorkspaceChange} />
        )}
        <div className="live-tx-list__header">
          <h1 className="live-tx-list__title">Transações</h1>
          <button className="live-tx-list__search-btn" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}>
            <Icons.search size={17} color={searchOpen ? 'var(--pos)' : 'var(--text-2)'}/>
          </button>
        </div>
        {searchOpen && (
          <div className="live-tx-list__search">
            <input
              type="text"
              placeholder="Buscar transação..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="live-tx-list__search-input"
            />
          </div>
        )}
        <div className="live-tx-list__chips no-scrollbar">
          <Chip active={filter==='all'} onClick={()=>setFilter('all')}>Todas</Chip>
          <Chip active={filter==='out'} onClick={()=>setFilter('out')}>Saídas</Chip>
          <Chip active={filter==='in'}  onClick={()=>setFilter('in')}>Entradas</Chip>
        </div>
        {grouped.map(grp=>(
          <TransactionGroup key={grp.day+grp.wd} day={grp.day} weekday={grp.wd.toUpperCase()+(grp.day==='14'?' · HOJE':'')} total={grp.total}>
            {grp.items.map(row=>(
              <div key={row.id}>
                <TransactionRow
                  tx={row}
                  displayCurrency={displayCurrency}
                  onClick={() => {
                    setExpandedTxId(expandedTxId === row.id ? null : row.id);
                    setConfirmDeleteId(null);
                  }}
                />
                {expandedTxId === row.id && (
                  <div className="live-tx-list__tx-actions">
                    <button
                      className="live-tx-list__tx-action-btn"
                      onClick={() => onEdit?.(row)}
                    >
                      <Icons.pencil size={14} color="var(--text-2)" />
                      <span>Editar</span>
                    </button>
                    <button
                      className={`live-tx-list__tx-action-btn ${confirmDeleteId === row.id ? 'live-tx-list__tx-action-btn--danger' : ''}`}
                      onClick={() => {
                        if (confirmDeleteId === row.id) {
                          onDelete?.(row.id);
                          setExpandedTxId(null);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(row.id);
                        }
                      }}
                    >
                      <Icons.trash size={14} color={confirmDeleteId === row.id ? 'var(--neg)' : 'var(--text-2)'} />
                      <span>{confirmDeleteId === row.id ? 'Confirmar' : 'Apagar'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </TransactionGroup>
        ))}
        {grouped.length===0 && (
          <div className="live-tx-list__empty">
            <Icons.list size={24} color="var(--text-3)"/>
            <p className="live-tx-list__empty-text">Nada por aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
