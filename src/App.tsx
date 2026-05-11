import { useState, useEffect } from 'react';
import { LiveHome } from './screens/LiveHome';
import { LiveTxList } from './screens/LiveTxList';
import { AddSheet } from './screens/AddSheet';
import { PrevisaoA } from './screens/PrevisaoA';
import { CategoriasScreen } from './screens/CategoriasScreen';
import { AjustesScreen } from './screens/AjustesScreen';
import { AiChat } from './screens/AiChat';
import { AiInsights } from './screens/AiInsights';
import { AdminCosts } from './screens/AdminCosts';
import { ReceiptScreen } from './screens/ReceiptScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ManageAccounts } from './screens/ManageAccounts';
import { ManageCategories } from './screens/ManageCategories';
import { FAB } from './components/FAB';
import { BottomTabBar } from './components/BottomTabBar';
import { fmtBRL } from './utils/formatters';
import { isAuthenticated, signOut, handleAuthCallback } from './lib/auth';
import { listTransactions, createTransaction, listAccounts, getSettings } from './lib/api';
import type { Transaction, Account, TabId, FabKind, ToastData, CurrencyCode } from './types';


const PT_WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function txDateFields() {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const day = String(now.getDate());
  const wd = PT_WEEKDAYS[now.getDay()];
  return { date: iso, day, wd };
}

interface WalletSettings {
  theme: 'dark' | 'light';
  accent: string;
  fab: FabKind;
  currency: 'BRL' | 'USD';
  monthlyBudget: number;
}

const DEFAULT_SETTINGS: WalletSettings = { theme: 'dark', accent: '#10B981', fab: 'circle', currency: 'BRL', monthlyBudget: 9500 };

