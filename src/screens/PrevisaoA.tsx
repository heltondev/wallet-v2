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
    <div className="phone-surface previsao-a" data-screen-label="Forecast A">
      <div className="previsao-a__status-bar"><IOSStatusBar/></div>
      <div className="previsao-a__scroll no-scrollbar">
        <div className="previsao-a__header">
          <div className="previsao-a__label">PREVISÃO PARA</div>
          <h1 className="previsao-a__title">{nextMonthLabel()}</h1>
        </div>

        <div className="previsao-a__balance-card">
          <div className="previsao-a__balance-label">Saldo atual do mês</div>
          <div className="money previsao-a__balance-value" style={{ color: stats.balance >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
            {fmtAmount(stats.balance, currency, {decimals:0})}
          </div>
          <div className="previsao-a__balance-note">
            Dados insuficientes para projeção completa. Continue adicionando transações.
          </div>
        </div>

        <div className="previsao-a__section-header">
          <h3 className="previsao-a__section-title">Gastos por categoria</h3>
          <span className="previsao-a__section-count">{stats.categories.length} categorias</span>
        </div>
        <div className="previsao-a__cat-list">
          {stats.categories.length === 0 ? (
            <div className="previsao-a__cat-empty">
              Sem dados de gastos
            </div>
          ) : stats.categories.map(([cat, amount]) => (
            <div key={cat} className="previsao-a__cat-row">
              <CategoryIcon cat={cat} size={28} radius={8}/>
              <div className="previsao-a__cat-name">{CATS[cat]?.label ?? cat}</div>
              <span className="money previsao-a__cat-amount">
                −{fmtAmount(amount, currency, {decimals:0}).replace('−','')}
              </span>
            </div>
          ))}
        </div>

        <div className="previsao-a__summary-card">
          <div className="previsao-a__summary-grid">
            <div>
              <div className="previsao-a__summary-label">Entradas</div>
              <div className="money previsao-a__summary-value previsao-a__summary-value--pos">{fmtAmount(stats.ins, currency, {decimals:0})}</div>
            </div>
            <div>
              <div className="previsao-a__summary-label">Saídas</div>
              <div className="money previsao-a__summary-value previsao-a__summary-value--neg">{fmtAmount(stats.outs, currency, {decimals:0})}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
