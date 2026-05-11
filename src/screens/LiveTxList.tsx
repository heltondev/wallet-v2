import { useState, useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { Chip } from '../components/Chip';
import { TransactionGroup } from '../components/TransactionGroup';
import { TransactionRow } from '../components/TransactionRow';
import { convertAmount } from '../utils/formatters';
import type { Transaction, CurrencyCode } from '../types';
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
}

export function LiveTxList({ tx, displayCurrency }: LiveTxListProps) {
  const [filter, setFilter] = useState<'all' | 'out' | 'in'>('all');
  const filtered = useMemo(()=>{
    if (filter==='out') return tx.filter(item=>item.amount<0);
    if (filter==='in') return tx.filter(item=>item.amount>0);
    return tx;
  },[tx,filter]);
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
        <div className="live-tx-list__header">
          <h1 className="live-tx-list__title">Transações</h1>
          <button className="live-tx-list__search-btn">
            <Icons.search size={17} color="var(--text-2)"/>
          </button>
        </div>
        <div className="live-tx-list__chips no-scrollbar">
          <Chip active={filter==='all'} onClick={()=>setFilter('all')}>Todas</Chip>
          <Chip active={filter==='out'} onClick={()=>setFilter('out')}>Saídas</Chip>
          <Chip active={filter==='in'}  onClick={()=>setFilter('in')}>Entradas</Chip>
          <Chip leadingIcon="filter">Filtros</Chip>
        </div>
        {grouped.map(grp=>(
          <TransactionGroup key={grp.day+grp.wd} day={grp.day} weekday={grp.wd.toUpperCase()+(grp.day==='14'?' · HOJE':'')} total={grp.total}>
            {grp.items.map(row=>(<TransactionRow key={row.id} tx={row} displayCurrency={displayCurrency}/>))}
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