export function App() {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(DEFAULT_SETTINGS.theme);
  const [accent] = useState(DEFAULT_SETTINGS.accent);
  const [fab] = useState<FabKind>(DEFAULT_SETTINGS.fab);
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(DEFAULT_SETTINGS.currency);

  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState(false);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [subScreen, setSubScreen] = useState<string | null>(null);

  // Check auth on mount — handle OAuth callback if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // OAuth callback — exchange code for tokens
      window.history.replaceState({}, '', '/');
      handleAuthCallback(code)
        .then(() => { setAuthed(true); setAuthLoading(false); })
        .catch(() => { setAuthed(false); setAuthLoading(false); });
    } else {
      isAuthenticated().then(ok => {
        setAuthed(ok);
        setAuthLoading(false);
      });
    }
  }, []);

  // Load data from API after auth
  useEffect(() => {
    if (!authed) return;
    loadData();
  }, [authed]);

  const loadData = async () => {
    try {
      const [txData, accData, settingsData] = await Promise.all([listTransactions(), listAccounts(), getSettings()]);
      setTx(txData as unknown as Transaction[]);
      setAccounts(accData as unknown as Account[]);
      if (settingsData.theme) setTheme(settingsData.theme as 'dark' | 'light');
      if (settingsData.currency) setCurrency(settingsData.currency as 'BRL' | 'USD');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      showToast(msg, 0);
    }
  };

  const showToast = (desc: string, amount: number) => {
    setToast({ desc, amount });
    setTimeout(() => setToast(null), 2200);
  };

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Override --pos and --pos-bg when accent changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--pos', accent);
    root.style.setProperty('--pos-bg', `color-mix(in oklch, ${accent} 18%, transparent)`);
  }, [accent]);

  const onSave = async (data: { desc: string; cat: string; amount: number; currency: CurrencyCode; fxRate: number; account: string }) => {
    try {
      const fields = { ...txDateFields(), ...data };
      await createTransaction(fields);
      showToast(data.desc, data.amount);
      // Re-fetch to get server-assigned id
      const txData = await listTransactions();
      setTx(txData as unknown as Transaction[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      showToast(msg, 0);
    }
  };

  const handleSignOut = () => {
    signOut();
    setAuthed(false);
    setTx([]);
    setAccounts([]);
    setTab('home');
    setSubScreen(null);
  };

  if (authLoading) {
    return (
      <div className="stage">
        <div className="stage-bg" style={{ position: 'absolute', inset: 0, zIndex: -1 }} />
        <div className="phone-shell">
          <div className="island" />
          <div className="phone-surface" style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Carregando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="stage">
        <div className="stage-bg" style={{ position: 'absolute', inset: 0, zIndex: -1 }} />
        <div className="phone-shell">
          <div className="island" />
          <div
            className="home-ind"
            style={{ background: 'rgba(255,255,255,0.5)' }}
          />
          <LoginScreen onAuthenticated={() => { setAuthed(true); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <div className="stage-bg" style={{ position: 'absolute', inset: 0, zIndex: -1 }} />
      <div className="phone-shell" data-theme={theme}>
        <div className="island" />
        <div
          className="home-ind"
          style={{
            background: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)',
          }}
        />

        {tab === 'home' && (
          <LiveHome tx={tx} currency={currency} onTabChange={(id) => setTab(id as TabId)} />
        )}
        {tab === 'list' && (
          <LiveTxList tx={tx} displayCurrency={currency} />
        )}
        {tab === 'forecast' && (
          <PrevisaoA fabKind={fab} />
        )}
        {tab === 'cats' && (
          <CategoriasScreen fabKind={fab} />
        )}
        {tab === 'settings' && !subScreen && (
          <AjustesScreen
            fabKind={fab}
            onNavigate={(s) => setSubScreen(s)}
            onSignOut={handleSignOut}
            onSettingsChange={(s) => {
              if (s.theme) setTheme(s.theme);
              if (s.currency) setCurrency(s.currency as 'BRL' | 'USD');
            }}
          />
        )}
        {subScreen === 'ai-chat' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <AiChat fabKind={fab} onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'ai-insights' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <AiInsights fabKind={fab} onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'admin-costs' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <AdminCosts fabKind={fab} onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'ai-receipt' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <ReceiptScreen fabKind={fab} onBack={() => setSubScreen(null)} onSave={async (data) => {
              try {
                const fields = {
                  ...txDateFields(),
                  desc: data.desc ?? 'Recibo',
                  cat: data.cat ?? 'outros',
                  amount: data.amount ?? 0,
                  currency: data.currency ?? 'BRL',
                  fxRate: data.fxRate ?? 1,
                  account: data.account ?? 'Itau · Debito',
                };
                await createTransaction(fields);
                showToast(fields.desc, fields.amount);
                const txData = await listTransactions();
                setTx(txData as unknown as Transaction[]);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Erro ao salvar';
                showToast(msg, 0);
              }
            }} />
          </div>
        )}

        {subScreen === 'accounts' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <ManageAccounts onBack={() => { setSubScreen(null); loadData(); }} />
          </div>
        )}
        {subScreen === 'categories' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <ManageCategories onBack={() => setSubScreen(null)} />
          </div>
        )}

        {/* Global tab bar + FAB — outside all screens */}
        {!subScreen && (
          <>
            <FAB kind={fab} onClick={() => setSheet(true)} />
            <BottomTabBar
              active={tab}
              fabKind={fab}
              onChange={(id) => setTab(id)}
              onAdd={() => setSheet(true)}
            />
          </>
        )}

        <AddSheet open={sheet} onClose={() => setSheet(false)} onSave={onSave} accounts={accounts} />

        {toast && (
          <div className="toast">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: toast.amount > 0 ? 'var(--pos)' : 'var(--neg)',
              }}
            />
            <span style={{ fontFamily: 'var(--font-sans)' }}>Salvo</span>
            <span
              className="tabular"
              style={{ opacity: 0.6, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              {toast.amount > 0 ? '+' : '\u2212'}
              {fmtBRL(Math.abs(toast.amount)).replace('\u2212', '')}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
