import React, { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { aiInsights } from '../utils/api';
import type { FabKind } from '../types';

interface InsightsData {
  summary: string;
  patterns: string[];
  alerts: string[];
  tips: string[];
}

function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div style={{
      background: 'var(--bg-1)', borderRadius: 'var(--r-card, 16px)',
      border: '1px solid var(--border-1)', padding: 18, height,
      animation: 'skeletonPulse 1.5s infinite ease-in-out',
    }}>
      <div style={{ width: '40%', height: 12, borderRadius: 6, background: 'var(--bg-3)', marginBottom: 12 }} />
      <div style={{ width: '90%', height: 10, borderRadius: 5, background: 'var(--bg-3)', marginBottom: 8 }} />
      <div style={{ width: '70%', height: 10, borderRadius: 5, background: 'var(--bg-3)' }} />
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border-1)',
      borderRadius: 'var(--r-card, 16px)',
      padding: 18,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {icon}
      <span style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
        color: color ?? 'var(--text-1)', textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}
      </span>
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3, flexShrink: 0, marginTop: 6,
            background: color ?? 'var(--text-3)',
          }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AiInsights({ fabKind: _fabKind, onBack }: { fabKind: FabKind; onBack?: () => void }) {
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    aiInsights('2026-05').then(setData);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)' }}>
      <IOSStatusBar />

      {/* Header */}
      <div style={{
        padding: '8px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border-1)',
        background: 'var(--bg-1)',
      }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.alert size={20} color="var(--pos)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 17, color: 'var(--text-1)' }}>
          Insights · Mai 2026
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!data ? (
          <>
            <SkeletonCard height={100} />
            <SkeletonCard height={90} />
            <SkeletonCard height={80} />
            <SkeletonCard height={80} />
          </>
        ) : (
          <>
            {/* Summary */}
            <Card>
              <CardHeader
                icon={<Icons.trending size={18} color="var(--pos)" />}
                label="Resumo"
              />
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-1)',
                lineHeight: 1.6, margin: 0,
              }}>
                {data.summary}
              </p>
            </Card>

            {/* Patterns */}
            <Card>
              <CardHeader
                icon={<Icons.search size={18} color="var(--text-2)" />}
                label="Padrões"
              />
              <BulletList items={data.patterns} color="var(--pos)" />
            </Card>

            {/* Alerts */}
            <Card style={{
              background: 'color-mix(in oklch, var(--neg) 8%, var(--bg-1))',
              borderColor: 'color-mix(in oklch, var(--neg) 25%, var(--border-1))',
            }}>
              <CardHeader
                icon={<Icons.alert size={18} color="var(--neg)" />}
                label="Alertas"
                color="var(--neg)"
              />
              <BulletList items={data.alerts} color="var(--neg)" />
            </Card>

            {/* Tips */}
            <Card style={{
              background: 'color-mix(in oklch, var(--pos) 8%, var(--bg-1))',
              borderColor: 'color-mix(in oklch, var(--pos) 25%, var(--border-1))',
            }}>
              <CardHeader
                icon={<Icons.trending size={18} color="var(--pos)" />}
                label="Dicas"
                color="var(--pos)"
              />
              <BulletList items={data.tips} color="var(--pos)" />
            </Card>
          </>
        )}
      </div>

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
