import type { CurrencyCode } from '../types';
import type { Transaction } from '../types';

const API_BASE = ''; // Will be set to API Gateway URL

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // TODO: Add Cognito auth token
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// AI endpoints — currently return mock data with simulated delay
export async function aiCategorize(desc: string, _amount: number): Promise<{ category: string; confidence: number }> {
  await new Promise(r => setTimeout(r, 300));
  const lower = desc.toLowerCase();
  if (lower.includes('uber') || lower.includes('99') || lower.includes('shell')) return { category: 'transporte', confidence: 0.92 };
  if (lower.includes('netflix') || lower.includes('spotify')) return { category: 'assinaturas', confidence: 0.95 };
  if (lower.includes('mercado') || lower.includes('pão') || lower.includes('carrefour')) return { category: 'mercado', confidence: 0.88 };
  if (lower.includes('restaurante') || lower.includes('outback') || lower.includes('padaria')) return { category: 'restaurante', confidence: 0.85 };
  return { category: 'outros', confidence: 0.5 };
}

export async function aiExtractReceipt(_file: string, _mimeType: string): Promise<Partial<Transaction>> {
  await new Promise(r => setTimeout(r, 1500));
  return {
    desc: 'Supermercado Extra',
    cat: 'mercado',
    amount: -234.56,
    currency: 'BRL' as CurrencyCode,
  };
}

export async function aiInsights(_month: string): Promise<{ summary: string; patterns: string[]; alerts: string[]; tips: string[] }> {
  await new Promise(r => setTimeout(r, 800));
  return {
    summary: 'Em maio você gastou R$ 7.512 — 12% acima de abril. Mercado e restaurante foram os maiores vilões.',
    patterns: [
      'Gastos com transporte aumentaram 30% (Uber mais frequente)',
      'Assinaturas estáveis em R$ 170/mês',
      'Média de R$ 45/dia em alimentação fora',
    ],
    alerts: [
      'Orçamento de Transporte ultrapassado em 8%',
      'Gasto com lazer 2x maior que março',
    ],
    tips: [
      'Reduzir 2 corridas de Uber/semana economizaria ~R$ 200/mês',
      'Cancele assinaturas duplicadas (Netflix + Disney+)',
    ],
  };
}

export async function aiChat(message: string): Promise<{ reply: string }> {
  await new Promise(r => setTimeout(r, 600));
  const lower = message.toLowerCase();
  if (lower.includes('uber')) return { reply: 'Você gastou R$ 243,80 em Uber este mês, distribuídos em 12 corridas. Isso é 30% a mais que abril. A média por corrida foi R$ 20,31.' };
  if (lower.includes('posso comprar') || lower.includes('posso gastar')) return { reply: 'Com base no seu orçamento restante de R$ 1.987 e 14 dias até o fim do mês, você pode gastar até R$ 142/dia mantendo sua meta. Compras acima de R$ 500 entrariam no vermelho.' };
  if (lower.includes('economizar')) return { reply: 'Suas 3 maiores oportunidades: 1) Trocar Uber por metrô 2x/semana (−R$ 200), 2) Cozinhar 1 dia a mais por semana (−R$ 180), 3) Revisar assinaturas (−R$ 55 com Netflix).' };
  return { reply: 'Baseado nos seus dados de maio: saldo de R$ 4.287, 10 transações registradas. Como posso ajudar com suas finanças?' };
}

export { apiFetch };
