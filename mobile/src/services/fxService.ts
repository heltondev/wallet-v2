interface FxRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

let cached: FxRates | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchFxRates(): Promise<Record<string, number>> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.rates;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    cached = { base: 'USD', rates: data.rates, fetchedAt: Date.now() };
    return cached.rates;
  } catch {
    return { USD: 1, BRL: 5.19, EUR: 0.92 };
  }
}

export function getFxRate(from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return 1;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return toRate / fromRate;
}
