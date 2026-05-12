import { useState, useEffect } from 'react';
import { LiveHome } from './screens/LiveHome';
import { LiveTxList } from './screens/LiveTxList';
import { PaymentSheet } from './screens/PaymentSheet';
import { VerifyPayments } from './screens/VerifyPayments';
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
import { BottomTabBar } from './components/BottomTabBar';
import { fmtBRL, convertAmount } from './utils/formatters';
import { fetchFxRates } from './utils/fxRates';
import { isAuthenticated, signOut, handleAuthCallback } from './lib/auth';
import {
	listTransactions,
	createPayment,
	deletePayment,
	listPayments,
	listAccounts,
	getSettings,
	listWorkspaces,
	listRecurring,
} from './lib/api';
import type {
	Transaction,
	Account,
	Workspace,
	RecurringTransaction,
	Payment,
	TabId,
	FabKind,
	ToastData,
	CurrencyCode,
	AiVerifyPaymentsMatch,
} from './types';
import './App.scss';

interface WalletSettings {
	theme: 'dark' | 'light';
	accent: string;
	fab: FabKind;
	currency: 'BRL' | 'USD';
}

const DEFAULT_SETTINGS: WalletSettings = {
	theme: 'dark',
	accent: '#10B981',
	fab: 'circle',
	currency: 'BRL',
};

