import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { Icons } from '../components/icons/Icons';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { signOut, getSession } from '../lib/auth';
import { getSettings, updateSettings, listAccounts, listCategories } from '../lib/api';
import { CATS } from '../data/categories';
import type { Transaction, FabKind, CurrencyCode } from '../types';
import './AjustesScreen.scss';

interface AjustesScreenProps {
  fabKind?: FabKind;
  tx?: Transaction[];
  onNavigate?: (screen: string) => void;
  onSignOut?: () => void;
  onSettingsChange?: (settings: { theme?: 'dark' | 'light'; currency?: CurrencyCode }) => void;
}

export function AjustesScreen({ fabKind: _fabKind = 'circle', tx = [], onNavigate, onSignOut, onSettingsChange }: AjustesScreenProps) {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [accountCount, setAccountCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [showAbout, setShowAbout] = useState(false);

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

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || userEmail.slice(0, 2).toUpperCase();

  const Row = ({ label, detail, icon, last, danger, onClick }: {
    label: string; detail?: string; icon?: string; last?: boolean; danger?: boolean; onClick?: () => void;
  }) => {
    const Ic = icon ? (Icons as Record<string, ComponentType<{ size?: number; color?: string; stroke?: number }>>)[icon] : null;
    return (
      <div
        onClick={onClick}
        className={`settings-screen__row ${onClick ? 'settings-screen__row--clickable' : ''} ${last ? 'settings-screen__row--last' : ''}`}
      >
        {Ic && <Ic size={17} color={danger ? 'var(--neg)' : 'var(--text-2)'} stroke={1.8} />}
        <span className={`settings-screen__row-label ${danger ? 'settings-screen__row-label--danger' : ''}`}>{label}</span>
        {detail && <span className="settings-screen__row-detail">{detail}</span>}
        {onClick && <Icons.chevR size={14} color="var(--text-4)" />}
      </div>
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="settings-screen__section">
      <div className="settings-screen__section-title">{title}</div>
      <div className="settings-screen__section-body">{children}</div>
    </div>
  );

  return (
    <div className="phone-surface settings-screen" data-screen-label="Settings">
      <div className="settings-screen__status-bar"><IOSStatusBar /></div>
      <div className="settings-screen__scroll no-scrollbar">
        <div className="settings-screen__page-header">
          <h1 className="settings-screen__page-title">Ajustes</h1>
        </div>

        {/* Profile */}
        <div className="settings-screen__profile">
          <div className="settings-screen__avatar">
            {initials}
          </div>
          <div className="settings-screen__profile-info">
            <div className="settings-screen__profile-name">{userName || 'Usuário'}</div>
            <div className="settings-screen__profile-email">{userEmail}</div>
          </div>
        </div>

        <Section title="CONTA">
          <Row label="Carteiras e contas" detail={String(accountCount)} icon="wallet" onClick={() => onNavigate?.('accounts')} />
          <Row label="Categorias" detail={String(categoryCount)} icon="grid" onClick={() => onNavigate?.('categories')} />
          <Row label="Recorrentes" icon="repeat" onClick={() => onNavigate?.('recurring')} />
          <Row label="Espaços" icon="grid" last onClick={() => onNavigate?.('workspaces')} />
        </Section>

        <Section title="APARÊNCIA">
          <Row label="Tema" detail={theme === 'dark' ? 'Escuro' : 'Claro'} icon="moon" onClick={toggleTheme} />
          <Row label="Moeda principal" detail={currency} last onClick={toggleCurrency} />
        </Section>

        <Section title="DADOS">
          <Row label="Exportar dados" detail={`${tx.length} transações`} icon="download" onClick={() => setExportOpen(!exportOpen)} />
          {exportOpen && (
            <div className="settings-screen__export-row">
              <button onClick={exportCSV} className="settings-screen__export-btn">CSV</button>
              <button onClick={exportJSON} className="settings-screen__export-btn">JSON</button>
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
          <Row label="Sobre" icon="alert" onClick={() => setShowAbout(!showAbout)} />
          {showAbout && (
            <div className="settings-screen__about">
              <div className="settings-screen__about-row">
                <span className="settings-screen__about-label">Versão</span>
                <span className="settings-screen__about-value">0.1.0</span>
              </div>
              <div className="settings-screen__about-row">
                <span className="settings-screen__about-label">Stack</span>
                <span className="settings-screen__about-value">React · TypeScript · Vite</span>
              </div>
              <div className="settings-screen__about-row">
                <span className="settings-screen__about-label">Backend</span>
                <span className="settings-screen__about-value">AWS Lambda · DynamoDB</span>
              </div>
              <div className="settings-screen__about-row">
                <span className="settings-screen__about-label">AI</span>
                <span className="settings-screen__about-value">OpenAI GPT-4o</span>
              </div>
              <div className="settings-screen__about-row">
                <span className="settings-screen__about-label">Auth</span>
                <span className="settings-screen__about-value">Cognito · Google OAuth</span>
              </div>
            </div>
          )}
          <Row label="Sair" icon="x" danger last onClick={() => { signOut(); onSignOut?.(); }} />
        </Section>
      </div>
    </div>
  );
}
