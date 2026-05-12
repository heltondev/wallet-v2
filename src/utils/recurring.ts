import { convertAmount } from './formatters';
import type { RecurringFrequency, RecurringTransaction, Transaction, Payment, CurrencyCode } from '../types';

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

export interface RecurringStatus {
  recurring: RecurringTransaction;
  status: 'paid' | 'pending' | 'overdue';
  matchingPayment?: Payment;
  matchingTx?: Transaction;
  monthlyConverted: number;
}

export function getRecurringStatuses(
  recurring: RecurringTransaction[],
  transactions: Transaction[],
  displayCurrency: CurrencyCode,
  fxRates?: Record<string, number>,
  payments?: Payment[],
): RecurringStatus[] {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const thisMonthPayments = (payments ?? []).filter(p => p.month === currentMonthKey);
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  return recurring
    .filter(r => r.active && r.frequency === 'monthly')
    .map(r => {
      const converted = convertAmount(
        monthlyAmount(r.amount, r.frequency, r.customDays),
        r.currency,
        displayCurrency,
        fxRates,
      );

      // Check payments first (new system)
      const paymentMatch = thisMonthPayments.find(p => p.recurringId === r.id);

      // Fallback: check transactions (legacy)
      let txMatch: Transaction | undefined;
      if (!paymentMatch) {
        txMatch = thisMonthTx.find(t => t.recurringId === r.id);
        if (!txMatch) {
          const descLower = r.desc.toLowerCase();
          txMatch = thisMonthTx.find(t => {
            if (t.desc.toLowerCase() !== descLower) return false;
            const ratio = Math.abs(t.amount) / Math.abs(r.amount);
            return ratio >= 0.8 && ratio <= 1.2;
          });
        }
      }

      let status: 'paid' | 'pending' | 'overdue';
      if (paymentMatch || txMatch) {
        status = 'paid';
      } else if (r.dayOfMonth && currentDay > r.dayOfMonth) {
        status = 'overdue';
      } else {
        status = 'pending';
      }

      return {
        recurring: r,
        status,
        matchingPayment: paymentMatch,
        matchingTx: txMatch,
        monthlyConverted: converted,
      };
    })
    .sort((a, b) => {
      const order = { overdue: 0, pending: 1, paid: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return (a.recurring.dayOfMonth ?? 0) - (b.recurring.dayOfMonth ?? 0);
    });
}
