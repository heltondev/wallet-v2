import React from 'react';
import { Icons } from './icons/Icons';
import type { FabKind } from '../types';
import './FAB.scss';

interface FABProps {
  kind?: FabKind;
  onClick?: () => void;
}

export const FAB: React.FC<FABProps> = ({ kind = 'circle', onClick }) => {
  if (kind === 'pill') return (
    <button onClick={onClick} className="fab fab--pill">
      <Icons.plus size={18} stroke={2.4} color="#0A0A0A"/>
      Adicionar
    </button>
  );
  if (kind === 'tab') return null;
  return (
    <button onClick={onClick} className="fab fab--circle">
      <Icons.plus size={26} stroke={2.4} color="#0A0A0A"/>
    </button>
  );
};
