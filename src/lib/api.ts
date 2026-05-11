import { getIdToken } from './auth';

const API_BASE = 'https://46ong49voc.execute-api.us-east-1.amazonaws.com/prod';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

// Transactions
export const createTransaction = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/transactions', { method: 'POST', body: JSON.stringify(data) });

export const listTransactions = (month?: string) =>
  apiFetch<Record<string, unknown>[]>(month ? `/transactions?month=${month}` : '/transactions');

export const deleteTransaction = (id: string) =>
  apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });

// Accounts
export const createAccount = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/accounts', { method: 'POST', body: JSON.stringify(data) });

export const listAccounts = () =>
  apiFetch<Record<string, unknown>[]>('/accounts');

// Categories
export const listCategories = () =>
  apiFetch<Record<string, unknown>[]>('/categories');

// Budgets
export const listBudgets = (month?: string) =>
  apiFetch<Record<string, unknown>[]>(month ? `/budgets?month=${month}` : '/budgets');

export const createBudget = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/budgets', { method: 'POST', body: JSON.stringify(data) });

// AI
export const aiCategorize = (desc: string, amount: number) =>
  apiFetch<{ category: string; confidence: number }>('/ai/categorize', { method: 'POST', body: JSON.stringify({ desc, amount }) });

export const aiExtractReceipt = (file: string, mimeType: string) =>
  apiFetch<Record<string, unknown>>('/ai/extract-receipt', { method: 'POST', body: JSON.stringify({ file, mimeType }) });

export const aiInsights = (month: string) =>
  apiFetch<{ summary: string; patterns: string[]; alerts: string[]; tips: string[] }>('/ai/insights', { method: 'POST', body: JSON.stringify({ month }) });

export const aiChat = (message: string) =>
  apiFetch<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) });

// Admin
export const getAdminCosts = () =>
  apiFetch<Record<string, unknown>>('/admin/costs');
