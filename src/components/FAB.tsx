import React from 'react';
import { Icons } from './icons/Icons';
import type { FabKind } from '../types';

interface FABProps {
  kind?: FabKind;
  onClick?: () => void;
}

export const FAB: React.FC<FABProps> = ({ kind = 'circle', onClick }) => {
  if (kind === 'pill') return (
    <button onClick={onClick} style={{
      position:'absolute',bottom:88,left:'50%',transform:'translateX(-50%)',
      height:50,padding:'0 24px',borderRadius:'var(--r-pill)',
      background:'var(--pos)',color:'#0A0A0A',border:'none',
      display:'flex',alignItems:'center',gap:8,fontFamily:'var(--font-sans)',
      fontWeight:600,fontSize:15,cursor:'pointer',
      boxShadow:'0 8px 24px oklch(0.7 0.16 158 / 0.35)',
    }}>
      <Icons.plus size={18} stroke={2.4} color="#0A0A0A"/>
      Adicionar
    </button>
  );
  if (kind === 'tab') return null; // rendered inside BottomTabBar
  return (
    <button onClick={onClick} style={{
      position:'absolute',bottom:84,right:18,
      width:56,height:56,borderRadius:28,
      background:'var(--pos)',color:'#0A0A0A',border:'none',cursor:'pointer',
      display:'flex',alignItems:'center',justifyContent:'center',
      boxShadow:'0 6px 18px oklch(0.7 0.16 158 / 0.4), 0 0 0 4px var(--bg-0)',
    }}>
      <Icons.plus size={26} stroke={2.4} color="#0A0A0A"/>
    </button>
  );
};
