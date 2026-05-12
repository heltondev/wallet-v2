import { FX } from '../data/constants';
import { getFxRate } from './fxRates';
import type { CurrencyCode, RecurringFrequency } from '../types';

export const fmtBRL = (v: number, { sign = false, decimals = 2 }: { sign?: boolean; decimals?: number } = {}): string => {
  const abs = Math.abs(v);
  const s = abs.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const prefix = sign ? (v < 0 ? '−' : v > 0 ? '+' : '') : (v < 0 ? '−' : '');
  return `${prefix}R$ ${s}`;
};

export const fmtUSD = (v: number, { decimals = 0 }: { decimals?: number } = {}): string => {
  const usd = v / FX;
  const abs = Math.abs(usd);
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${usd < 0 ? '−' : ''}$${s}`;
};

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string }> = {
  BRL: { symbol: 'R$', locale: 'pt-BR' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
};

export const fmtAmount = (
  v: number,
  currency: CurrencyCode,
  { decimals = 2, sign = false }: { decimals?: number; sign?: boolean } = {},
): string => {
  const cfg = CURRENCY_CONFIG[currency];
  const abs = Math.abs(v);
  const s = abs.toLocaleString(cfg.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const prefix = sign ? (v < 0 ? '−' : v > 0 ? '+' : '') : (v < 0 ? '−' : '');
  return `${prefix}${cfg.symbol} ${s}`;
};

export const convertAmount = (amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode, rates?: Record<string, number>): number => {
  if (fromCurrency === toCurrency) return amount;
  if (rates) {
    return amount * getFxRate(fromCurrency, toCurrency, rates);
  }
  // Fallback to hardcoded rates
  const toBRL: Record<CurrencyCode, number> = { BRL: 1, USD: FX, EUR: FX * 1.08 };
  const inBRL = amount * toBRL[fromCurrency];
  return inBRL / toBRL[toCurrency];
};

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  monthly: 'Mensal',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  yearly: 'Anual',
  custom: 'Personalizado',
};

export const freqLabel = (f: RecurringFrequency): string => FREQ_LABELS[f] ?? f;
