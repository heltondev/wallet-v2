import React from 'react';

interface NumericKeypadProps {
  onPress?: (key: string) => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ onPress }) => {
  const keys = ['1','2','3','4','5','6','7','8','9',',','0','\u232B'];
  return (
    <div style={{
      display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:1,
      background:'var(--border-1)',padding:1,borderRadius:'var(--r-card)',
    }}>
      {keys.map(k=>(
        <button key={k} onClick={()=>onPress&&onPress(k)} style={{
          background:'var(--bg-1)',border:'none',color:'var(--text-1)',
          padding:'18px 0',fontSize:24,fontWeight:500,fontFamily:'var(--font-mono)',
          cursor:'pointer',letterSpacing:-0.5,
        }} className="tabular">{k}</button>
      ))}
    </div>
  );
};
