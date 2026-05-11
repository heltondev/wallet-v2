import type { ReactNode } from 'react';
import { fmtBRL } from '../utils/formatters';
import './TransactionGroup.scss';

interface TransactionGroupProps {
  day: string;
  weekday: string;
  total: number;
  children: ReactNode;
}

export function TransactionGroup({ day, weekday, total, children }: TransactionGroupProps) {
  return (
    <div className="transaction-group">
      <div className="transaction-group__header">
        <div className="transaction-group__date">
          <span className="transaction-group__day">{day}</span>
          <span className="transaction-group__weekday">{weekday}</span>
        </div>
        <span className="money transaction-group__total">
          {total>=0?'+':'−'}{fmtBRL(Math.abs(total),{decimals:0}).replace('−','')}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}
