import React, { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listAccounts, createAccount } from '../lib/api';
import type { Account, CurrencyCode } from '../types';

interface ManageAccountsProps {
  onBack?: () => void;
}

const CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR'];

export function ManageAccounts({ onBack }: ManageAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    listAccounts()
      .then(data => setAccounts(data as unknown as Account[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createAccount({ name: name.trim(), institution: institution.trim(), currency });
      setName('');
      setInstitution('');
      setCurrency('BRL');
      setShowForm(false);
      fetchAccounts();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text-1)',
    fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none',
  };

  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--bg-0)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar />
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100, overflow: 'auto', paddingTop: 54, paddingBottom: 20 }} className="no-scrollbar">
        {/* Header */}
        <div style={{ padding: '8px 16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: 'var(--text-1)' }}>
            Carteiras e contas
          </h1>
        </div>

        {/* Account list */}
        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Carregando...
          </div>
        ) : accounts.length === 0 && !showForm ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Icons.wallet size={36} color="var(--text-4)" />
            <div style={{ marginTop: 12, color: 'var(--text-3)', fontSize: 14 }}>Nenhuma conta cadastrada</div>
          </div>
        ) : (
          <div style={{ margin: '0 16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', overflow: 'hidden' }}>
            {accounts.map((acc, i) => (
              <div
                key={acc.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderBottom: i < accounts.length - 1 ? '1px solid var(--border-1)' : 'none',
                }}
              >
                <Icons.wallet size={17} color="var(--text-2)" stroke={1.8} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text-1)' }}>{acc.name}</div>
                  {acc.institution && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{acc.institution}</div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  padding: '3px 8px', borderRadius: 6,
                  background: 'var(--bg-3)', color: 'var(--text-2)',
                }}>
                  {acc.currency}
                </span>
                <button
                  onClick={() => handleDelete(acc.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  }}
                >
                  <Icons.trash
                    size={16}
                    color={confirmDelete === acc.id ? 'var(--neg)' : 'var(--text-4)'}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div style={{ margin: '18px 16px 0', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Nova conta</div>
            <input
              type="text"
              placeholder="Nome da conta"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Instituição (opcional)"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)',
                    background: currency === c ? 'var(--accent)' : 'var(--bg-3)',
                    color: currency === c ? '#fff' : 'var(--text-2)',
                    transition: 'background 0.15s',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border-2)',
                  background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: name.trim() ? 'var(--accent)' : 'var(--bg-3)',
                  color: name.trim() ? '#fff' : 'var(--text-4)',
                  fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Add button */}
        {!showForm && (
          <div style={{ margin: '18px 16px 0' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 'var(--r-card-sm)',
                border: '1px dashed var(--border-2)', background: 'transparent',
                color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
              }}
            >
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
