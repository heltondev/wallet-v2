export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

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
}

export interface Account {
  id: string;
  name: string;
  institution: string;
  currency: CurrencyCode;
}

export interface CategoryMeta {
  label: string;
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
