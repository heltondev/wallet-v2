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

export const deleteTransaction = (id: string, month: string) =>
  apiFetch<void>(`/transactions/${id}?month=${month}`, { method: 'DELETE' });

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

export const aiExtractReceipt = async (
  files: { base64: string; mimeType: string }[],
  text: string,
): Promise<import('../types').AiExtractResult> => {
  const { jobId } = await apiFetch<{ jobId: string }>('/ai/extract-receipt', {
    method: 'POST',
    body: JSON.stringify({ files, text }),
  });

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const job = await apiFetch<{ status: string; result?: import('../types').AiExtractResult; error?: string }>(`/ai/jobs/${jobId}`);
    if (job.status === 'completed' && job.result) return job.result;
    if (job.status === 'failed') throw new Error(job.error ?? 'AI processing failed');
  }

  throw new Error('AI processing timed out');
};

export const aiInsights = (month: string) =>
  apiFetch<{ summary: string; patterns: string[]; alerts: string[]; tips: string[] }>('/ai/insights', { method: 'POST', body: JSON.stringify({ month }) });

export const aiChat = (message: string) =>
  apiFetch<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) });

export const aiExtractRecurring = async (
  files: { base64: string; mimeType: string }[],
  text: string,
): Promise<import('../types').AiExtractRecurringResult> => {
  const { jobId } = await apiFetch<{ jobId: string }>('/ai/extract-recurring', {
    method: 'POST',
    body: JSON.stringify({ files, text }),
  });

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const job = await apiFetch<{ status: string; result?: import('../types').AiExtractRecurringResult; error?: string }>(`/ai/jobs/${jobId}`);
    if (job.status === 'completed' && job.result) return job.result;
    if (job.status === 'failed') throw new Error(job.error ?? 'AI processing failed');
  }

  throw new Error('AI processing timed out');
};

// Recurring
export const listRecurring = () =>
  apiFetch<Record<string, unknown>[]>('/recurring');

export const createRecurring = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/recurring', { method: 'POST', body: JSON.stringify(data) });

export const updateRecurring = (id: string, data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>(`/recurring/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteRecurring = (id: string) =>
  apiFetch<void>(`/recurring/${id}`, { method: 'DELETE' });

export const generateRecurring = () =>
  apiFetch<{ generated: Record<string, unknown>[] }>('/recurring/generate', { method: 'POST' });

// Workspaces
export const listWorkspaces = () =>
  apiFetch<Record<string, unknown>[]>('/workspaces');

export const createWorkspace = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/workspaces', { method: 'POST', body: JSON.stringify(data) });

export const updateWorkspace = (id: string, data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteWorkspace = (id: string) =>
  apiFetch<void>(`/workspaces/${id}`, { method: 'DELETE' });

// Receipts
export const getUploadUrl = (txId: string, fileName: string, contentType: string) =>
  apiFetch<{ uploadUrl: string; key: string }>('/receipts/upload-url', { method: 'POST', body: JSON.stringify({ txId, fileName, contentType }) });

export const getReceiptUrl = (txId: string) =>
  apiFetch<{ downloadUrl: string; fileName: string; contentType: string }>(`/receipts/${txId}`);

export const uploadFileToS3 = async (url: string, file: File) => {
  await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
};

// Payments
export const createPayment = (data: Record<string, unknown>) =>
  apiFetch<Record<string, unknown>>('/payments', { method: 'POST', body: JSON.stringify(data) });

export const listPayments = (month: string) =>
  apiFetch<Record<string, unknown>[]>(`/payments?month=${month}`);

export const deletePayment = (id: string, month: string) =>
  apiFetch<void>(`/payments/${id}?month=${month}`, { method: 'DELETE' });

export const aiVerifyPayments = async (
  files: { base64: string; mimeType: string }[],
  text: string,
): Promise<import('../types').AiVerifyPaymentsResult> => {
  const { jobId } = await apiFetch<{ jobId: string }>('/ai/verify-payments', {
    method: 'POST',
    body: JSON.stringify({ files, text }),
  });

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const job = await apiFetch<{ status: string; result?: import('../types').AiVerifyPaymentsResult; error?: string }>(`/ai/jobs/${jobId}`);
    if (job.status === 'completed' && job.result) return job.result;
    if (job.status === 'failed') throw new Error(job.error ?? 'AI processing failed');
  }

  throw new Error('AI processing timed out');
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
