import './CategoryIcon.scss';
import { Icons } from './icons/Icons';
import { CATS } from '../data/categories';

interface CategoryIconProps {
  cat?: string;
  size?: number;
  radius?: number;
}

export function CategoryIcon({ cat = 'outros', size = 36, radius = 10 }: CategoryIconProps) {
  const c = CATS[cat] || CATS.outros;
  const Ic = Icons[c.icon] || Icons.wallet;
  return (
    <div
      className="category-icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `color-mix(in oklch, ${c.color} 18%, transparent)`,
        color: c.color,
      }}
    >
      <Ic size={Math.round(size * 0.5)} stroke={2} />
    </div>
  );
}
