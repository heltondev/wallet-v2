import React from 'react';
import './SegmentedToggle.scss';

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
    <div className="segmented-toggle">
      {options.map(o=>(
        <button
          key={o.id}
          onClick={()=>onChange&&onChange(o.id)}
          className={`segmented-toggle__option ${value === o.id ? 'segmented-toggle__option--active' : ''}`}
          style={value === o.id && o.color ? { color: o.color } : undefined}
        >{o.label}</button>
      ))}
    </div>
  );
};
