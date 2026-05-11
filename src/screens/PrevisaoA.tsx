import { useMemo } from 'react';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { EmptyPrevisao } from './EmptyPrevisao';
import { nextMonthLabel } from '../utils/dates';
import type { Transaction, CurrencyCode } from '../types';

interface PrevisaoAProps {
  tx: Transaction[];
  currency: CurrencyCode;
}

export function PrevisaoA({ tx, currency }: PrevisaoAProps) {
  const stats = useMemo(() => {
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
    const categories = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { ins, outs, balance: ins - outs, categories };
  }, [tx, currency]);

  if (tx.length === 0) return <EmptyPrevisao />;

  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Forecast A">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:100,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 16px'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1.2,textTransform:'uppercase',marginBottom:4}}>PREVISÃO PARA</div>
          <h1 style={{fontSize:28,fontWeight:600,letterSpacing:-0.8,margin:0,color:'var(--text-1)'}}>{nextMonthLabel()}</h1>
        </div>

        <div style={{margin:'0 16px 14px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card)',padding:'18px 18px 20px'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.8,textTransform:'uppercase',marginBottom:4}}>Saldo atual do mês</div>
          <div className="money" style={{fontSize:42,fontWeight:600,letterSpacing:-1.8,lineHeight:1,color: stats.balance >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
            {fmtAmount(stats.balance, currency, {decimals:0})}
          </div>
          <div style={{fontSize:12,color:'var(--text-3)',marginTop:8,lineHeight:1.45}}>
            Dados insuficientes para projeção completa. Continue adicionando transações.
          </div>
        </div>

        <div style={{padding:'4px 16px 6px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <h3 style={{fontSize:13,fontWeight:600,color:'var(--text-2)',margin:0,letterSpacing:0.5,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Gastos por categoria</h3>
          <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>{stats.categories.length} categorias</span>
        </div>
        <div style={{margin:'4px 16px 14px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)'}}>
          {stats.categories.length === 0 ? (
            <div style={{padding:'20px 14px',textAlign:'center',color:'var(--text-3)',fontSize:13,fontFamily:'var(--font-mono)'}}>
              Sem dados de gastos
            </div>
          ) : stats.categories.map(([cat, amount], idx, arr) => (
            <div key={cat} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom: idx<arr.length-1?'1px solid var(--border-1)':'none'}}>
              <CategoryIcon cat={cat} size={28} radius={8}/>
              <div style={{flex:1,fontSize:13.5,color:'var(--text-1)',fontWeight:500}}>{CATS[cat]?.label ?? cat}</div>
              <span className="money" style={{fontSize:13,fontWeight:600,color:'var(--text-1)',minWidth:80,textAlign:'right'}}>
                −{fmtAmount(amount, currency, {decimals:0}).replace('−','')}
              </span>
            </div>
          ))}
        </div>

        <div style={{margin:'0 16px 14px',padding:'18px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card)'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.5,textTransform:'uppercase',marginBottom:4}}>Entradas</div>
              <div className="money" style={{fontSize:20,fontWeight:600,color:'var(--pos)',letterSpacing:-0.5}}>{fmtAmount(stats.ins, currency, {decimals:0})}</div>
            </div>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.5,textTransform:'uppercase',marginBottom:4}}>Saídas</div>
              <div className="money" style={{fontSize:20,fontWeight:600,color:'var(--neg)',letterSpacing:-0.5}}>{fmtAmount(stats.outs, currency, {decimals:0})}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