export function App() {
	const [authed, setAuthed] = useState(false);
	const [authLoading, setAuthLoading] = useState(true);

	const [theme, setTheme] = useState<'dark' | 'light'>(DEFAULT_SETTINGS.theme);
	const [accent] = useState(DEFAULT_SETTINGS.accent);
	const [fab] = useState<FabKind>(DEFAULT_SETTINGS.fab);
	const [currency, setCurrency] = useState<'BRL' | 'USD'>(
		DEFAULT_SETTINGS.currency
	);

	const [tab, setTab] = useState<TabId>('home');
	const [tx, setTx] = useState<Transaction[]>([]);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>(
		[]
	);
	const [payments, setPayments] = useState<Payment[]>([]);
	const [toast, setToast] = useState<ToastData | null>(null);
	const [subScreen, setSubScreen] = useState<string | null>(null);
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
	const [fxRates, setFxRates] = useState<Record<string, number>>({
		USD: 1,
		BRL: 5.19,
		EUR: 0.92,
	});

	// Payment sheet state
	const [payingBill, setPayingBill] = useState<RecurringTransaction | null>(
		null
	);

	// Check auth on mount
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');

		if (code) {
			window.history.replaceState({}, '', '/');
			handleAuthCallback(code)
				.then(() => {
					setAuthed(true);
					setAuthLoading(false);
				})
				.catch(() => {
					setAuthed(false);
					setAuthLoading(false);
				});
		} else {
			isAuthenticated().then((ok) => {
				setAuthed(ok);
				setAuthLoading(false);
			});
		}
	}, []);

	useEffect(() => {
		if (!authed) return;
		fetchFxRates().then(setFxRates);
	}, [authed]);

	useEffect(() => {
		if (!authed) return;
		loadData(activeWorkspace);
	}, [authed]);

	// Reload data when switching to/from shared workspace
	useEffect(() => {
		if (!authed) return;
		const ws = workspaces.find((w) => w.id === activeWorkspace);
		if (ws?.ownership === 'shared' || activeWorkspace === null) {
			loadData(activeWorkspace);
		}
	}, [activeWorkspace]);

	const currentMonthKey = () => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	};

	const loadData = async (wsId?: string | null) => {
		try {
			// Always load settings + workspaces from own account
			const [settingsData, wsData] = await Promise.all([
				getSettings(),
				listWorkspaces(),
			]);
			if (settingsData.theme) setTheme(settingsData.theme as 'dark' | 'light');
			if (settingsData.currency)
				setCurrency(settingsData.currency as 'BRL' | 'USD');
			const allWorkspaces = wsData as unknown as Workspace[];
			setWorkspaces(allWorkspaces);

			// Auto-select first workspace if user has no owned workspaces
			const hasOwned = allWorkspaces.some(w => w.ownership !== 'shared');
			if (!hasOwned && wsId === null && allWorkspaces.length > 0) {
				wsId = allWorkspaces[0].id;
				setActiveWorkspace(wsId);
			}

			// Determine shared access params
			const activeWs = allWorkspaces.find((w) => w.id === wsId);
			const isShared = activeWs?.ownership === 'shared';
			const owner = isShared ? activeWs?.ownerId : undefined;
			const workspace = isShared ? activeWs?.id : undefined;

			// Load data — from owner's account if shared, own account otherwise
			const [txData, accData, recData, payData] = await Promise.all([
				listTransactions(undefined, owner, workspace),
				listAccounts(owner, workspace),
				listRecurring(owner, workspace),
				listPayments(currentMonthKey(), owner, workspace),
			]);
			setTx(txData as unknown as Transaction[]);
			setAccounts(accData as unknown as Account[]);
			setRecurringItems(recData as unknown as RecurringTransaction[]);
			setPayments(payData as unknown as Payment[]);
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
		? tx.filter((t) => t.workspaceId === activeWorkspace)
		: tx;

	const activeBudget = activeWorkspace
		? (workspaces.find((w) => w.id === activeWorkspace)?.monthlyBudget ?? 0)
		: workspaces.reduce(
				(sum, w) =>
					sum + convertAmount(w.monthlyBudget, w.currency, currency, fxRates),
				0
			);

	const activeCurrency = activeWorkspace
		? (workspaces.find((w) => w.id === activeWorkspace)?.currency ?? currency)
		: currency;

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
	}, [theme]);

	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty('--pos', accent);
		root.style.setProperty(
			'--pos-bg',
			`color-mix(in oklch, ${accent} 18%, transparent)`
		);
	}, [accent]);

	// Shared workspace access helpers
	const activeWs = workspaces.find((w) => w.id === activeWorkspace);
	const sharedOwner =
		activeWs?.ownership === 'shared' ? activeWs.ownerId : undefined;
	const sharedWsId = activeWs?.ownership === 'shared' ? activeWs.id : undefined;
	const isViewerMode = activeWs?.role === 'viewer';

	const handleMarkPaid = (r: RecurringTransaction) => {
		setPayingBill(r);
	};

	const handleUndoPayment = async (paymentId: string) => {
		try {
			await deletePayment(
				paymentId,
				currentMonthKey(),
				sharedOwner,
				sharedWsId
			);
			showToast('Pagamento desfeito', 0);
			const payData = await listPayments(
				currentMonthKey(),
				sharedOwner,
				sharedWsId
			);
			setPayments(payData as unknown as Payment[]);
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : 'Erro ao desfazer pagamento';
			showToast(msg, 0);
		}
	};

	const handleConfirmPayment = async (data: {
		recurringId: string;
		amount: number;
		currency: CurrencyCode;
		paidDate: string;
		account: string;
		notes?: string;
		receiptKey?: string;
		receiptName?: string;
		workspaceId?: string;
	}) => {
		try {
			await createPayment(
				{
					...data,
					month: currentMonthKey(),
				},
				sharedOwner,
				sharedWsId
			);
			showToast('Pagamento registrado', data.amount);
			const payData = await listPayments(
				currentMonthKey(),
				sharedOwner,
				sharedWsId
			);
			setPayments(payData as unknown as Payment[]);
			setPayingBill(null);
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : 'Erro ao registrar pagamento';
			showToast(msg, 0);
		}
	};

	const handleVerifyConfirm = async (matches: AiVerifyPaymentsMatch[]) => {
		try {
			for (const m of matches) {
				await createPayment(
					{
						recurringId: m.recurringId,
						month: currentMonthKey(),
						amount: m.amount,
						currency: m.currency,
						paidDate: m.paidDate,
						account: accounts[0]?.name ?? '',
						notes: `AI: ${m.matchReason}`,
					},
					sharedOwner,
					sharedWsId
				);
			}
			showToast(`${matches.length} pagamentos registrados`, 0);
			const payData = await listPayments(
				currentMonthKey(),
				sharedOwner,
				sharedWsId
			);
			setPayments(payData as unknown as Payment[]);
			setSubScreen(null);
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : 'Erro ao registrar pagamentos';
			showToast(msg, 0);
		}
	};

	const handleSignOut = () => {
		signOut();
		setAuthed(false);
		setTx([]);
		setAccounts([]);
		setPayments([]);
		setTab('home');
		setSubScreen(null);
	};

	if (authLoading) {
		return (
			<div className='stage'>
				<div className='app__stage-bg' />
				<div className='phone-shell'>
					<div className='island' />
					<div className='phone-surface app__loading'>
						<span className='app__loading-text'>Carregando...</span>
					</div>
				</div>
			</div>
		);
	}

	if (!authed) {
		return (
			<div className='stage'>
				<div className='app__stage-bg' />
				<div className='phone-shell'>
					<div className='island' />
					<LoginScreen
						onAuthenticated={() => {
							setAuthed(true);
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className='stage'>
			<div className='app__stage-bg' />
			<div className='phone-shell' data-theme={theme}>
				<div className='island' />

				{tab === 'home' && !subScreen && (
					<LiveHome
						tx={tx}
						recurring={recurringItems}
						payments={payments}
						currency={activeCurrency}
						monthlyBudget={activeBudget}
						workspaces={workspaces}
						activeWorkspace={activeWorkspace}
						onWorkspaceChange={setActiveWorkspace}
						onNavigateRecurring={() => {
							setTab('settings');
							setSubScreen('recurring');
						}}
						onMarkPaid={isViewerMode ? undefined : handleMarkPaid}
						onUndoPayment={isViewerMode ? undefined : handleUndoPayment}
						onVerifyPayments={
							isViewerMode ? undefined : () => setSubScreen('verify-payments')
						}
						onNavigateContas={() => setTab('list')}
						fxRates={fxRates}
					/>
				)}
				{tab === 'list' && !subScreen && (
					<LiveTxList
						tx={tx}
						recurring={recurringItems}
						payments={payments}
						displayCurrency={activeCurrency}
						workspaces={workspaces}
						activeWorkspace={activeWorkspace}
						onWorkspaceChange={setActiveWorkspace}
						onMarkPaid={isViewerMode ? undefined : handleMarkPaid}
						onUndoPayment={isViewerMode ? undefined : handleUndoPayment}
						onVerifyPayments={
							isViewerMode ? undefined : () => setSubScreen('verify-payments')
						}
						onNavigateRecurring={() => {
							setTab('settings');
							setSubScreen('recurring');
						}}
						fxRates={fxRates}
					/>
				)}
				{tab === 'forecast' && !subScreen && (
					<PrevisaoA
						tx={filteredTx}
						recurring={recurringItems}
						currency={activeCurrency}
						monthlyBudget={activeBudget}
						workspaces={workspaces}
						activeWorkspace={activeWorkspace}
						onWorkspaceChange={setActiveWorkspace}
						fxRates={fxRates}
					/>
				)}
				{tab === 'cats' && !subScreen && (
					<CategoriasScreen
						recurring={recurringItems}
						currency={activeCurrency}
						workspaceId={activeWorkspace}
						fxRates={fxRates}
					/>
				)}
				{tab === 'settings' && !subScreen && (
					<AjustesScreen
						fabKind={fab}
						tx={tx}
						isOwner={workspaces.some(w => w.ownership !== 'shared')}
						onNavigate={(s) => setSubScreen(s)}
						onSignOut={handleSignOut}
						onSettingsChange={(s) => {
							if (s.theme) setTheme(s.theme);
							if (s.currency) setCurrency(s.currency as 'BRL' | 'USD');
						}}
					/>
				)}

				{subScreen === 'verify-payments' && (
					<div className='app__sub-screen'>
						<VerifyPayments
							onBack={() => setSubScreen(null)}
							onConfirm={handleVerifyConfirm}
							currency={activeCurrency}
						/>
					</div>
				)}
				{subScreen === 'ai-chat' && (
					<div className='app__sub-screen'>
						<AiChat fabKind={fab} onBack={() => setSubScreen(null)} />
					</div>
				)}
				{subScreen === 'ai-insights' && (
					<div className='app__sub-screen'>
						<AiInsights fabKind={fab} onBack={() => setSubScreen(null)} />
					</div>
				)}
				{subScreen === 'admin-costs' && (
					<div className='app__sub-screen'>
						<AdminCosts fabKind={fab} onBack={() => setSubScreen(null)} />
					</div>
				)}
				{subScreen === 'ai-receipt' && (
					<div className='app__sub-screen'>
						<ReceiptScreen
							fabKind={fab}
							onBack={() => setSubScreen(null)}
							onSave={async (data) => {
								try {
									showToast(data.desc ?? 'Recibo', data.amount ?? 0);
								} catch (err: unknown) {
									const msg =
										err instanceof Error ? err.message : 'Erro ao salvar';
									showToast(msg, 0);
								}
							}}
						/>
					</div>
				)}

				{subScreen === 'accounts' && (
					<div className='app__sub-screen'>
						<ManageAccounts
							onBack={() => {
								setSubScreen(null);
								loadData();
							}}
						/>
					</div>
				)}
				{subScreen === 'categories' && (
					<div className='app__sub-screen'>
						<ManageCategories onBack={() => setSubScreen(null)} />
					</div>
				)}
				{subScreen === 'prompts' && (
					<div className='app__sub-screen'>
						<ManagePrompts onBack={() => setSubScreen(null)} />
					</div>
				)}
				{subScreen === 'recurring' && (
					<div className='app__sub-screen'>
						<ManageRecurring onBack={() => setSubScreen(null)} />
					</div>
				)}
				{subScreen === 'workspaces' && (
					<div className='app__sub-screen'>
						<ManageWorkspaces
							onBack={() => {
								setSubScreen(null);
								loadData();
							}}
						/>
					</div>
				)}

				{/* Tab bar — no FAB */}
				{!subScreen && (
					<BottomTabBar
						active={tab}
						fabKind={fab}
						onChange={(id) => setTab(id)}
					/>
				)}

				{/* Payment sheet */}
				{payingBill && (
					<PaymentSheet
						open={!!payingBill}
						recurring={payingBill}
						accounts={accounts}
						onClose={() => setPayingBill(null)}
						onConfirm={handleConfirmPayment}
					/>
				)}

				{toast && (
					<div className='toast'>
						<span
							className='app__toast-dot'
							style={{
								background: toast.amount > 0 ? 'var(--pos)' : 'var(--neg)',
							}}
						/>
						<span className='app__toast-label'>Salvo</span>
						<span className='tabular app__toast-amount'>
							{toast.amount > 0 ? '+' : '\u2212'}
							{fmtBRL(Math.abs(toast.amount)).replace('\u2212', '')}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
