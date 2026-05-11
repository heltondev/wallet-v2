import { useState } from 'react';
import { Icons } from './icons/Icons';
import { getReceiptUrl } from '../lib/api';

interface ReceiptViewerProps {
  txId: string;
  receiptName?: string;
}

export function ReceiptViewer({ txId, receiptName }: ReceiptViewerProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  if (!receiptName) return null;

  const isPdf = receiptName.toLowerCase().endsWith('.pdf');

  const handleView = async () => {
    setLoading(true);
    try {
      const { downloadUrl, contentType } = await getReceiptUrl(txId);
      if (contentType === 'application/pdf' || isPdf) {
        window.open(downloadUrl, '_blank');
      } else {
        setImageUrl(downloadUrl);
        setShowOverlay(true);
      }
    } catch {
      // Failed to load receipt
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleView}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 8,
          background: 'var(--bg-2)', border: '1px solid var(--border-1)',
          color: 'var(--text-2)', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
        }}
      >
        <Icons.download size={14} color="var(--text-3)" />
        {loading ? 'Carregando...' : 'Ver comprovante'}
      </button>

      {showOverlay && imageUrl && (
        <div
          onClick={() => setShowOverlay(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={() => setShowOverlay(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <Icons.x size={24} color="#fff" />
          </button>
          <img
            src={imageUrl}
            alt={receiptName}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
