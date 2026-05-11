export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export interface Transaction {
  id: number;
  day: string;
  wd: string;
  desc: string;
  cat: string;
  amount: number;
  currency: CurrencyCode;
  fxRate: number;
  account: string;
  amount_usd?: number;
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
