import React from 'react';

interface BottomSheetProps {
  children: React.ReactNode;
  height?: number;
  dim?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ children, height = 600, dim = true }) => {
  return (
    <div style={{position:'absolute',inset:0,zIndex:50,pointerEvents:'none'}}>
      {dim && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(2px)'}}/>}
      <div style={{
        position:'absolute',left:0,right:0,bottom:0,
        background:'var(--bg-1)',
        borderRadius:'24px 24px 0 0',
        borderTop:'1px solid var(--border-1)',
        height,
        padding:'10px 16px 20px',
        boxSizing:'border-box',
        pointerEvents:'auto',
      }}>
        {/* grip */}
        <div style={{width:36,height:4,background:'var(--bg-4)',borderRadius:2,margin:'0 auto 14px'}}/>
        {children}
      </div>
    </div>
  );
};
