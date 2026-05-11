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
import { FAB } from './components/FAB';
import { BottomTabBar } from './components/BottomTabBar';
import { fmtBRL } from './utils/formatters';
import { TweaksPanel } from './tweaks/TweaksPanel';
import { TweakSection, TweakRadio, TweakColor, TweakButton } from './tweaks/TweakControls';
import { ACCENT_OPTIONS } from './data/constants';
import { isAuthenticated, signOut, handleAuthCallback } from './lib/auth';
import { listTransactions, createTransaction, listAccounts } from './lib/api';
import type { Transaction, Account, TabId, FabKind, ToastData, CurrencyCode } from './types';

/* Overlay interceptors for screens not yet wired live */
function FabIntercept({ fabKind, onAdd }: { fabKind: FabKind; onAdd: () => void }) {
  if (fabKind === 'tab') return null;
  return <FAB kind={fabKind} onClick={onAdd} />;
}

function TabIntercept({
  active,
  fabKind,
  onChange,
  onAdd,
}: {
  active: TabId;
  fabKind: FabKind;
  onChange: (tab: string) => void;
  onAdd: () => void;
}) {
  return <BottomTabBar active={active} fabKind={fabKind} onChange={onChange} onAdd={onAdd} />;
}

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

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);
  const [accent, setAccent] = useState(settings.accent);
  const [fab, setFab] = useState<FabKind>(settings.fab);
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(settings.currency);

  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState(false);
  const [tx, setTx] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
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
      const [txData, accData] = await Promise.all([listTransactions(), listAccounts()]);
      setTx(txData as unknown as Transaction[]);
      setAccounts(accData as unknown as Account[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      showToast(msg, 0);
    }
  };

  const showToast = (desc: string, amount: number) => {
    setToast({ desc, amount });
    setTimeout(() => setToast(null), 2200);
  };

  // Persist settings in memory (no localStorage)
  useEffect(() => {
    const s = { theme, accent, fab, currency, monthlyBudget: settings.monthlyBudget };
    setSettings(s);
  }, [theme, accent, fab, currency, settings.monthlyBudget]);

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
          <LiveHome
            tx={tx}
            currency={currency}
            fabKind={fab}
            onAdd={() => setSheet(true)}
            onTabChange={(id) => setTab(id as TabId)}
          />
        )}
        {tab === 'list' && (
          <LiveTxList
            tx={tx}
            fabKind={fab}
            displayCurrency={currency}
            onAdd={() => setSheet(true)}
            onTabChange={(id) => setTab(id as TabId)}
          />
        )}
        {tab === 'forecast' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <PrevisaoA fabKind={fab} />
            <FabIntercept fabKind={fab} onAdd={() => setSheet(true)} />
            <TabIntercept
              active="forecast"
              fabKind={fab}
              onChange={(id) => setTab(id as TabId)}
              onAdd={() => setSheet(true)}
            />
          </div>
        )}
        {tab === 'cats' && (
          <div style={{ height: '100%', position: 'relative' }}>
            <CategoriasScreen fabKind={fab} />
            <FabIntercept fabKind={fab} onAdd={() => setSheet(true)} />
            <TabIntercept
              active="cats"
              fabKind={fab}
              onChange={(id) => setTab(id as TabId)}
              onAdd={() => setSheet(true)}
            />
          </div>
        )}
        {tab === 'settings' && !subScreen && (
          <div style={{ height: '100%', position: 'relative' }}>
            <AjustesScreen fabKind={fab} onNavigate={(s) => setSubScreen(s)} onSignOut={handleSignOut} />
            <TabIntercept
              active="settings"
              fabKind={fab}
              onChange={(id) => { setSubScreen(null); setTab(id as TabId); }}
              onAdd={() => setSheet(true)}
            />
          </div>
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

      {/* Gear toggle */}
      <button
        onClick={() => setTweaksOpen((v) => !v)}
        style={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          zIndex: 2147483645,
          width: 36,
          height: 36,
          borderRadius: 10,
          border: 'none',
          background: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Toggle tweaks"
      >
        ⚙
      </button>

      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            value={theme}
            onChange={(v) => setTheme(v as 'dark' | 'light')}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Accent color">
          <TweakColor
            value={accent}
            onChange={(v) => setAccent(v as string)}
            options={ACCENT_OPTIONS}
          />
        </TweakSection>
        <TweakSection label="FAB style">
          <TweakRadio
            value={fab}
            onChange={(v) => setFab(v as FabKind)}
            options={[
              { value: 'circle', label: 'Circle' },
              { value: 'pill', label: 'Pill' },
              { value: 'tab', label: 'Tab' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Currency">
          <TweakRadio
            value={currency}
            onChange={(v) => setCurrency(v as 'BRL' | 'USD')}
            options={[
              { value: 'BRL', label: 'BRL' },
              { value: 'USD', label: 'USD' },
            ]}
          />
        </TweakSection>
        <TweakButton
          onClick={() => {
            setTx([]);
            showToast('Reset', 0);
          }}
        >
          Reset transactions
        </TweakButton>
      </TweaksPanel>
    </div>
  );
}
