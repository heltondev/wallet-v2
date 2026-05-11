import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { BarChart } from '../components/BarChart';
import type { FabKind } from '../types';

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      <IOSStatusBar />
      <div style={{
        padding: '8px 16px 12px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border-1)', background: 'var(--bg-1)',
      }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.trending size={20} color="var(--text-2)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 17, color: 'var(--text-1)' }}>
          Custos de Infraestrutura
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }} className="no-scrollbar">
        {!data ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            Carregando custos...
          </div>
        ) : (
          <>
            {/* Total card */}
            <div style={{
              background: 'var(--bg-1)', border: '1px solid var(--border-1)',
              borderRadius: 'var(--r-card, 16px)', padding: 18,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                CUSTO MENSAL · MAI 2026
              </div>
              <div className="money" style={{ fontSize: 42, fontWeight: 600, letterSpacing: -1.8, lineHeight: 1, color: 'var(--text-1)' }}>
                ${data.totalMonthly.toFixed(2)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="money" style={{
                  fontSize: 11, color: data.trend <= 0 ? 'var(--pos)' : 'var(--neg)',
                  fontFamily: 'var(--font-mono)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  {data.trend <= 0 ? <Icons.arrowDown size={11} stroke={2.4} /> : <Icons.arrowUp size={11} stroke={2.4} />}
                  {Math.abs(data.trend).toFixed(1)}% vs abr
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-4)' }} />
                <span className="money" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  Projeção: ${data.projectedMonthly.toFixed(2)}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border-1)', margin: '16px -18px 14px' }} />
              <BarChart data={data.history} height={100} />
            </div>

            {/* AWS Services */}
            <div style={{
              background: 'var(--bg-1)', border: '1px solid var(--border-1)',
              borderRadius: 'var(--r-card-sm, 12px)', overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  AWS SERVICES
                </span>
                <span className="money" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                  ${totalAws.toFixed(2)}
                </span>
              </div>
              {data.services.map((svc, i) => (
                <div key={svc.service} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderBottom: i < data.services.length - 1 ? '1px solid var(--border-1)' : 'none',
                }}>
                  <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500 }}>{svc.service}</div>
                  <span className="money" style={{
                    fontSize: 11, color: svc.trend <= 0 ? 'var(--pos)' : 'var(--neg)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {svc.trend > 0 ? '+' : ''}{svc.trend}%
                  </span>
                  <span className="money" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', minWidth: 60, textAlign: 'right' }}>
                    ${svc.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Usage */}
            <div style={{
              background: 'var(--bg-1)', border: '1px solid var(--border-1)',
              borderRadius: 'var(--r-card-sm, 12px)', overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  OPENAI · USAGE
                </span>
                <span className="money" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                  ${totalAi.toFixed(2)}
                </span>
              </div>
              {data.aiUsage.map((u, i) => (
                <div key={u.feature} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderBottom: i < data.aiUsage.length - 1 ? '1px solid var(--border-1)' : 'none',
                }}>
                  <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500 }}>{u.feature}</div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {u.calls} calls
                  </span>
                  <span className="money" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', minWidth: 60, textAlign: 'right' }}>
                    ${u.cost.toFixed(2)}
                  </span>
                </div>
              ))}
              {/* Budget bar */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>BUDGET</span>
                  <span className="money" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                    ${totalAi.toFixed(2)} / $5.00
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, (totalAi / 5) * 100)}%`,
                    background: totalAi > 4 ? 'var(--neg)' : totalAi > 3 ? 'var(--warn)' : 'var(--pos)',
                  }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
