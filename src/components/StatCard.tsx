import { Icons } from './icons/Icons';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'pos' | 'neg' | 'warn' | 'neutral';
  icon?: string;
}

export function StatCard({ label, value, sub, accent = 'neutral', icon }: StatCardProps) {
  const colors: Record<string, string> = {
    pos:'var(--pos)', neg:'var(--neg)', warn:'var(--warn)', neutral:'var(--text-1)',
  };
  const Ic = icon ? Icons[icon] : undefined;
  return (
    <div style={{
      background:'var(--bg-1)',border:'1px solid var(--border-1)',
      borderRadius:'var(--r-card-sm)',padding:'12px 14px 14px',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <span style={{fontSize:10.5,color:'var(--text-3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:0.8}}>{label}</span>
        {Ic && <Ic size={13} color={colors[accent]} stroke={2.2}/>}
      </div>
      <div className="money" style={{fontSize:22,fontWeight:600,letterSpacing:-0.8,color:colors[accent],lineHeight:1.1}}>{value}</div>
      {sub && <div className="money" style={{fontSize:11,color:'var(--text-3)',marginTop:4,fontFamily:'var(--font-mono)'}}>{sub}</div>}
    </div>
  );
}
