import React from 'react';
import './BottomSheet.scss';

interface BottomSheetProps {
  children: React.ReactNode;
  height?: number;
  dim?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ children, height = 600, dim = true }) => {
  return (
    <div className="bottom-sheet">
      {dim && <div className="bottom-sheet__backdrop"/>}
      <div className="bottom-sheet__panel" style={{ height }}>
        {/* grip */}
        <div className="bottom-sheet__grip"/>
        {children}
      </div>
    </div>
  );
};
