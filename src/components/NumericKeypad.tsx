import React from 'react';
import './NumericKeypad.scss';

interface NumericKeypadProps {
  onPress?: (key: string) => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ onPress }) => {
  const keys = ['1','2','3','4','5','6','7','8','9',',','0','\u232B'];
  return (
    <div className="numeric-keypad">
      {keys.map(k=>(
        <button key={k} onClick={()=>onPress&&onPress(k)} className="numeric-keypad__key tabular">{k}</button>
      ))}
    </div>
  );
};
