import { Icons } from './icons/Icons';
import { fmtAmount, convertAmount } from '../utils/formatters';
import type { CurrencyCode } from '../types';

interface BalanceCardProps {
  value: number;
  delta: number;
  currency?: CurrencyCode;
  month?: string;
  kind?: 'a' | 'b';
}

export function BalanceCard({ value, delta, currency = 'BRL', month = 'Maio · 2026', kind = 'a' }: BalanceCardProps) {
  const positive = value >= 0;
  const secondaryCurrency: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
  const secondaryValue = convertAmount(value, currency, secondaryCurrency);

  if (kind === 'b') {
    return (
      <div style={{
        background: 'var(--bg-1)', border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-card)', padding: '20px 20px 22px',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontSize:13,color:'var(--text-3)',letterSpacing:0.2,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>Saldo do mês</span>
          <span style={{
            fontSize:11,color: delta>=0?'var(--pos)':'var(--neg)',
            background: delta>=0?'var(--pos-bg)':'var(--neg-bg)',
            padding:'3px 7px',borderRadius:'var(--r-pill)',
            fontFamily:'var(--font-mono)',fontWeight:500,
          }} className="tabular">
            {delta>=0?'+':'−'}{Math.abs(delta).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}% vs abr
          </span>
        </div>
        <div className="money" style={{fontSize:38,fontWeight:600,letterSpacing:-1.4,lineHeight:1.05,marginTop:4}}>
          {fmtAmount(value, currency)}
        </div>
        <div className="money" style={{fontSize:13,color:'var(--text-3)',marginTop:6,fontFamily:'var(--font-mono)'}}>
          ≈ {fmtAmount(secondaryValue, secondaryCurrency, {decimals:0})}
        </div>
      </div>
    );
  }
  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border-1)',
      borderRadius: 'var(--r-card)', padding: '16px 18px 20px', position:'relative',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:11,color:'var(--text-3)',letterSpacing:1.2,textTransform:'uppercase',fontFamily:'var(--font-mono)'}}>SALDO · {month.toUpperCase()}</div>
        </div>
        <div style={{
          fontSize:11,color: delta>=0?'var(--pos)':'var(--neg)',
          fontFamily:'var(--font-mono)',fontWeight:500,
          display:'flex',alignItems:'center',gap:3,
        }} className="tabular">
          {delta>=0? <Icons.arrowUp size={11} stroke={2.4}/> : <Icons.arrowDown size={11} stroke={2.4}/>}
          {Math.abs(delta).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%
        </div>
      </div>
      <div className="money" style={{
        fontSize:54,fontWeight:600,letterSpacing:-2.4,lineHeight:0.98,marginTop:10,
        color: positive?'var(--text-1)':'var(--neg)',
      }}>
        {fmtAmount(value, currency)}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
        <div style={{height:1,flex:1,background:'var(--border-1)'}}/>
        <span className="money" style={{fontSize:12,color:'var(--text-3)',fontFamily:'var(--font-mono)'}}>
          ≈ {fmtAmount(secondaryValue, secondaryCurrency, {decimals:0})}
        </span>
      </div>
    </div>
  );
}
