import React from 'react';

interface BarChartDatum {
  label: string;
  value: number;
  forecast?: boolean;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => d.value || 0));
  return (
    <div style={{padding:'8px 0'}}>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,height,padding:'0 4px'}}>
        {data.map((d,i)=>{
          const h = max ? (d.value / max) * (height - 24) : 0;
          const isFc = d.forecast;
          return (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <div className="money" style={{
                fontSize:10,fontFamily:'var(--font-mono)',
                color: isFc?'var(--pos)':'var(--text-3)',
                fontWeight:isFc?600:400,
              }}>
                {(d.value/1000).toFixed(1)}k
              </div>
              <div style={{
                width:'100%',height:h,
                background: isFc ? 'transparent' : 'var(--text-1)',
                border: isFc ? '1.5px dashed var(--pos)' : 'none',
                borderRadius:2,position:'relative',
              }}>
                {isFc && <div style={{position:'absolute',inset:0,background:'var(--pos)',opacity:0.12,borderRadius:2}}/>}
              </div>
              <div style={{fontSize:10,color: isFc?'var(--pos)':'var(--text-3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:0.5,fontWeight: isFc?600:400}}>
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
