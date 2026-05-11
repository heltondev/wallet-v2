import React from 'react';
import { Icons } from './icons/Icons';
import { currentMonth, currentYear, surroundingMonthsShort } from '../utils/dates';

interface MonthSelectorProps {
  month?: string;
  year?: number;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ month = currentMonth(), year = currentYear() }) => {
  const months = surroundingMonthsShort();
  const activeIdx = 2;
  return (
    <div style={{padding:'8px 16px 12px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}>
          <Icons.chevL size={20}/>
        </button>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',letterSpacing:1.2,textTransform:'uppercase'}}>{year}</div>
          <div style={{fontSize:22,fontWeight:600,color:'var(--text-1)',letterSpacing:-0.5,display:'flex',alignItems:'center',gap:4,justifyContent:'center'}}>
            {month}
            <Icons.chevD size={16} color="var(--text-3)"/>
          </div>
        </div>
        <button style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4}}>
          <Icons.chevR size={20}/>
        </button>
      </div>
      <div style={{display:'flex',gap:0,position:'relative'}}>
        {months.map((m,i)=>(
          <div key={m} style={{
            flex:1,textAlign:'center',padding:'6px 0',
            fontSize:12,fontFamily:'var(--font-mono)',
            color: i===activeIdx?'var(--text-1)':'var(--text-4)',
            fontWeight: i===activeIdx?600:400,
            position:'relative',
          }}>
            {m}
            {i===activeIdx && <div style={{position:'absolute',bottom:-1,left:'30%',right:'30%',height:2,background:'var(--pos)'}}/>}
          </div>
        ))}
        <div style={{position:'absolute',bottom:-1,left:0,right:0,height:1,background:'var(--border-1)',zIndex:-1}}/>
      </div>
    </div>
  );
};
