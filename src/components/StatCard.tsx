import './StatCard.scss';
import { Icons } from './icons/Icons';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'pos' | 'neg' | 'warn' | 'neutral';
  icon?: string;
}

export function StatCard({ label, value, sub, accent = 'neutral', icon }: StatCardProps) {
  const colors: Record<string, string> = {
    pos:'var(--pos)', neg:'var(--neg)', warn:'var(--warn)', neutral:'var(--text-1)',
  };
  const Ic = icon ? Icons[icon] : undefined;
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {Ic && <Ic size={13} color={colors[accent]} stroke={2.2}/>}
      </div>
      <div className="money stat-card__value" style={{ color: colors[accent] }}>{value}</div>
      {sub && <div className="money stat-card__sub">{sub}</div>}
    </div>
  );
}
