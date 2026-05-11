import type { ReactNode } from 'react';
import { fmtBRL } from '../utils/formatters';

interface TransactionGroupProps {
  day: string;
  weekday: string;
  total: number;
  children: ReactNode;
}

export function TransactionGroup({ day, weekday, total, children }: TransactionGroupProps) {
  return (
    <div style={{padding:'0 16px'}}>
      <div style={{
        display:'flex',justifyContent:'space-between',alignItems:'baseline',
        padding:'14px 0 6px',borderBottom:'1px solid var(--border-1)',marginBottom:4,
      }}>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontSize:14,fontWeight:600,color:'var(--text-1)',fontFamily:'var(--font-mono)',letterSpacing:0.2}}>{day}</span>
          <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:0.8}}>{weekday}</span>
        </div>
        <span className="money" style={{fontSize:12,color:'var(--text-3)',fontFamily:'var(--font-mono)',fontWeight:400}}>
          {total>=0?'+':'\u2212'}{fmtBRL(Math.abs(total),{decimals:0}).replace('\u2212','')}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}
