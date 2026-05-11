import { useState } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { ReceiptUpload } from '../components/ReceiptUpload';
import { fmtAmount } from '../utils/formatters';
import type { Transaction, FabKind, CurrencyCode } from '../types';

export function ReceiptScreen({ fabKind: _fabKind, onBack, onSave }: {
  fabKind: FabKind;
  onBack?: () => void;
  onSave?: (data: Partial<Transaction>) => void;
}) {
  const [saved, setSaved] = useState<Partial<Transaction> | null>(null);

  const handleExtracted = (data: Partial<Transaction>) => {
    setSaved(data);
    onSave?.(data);
  };

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
        <Icons.search size={20} color="var(--pos)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 17, color: 'var(--text-1)' }}>
          Escanear Recibo
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {saved ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--pos)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.check size={28} color="#0A0A0A" stroke={2.4} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Transação salva!</div>
              <div style={{ fontSize: 14, color: 'var(--text-3)' }}>{saved.desc}</div>
              <div className="money" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', marginTop: 8 }}>
                {fmtAmount(Math.abs(saved.amount ?? 0), (saved.currency ?? 'BRL') as CurrencyCode)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setSaved(null)} style={{
                padding: '12px 20px', borderRadius: 'var(--r-input)', background: 'transparent',
                border: '1px solid var(--border-2)', color: 'var(--text-2)', fontFamily: 'var(--font-sans)',
                fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>Escanear outro</button>
              <button onClick={onBack} style={{
                padding: '12px 20px', borderRadius: 'var(--r-input)', background: 'var(--text-1)',
                color: 'var(--bg-0)', border: 'none', fontFamily: 'var(--font-sans)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Voltar</button>
            </div>
          </div>
        ) : (
          <ReceiptUpload onExtracted={handleExtracted} onClose={() => onBack?.()} />
        )}
      </div>
    </div>
  );
}
