import { useState, useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { Chip } from '../components/Chip';
import { TransactionGroup } from '../components/TransactionGroup';
import { TransactionRow } from '../components/TransactionRow';
import { convertAmount } from '../utils/formatters';
import type { Transaction, CurrencyCode } from '../types';

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
    <div className="phone-surface" style={{height:'100%',position:'relative'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:100,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h1 style={{fontSize:24,fontWeight:600,color:'var(--text-1)',letterSpacing:-0.6,margin:0}}>Transações</h1>
          <button style={{background:'var(--bg-2)',border:'none',width:36,height:36,borderRadius:'var(--r-input)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <Icons.search size={17} color="var(--text-2)"/>
          </button>
        </div>
        <div style={{display:'flex',gap:6,padding:'8px 16px 14px',overflowX:'auto'}} className="no-scrollbar">
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
          <div style={{padding:'80px 24px',textAlign:'center'}}>
            <Icons.list size={24} color="var(--text-3)"/>
            <p style={{fontSize:13,color:'var(--text-3)',marginTop:10,fontFamily:'var(--font-mono)'}}>Nada por aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
