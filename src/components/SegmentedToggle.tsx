import React from 'react';

interface SegmentedOption {
  id: string;
  label: string;
  color?: string;
}

interface SegmentedToggleProps {
  value: string;
  options: SegmentedOption[];
  onChange?: (id: string) => void;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ value, options, onChange }) => {
  return (
    <div style={{
      display:'flex',background:'var(--bg-2)',padding:3,borderRadius:'var(--r-pill)',
      gap:2,
    }}>
      {options.map(o=>(
        <button key={o.id} onClick={()=>onChange&&onChange(o.id)} style={{
          flex:1,padding:'9px 0',border:'none',
          background: value===o.id ? 'var(--bg-0)' : 'transparent',
          color: value===o.id ? (o.color||'var(--text-1)') : 'var(--text-3)',
          fontSize:13,fontWeight:600,fontFamily:'var(--font-sans)',
          borderRadius:'var(--r-pill)',cursor:'pointer',
          boxShadow: value===o.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  );
};
