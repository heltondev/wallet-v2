import React from 'react';
import './BarChart.scss';

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
    <div className="bar-chart">
      <div className="bar-chart__bars" style={{ height }}>
        {data.map((d,i)=>{
          const h = max ? (d.value / max) * (height - 24) : 0;
          const isFc = d.forecast;
          return (
            <div key={i} className="bar-chart__column">
              <div className={`money bar-chart__value ${isFc ? 'bar-chart__value--forecast' : ''}`}>
                {(d.value/1000).toFixed(1)}k
              </div>
              <div
                className={`bar-chart__bar ${isFc ? 'bar-chart__bar--forecast' : ''}`}
                style={{ '--bar-height': h + 'px' } as React.CSSProperties}
              >
                {isFc && <div className="bar-chart__bar-fill"/>}
              </div>
              <div className={`bar-chart__label ${isFc ? 'bar-chart__label--forecast' : ''}`}>
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
