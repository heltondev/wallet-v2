import React from 'react';
import { Icons } from './icons/Icons';
import { currentMonth, currentYear, surroundingMonthsShort } from '../utils/dates';
import './MonthSelector.scss';

interface MonthSelectorProps {
  month?: string;
  year?: number;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ month = currentMonth(), year = currentYear() }) => {
  const months = surroundingMonthsShort();
  const activeIdx = 2;
  return (
    <div className="month-selector">
      <div className="month-selector__nav">
        <button className="month-selector__nav-btn">
          <Icons.chevL size={20}/>
        </button>
        <div className="month-selector__center">
          <div className="month-selector__year">{year}</div>
          <div className="month-selector__month">
            {month}
            <Icons.chevD size={16} color="var(--text-3)"/>
          </div>
        </div>
        <button className="month-selector__nav-btn">
          <Icons.chevR size={20}/>
        </button>
      </div>
      <div className="month-selector__months">
        {months.map((m,i)=>(
          <div key={m} className={`month-selector__month-item ${i === activeIdx ? 'month-selector__month-item--active' : ''}`}>
            {m}
            {i===activeIdx && <div className="month-selector__month-indicator"/>}
          </div>
        ))}
        <div className="month-selector__months-line"/>
      </div>
    </div>
  );
};
