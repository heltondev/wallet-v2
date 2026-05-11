import { useState, useEffect } from 'react';
import { LiveHome } from './screens/LiveHome';
import { LiveTxList } from './screens/LiveTxList';
import { AddSheet } from './screens/AddSheet';
import { PrevisaoA } from './screens/PrevisaoA';
import { CategoriasScreen } from './screens/CategoriasScreen';
import { AjustesScreen } from './screens/AjustesScreen';
import { AiChat } from './screens/AiChat';
import { AiInsights } from './screens/AiInsights';
import { FAB } from './components/FAB';
import { BottomTabBar } from './components/BottomTabBar';
import { fmtBRL } from './utils/formatters';
import { TweaksPanel } from './tweaks/TweaksPanel';
import { TweakSection, TweakRadio, TweakColor, TweakButton } from './tweaks/TweakControls';
import { INITIAL_TX, INITIAL_ACCOUNTS } from './data/sampleTransactions';
import { ACCENT_OPTIONS, TWEAKS_DEFAULTS } from './data/constants';
import type { Transaction, TabId, FabKind, ToastData, CurrencyCode } from './types';

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

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(TWEAKS_DEFAULTS.theme);
  const [accent, setAccent] = useState(TWEAKS_DEFAULTS.accent);
  const [fab, setFab] = useState<FabKind>(TWEAKS_DEFAULTS.fab);
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(TWEAKS_DEFAULTS.currency);

  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState(false);
  const [tx, setTx] = useState<Transaction[]>(INITIAL_TX);
  const [accounts] = useState(INITIAL_ACCOUNTS);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [subScreen, setSubScreen] = useState<string | null>(null);

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

  const onSave = (data: { desc: string; cat: string; amount: number; currency: CurrencyCode; fxRate: number; account: string }) => {
    const newId = Math.max(...tx.map((item) => item.id)) + 1;
    setTx([{ id: newId, day: '14', wd: 'qua', ...data }, ...tx]);
    setToast({ desc: data.desc, amount: data.amount });
    setTimeout(() => setToast(null), 2200);
  };

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
            <AjustesScreen fabKind={fab} onNavigate={(s) => setSubScreen(s)} />
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
            setTx(INITIAL_TX);
            setToast({ desc: 'Reset', amount: 0 });
            setTimeout(() => setToast(null), 1500);
          }}
        >
          Reset transactions
        </TweakButton>
      </TweaksPanel>
    </div>
  );
}
