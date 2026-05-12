export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export interface Workspace {
  id: string;
  name: string;
  currency: CurrencyCode;
  monthlyBudget: number;
  icon: string;
  order: number;
}

export interface Transaction {
  id: number;
  date: string; // ISO date string e.g. '2026-05-11'
  day: string;
  wd: string;
  desc: string;
  cat: string;
  amount: number;
  currency: CurrencyCode;
  fxRate: number;
  account: string;
  amount_usd?: number;
  receiptKey?: string;
  receiptName?: string;
  recurringId?: string;
  isRecurringOverride?: boolean;
  workspaceId?: string;
}

export interface Account {
  id: string;
  name: string;
  institution: string;
  currency: CurrencyCode;
  workspaceId?: string;
}

export interface CategoryMeta {
  label: string;
  labelEn: string;
  color: string;
  icon: string;
}

export type TabId = 'home' | 'list' | 'forecast' | 'cats' | 'settings';
export type FabKind = 'circle' | 'pill' | 'tab';

export interface TweakValues {
  theme: 'dark' | 'light';
  accent: string;
  fab: FabKind;
  currency: 'BRL' | 'USD';
}

export interface ToastData {
  desc: string;
  amount: number;
}

export interface ExtractedTransaction {
  desc: string;
  amount: number;
  currency: CurrencyCode;
  cat: string;
  catConfidence: 'high' | 'medium' | 'low';
  catAlternatives: string[];
  date: string;
  dateType: string;
  account: string | null;
  accountConfidence: 'high' | 'medium' | 'low';
  merchant: {
    name: string;
    fullName: string | null;
    cnpj: string | null;
    ein: string | null;
    address: string | null;
    phone: string | null;
    category: string;
  };
  payment: {
    method: string | null;
    cardLast4: string | null;
    installments: number | null;
    installmentNumber: number | null;
  };
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  tax: { total: number; breakdown: Record<string, number> };
  totals: { subtotal: number; discount: number; tax: number; total: number };
  notes: string;
  rawText: string;
  flags: string[];
}

export type RecurringFrequency = 'monthly' | 'weekly' | 'biweekly' | 'yearly' | 'custom';

export interface RecurringTransaction {
  id: string;
  desc: string;
  amount: number;
  currency: CurrencyCode;
  cat: string;
  account: string;
  frequency: RecurringFrequency;
  customDays: number | null;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  fxRate: number;
  notes: string | null;
  lastGenerated: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId?: string;
  seen?: boolean;
}

export interface AiExtractResult {
  transactions: ExtractedTransaction[];
  document: {
    type: string;
    subType: string;
    language: string;
    country: string;
    issueDate: string | null;
    dueDate: string | null;
    quality: string;
    pageCount: number;
  };
  warnings: string[];
  suggestions: string[];
}

export interface ExtractedRecurring {
  desc: string;
  amount: number;
  currency: CurrencyCode;
  cat: string;
  frequency: RecurringFrequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  customDays: number | null;
  account: string | null;
  notes: string | null;
}

export interface AiExtractRecurringResult {
  recurring: ExtractedRecurring[];
  document: {
    type: string;
    subType: string;
    language: string;
    country: string;
    quality: string;
  };
  warnings: string[];
  suggestions: string[];
}

export interface Payment {
  id: string;
  recurringId: string;
  month: string; // YYYY-MM
  amount: number;
  currency: CurrencyCode;
  paidDate: string; // ISO date
  account: string;
  receiptKey?: string;
  receiptName?: string;
  notes?: string;
  workspaceId?: string;
}

export interface AiVerifyPaymentsMatch {
  recurringId: string;
  recurringDesc: string;
  amount: number;
  currency: CurrencyCode;
  paidDate: string;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
}

export interface AiVerifyPaymentsResult {
  matches: AiVerifyPaymentsMatch[];
  unmatched: string[];
  warnings: string[];
}
