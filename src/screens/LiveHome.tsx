import { useMemo } from 'react';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { MonthSelector } from '../components/MonthSelector';
import { BalanceCard } from '../components/BalanceCard';
import { BudgetBar } from '../components/BudgetBar';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';
import { fmtAmount, convertAmount } from '../utils/formatters';
import type { Transaction, TabId, CurrencyCode } from '../types';

interface LiveHomeProps {
  tx: Transaction[];
  currency: CurrencyCode;
  onTabChange: (tab: TabId) => void;
}

export function LiveHome({ tx, currency, onTabChange }: LiveHomeProps) {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const m = useMemo(() => {
    let ins = 0;
    let outs = 0;
    for (const item of tx) {
      const converted = convertAmount(item.amount, item.currency, currency);
      if (converted > 0) ins += converted;
      else outs += Math.abs(converted);
    }
    return { ins, outs, balance: ins - outs };
  }, [tx, currency]);

  return (
    <div className="phone-surface" style={{ height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}><IOSStatusBar dark={dark} /></div>
      <div style={{ height: '100%', overflow: 'auto', paddingTop: 50, paddingBottom: 200 }} className="no-scrollbar">
        <MonthSelector month="Maio" year={2026} />
        <div style={{ padding: '4px 16px 14px' }} key={m.balance}>
          <div style={{ animation: 'countup .3s ease' }}>
            <BalanceCard value={m.balance} delta={12.4} month="Maio · 2026" currency={currency} kind="a" />
          </div>
        </div>
        <div style={{ padding: '0 16px 14px' }}>
          <BudgetBar spent={m.outs} budget={9500} label="Orçamento mensal" />
        </div>
        <div style={{ padding: '0 16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard label="Entradas" value={fmtAmount(m.ins, currency, { decimals: 0 })} sub="+R$ 0 vs abr" accent="pos" icon="arrowDown" />
          <StatCard label="Saídas" value={fmtAmount(m.outs, currency, { decimals: 0 })} sub="−R$ 412 vs abr" accent="neg" icon="arrowUp" />
          <StatCard label="Previsto restante" value={fmtAmount(9500 - m.outs, currency, { decimals: 0 })} sub="14 dias restantes" accent="neutral" />
          <StatCard label="Sobra projetada" value={fmtAmount(m.balance - 200, currency, { decimals: 0 })} sub="+5.1% vs média" accent="pos" />
        </div>
        <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Últimas transações</h3>
          <button onClick={() => onTabChange('list')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Ver todas →</button>
        </div>
        <div style={{ padding: '0 16px' }}>
          {tx.slice(0, 5).map(row => (
            <div key={row.id} style={{ borderBottom: '1px solid var(--border-1)' }}>
              <TransactionRow tx={row} compact displayCurrency={currency} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
