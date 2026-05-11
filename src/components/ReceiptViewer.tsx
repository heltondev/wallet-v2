import { useState } from 'react';
import { Icons } from './icons/Icons';
import { getReceiptUrl } from '../lib/api';
import './ReceiptViewer.scss';

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
        className={`receipt-viewer__btn ${loading ? 'receipt-viewer__btn--loading' : 'receipt-viewer__btn--ready'}`}
      >
        <Icons.download size={14} color="var(--text-3)" />
        {loading ? 'Carregando...' : 'Ver comprovante'}
      </button>

      {showOverlay && imageUrl && (
        <div
          onClick={() => setShowOverlay(false)}
          className="receipt-viewer__overlay"
        >
          <button
            onClick={() => setShowOverlay(false)}
            className="receipt-viewer__overlay-close"
          >
            <Icons.x size={24} color="#fff" />
          </button>
          <img
            src={imageUrl}
            alt={receiptName}
            className="receipt-viewer__image"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
