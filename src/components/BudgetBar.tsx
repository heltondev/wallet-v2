import { fmtBRL } from '../utils/formatters';

interface BudgetBarProps {
  spent: number;
  budget: number;
  label?: string;
}

export function BudgetBar({ spent, budget, label = 'Or\u00e7amento' }: BudgetBarProps) {
  const pct = Math.min(100, (spent / budget) * 100);
  const color = pct > 90 ? 'var(--neg)' : pct > 70 ? 'var(--warn)' : 'var(--pos)';
  return (
    <div style={{padding:'14px 16px',background:'var(--bg-1)',border:'1px solid var(--border-1)',borderRadius:'var(--r-card)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
        <span style={{fontSize:13,color:'var(--text-2)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:0.5}}>{label}</span>
        <span className="money" style={{fontSize:13,color:'var(--text-2)'}}>
          <span style={{color:'var(--text-1)',fontWeight:600}}>{fmtBRL(spent,{decimals:0})}</span>
          <span style={{color:'var(--text-4)'}}> / {fmtBRL(budget,{decimals:0})}</span>
        </span>
      </div>
      <div style={{height:8,background:'var(--bg-2)',borderRadius:4,overflow:'hidden',position:'relative'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,transition:'width .4s'}}/>
        {[25,50,75].map(m=>(
          <div key={m} style={{position:'absolute',top:0,bottom:0,left:`${m}%`,width:1,background:'var(--bg-0)',opacity:0.6}}/>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
        <span className="money" style={{fontSize:11,color:color,fontFamily:'var(--font-mono)',fontWeight:500}}>{pct.toFixed(0)}% consumido</span>
        <span className="money" style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>Resta {fmtBRL(budget-spent,{decimals:0})}</span>
      </div>
    </div>
  );
}
