import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listAccounts, createAccount, listWorkspaces } from '../lib/api';
import type { Account, Workspace, CurrencyCode } from '../types';
import './ManageAccounts.scss';

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
  const [workspaceId, setWorkspaceId] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    listAccounts()
      .then(data => setAccounts(data as unknown as Account[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
    listWorkspaces()
      .then(data => setWorkspaces(data as unknown as Workspace[]))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: name.trim(), institution: institution.trim(), currency };
      if (workspaceId) payload.workspaceId = workspaceId;
      await createAccount(payload);
      setName('');
      setInstitution('');
      setCurrency('BRL');
      setWorkspaceId('');
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

  return (
    <div className="manage-accounts">
      <div className="manage-accounts__status-bar">
        <IOSStatusBar />
      </div>

      <div className="manage-accounts__scroll no-scrollbar">
        {/* Header */}
        <div className="manage-accounts__header">
          {onBack && (
            <button onClick={onBack} className="manage-accounts__back-btn">
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 className="manage-accounts__title">
            Carteiras e contas
          </h1>
        </div>

        {/* Add button + form — at top */}
        {!showForm && (
          <div className="manage-accounts__add-wrap">
            <button
              onClick={() => setShowForm(true)}
              className="manage-accounts__add-btn"
            >
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar conta
            </button>
          </div>
        )}

        {showForm && (
          <div className="manage-accounts__form">
            <div className="manage-accounts__form-title">Nova conta</div>
            <input
              type="text"
              placeholder="Nome da conta"
              value={name}
              onChange={e => setName(e.target.value)}
              className="manage-accounts__input"
            />
            <input
              type="text"
              placeholder="Instituição (opcional)"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              className="manage-accounts__input"
            />
            <div className="manage-accounts__currency-row">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`manage-accounts__currency-btn ${currency === c ? 'manage-accounts__currency-btn--active' : 'manage-accounts__currency-btn--inactive'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            {workspaces.length > 0 && (
              <select
                value={workspaceId}
                onChange={e => setWorkspaceId(e.target.value)}
                className="manage-accounts__input"
              >
                <option value="">Sem espaço</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.icon} {ws.name}</option>
                ))}
              </select>
            )}
            <div className="manage-accounts__form-actions">
              <button
                onClick={() => setShowForm(false)}
                className="manage-accounts__cancel-btn"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className={`manage-accounts__save-btn ${name.trim() ? 'manage-accounts__save-btn--active' : 'manage-accounts__save-btn--disabled'} ${saving ? 'manage-accounts__save-btn--saving' : ''}`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Account list */}
        {loading ? (
          <div className="manage-accounts__loading">
            Carregando...
          </div>
        ) : accounts.length === 0 && !showForm ? (
          <div className="manage-accounts__empty">
            <Icons.wallet size={36} color="var(--text-4)" />
            <div className="manage-accounts__empty-text">Nenhuma conta cadastrada</div>
          </div>
        ) : (
          <div className="manage-accounts__list">
            {accounts.map((acc) => (
              <div key={acc.id} className="manage-accounts__item">
                <Icons.wallet size={17} color="var(--text-2)" stroke={1.8} />
                <div className="manage-accounts__item-info">
                  <div className="manage-accounts__item-name">{acc.name}</div>
                  {acc.institution && (
                    <div className="manage-accounts__item-institution">{acc.institution}</div>
                  )}
                </div>
                <span className="manage-accounts__item-currency">
                  {acc.currency}
                </span>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="manage-accounts__delete-btn"
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

      </div>
    </div>
  );
}
