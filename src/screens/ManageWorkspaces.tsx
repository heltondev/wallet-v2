import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../lib/api';
import type { Workspace, CurrencyCode } from '../types';
import './ManageWorkspaces.scss';

interface ManageWorkspacesProps {
  onBack?: () => void;
}

const CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR'];

interface WorkspaceForm {
  name: string;
  currency: CurrencyCode;
  monthlyBudget: string;
  icon: string;
  order: string;
}

const EMPTY_FORM: WorkspaceForm = { name: '', currency: 'BRL', monthlyBudget: '', icon: '', order: '0' };

export function ManageWorkspaces({ onBack }: ManageWorkspacesProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkspaceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = () => {
    setLoading(true);
    listWorkspaces()
      .then(data => {
        const ws = (data as unknown as Workspace[]).sort((a, b) => a.order - b.order);
        setWorkspaces(ws);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (ws: Workspace) => {
    setEditingId(ws.id);
    setForm({
      name: ws.name,
      currency: ws.currency,
      monthlyBudget: String(ws.monthlyBudget),
      icon: ws.icon,
      order: String(ws.order),
    });
    setShowForm(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const budget = parseFloat(form.monthlyBudget.replace(/\./g, '').replace(',', '.'));
    const payload = {
      name: form.name.trim(),
      currency: form.currency,
      monthlyBudget: isNaN(budget) ? 0 : budget,
      icon: form.icon.trim(),
      order: parseInt(form.order) || 0,
    };

    try {
      if (editingId) {
        await updateWorkspace(editingId, payload);
      } else {
        await createWorkspace(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchWorkspaces();
    } catch {
      setError('Erro ao salvar');
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
    setError(null);
    try {
      await deleteWorkspace(id);
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      setError(msg);
    }
  };

  return (
    <div className="manage-workspaces">
      <div className="manage-workspaces__status-bar">
        <IOSStatusBar />
      </div>

      <div className="manage-workspaces__scroll no-scrollbar">
        <div className="manage-workspaces__header">
          {onBack && (
            <button onClick={onBack} className="manage-workspaces__back-btn">
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 className="manage-workspaces__title">Espaços</h1>
        </div>

        {error && (
          <div className="manage-workspaces__error">{error}</div>
        )}

        {!showForm && (
          <div className="manage-workspaces__add-wrap">
            <button onClick={openAdd} className="manage-workspaces__add-btn">
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar espaço
            </button>
          </div>
        )}

        {showForm && (
          <div className="manage-workspaces__form">
            <div className="manage-workspaces__form-title">
              {editingId ? 'Editar espaço' : 'Novo espaço'}
            </div>
            <input
              type="text"
              placeholder="Nome (ex: Brasil, EUA)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="manage-workspaces__input"
            />
            <input
              type="text"
              placeholder="Ícone (emoji, ex: 🇧🇷)"
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              className="manage-workspaces__input"
            />
            <div className="manage-workspaces__currency-row">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, currency: c })}
                  className={`manage-workspaces__currency-btn ${form.currency === c ? 'manage-workspaces__currency-btn--active' : 'manage-workspaces__currency-btn--inactive'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Orçamento mensal"
              value={form.monthlyBudget}
              onChange={e => setForm({ ...form, monthlyBudget: e.target.value })}
              className="manage-workspaces__input"
            />
            <input
              type="number"
              placeholder="Ordem (0, 1, 2...)"
              value={form.order}
              onChange={e => setForm({ ...form, order: e.target.value })}
              className="manage-workspaces__input"
            />
            <div className="manage-workspaces__form-actions">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="manage-workspaces__cancel-btn"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className={`manage-workspaces__save-btn ${form.name.trim() ? 'manage-workspaces__save-btn--active' : 'manage-workspaces__save-btn--disabled'} ${saving ? 'manage-workspaces__save-btn--saving' : ''}`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="manage-workspaces__loading">Carregando...</div>
        ) : workspaces.length === 0 && !showForm ? (
          <div className="manage-workspaces__empty">
            <Icons.grid size={36} color="var(--text-4)" />
            <div className="manage-workspaces__empty-text">Nenhum espaço cadastrado</div>
          </div>
        ) : (
          <div className="manage-workspaces__list">
            {workspaces.map(ws => (
              <div key={ws.id} className="manage-workspaces__item">
                <span className="manage-workspaces__item-icon">{ws.icon}</span>
                <div className="manage-workspaces__item-info">
                  <div className="manage-workspaces__item-name">{ws.name}</div>
                  <div className="manage-workspaces__item-meta">
                    {ws.currency} · R$ {ws.monthlyBudget.toLocaleString('pt-BR')}
                  </div>
                </div>
                <button onClick={() => openEdit(ws)} className="manage-workspaces__edit-btn">
                  <Icons.pencil size={16} color="var(--text-4)" />
                </button>
                <button onClick={() => handleDelete(ws.id)} className="manage-workspaces__delete-btn">
                  <Icons.trash
                    size={16}
                    color={confirmDelete === ws.id ? 'var(--neg)' : 'var(--text-4)'}
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
