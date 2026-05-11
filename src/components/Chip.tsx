import type { ReactNode } from 'react';
import { Icons } from './icons/Icons';
import './Chip.scss';

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
    <button onClick={onClick} className={`chip ${active ? 'chip--active' : 'chip--inactive'}`}>
      {leadingDot && <span className="chip__dot" style={{ background: color || 'var(--pos)' }}/>}
      {Ic && <Ic size={13}/>}
      {children}
    </button>
  );
}
