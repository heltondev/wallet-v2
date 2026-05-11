import { useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { currentMonthKey, monthLabelUpper } from '../utils/dates';
import type { Transaction, CurrencyCode } from '../types';

interface CategoriasScreenProps {
  tx: Transaction[];
  currency: CurrencyCode;
}

export function CategoriasScreen({ tx, currency }: CategoriasScreenProps) {
  const data = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted < 0) {
        const cat = item.cat || 'outros';
        byCat[cat] = (byCat[cat] || 0) + Math.abs(converted);
      }
    }
    return Object.entries(byCat)
      .map(([cat, spent]) => ({ cat, spent }))
      .sort((a, b) => b.spent - a.spent);
  }, [tx, currency]);

  const label = monthLabelUpper(currentMonthKey());

  return (
    <div className="phone-surface" style={{height:'100%',position:'relative'}} data-screen-label="Categories">
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10}}><IOSStatusBar/></div>
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:100,overflow:'auto',paddingTop:54,paddingBottom:20}} className="no-scrollbar">
        <div style={{padding:'8px 16px 6px',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <h1 style={{fontSize:24,fontWeight:600,letterSpacing:-0.6,margin:0,color:'var(--text-1)'}}>Categorias</h1>
          <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:0.5,textTransform:'uppercase'}}>{label}</span>
        </div>
        <div style={{padding:'12px 16px 8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {data.map(d => {
            const catMeta = CATS[d.cat];
            return (
              <div key={d.cat} style={{background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card-sm)',padding:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <CategoryIcon cat={d.cat} size={32} radius={8}/>
                </div>
                <div style={{fontSize:13.5,fontWeight:500,color:'var(--text-1)',marginBottom:6}}>{catMeta?.label ?? d.cat}</div>
                <div className="money" style={{fontSize:17,fontWeight:600,letterSpacing:-0.4,color:'var(--text-1)'}}>{fmtAmount(d.spent, currency, {decimals:0})}</div>
                <div className="money" style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',marginTop:1}}>sem orçamento</div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div style={{gridColumn:'1 / -1',padding:'30px 0',textAlign:'center',color:'var(--text-3)',fontSize:13,fontFamily:'var(--font-mono)'}}>
              Sem gastos registrados
            </div>
          )}
          {/* + new category */}
          <button style={{
            background:'transparent',border:'1.5px dashed var(--border-2)',borderRadius:'var(--r-card-sm)',
            padding:14,minHeight:130,color:'var(--text-3)',cursor:'pointer',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
            fontFamily:'var(--font-sans)',fontSize:13,fontWeight:500,
          }}>
            <Icons.plus size={20} color="var(--text-3)"/>
            Nova categoria
          </button>
        </div>
      </div>
    </div>
  );
}
