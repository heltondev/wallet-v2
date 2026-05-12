import type { RecurringFrequency } from '../types';

export function monthlyMultiplier(frequency: RecurringFrequency, customDays?: number | null): number {
  switch (frequency) {
    case 'weekly': return 4.33;
    case 'biweekly': return 2.17;
    case 'monthly': return 1;
    case 'yearly': return 1 / 12;
    case 'custom':
      if (customDays && customDays > 0) return 30.44 / customDays;
      return 1;
    default: return 1;
  }
}

export function monthlyAmount(amount: number, frequency: RecurringFrequency, customDays?: number | null): number {
  return amount * monthlyMultiplier(frequency, customDays);
}
