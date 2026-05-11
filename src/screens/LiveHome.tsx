import { useMemo } from 'react';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { MonthSelector } from '../components/MonthSelector';
import { BalanceCard } from '../components/BalanceCard';
import { BudgetBar } from '../components/BudgetBar';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';
import { FAB } from '../components/FAB';
import { BottomTabBar } from '../components/BottomTabBar';
import { fmtBRL } from '../utils/formatters';
import type { Transaction, TabId, FabKind } from '../types';

interface MiniStatProps {
  label: string;
  value: string;
  color: 'pos' | 'neg' | 'neutral';
}

export function MiniStat({ label, value, color }: MiniStatProps) {
  const colors: Record<string, string> = { pos:'var(--pos)', neg:'var(--neg)', neutral:'var(--text-1)' };
  return (
    <div>
      <div style={{fontSize:10.5,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.8,textTransform:'uppercase',marginBottom:3}}>{label}</div>
      <div className="money" style={{fontSize:18,fontWeight:600,color:colors[color],letterSpacing:-0.5}}>{value}</div>
    </div>
  );
}

interface LiveHomeProps {
  tx: Transaction[];
  currency: 'BRL' | 'USD';
  fabKind: FabKind;
  onAdd: () => void;
  onTabChange: (tab: TabId) => void;
}

export function LiveHome({ tx, currency, fabKind, onAdd, onTabChange }: LiveHomeProps) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const m = useMemo(()=>{
    const ins  = tx.filter(item=>item.amount>0).reduce((s,item)=>s+item.amount,0);
    const outs = tx.filter(item=>item.amount<0).reduce((s,item)=>s+Math.abs(item.amount),0);
    return { ins, outs, balance: ins - outs };
  },[tx]);

  return (
    <div className="phone-surface" style={{height:'100%',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar dark={dark}/></div>
      <div style={{height:'100%',overflow:'auto',paddingTop:50,paddingBottom:90}} className="no-scrollbar">
        <MonthSelector month="Maio" year={2026}/>
        <div style={{padding:'4px 16px 14px'}} key={m.balance}>
          <div style={{animation:'countup .3s ease'}}>
            <BalanceCard value={m.balance} delta={12.4} month="Maio · 2026" currency={currency} kind="a"/>
          </div>
        </div>
        <div style={{padding:'0 16px 14px'}}>
          <BudgetBar spent={m.outs} budget={9500} label="Orçamento mensal"/>
        </div>
        <div style={{padding:'0 16px 18px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <StatCard label="Entradas" value={fmtBRL(m.ins,{decimals:0})} sub="+R$ 0 vs abr" accent="pos" icon="arrowDown"/>
          <StatCard label="Saídas" value={fmtBRL(m.outs,{decimals:0})} sub="−R$ 412 vs abr" accent="neg" icon="arrowUp"/>
          <StatCard label="Previsto restante" value={fmtBRL(9500-m.outs,{decimals:0})} sub="14 dias restantes" accent="neutral"/>
          <StatCard label="Sobra projetada" value={fmtBRL(m.balance - 200,{decimals:0})} sub="+5.1% vs média" accent="pos"/>
        </div>
        <div style={{padding:'0 16px 8px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-2)',margin:0,letterSpacing:0.5,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Últimas transações</h3>
          <button onClick={()=>onTabChange('list')} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:12,fontFamily:'var(--font-mono)',cursor:'pointer'}}>Ver todas →</button>
        </div>
        <div style={{padding:'0 16px'}}>
          {tx.slice(0,5).map(row=>(
            <div key={row.id} style={{borderBottom:'1px solid var(--border-1)'}}>
              <TransactionRow tx={row} compact/>
            </div>
          ))}
        </div>
      </div>
      <FAB kind={fabKind} onClick={onAdd}/>
      <BottomTabBar active="home" onChange={onTabChange} fabKind={fabKind} onAdd={onAdd}/>
    </div>
  );
}
