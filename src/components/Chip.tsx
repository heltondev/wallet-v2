import type { ReactNode } from 'react';
import { Icons } from './icons/Icons';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  color?: string;
  onClick?: () => void;
  leadingDot?: boolean;
  leadingIcon?: string;
}

export function Chip({ children, active, color, onClick, leadingDot, leadingIcon }: ChipProps) {
  const Ic = leadingIcon ? Icons[leadingIcon] : undefined;
  return (
    <button onClick={onClick} style={{
      padding:'7px 12px',borderRadius:'var(--r-pill)',
      background: active ? 'var(--text-1)' : 'var(--bg-1)',
      color: active ? 'var(--bg-0)' : 'var(--text-2)',
      border: `1px solid ${active?'var(--text-1)':'var(--border-1)'}`,
      fontSize:13,fontWeight:500,fontFamily:'var(--font-sans)',
      display:'inline-flex',alignItems:'center',gap:6,cursor:'pointer',whiteSpace:'nowrap',
    }}>
      {leadingDot && <span style={{width:7,height:7,borderRadius:'50%',background:color||'var(--pos)'}}/>}
      {Ic && <Ic size={13}/>}
      {children}
    </button>
  );
}
