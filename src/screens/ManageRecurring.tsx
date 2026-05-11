import { useState, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { listRecurring, createRecurring, updateRecurring, deleteRecurring, listAccounts, aiExtractRecurring, listWorkspaces } from '../lib/api';
import { CATS } from '../data/categories';
import type { RecurringTransaction, RecurringFrequency, CurrencyCode, Account, Workspace, ExtractedRecurring, AiExtractRecurringResult } from '../types';
import './ManageRecurring.scss';

interface ManageRecurringProps {
  onBack?: () => void;
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'yearly', label: 'Anual' },
  { value: 'custom', label: 'Personalizado' },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR'];

const freqLabel = (f: RecurringFrequency) =>
  FREQUENCIES.find(x => x.value === f)?.label ?? f;

const dayInfo = (r: RecurringTransaction): string => {
  if (r.frequency === 'monthly' && r.dayOfMonth != null) return `dia ${r.dayOfMonth}`;
  if (r.frequency === 'weekly' && r.dayOfWeek != null) return `toda ${WEEKDAYS[r.dayOfWeek]}`;
  if (r.frequency === 'biweekly' && r.dayOfWeek != null) return `toda ${WEEKDAYS[r.dayOfWeek]}`;
  if (r.frequency === 'custom' && r.customDays != null) return `a cada ${r.customDays} dias`;
  if (r.frequency === 'yearly' && r.dayOfMonth != null) return `dia ${r.dayOfMonth}`;
  return '';
};

interface FormData {
  desc: string;
  amount: string;
  type: 'expense' | 'income';
  cat: string;
  account: string;
  currency: CurrencyCode;
  frequency: RecurringFrequency;
  dayOfMonth: string;
  dayOfWeek: string;
  customDays: string;
  startDate: string;
  endDate: string;
  notes: string;
  active: boolean;
  workspaceId: string;
}

const emptyForm = (): FormData => ({
  desc: '',
  amount: '',
  type: 'expense',
  cat: 'outros',
  account: '',
  currency: 'BRL',
  frequency: 'monthly',
  dayOfMonth: '',
  dayOfWeek: '0',
  customDays: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
  active: true,
  workspaceId: '',
});

export function ManageRecurring({ onBack }: ManageRecurringProps) {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const catSlugs = Object.keys(CATS);

  // AI state
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiFiles, setAiFiles] = useState<{ name: string; base64: string; mimeType: string }[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiReviewItems, setAiReviewItems] = useState<ExtractedRecurring[]>([]);
  const [aiReviewChecked, setAiReviewChecked] = useState<boolean[]>([]);
  const [aiReviewMode, setAiReviewMode] = useState(false);
  const [aiSavingReview, setAiSavingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const readFileAsBase64 = (file: File): Promise<{ name: string; base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ name: file.name, base64, mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAiFiles = async (fileList: FileList) => {
    const newFiles = await Promise.all(
      Array.from(fileList)
        .filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
        .map(readFileAsBase64)
    );
    setAiFiles(prev => [...prev, ...newFiles]);
    if (!aiExpanded && newFiles.length > 0) setAiExpanded(true);
  };

  const onAiDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) handleAiFiles(e.dataTransfer.files);
  };

  const onAiDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const removeAiFile = (idx: number) => setAiFiles(prev => prev.filter((_, i) => i !== idx));

  const handleAiFill = async () => {
    if (aiFiles.length === 0 && !aiText.trim()) return;
    setAiLoading(true);
    try {
      const payload = aiFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType }));
      const result: AiExtractRecurringResult = await aiExtractRecurring(payload, aiText);

      if (result.recurring.length === 1) {
        const r = result.recurring[0];
        fillFormFromAi(r);
        setAiDone(true);
        setShowForm(true);
      } else if (result.recurring.length > 1) {
        setAiReviewItems(result.recurring);
        setAiReviewChecked(result.recurring.map(() => true));
        setAiReviewMode(true);
        setAiDone(true);
      }
    } catch {
      // AI failed
    } finally {
      setAiLoading(false);
    }
  };

  const fillFormFromAi = (r: ExtractedRecurring) => {
    setForm({
      desc: r.desc || '',
      amount: String(Math.abs(r.amount)),
      type: r.amount >= 0 ? 'income' : 'expense',
      cat: catSlugs.includes(r.cat) ? r.cat : 'outros',
      account: r.account ?? '',
      currency: (['BRL', 'USD', 'EUR'].includes(r.currency) ? r.currency : 'BRL') as CurrencyCode,
      frequency: r.frequency || 'monthly',
      dayOfMonth: r.dayOfMonth != null ? String(r.dayOfMonth) : '',
      dayOfWeek: r.dayOfWeek != null ? String(r.dayOfWeek) : '0',
      customDays: r.customDays != null ? String(r.customDays) : '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      notes: r.notes ?? '',
      active: true,
      workspaceId: '',
    });
  };

  const handleApproveAiReview = async () => {
    setAiSavingReview(true);
    try {
      for (let i = 0; i < aiReviewItems.length; i++) {
        if (!aiReviewChecked[i]) continue;
        const r = aiReviewItems[i];
        const rawAmount = r.amount;
        const cur = (['BRL', 'USD', 'EUR'].includes(r.currency) ? r.currency : 'BRL') as CurrencyCode;
        await createRecurring({
          desc: r.desc,
          amount: rawAmount,
          currency: cur,
          cat: catSlugs.includes(r.cat) ? r.cat : 'outros',
          account: r.account ?? accounts[0]?.name ?? '',
          frequency: r.frequency || 'monthly',
          dayOfMonth: r.dayOfMonth,
          dayOfWeek: r.dayOfWeek,
          customDays: r.customDays,
          fxRate: 1,
          notes: r.notes,
          active: true,
        });
      }
      setAiReviewMode(false);
      setAiReviewItems([]);
      await fetchData();
    } catch {
      // silent
    } finally {
      setAiSavingReview(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recData, accData, wsData] = await Promise.all([listRecurring(), listAccounts(), listWorkspaces()]);
      setItems(recData as unknown as RecurringTransaction[]);
      setAccounts(accData as unknown as Account[]);
      setWorkspaces(wsData as unknown as Workspace[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (r: RecurringTransaction) => {
    setEditingId(r.id);
    setForm({
      desc: r.desc,
      amount: String(Math.abs(r.amount)),
      type: r.amount >= 0 ? 'income' : 'expense',
      cat: r.cat,
      account: r.account,
      currency: r.currency,
      frequency: r.frequency,
      dayOfMonth: r.dayOfMonth != null ? String(r.dayOfMonth) : '',
      dayOfWeek: r.dayOfWeek != null ? String(r.dayOfWeek) : '0',
      customDays: r.customDays != null ? String(r.customDays) : '',
      startDate: r.startDate,
      endDate: r.endDate ?? '',
      notes: r.notes ?? '',
      active: r.active,
      workspaceId: r.workspaceId ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.desc.trim() || !form.amount.trim()) return;
    setSaving(true);

    const rawAmount = parseFloat(form.amount.replace(',', '.'));
    const amount = form.type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    const payload: Record<string, unknown> = {
      desc: form.desc.trim(),
      amount,
      currency: form.currency,
      cat: form.cat,
      account: form.account,
      frequency: form.frequency,
      dayOfMonth: form.frequency === 'monthly' || form.frequency === 'yearly'
        ? (form.dayOfMonth ? parseInt(form.dayOfMonth) : null)
        : null,
      dayOfWeek: form.frequency === 'weekly' || form.frequency === 'biweekly'
        ? parseInt(form.dayOfWeek)
        : null,
      customDays: form.frequency === 'custom'
        ? (form.customDays ? parseInt(form.customDays) : null)
        : null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      fxRate: 1,
      notes: form.notes.trim() || null,
      active: form.active,
      workspaceId: form.workspaceId || null,
    };

    try {
      if (editingId) {
        await updateRecurring(editingId, payload);
      } else {
        await createRecurring(payload);
      }
      setShowForm(false);
      setEditingId(null);
      await fetchData();
    } catch {
      // silent
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
    try {
      await deleteRecurring(id);
      setItems(prev => prev.filter(r => r.id !== id));
    } catch {
      // silent
    }
  };

  const handleToggleActive = async (r: RecurringTransaction) => {
    const newActive = !r.active;
    setItems(prev => prev.map(x => x.id === r.id ? { ...x, active: newActive } : x));
    try {
      await updateRecurring(r.id, { active: newActive });
    } catch {
      setItems(prev => prev.map(x => x.id === r.id ? { ...x, active: r.active } : x));
    }
  };

  const CatIcon = ({ slug }: { slug: string }) => {
    const meta = CATS[slug];
    if (!meta) return null;
    const Ic = (Icons as Record<string, ComponentType<{ size?: number; color?: string; stroke?: number }>>)[meta.icon];
    if (!Ic) return null;
    return (
      <div className="manage-recurring__cat-icon" style={{ background: meta.color }}>
        <Ic size={14} color="#fff" stroke={1.8} />
      </div>
    );
  };

  return (
    <div className="manage-recurring">
      <div className="manage-recurring__status-bar">
        <IOSStatusBar />
      </div>

      <div className="manage-recurring__scroll no-scrollbar">
        <div className="manage-recurring__header">
          {onBack && (
            <button onClick={onBack} className="manage-recurring__back-btn">
              <Icons.chevL size={20} color="var(--text-2)" />
            </button>
          )}
          <h1 className="manage-recurring__title">Recorrentes</h1>
        </div>

        {/* AI Review Mode */}
        {aiReviewMode && (
          <div className="manage-recurring__ai-review">
            <div className="manage-recurring__ai-review-header">
              <div className="manage-recurring__ai-review-title">
                {aiReviewItems.length} recorrentes encontradas
              </div>
              <button onClick={() => { setAiReviewMode(false); setAiReviewItems([]); }} className="manage-recurring__ai-review-back">
                Voltar
              </button>
            </div>
            <div className="manage-recurring__ai-review-list">
              {aiReviewItems.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => setAiReviewChecked(prev => prev.map((v, i) => i === idx ? !v : v))}
                  className={`manage-recurring__ai-review-item ${aiReviewChecked[idx] ? 'manage-recurring__ai-review-item--checked' : 'manage-recurring__ai-review-item--unchecked'}`}
                >
                  <div className={`manage-recurring__ai-review-checkbox ${aiReviewChecked[idx] ? 'manage-recurring__ai-review-checkbox--checked' : 'manage-recurring__ai-review-checkbox--unchecked'}`}>
                    {aiReviewChecked[idx] && <Icons.check size={12} stroke={2.5} color="#0A0A0A" />}
                  </div>
                  <div className="manage-recurring__ai-review-info">
                    <div className="manage-recurring__ai-review-desc">{r.desc}</div>
                    <div className="manage-recurring__ai-review-meta">
                      <span className="manage-recurring__ai-review-freq">
                        {FREQUENCIES.find(f => f.value === r.frequency)?.label ?? r.frequency}
                      </span>
                      {r.dayOfMonth != null && <span className="manage-recurring__ai-review-day">dia {r.dayOfMonth}</span>}
                    </div>
                  </div>
                  <span className={`manage-recurring__ai-review-amount ${r.amount >= 0 ? 'manage-recurring__ai-review-amount--income' : ''}`}>
                    {r.amount >= 0 ? '+' : ''}{r.currency === 'BRL' ? 'R$ ' : r.currency === 'USD' ? '$ ' : '€ '}
                    {Math.abs(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
            <div className="manage-recurring__ai-review-actions">
              <button onClick={() => { setAiReviewMode(false); setAiReviewItems([]); }} className="manage-recurring__cancel-btn">
                Cancelar
              </button>
              <button
                onClick={handleApproveAiReview}
                disabled={aiSavingReview || aiReviewChecked.filter(Boolean).length === 0}
                className={`manage-recurring__save-btn ${aiReviewChecked.filter(Boolean).length > 0 && !aiSavingReview ? 'manage-recurring__save-btn--active' : 'manage-recurring__save-btn--disabled'}`}
              >
                {aiSavingReview ? 'Salvando...' : `Adicionar ${aiReviewChecked.filter(Boolean).length} recorrentes`}
              </button>
            </div>
          </div>
        )}

        {/* AI Section + Add button + Form — hidden during review */}
        {!aiReviewMode && (
        <>
        {/* AI Section */}
        {!showForm && (
          <div className="manage-recurring__ai-section">
            <button
              onClick={() => setAiExpanded(!aiExpanded)}
              className="manage-recurring__ai-header"
            >
              <Icons.alert size={16} color="var(--pos)" />
              <span className="manage-recurring__ai-header-label">Preencher com AI</span>
              {aiDone && <span className="manage-recurring__ai-done">preenchido</span>}
              <Icons.chevD size={14} color="var(--text-3)" />
            </button>

            {aiExpanded && (
              <div className="manage-recurring__ai-body">
                <div
                  ref={dropRef}
                  onDrop={onAiDrop}
                  onDragOver={onAiDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`manage-recurring__ai-dropzone ${aiFiles.length > 0 ? 'manage-recurring__ai-dropzone--has-files' : 'manage-recurring__ai-dropzone--empty'}`}
                >
                  {aiFiles.length === 0 ? (
                    <>
                      <Icons.download size={20} color="var(--text-3)" />
                      <span className="manage-recurring__ai-dropzone-label">Arraste extratos ou faturas</span>
                      <span className="manage-recurring__ai-dropzone-formats">PDF, JPG, PNG</span>
                    </>
                  ) : (
                    <div className="manage-recurring__ai-file-list">
                      {aiFiles.map((f, i) => (
                        <div key={i} className="manage-recurring__ai-file-item">
                          <Icons.check size={14} color="var(--pos)" />
                          <span className="manage-recurring__ai-file-name">{f.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeAiFile(i); }} className="manage-recurring__ai-file-remove">
                            <Icons.x size={14} color="var(--text-4)" />
                          </button>
                        </div>
                      ))}
                      <span className="manage-recurring__ai-file-add-more">+ adicionar mais</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={e => { if (e.target.files) handleAiFiles(e.target.files); }}
                  className="manage-recurring__ai-hidden-input"
                />

                <textarea
                  placeholder="Cole texto de fatura, extrato ou instruções para a AI..."
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  rows={3}
                  className="manage-recurring__ai-textarea"
                />

                <button
                  onClick={handleAiFill}
                  disabled={aiLoading || (aiFiles.length === 0 && !aiText.trim())}
                  className={`manage-recurring__ai-btn ${(aiLoading || (aiFiles.length === 0 && !aiText.trim())) ? 'manage-recurring__ai-btn--disabled' : 'manage-recurring__ai-btn--active'}`}
                >
                  {aiLoading ? (
                    <span className="manage-recurring__ai-loading-text">Analisando...</span>
                  ) : (
                    <>
                      <Icons.alert size={16} />
                      Preencher formulário
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add button at top */}
        {!showForm && (
          <div className="manage-recurring__add-wrap">
            <button onClick={openAdd} className="manage-recurring__add-btn">
              <Icons.plus size={16} color="var(--text-2)" />
              Adicionar recorrente
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="manage-recurring__form">
            <div className="manage-recurring__form-title">
              {editingId ? 'Editar recorrente' : 'Nova recorrente'}
            </div>

            <input
              type="text"
              placeholder="Descrição (ex: Netflix, Aluguel)"
              value={form.desc}
              onChange={e => setField('desc', e.target.value)}
              className="manage-recurring__input"
            />

            <div className="manage-recurring__row-2col">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Valor"
                value={form.amount}
                onChange={e => setField('amount', e.target.value)}
                className="manage-recurring__input"
              />
              <select
                value={form.type}
                onChange={e => setField('type', e.target.value as 'expense' | 'income')}
                className="manage-recurring__select"
              >
                <option value="expense">Saída</option>
                <option value="income">Entrada</option>
              </select>
            </div>

            <select
              value={form.cat}
              onChange={e => setField('cat', e.target.value)}
              className="manage-recurring__select"
            >
              {catSlugs.map(slug => (
                <option key={slug} value={slug}>{CATS[slug].label}</option>
              ))}
            </select>

            <select
              value={form.account}
              onChange={e => setField('account', e.target.value)}
              className="manage-recurring__select"
            >
              <option value="">Selecionar conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.name}>{acc.name}</option>
              ))}
            </select>

            {workspaces.length > 0 && (
              <select
                value={form.workspaceId}
                onChange={e => setField('workspaceId', e.target.value)}
                className="manage-recurring__select"
              >
                <option value="">Sem espaço</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.icon} {ws.name}</option>
                ))}
              </select>
            )}

            <div className="manage-recurring__row-2col">
              <select
                value={form.currency}
                onChange={e => setField('currency', e.target.value as CurrencyCode)}
                className="manage-recurring__select"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={form.frequency}
                onChange={e => setField('frequency', e.target.value as RecurringFrequency)}
                className="manage-recurring__select"
              >
                {FREQUENCIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {(form.frequency === 'monthly' || form.frequency === 'yearly') && (
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Dia do mês (1-31)"
                value={form.dayOfMonth}
                onChange={e => setField('dayOfMonth', e.target.value)}
                className="manage-recurring__input"
              />
            )}

            {(form.frequency === 'weekly' || form.frequency === 'biweekly') && (
              <select
                value={form.dayOfWeek}
                onChange={e => setField('dayOfWeek', e.target.value)}
                className="manage-recurring__select"
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={i} value={String(i)}>{d}</option>
                ))}
              </select>
            )}

            {form.frequency === 'custom' && (
              <input
                type="number"
                min="1"
                placeholder="A cada quantos dias?"
                value={form.customDays}
                onChange={e => setField('customDays', e.target.value)}
                className="manage-recurring__input"
              />
            )}

            <div className="manage-recurring__row-2col">
              <div className="manage-recurring__field">
                <label className="manage-recurring__label">Início</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setField('startDate', e.target.value)}
                  className="manage-recurring__input"
                />
              </div>
              <div className="manage-recurring__field">
                <label className="manage-recurring__label">Duração</label>
                <select
                  value={form.endDate ? 'fixed' : 'forever'}
                  onChange={e => {
                    if (e.target.value === 'forever') setField('endDate', '');
                    else setField('endDate', new Date().toISOString().slice(0, 10));
                  }}
                  className="manage-recurring__select"
                >
                  <option value="forever">Indeterminado</option>
                  <option value="fixed">Prazo final</option>
                </select>
                {form.endDate && (
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setField('endDate', e.target.value)}
                    className="manage-recurring__input manage-recurring__input--date-below"
                  />
                )}
              </div>
            </div>

            <textarea
              placeholder="Notas (opcional)"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              className="manage-recurring__textarea"
              rows={2}
            />

            <div className="manage-recurring__toggle-row">
              <span className="manage-recurring__toggle-label">Ativa</span>
              <button
                onClick={() => setField('active', !form.active)}
                className={`manage-recurring__toggle ${form.active ? 'manage-recurring__toggle--on' : 'manage-recurring__toggle--off'}`}
              >
                <span className="manage-recurring__toggle-knob" />
              </button>
            </div>

            <div className="manage-recurring__form-actions">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="manage-recurring__cancel-btn"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.desc.trim() || !form.amount.trim()}
                className={`manage-recurring__save-btn ${form.desc.trim() && form.amount.trim() ? 'manage-recurring__save-btn--active' : 'manage-recurring__save-btn--disabled'}`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="manage-recurring__loading">Carregando...</div>
        ) : items.length === 0 && !showForm ? (
          <div className="manage-recurring__empty">
            <Icons.repeat size={36} color="var(--text-4)" />
            <div className="manage-recurring__empty-text">Nenhuma recorrente cadastrada</div>
          </div>
        ) : !showForm && (
          <div className="manage-recurring__list">
            {items.map(r => (
              <div
                key={r.id}
                className={`manage-recurring__item ${!r.active ? 'manage-recurring__item--inactive' : ''}`}
              >
                <CatIcon slug={r.cat} />
                <div className="manage-recurring__item-info">
                  <div className="manage-recurring__item-desc">{r.desc}</div>
                  <div className="manage-recurring__item-meta">
                    <span className="manage-recurring__item-freq">{freqLabel(r.frequency)}</span>
                    {dayInfo(r) && (
                      <span className="manage-recurring__item-day">{dayInfo(r)}</span>
                    )}
                    {r.workspaceId && (() => {
                      const ws = workspaces.find(w => w.id === r.workspaceId);
                      return ws ? (
                        <span className="manage-recurring__item-workspace">{ws.icon} {ws.name}</span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <span
                  className={`manage-recurring__item-amount ${r.amount >= 0 ? 'manage-recurring__item-amount--income' : ''}`}
                >
                  {r.amount >= 0 ? '+' : ''}{r.currency === 'BRL' ? 'R$ ' : r.currency === 'USD' ? '$ ' : '€ '}
                  {Math.abs(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <div className="manage-recurring__item-actions">
                  <button
                    onClick={() => handleToggleActive(r)}
                    className={`manage-recurring__toggle-sm ${r.active ? 'manage-recurring__toggle-sm--on' : 'manage-recurring__toggle-sm--off'}`}
                  >
                    <span className="manage-recurring__toggle-sm-knob" />
                  </button>
                  <button onClick={() => openEdit(r)} className="manage-recurring__icon-btn">
                    <Icons.pencil size={15} color="var(--text-3)" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="manage-recurring__icon-btn">
                    <Icons.trash size={15} color={confirmDelete === r.id ? 'var(--neg)' : 'var(--text-4)'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
