import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BarChart } from '../components/BarChart';
import { currentMonthKey, monthLabelUpper } from '../utils/dates';
import type { FabKind } from '../types';
import './AdminCosts.scss';

interface ServiceCost {
  service: string;
  cost: number;
  trend: number;
}

interface AiUsage {
  feature: string;
  calls: number;
  cost: number;
}

interface CostsData {
  totalMonthly: number;
  projectedMonthly: number;
  trend: number;
  services: ServiceCost[];
  aiUsage: AiUsage[];
  history: { label: string; value: number; forecast?: boolean }[];
}

const MOCK_COSTS: CostsData = {
  totalMonthly: 12.47,
  projectedMonthly: 14.20,
  trend: -8.3,
  services: [
    { service: 'Lambda', cost: 3.21, trend: -12 },
    { service: 'DynamoDB', cost: 2.85, trend: 5 },
    { service: 'S3', cost: 0.42, trend: 0 },
    { service: 'CloudFront', cost: 1.18, trend: 15 },
    { service: 'Cognito', cost: 0.00, trend: 0 },
    { service: 'API Gateway', cost: 1.56, trend: -3 },
  ],
  aiUsage: [
    { feature: 'Categorização', calls: 47, cost: 0.12 },
    { feature: 'OCR Recibos', calls: 8, cost: 0.89 },
    { feature: 'Insights', calls: 3, cost: 0.34 },
    { feature: 'Previsão', calls: 1, cost: 0.45 },
    { feature: 'Chat', calls: 22, cost: 1.45 },
  ],
  history: [
    { label: 'DEZ', value: 8.50 },
    { label: 'JAN', value: 9.20 },
    { label: 'FEV', value: 10.80 },
    { label: 'MAR', value: 11.30 },
    { label: 'ABR', value: 13.60 },
    { label: 'MAI', value: 12.47 },
    { label: 'JUN', value: 14.20, forecast: true },
  ],
};

export function AdminCosts({ fabKind: _fabKind, onBack }: { fabKind: FabKind; onBack?: () => void }) {
  const [data, setData] = useState<CostsData | null>(null);

  useEffect(() => {
    setTimeout(() => setData(MOCK_COSTS), 400);
  }, []);

  const totalAi = data?.aiUsage.reduce((s, u) => s + u.cost, 0) ?? 0;
  const totalAws = data?.services.reduce((s, s2) => s + s2.cost, 0) ?? 0;

  return (
    <div className="admin-costs">
      <IOSStatusBar />
      <div className="admin-costs__header">
        {onBack && (
          <button onClick={onBack} className="admin-costs__back-btn">
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.trending size={20} color="var(--text-2)" />
        <span className="admin-costs__title">
          Custos de Infraestrutura
        </span>
      </div>

      <div className="admin-costs__scroll no-scrollbar">
        {!data ? (
          <div className="admin-costs__loading">
            Carregando custos...
          </div>
        ) : (
          <>
            {/* Total card */}
            <div className="admin-costs__total-card">
              <div className="admin-costs__total-label">
                CUSTO MENSAL · {monthLabelUpper(currentMonthKey())}
              </div>
              <div className="money admin-costs__total-value">
                ${data.totalMonthly.toFixed(2)}
              </div>
              <div className="admin-costs__total-meta">
                <span className={`money admin-costs__trend ${data.trend <= 0 ? 'admin-costs__trend--positive' : 'admin-costs__trend--negative'}`}>
                  {data.trend <= 0 ? <Icons.arrowDown size={11} stroke={2.4} /> : <Icons.arrowUp size={11} stroke={2.4} />}
                  {Math.abs(data.trend).toFixed(1)}% vs mês anterior
                </span>
                <span className="admin-costs__dot" />
                <span className="money admin-costs__projection">
                  Projeção: ${data.projectedMonthly.toFixed(2)}
                </span>
              </div>
              <div className="admin-costs__divider" />
              <BarChart data={data.history} height={100} />
            </div>

            {/* AWS Services */}
            <div className="admin-costs__section">
              <div className="admin-costs__section-header">
                <span className="admin-costs__section-label">
                  AWS SERVICES
                </span>
                <span className="money admin-costs__section-total">
                  ${totalAws.toFixed(2)}
                </span>
              </div>
              {data.services.map((svc) => (
                <div key={svc.service} className="admin-costs__row">
                  <div className="admin-costs__row-name">{svc.service}</div>
                  <span className={`money admin-costs__row-trend`} style={{ color: svc.trend <= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                    {svc.trend > 0 ? '+' : ''}{svc.trend}%
                  </span>
                  <span className="money admin-costs__row-cost">
                    ${svc.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Usage */}
            <div className="admin-costs__section">
              <div className="admin-costs__section-header">
                <span className="admin-costs__section-label">
                  OPENAI · USAGE
                </span>
                <span className="money admin-costs__section-total">
                  ${totalAi.toFixed(2)}
                </span>
              </div>
              {data.aiUsage.map((u) => (
                <div key={u.feature} className="admin-costs__row">
                  <div className="admin-costs__row-name">{u.feature}</div>
                  <span className="admin-costs__row-calls">
                    {u.calls} calls
                  </span>
                  <span className="money admin-costs__row-cost">
                    ${u.cost.toFixed(2)}
                  </span>
                </div>
              ))}
              {/* Budget bar */}
              <div className="admin-costs__budget">
                <div className="admin-costs__budget-header">
                  <span className="admin-costs__budget-label">BUDGET</span>
                  <span className="money admin-costs__budget-label">
                    ${totalAi.toFixed(2)} / $5.00
                  </span>
                </div>
                <div className="admin-costs__budget-track">
                  <div
                    className="admin-costs__budget-fill"
                    style={{
                      width: `${Math.min(100, (totalAi / 5) * 100)}%`,
                      background: totalAi > 4 ? 'var(--neg)' : totalAi > 3 ? 'var(--warn)' : 'var(--pos)',
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
