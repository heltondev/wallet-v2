import { useMemo } from 'react';
import { CATS } from '../data/categories';
import { fmtAmount, convertAmount } from '../utils/formatters';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { CategoryIcon } from '../components/CategoryIcon';
import { EmptyPrevisao } from './EmptyPrevisao';
import { nextMonthLabel } from '../utils/dates';
import type { Transaction, CurrencyCode } from '../types';
import './PrevisaoA.scss';

interface PrevisaoAProps {
  tx: Transaction[];
  currency: CurrencyCode;
}

export function PrevisaoA({ tx, currency }: PrevisaoAProps) {
  const stats = useMemo(() => {
    let ins = 0;
    let outs = 0;
    const byCat: Record<string, number> = {};
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted > 0) ins += converted;
      else {
        const abs = Math.abs(converted);
        outs += abs;
        const cat = item.cat || 'outros';
        byCat[cat] = (byCat[cat] || 0) + abs;
      }
    }
    const categories = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return { ins, outs, balance: ins - outs, categories };
  }, [tx, currency]);

  if (tx.length === 0) return <EmptyPrevisao />;

  return (
    <div className="phone-surface forecast-screen" data-screen-label="Forecast A">
      <div className="forecast-screen__status-bar"><IOSStatusBar/></div>
      <div className="forecast-screen__scroll no-scrollbar">
        <div className="forecast-screen__header">
          <div className="forecast-screen__label">PREVISÃO PARA</div>
          <h1 className="forecast-screen__title">{nextMonthLabel()}</h1>
        </div>

        <div className="forecast-screen__balance-card">
          <div className="forecast-screen__balance-label">Saldo atual do mês</div>
          <div className="money forecast-screen__balance-value" style={{ color: stats.balance >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
            {fmtAmount(stats.balance, currency, {decimals:0})}
          </div>
          <div className="forecast-screen__balance-note">
            Dados insuficientes para projeção completa. Continue adicionando transações.
          </div>
        </div>

        <div className="forecast-screen__section-header">
          <h3 className="forecast-screen__section-title">Gastos por categoria</h3>
          <span className="forecast-screen__section-count">{stats.categories.length} categorias</span>
        </div>
        <div className="forecast-screen__cat-list">
          {stats.categories.length === 0 ? (
            <div className="forecast-screen__cat-empty">
              Sem dados de gastos
            </div>
          ) : stats.categories.map(([cat, amount]) => (
            <div key={cat} className="forecast-screen__cat-row">
              <CategoryIcon cat={cat} size={28} radius={8}/>
              <div className="forecast-screen__cat-name">{CATS[cat]?.label ?? cat}</div>
              <span className="money forecast-screen__cat-amount">
                −{fmtAmount(amount, currency, {decimals:0}).replace('−','')}
              </span>
            </div>
          ))}
        </div>

        <div className="forecast-screen__summary-card">
          <div className="forecast-screen__summary-grid">
            <div>
              <div className="forecast-screen__summary-label">Entradas</div>
              <div className="money forecast-screen__summary-value forecast-screen__summary-value--pos">{fmtAmount(stats.ins, currency, {decimals:0})}</div>
            </div>
            <div>
              <div className="forecast-screen__summary-label">Saídas</div>
              <div className="money forecast-screen__summary-value forecast-screen__summary-value--neg">{fmtAmount(stats.outs, currency, {decimals:0})}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
