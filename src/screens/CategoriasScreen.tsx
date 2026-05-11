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
    <div className="phone-surface categorias" data-screen-label="Categories">
      <div className="categorias__status-bar"><IOSStatusBar/></div>
      <div className="categorias__scroll no-scrollbar">
        <div className="categorias__header">
          <h1 className="categorias__title">Categorias</h1>
          <span className="categorias__month">{label}</span>
        </div>
        <div className="categorias__grid">
          {data.map(d => {
            const catMeta = CATS[d.cat];
            return (
              <div key={d.cat} className="categorias__card">
                <div className="categorias__card-top">
                  <CategoryIcon cat={d.cat} size={32} radius={8}/>
                </div>
                <div className="categorias__card-label">{catMeta?.label ?? d.cat}</div>
                <div className="money categorias__card-amount">{fmtAmount(d.spent, currency, {decimals:0})}</div>
                <div className="money categorias__card-budget">sem orçamento</div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="categorias__empty">
              Sem gastos registrados
            </div>
          )}
          {/* + new category */}
          <button className="categorias__add-btn">
            <Icons.plus size={20} color="var(--text-3)"/>
            Nova categoria
          </button>
        </div>
      </div>
    </div>
  );
}
