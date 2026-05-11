import { FX } from '../data/constants';

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
