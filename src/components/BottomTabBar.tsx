import React from 'react';
import { Icons } from './icons/Icons';
import type { FabKind, TabId } from '../types';
import './BottomTabBar.scss';

interface BottomTabBarProps {
  active?: TabId;
  onChange?: (id: TabId) => void;
  fabKind?: FabKind;
  onAdd?: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ active = 'home', onChange, fabKind = 'circle', onAdd }) => {
  const tabs = [
    { id:'home', label:'Home', icon:'home' },
    { id:'list', label:'Contas', icon:'repeat' },
    ...(fabKind==='tab' ? [{ id:'add', label:'', icon:'plus', center:true }] : []),
    { id:'forecast', label:'Previsao', icon:'trending' },
    { id:'cats', label:'Categorias', icon:'grid' },
    ...(fabKind!=='tab' ? [{ id:'settings', label:'Ajustes', icon:'settings' }] : []),
  ];
  return (
    <div className="bottom-tab-bar">
      {tabs.map(tab=>{
        const Ic = Icons[tab.icon as keyof typeof Icons];
        const isActive = tab.id === active;
        if ('center' in tab && tab.center) return (
          <button key={tab.id} onClick={onAdd} className="bottom-tab-bar__center-btn">
            <Ic size={22} color="#0A0A0A" stroke={2.5}/>
          </button>
        );
        return (
          <button key={tab.id} onClick={()=>onChange&&onChange(tab.id as TabId)} className={`bottom-tab-bar__tab ${isActive ? 'bottom-tab-bar__tab--active' : ''}`}>
            <Ic size={20} stroke={isActive?2.2:1.7}/>
            <span className={`bottom-tab-bar__tab-label ${isActive ? 'bottom-tab-bar__tab-label--active' : ''}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
