import type { Transaction, Account } from '../types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'itau-deb',  name: 'Itaú · Débito',  institution: 'Itaú',   currency: 'BRL' },
  { id: 'itau-cred', name: 'Itaú · Crédito',  institution: 'Itaú',   currency: 'BRL' },
  { id: 'nubank',    name: 'Nubank',           institution: 'Nubank', currency: 'BRL' },
  { id: 'cash-brl',  name: 'Dinheiro',         institution: 'Cash',   currency: 'BRL' },
  { id: 'chase',     name: 'Chase Checking',   institution: 'Chase',  currency: 'USD' },
];

export const INITIAL_TX: Transaction[] = [
  { id: 1,  day: '14', wd: 'qua', desc: 'Pão de Açúcar',    cat: 'mercado',     amount: -187.42,  currency: 'BRL', fxRate: 1,    account: 'Itaú · Débito' },
  { id: 2,  day: '14', wd: 'qua', desc: 'Uber',             cat: 'transporte',  amount: -23.90,   currency: 'BRL', fxRate: 1,    account: 'Nubank' },
  { id: 3,  day: '13', wd: 'ter', desc: 'Salário · Maio',   cat: 'salario',     amount: 11800,    currency: 'BRL', fxRate: 1,    account: 'Itaú' },
  { id: 4,  day: '13', wd: 'ter', desc: 'Netflix',          cat: 'assinaturas', amount: -10.78,   currency: 'USD', fxRate: 5.19, account: 'Chase Checking', amount_usd: 10.78 },
  { id: 5,  day: '13', wd: 'ter', desc: 'Padaria',          cat: 'restaurante', amount: -32.00,   currency: 'BRL', fxRate: 1,    account: 'Dinheiro' },
  { id: 6,  day: '12', wd: 'seg', desc: 'Posto Shell',      cat: 'transporte',  amount: -220.00,  currency: 'BRL', fxRate: 1,    account: 'Itaú · Crédito' },
  { id: 7,  day: '12', wd: 'seg', desc: 'Drogaria SP',      cat: 'saude',       amount: -89.15,   currency: 'BRL', fxRate: 1,    account: 'Nubank' },
  { id: 8,  day: '11', wd: 'dom', desc: 'Outback',          cat: 'restaurante', amount: -186.50,  currency: 'BRL', fxRate: 1,    account: 'Itaú · Crédito' },
  { id: 9,  day: '10', wd: 'sáb', desc: 'Spotify Family',   cat: 'assinaturas', amount: -5.18,    currency: 'USD', fxRate: 5.19, account: 'Chase Checking' },
  { id: 10, day: '10', wd: 'sáb', desc: 'Cinemark',         cat: 'lazer',       amount: -72.00,   currency: 'BRL', fxRate: 1,    account: 'Itaú · Crédito' },
];
