import { useState } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { ReceiptUpload } from '../components/ReceiptUpload';
import { fmtAmount } from '../utils/formatters';
import type { Transaction, FabKind, CurrencyCode } from '../types';
import './ReceiptScreen.scss';

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
    <div className="receipt-screen">
      <IOSStatusBar />
      <div className="receipt-screen__header">
        {onBack && (
          <button onClick={onBack} className="receipt-screen__back-btn">
            <Icons.chevL size={20} color="var(--text-2)" />
          </button>
        )}
        <Icons.search size={20} color="var(--pos)" />
        <span className="receipt-screen__title">
          Escanear Recibo
        </span>
      </div>

      <div className="receipt-screen__body">
        {saved ? (
          <div className="receipt-screen__saved">
            <div className="receipt-screen__saved-icon">
              <Icons.check size={28} color="#0A0A0A" stroke={2.4} />
            </div>
            <div className="receipt-screen__saved-text">
              <div className="receipt-screen__saved-title">Transação salva!</div>
              <div className="receipt-screen__saved-desc">{saved.desc}</div>
              <div className="money receipt-screen__saved-amount">
                {fmtAmount(Math.abs(saved.amount ?? 0), (saved.currency ?? 'BRL') as CurrencyCode)}
              </div>
            </div>
            <div className="receipt-screen__saved-actions">
              <button onClick={() => setSaved(null)} className="receipt-screen__scan-again-btn">Escanear outro</button>
              <button onClick={onBack} className="receipt-screen__back-action-btn">Voltar</button>
            </div>
          </div>
        ) : (
          <ReceiptUpload onExtracted={handleExtracted} onClose={() => onBack?.()} />
        )}
      </div>
    </div>
  );
}
