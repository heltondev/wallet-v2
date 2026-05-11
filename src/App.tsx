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
import { ManagePrompts } from './screens/ManagePrompts';
import { ManageRecurring } from './screens/ManageRecurring';
import { ManageWorkspaces } from './screens/ManageWorkspaces';
import { FAB } from './components/FAB';
import { BottomTabBar } from './components/BottomTabBar';
import { fmtBRL } from './utils/formatters';
import { isAuthenticated, signOut, handleAuthCallback } from './lib/auth';
import { listTransactions, createTransaction, listAccounts, getSettings, generateRecurring, listWorkspaces, listRecurring } from './lib/api';
import type { Transaction, Account, Workspace, RecurringTransaction, TabId, FabKind, ToastData, CurrencyCode } from './types';
import './App.scss';


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
}

const DEFAULT_SETTINGS: WalletSettings = { theme: 'dark', accent: '#10B981', fab: 'circle', currency: 'BRL' };

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
  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);

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

  // Load data from API after auth, then generate pending recurring transactions
  useEffect(() => {
    if (!authed) return;
    loadData().then(async () => {
      try {
        const result = await generateRecurring();
        if (result.generated.length > 0) {
          const txData = await listTransactions();
          setTx(txData as unknown as Transaction[]);
        }
      } catch {
        // Recurring generation failed — non-blocking
      }
    });
  }, [authed]);

  const loadData = async () => {
    try {
      const [txData, accData, settingsData, wsData, recData] = await Promise.all([
        listTransactions(), listAccounts(), getSettings(), listWorkspaces(), listRecurring(),
      ]);
      setTx(txData as unknown as Transaction[]);
      setAccounts(accData as unknown as Account[]);
      setRecurringItems(recData as unknown as RecurringTransaction[]);
      if (settingsData.theme) setTheme(settingsData.theme as 'dark' | 'light');
      if (settingsData.currency) setCurrency(settingsData.currency as 'BRL' | 'USD');
      setWorkspaces(wsData as unknown as Workspace[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      showToast(msg, 0);
    }
  };

  const showToast = (desc: string, amount: number) => {
    setToast({ desc, amount });
    setTimeout(() => setToast(null), 2200);
  };

  const filteredTx = activeWorkspace
    ? tx.filter(t => t.workspaceId === activeWorkspace)
    : tx;

  const activeBudget = activeWorkspace
    ? workspaces.find(w => w.id === activeWorkspace)?.monthlyBudget ?? 0
    : workspaces.reduce((sum, w) => sum + w.monthlyBudget, 0);

  const activeCurrency = activeWorkspace
    ? workspaces.find(w => w.id === activeWorkspace)?.currency ?? currency
    : currency;

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

  const onSave = async (data: { desc: string; cat: string; amount: number; currency: CurrencyCode; fxRate: number; account: string; date?: string; day?: string; wd?: string; workspaceId?: string | null }): Promise<string | undefined> => {
    try {
      const fields = data.date ? data : { ...txDateFields(), ...data };
      const result = await createTransaction(fields);
      showToast(data.desc, data.amount);
      // Re-fetch to get server-assigned id
      const txData = await listTransactions();
      setTx(txData as unknown as Transaction[]);
      return result.id as string;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      showToast(msg, 0);
      return undefined;
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
        <div className="app__stage-bg" />
        <div className="phone-shell">
          <div className="island" />
          <div className="phone-surface app__loading">
            <span className="app__loading-text">
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
        <div className="app__stage-bg" />
        <div className="phone-shell">
          <div className="island" />
          <div
            className={`home-ind ${theme === 'dark' ? 'app__home-ind--dark' : 'app__home-ind--light'}`}
          />
          <LoginScreen onAuthenticated={() => { setAuthed(true); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <div className="app__stage-bg" />
      <div className="phone-shell" data-theme={theme}>
        <div className="island" />
        <div
          className={`home-ind ${theme === 'dark' ? 'app__home-ind--dark' : 'app__home-ind--light'}`}
        />

        {tab === 'home' && (
          <LiveHome
            tx={filteredTx}
            recurring={recurringItems}
            currency={activeCurrency}
            monthlyBudget={activeBudget}
            onTabChange={(id) => setTab(id as TabId)}
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={setActiveWorkspace}
          />
        )}
        {tab === 'list' && (
          <LiveTxList
            tx={filteredTx}
            displayCurrency={activeCurrency}
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={setActiveWorkspace}
          />
        )}
        {tab === 'forecast' && (
          <PrevisaoA tx={filteredTx} recurring={recurringItems} currency={activeCurrency} monthlyBudget={activeBudget} workspaceId={activeWorkspace} />
        )}
        {tab === 'cats' && (
          <CategoriasScreen tx={filteredTx} currency={activeCurrency} workspaceId={activeWorkspace} />
        )}
        {tab === 'settings' && !subScreen && (
          <AjustesScreen
            fabKind={fab}
            tx={tx}
            onNavigate={(s) => setSubScreen(s)}
            onSignOut={handleSignOut}
            onSettingsChange={(s) => {
              if (s.theme) setTheme(s.theme);
              if (s.currency) setCurrency(s.currency as 'BRL' | 'USD');
            }}
          />
        )}
        {subScreen === 'ai-chat' && (
          <div className="app__sub-screen">
            <AiChat fabKind={fab} onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'ai-insights' && (
          <div className="app__sub-screen">
            <AiInsights fabKind={fab} onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'admin-costs' && (
          <div className="app__sub-screen">
            <AdminCosts fabKind={fab} onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'ai-receipt' && (
          <div className="app__sub-screen">
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
          <div className="app__sub-screen">
            <ManageAccounts onBack={() => { setSubScreen(null); loadData(); }} />
          </div>
        )}
        {subScreen === 'categories' && (
          <div className="app__sub-screen">
            <ManageCategories onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'prompts' && (
          <div className="app__sub-screen">
            <ManagePrompts onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'recurring' && (
          <div className="app__sub-screen">
            <ManageRecurring onBack={() => setSubScreen(null)} />
          </div>
        )}
        {subScreen === 'workspaces' && (
          <div className="app__sub-screen">
            <ManageWorkspaces onBack={() => { setSubScreen(null); loadData(); }} />
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

        <AddSheet open={sheet} onClose={() => setSheet(false)} onSave={onSave} accounts={accounts} activeWorkspace={activeWorkspace} workspaces={workspaces} />

        {toast && (
          <div className="toast">
            <span
              className="app__toast-dot"
              style={{ background: toast.amount > 0 ? 'var(--pos)' : 'var(--neg)' }}
            />
            <span className="app__toast-label">Salvo</span>
            <span className="tabular app__toast-amount">
              {toast.amount > 0 ? '+' : '\u2212'}
              {fmtBRL(Math.abs(toast.amount)).replace('\u2212', '')}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
