import { CATS } from '../data/categories';
import { fmtBRL } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import type { Transaction } from '../types';

interface TransactionRowProps {
  tx: Transaction;
  compact?: boolean;
  onClick?: () => void;
}

export function TransactionRow({ tx, compact = false, onClick }: TransactionRowProps) {
  const c = CATS[tx.cat] || CATS.outros;
  const positive = tx.amount > 0;
  return (
    <div onClick={onClick} style={{
      display:'flex',alignItems:'center',gap:12,
      padding: compact?'10px 0':'12px 0',
      cursor: onClick?'pointer':'default',
    }}>
      <CategoryIcon cat={tx.cat} size={compact?34:38}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14.5,fontWeight:500,color:'var(--text-1)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.desc}</div>
        <div style={{fontSize:12,color:'var(--text-3)',marginTop:1,display:'flex',alignItems:'center',gap:6}}>
          <span>{c.label}</span>
          {tx.account && <><span style={{opacity:0.5}}>&middot;</span><span>{tx.account}</span></>}
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <div className="money" style={{
          fontSize:14.5,fontWeight:600,
          color: positive?'var(--pos)':'var(--text-1)',
          letterSpacing:-0.2,
        }}>
          {positive?'+':'\u2212'}{fmtBRL(Math.abs(tx.amount)).replace('\u2212','')}
        </div>
        {tx.amount_usd && <div className="money" style={{fontSize:11,color:'var(--text-4)',marginTop:1,fontFamily:'var(--font-mono)'}}>\u2248 ${Math.abs(tx.amount_usd).toFixed(0)}</div>}
      </div>
    </div>
  );
}
