import React from 'react';
import { Icons } from './icons/Icons';
import type { FabKind, TabId } from '../types';

interface BottomTabBarProps {
  active?: TabId;
  onChange?: (id: TabId) => void;
  fabKind?: FabKind;
  onAdd?: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ active = 'home', onChange, fabKind = 'circle', onAdd }) => {
  const tabs = [
    { id:'home', label:'Home', icon:'home' },
    { id:'list', label:'Transacoes', icon:'list' },
    ...(fabKind==='tab' ? [{ id:'add', label:'', icon:'plus', center:true }] : []),
    { id:'forecast', label:'Previsao', icon:'trending' },
    { id:'cats', label:'Categorias', icon:'grid' },
    ...(fabKind!=='tab' ? [{ id:'settings', label:'Ajustes', icon:'settings' }] : []),
  ];
  return (
    <div className="bottom-tab-bar" style={{
      position:'fixed',left:0,right:0,bottom:0,
      paddingBottom:'max(8px, env(safe-area-inset-bottom, 0px))',paddingTop:8,
      background:'color-mix(in oklch, var(--bg-0) 92%, transparent)',
      backdropFilter:'blur(20px)',
      borderTop:'1px solid var(--border-1)',
      display:'flex',justifyContent:'space-around',alignItems:'center',
      zIndex:10,
    }}>
      {tabs.map(tab=>{
        const Ic = Icons[tab.icon as keyof typeof Icons];
        const isActive = tab.id === active;
        if ('center' in tab && tab.center) return (
          <button key={tab.id} onClick={onAdd} style={{
            width:48,height:48,borderRadius:'50%',background:'var(--pos)',border:'none',
            display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
            marginTop:-12,boxShadow:'0 4px 12px oklch(0.7 0.16 158 / 0.4)',
          }}>
            <Ic size={22} color="#0A0A0A" stroke={2.5}/>
          </button>
        );
        return (
          <button key={tab.id} onClick={()=>onChange&&onChange(tab.id as TabId)} style={{
            background:'none',border:'none',padding:'4px 8px',cursor:'pointer',
            display:'flex',flexDirection:'column',alignItems:'center',gap:2,
            color: isActive?'var(--text-1)':'var(--text-4)',
          }}>
            <Ic size={20} stroke={isActive?2.2:1.7}/>
            <span style={{fontSize:10,fontWeight:isActive?600:500,letterSpacing:0.1,fontFamily:'var(--font-sans)'}}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
