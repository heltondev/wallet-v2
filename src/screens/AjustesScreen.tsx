import { useState, useEffect } from 'react';
import type { ReactNode, ComponentType } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { signOut, getSession } from '../lib/auth';
import { getSettings, updateSettings, listAccounts, listCategories } from '../lib/api';
import { CATS } from '../data/categories';
import type { Transaction, FabKind, CurrencyCode } from '../types';

interface RowProps {
  label: string;
  detail?: string;
  icon?: string;
  last?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface AjustesScreenProps {
  fabKind?: FabKind;
  tx?: Transaction[];
  onNavigate?: (screen: string) => void;
  onSignOut?: () => void;
  onSettingsChange?: (settings: { theme?: 'dark' | 'light'; currency?: CurrencyCode; monthlyBudget?: number }) => void;
}

export function AjustesScreen({ fabKind: _fabKind = 'circle', tx = [], onNavigate, onSignOut, onSettingsChange }: AjustesScreenProps) {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [budget, setBudget] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    getSession().then(session => {
      const payload = session.getIdToken().decodePayload();
      setUserEmail(payload.email ?? '');
      const name = payload.given_name
        ? `${payload.given_name} ${payload.family_name ?? ''}`.trim()
        : payload.email?.split('@')[0] ?? '';
      setUserName(name);
    }).catch(() => {});

    getSettings().then(s => {
      if (s.theme) setTheme(s.theme as 'dark' | 'light');
      if (s.currency) setCurrency(s.currency as CurrencyCode);
      if (s.monthlyBudget) setBudget(s.monthlyBudget as number);
    }).catch(() => {});

    listAccounts().then(a => setAccountCount(a.length)).catch(() => {});
    listCategories().then(c => setCategoryCount(Object.keys(CATS).length + c.length)).catch(() => setCategoryCount(Object.keys(CATS).length));
  }, []);

  const download = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (tx.length === 0) return;
    const header = 'Data,Descrição,Categoria,Valor,Moeda,Conta';
    const rows = tx.map(item => {
      const cat = CATS[item.cat]?.label ?? item.cat;
      return `${item.date ?? item.day},"${item.desc}",${cat},${item.amount},${item.currency},"${item.account}"`;
    });
    download([header, ...rows].join('\n'), `wallet-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportJSON = () => {
    if (tx.length === 0) return;
    const data = tx.map(item => ({
      date: item.date ?? item.day,
      desc: item.desc,
      category: CATS[item.cat]?.label ?? item.cat,
      categorySlug: item.cat,
      amount: item.amount,
      currency: item.currency,
      fxRate: item.fxRate,
      account: item.account,
    }));
    download(JSON.stringify(data, null, 2), `wallet-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const [exportOpen, setExportOpen] = useState(false);

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    onSettingsChange?.({ theme: next });
    await updateSettings({ theme: next }).catch(() => {});
  };

  const toggleCurrency = async () => {
    const next: CurrencyCode = currency === 'BRL' ? 'USD' : 'BRL';
    setCurrency(next);
    onSettingsChange?.({ currency: next });
    await updateSettings({ currency: next }).catch(() => {});
  };

  const saveBudget = async () => {
    const val = parseFloat(budgetInput.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      setBudget(val);
      onSettingsChange?.({ monthlyBudget: val });
      await updateSettings({ monthlyBudget: val }).catch(() => {});
    }
    setEditingBudget(false);
  };

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || userEmail.slice(0, 2).toUpperCase();

  const Row = ({ label, detail, icon, last, danger, onClick }: RowProps) => {
    const Ic = icon ? (Icons as Record<string, ComponentType<{ size?: number; color?: string; stroke?: number }>>)[icon] : null;
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
          borderBottom: last ? 'none' : '1px solid var(--border-1)',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {Ic && <Ic size={17} color={danger ? 'var(--neg)' : 'var(--text-2)'} stroke={1.8} />}
        <span style={{ flex: 1, fontSize: 14.5, color: danger ? 'var(--neg)' : 'var(--text-1)', fontWeight: 500 }}>{label}</span>
        {detail && <span style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{detail}</span>}
        {onClick && <Icons.chevR size={14} color="var(--text-4)" />}
      </div>
    );
  };

  const Section = ({ title, children }: SectionProps) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', padding: '0 16px 6px' }}>{title}</div>
      <div style={{ margin: '0 16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', overflow: 'hidden' }}>{children}</div>
    </div>
  );

  return (
    <div className="phone-surface" style={{ height: '100%', position: 'relative' }} data-screen-label="Settings">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}><IOSStatusBar /></div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 100, overflow: 'auto', paddingTop: 54, paddingBottom: 20 }} className="no-scrollbar">
        <div style={{ padding: '8px 16px 18px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, margin: 0, color: 'var(--text-1)' }}>Ajustes</h1>
        </div>

        {/* Profile */}
        <div style={{ margin: '0 16px 18px', padding: '14px 16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-card-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-sans)' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-1)' }}>{userName || 'Usuário'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{userEmail}</div>
          </div>
        </div>

        <Section title="CONTA">
          <Row label="Carteiras e contas" detail={String(accountCount)} icon="wallet" onClick={() => onNavigate?.('accounts')} />
          <Row label="Categorias" detail={String(categoryCount)} icon="grid" onClick={() => onNavigate?.('categories')} />
          {editingBudget ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
              <Icons.trending size={17} color="var(--text-2)" stroke={1.8} />
              <span style={{ fontSize: 14.5, color: 'var(--text-1)', fontWeight: 500 }}>R$</span>
              <input
                autoFocus
                type="text"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveBudget(); }}
                onBlur={saveBudget}
                style={{
                  flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border-2)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--text-1)',
                  fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none',
                }}
                placeholder="9500"
              />
            </div>
          ) : (
            <Row
              label="Orçamento mensal"
              detail={`R$ ${budget.toLocaleString('pt-BR')}`}
              icon="trending"
              last
              onClick={() => { setBudgetInput(String(budget)); setEditingBudget(true); }}
            />
          )}
        </Section>

        <Section title="APARÊNCIA">
          <Row label="Tema" detail={theme === 'dark' ? 'Escuro' : 'Claro'} icon="moon" onClick={toggleTheme} />
          <Row label="Moeda principal" detail={currency} last onClick={toggleCurrency} />
        </Section>

        <Section title="DADOS">
          <Row label="Exportar dados" detail={`${tx.length} transações`} icon="download" onClick={() => setExportOpen(!exportOpen)} />
          {exportOpen && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px 14px' }}>
              <button onClick={exportCSV} style={{
                flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid var(--border-2)',
                background: 'var(--bg-2)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>CSV</button>
              <button onClick={exportJSON} style={{
                flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid var(--border-2)',
                background: 'var(--bg-2)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>JSON</button>
            </div>
          )}
          <Row label="Backup na nuvem" detail="Ativo" icon="cloud" last />
        </Section>

        <Section title="INTELIGÊNCIA ARTIFICIAL">
          <Row label="Assistente financeiro" detail="Chat" icon="alert" onClick={() => onNavigate?.('ai-chat')} />
          <Row label="Insights do mês" icon="trending" onClick={() => onNavigate?.('ai-insights')} />
          <Row label="Escanear recibo" icon="search" last onClick={() => onNavigate?.('ai-receipt')} />
        </Section>

        <Section title="ADMIN">
          <Row label="Custos de infraestrutura" icon="trending" onClick={() => onNavigate?.('admin-costs')} />
          {userEmail === 'holiver.usa@gmail.com' && (
            <Row label="Prompts de AI" icon="alert" last onClick={() => onNavigate?.('prompts')} />
          )}
        </Section>

        <Section title="SUPORTE">
          <Row label="Sobre" />
          <Row label="Sair" icon="x" danger last onClick={() => { signOut(); onSignOut?.(); }} />
        </Section>
      </div>
    </div>
  );
}
