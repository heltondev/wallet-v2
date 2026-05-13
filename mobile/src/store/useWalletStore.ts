import { create } from 'zustand';
import type { Transaction, Account, RecurringTransaction, Payment, Workspace } from '../types';
import * as api from '../services/apiService';

interface WalletState {
  tx: Transaction[];
  accounts: Account[];
  recurringItems: RecurringTransaction[];
  payments: Payment[];
  workspaces: Workspace[];
  activeWorkspace: string | null;
  fxRates: Record<string, number>;
  loading: boolean;
  loadData: (wsId?: string | null) => Promise<void>;
  setActiveWorkspace: (id: string | null) => void;
  setFxRates: (rates: Record<string, number>) => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  tx: [],
  accounts: [],
  recurringItems: [],
  payments: [],
  workspaces: [],
  activeWorkspace: null,
  fxRates: { USD: 1, BRL: 5.19, EUR: 0.92 },
  loading: false,

  loadData: async (wsId?: string | null) => {
    set({ loading: true });

    try {
      // Always fetch workspaces + settings first
      const [workspacesData, settingsData] = await Promise.all([
        api.listWorkspaces(),
        api.getSettings(),
      ]);

      const allWorkspaces = workspacesData as unknown as Workspace[];
      set({ workspaces: allWorkspaces });

      // Auto-select first workspace if user has no owned workspaces
      let targetWs = wsId !== undefined ? wsId : get().activeWorkspace;
      const hasOwned = allWorkspaces.some(w => w.ownership !== 'shared');
      if (!hasOwned && targetWs === null && allWorkspaces.length > 0) {
        targetWs = allWorkspaces[0].id;
        set({ activeWorkspace: targetWs });
      }

      // Determine shared access params
      let owner: string | undefined;
      let workspace: string | undefined;

      if (targetWs) {
        const ws = allWorkspaces.find((w) => w.id === targetWs);
        if (ws?.ownership === 'shared' && ws.ownerId) {
          owner = ws.ownerId;
          workspace = ws.id;
        }
      }

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [txData, accountsData, recurringData, paymentsData] =
        await Promise.all([
          api.listTransactions(month, owner, workspace),
          api.listAccounts(owner, workspace),
          api.listRecurring(owner, workspace),
          api.listPayments(month, owner, workspace),
        ]);

      set({
        tx: txData as unknown as Transaction[],
        accounts: accountsData as unknown as Account[],
        recurringItems: recurringData as unknown as RecurringTransaction[],
        payments: paymentsData as unknown as Payment[],
        loading: false,
      });

      if (settingsData && typeof settingsData === 'object') {
        // Settings can be consumed by useSettingsStore separately
      }
    } catch {
      set({ loading: false });
    }
  },

  setActiveWorkspace: (id) => set({ activeWorkspace: id }),
  setFxRates: (rates) => set({ fxRates: rates }),
}));
