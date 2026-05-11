import { useMemo } from 'react';
import { Icons } from '../components/icons/Icons';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { currentMonthKey, monthLabelUpper } from '../utils/dates';
import type { Transaction, CurrencyCode } from '../types';
import './CategoriasScreen.scss';

interface CategoriasScreenProps {
  tx: Transaction[];
  currency: CurrencyCode;
  workspaceId?: string | null;
}

export function CategoriasScreen({ tx, currency }: CategoriasScreenProps) {
  const data = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted < 0) {
        const cat = item.cat || 'outros';
        byCat[cat] = (byCat[cat] || 0) + Math.abs(converted);
      }
    }
    return Object.entries(byCat)
      .map(([cat, spent]) => ({ cat, spent }))
      .sort((a, b) => b.spent - a.spent);
  }, [tx, currency]);

  const label = monthLabelUpper(currentMonthKey());

  return (
    <div className="phone-surface categories-screen" data-screen-label="Categories">
      <div className="categories-screen__status-bar"><IOSStatusBar/></div>
      <div className="categories-screen__scroll no-scrollbar">
        <div className="categories-screen__header">
          <h1 className="categories-screen__title">Categorias</h1>
          <span className="categories-screen__month">{label}</span>
        </div>
        <div className="categories-screen__grid">
          {data.map(d => {
            const catMeta = CATS[d.cat];
            return (
              <div key={d.cat} className="categories-screen__card">
                <div className="categories-screen__card-top">
                  <CategoryIcon cat={d.cat} size={32} radius={8}/>
                </div>
                <div className="categories-screen__card-label">{catMeta?.label ?? d.cat}</div>
                <div className="money categories-screen__card-amount">{fmtAmount(d.spent, currency, {decimals:0})}</div>
                <div className="money categories-screen__card-budget">sem orçamento</div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="categories-screen__empty">
              Sem gastos registrados
            </div>
          )}
          {/* + new category */}
          <button className="categories-screen__add-btn">
            <Icons.plus size={20} color="var(--text-3)"/>
            Nova categoria
          </button>
        </div>
      </div>
    </div>
  );
}
