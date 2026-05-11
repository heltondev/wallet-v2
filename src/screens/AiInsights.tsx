import React, { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { aiInsights } from '../lib/api';
import { currentMonthKey, monthLabelShort } from '../utils/dates';
import type { FabKind } from '../types';
import './AiInsights.scss';

interface InsightsData {
  summary: string;
  patterns: string[];
  alerts: string[];
  tips: string[];
}

function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div className="ai-insights__skeleton" style={{ height }}>
      <div className="ai-insights__skeleton-bar ai-insights__skeleton-bar--short" />
      <div className="ai-insights__skeleton-bar ai-insights__skeleton-bar--long" />
      <div className="ai-insights__skeleton-bar ai-insights__skeleton-bar--medium" />
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ai-insights__card ${className ?? ''}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div className="ai-insights__card-header">
      {icon}
      <span className="ai-insights__card-label" style={{ color: color ?? 'var(--text-1)' }}>
        {label}
      </span>
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <div className="ai-insights__bullet-list">
      {items.map((item, i) => (
        <div key={i} className="ai-insights__bullet-item">
          <span className="ai-insights__bullet-dot" style={{ background: color ?? 'var(--text-3)' }} />
          <span className="ai-insights__bullet-text">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AiInsights({ fabKind: _fabKind, onBack }: { fabKind: FabKind; onBack?: () => void }) {
  const [data, setData] = useState<InsightsData | null>(null);
  const monthKey = currentMonthKey();

  useEffect(() => {
    aiInsights(monthKey).then(setData);
  }, [monthKey]);

  const headerLabel = `Insights \u00b7 ${monthLabelShort(monthKey)}`;

  return (
    <div className="ai-insights">
      <IOSStatusBar />

      {/* Header */}
      <div className="ai-insights__header">
        {onBack && (
          <button onClick={onBack} className="ai-insights__back-btn">
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.alert size={20} color="var(--pos)" />
        <span className="ai-insights__title">
          {headerLabel}
        </span>
      </div>

      {/* Content */}
      <div className="ai-insights__content">
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
              <p className="ai-insights__summary">
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
            <Card className="ai-insights__card--alerts">
              <CardHeader
                icon={<Icons.alert size={18} color="var(--neg)" />}
                label="Alertas"
                color="var(--neg)"
              />
              <BulletList items={data.alerts} color="var(--neg)" />
            </Card>

            {/* Tips */}
            <Card className="ai-insights__card--tips">
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
    </div>
  );
}
