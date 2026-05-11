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

export const updateTransaction = (id: string, month: string, data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>(`/transactions/${id}?month=${month}`, { method: 'PUT', body: JSON.stringify({ month, ...data }) });

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

export const createCategory = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/categories', { method: 'POST', body: JSON.stringify(data) });

export const updateCategory = (slug: string, data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>(`/categories/${slug}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCategory = (slug: string) =>
  apiFetch<void>(`/categories/${slug}`, { method: 'DELETE' });

// Budgets
export const listBudgets = (month?: string) =>
  apiFetch<Record<string, unknown>[]>(month ? `/budgets?month=${month}` : '/budgets');

export const createBudget = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/budgets', { method: 'POST', body: JSON.stringify(data) });

// Settings
export const getSettings = () =>
  apiFetch<Record<string, unknown>>('/settings');

export const updateSettings = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/settings', { method: 'PUT', body: JSON.stringify(data) });

// AI
export const aiCategorize = (data: { desc: string; amount: number; currency: string; account: string }) =>
  apiFetch<{ category: string; confidence: number; alternatives: string[]; reasoning: string }>('/ai/categorize', { method: 'POST', body: JSON.stringify(data) });

export const aiLearnCategory = (merchant: string, suggestedCategory: string, correctedCategory: string) =>
  apiFetch<void>('/ai/learn-category', { method: 'POST', body: JSON.stringify({ merchant, suggestedCategory, correctedCategory }) });

export const aiExtractReceipt = (
  files: { base64: string; mimeType: string }[],
  text: string,
) =>
  apiFetch<import('../types').AiExtractResult>('/ai/extract-receipt', {
    method: 'POST',
    body: JSON.stringify({ files, text }),
  });

export const aiInsights = (month: string) =>
  apiFetch<{ summary: string; patterns: string[]; alerts: string[]; tips: string[] }>('/ai/insights', { method: 'POST', body: JSON.stringify({ month }) });

export const aiChat = (message: string) =>
  apiFetch<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) });

// Receipts
export const getUploadUrl = (txId: string, fileName: string, contentType: string) =>
  apiFetch<{ uploadUrl: string; key: string }>('/receipts/upload-url', { method: 'POST', body: JSON.stringify({ txId, fileName, contentType }) });

export const getReceiptUrl = (txId: string) =>
  apiFetch<{ downloadUrl: string; fileName: string; contentType: string }>(`/receipts/${txId}`);

export const uploadFileToS3 = async (url: string, file: File) => {
  await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
};

// Admin
export const getAdminCosts = () =>
  apiFetch<Record<string, unknown>>('/admin/costs');

// Admin - Prompts
export const listPrompts = () =>
  apiFetch<Record<string, unknown>[]>('/admin/prompts');

export const getPrompt = (feature: string) =>
  apiFetch<Record<string, unknown>>(`/admin/prompts/${feature}`);

export const updatePrompt = (feature: string, content: string) =>
  apiFetch<Record<string, unknown>>(`/admin/prompts/${feature}`, { method: 'PUT', body: JSON.stringify({ content }) });
