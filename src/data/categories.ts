import type { CategoryMeta } from '../types';

export const CATS: Record<string, CategoryMeta> = {
  // Expenses
  mercado:        { label: 'Mercado',        labelEn: 'Grocery',         color: 'var(--cat-mercado)',       icon: 'cart' },
  restaurante:    { label: 'Restaurante',    labelEn: 'Restaurant',      color: 'var(--cat-restaurante)',   icon: 'utensils' },
  alimentacao:    { label: 'Alimentação',    labelEn: 'Food Delivery',   color: 'var(--cat-alimentacao)',   icon: 'coffee' },
  transporte:     { label: 'Transporte',     labelEn: 'Transport',       color: 'var(--cat-transporte)',    icon: 'car' },
  casa:           { label: 'Casa',           labelEn: 'Housing',         color: 'var(--cat-casa)',          icon: 'house' },
  utilities:      { label: 'Contas',         labelEn: 'Utilities',       color: 'var(--cat-utilities)',     icon: 'zap' },
  saude:          { label: 'Saúde',          labelEn: 'Health',          color: 'var(--cat-saude)',         icon: 'heart' },
  lazer:          { label: 'Lazer',          labelEn: 'Entertainment',   color: 'var(--cat-lazer)',         icon: 'film' },
  trabalho:       { label: 'Trabalho',       labelEn: 'Work',            color: 'var(--cat-trabalho)',      icon: 'briefcase' },
  assinaturas:    { label: 'Assinaturas',    labelEn: 'Subscriptions',   color: 'var(--cat-assinaturas)',   icon: 'repeat' },
  educacao:       { label: 'Educação',       labelEn: 'Education',       color: 'var(--cat-educacao)',      icon: 'book' },
  compras:        { label: 'Compras',        labelEn: 'Shopping',        color: 'var(--cat-compras)',       icon: 'shoppingBag' },
  viagem:         { label: 'Viagem',         labelEn: 'Travel',          color: 'var(--cat-viagem)',        icon: 'plane' },
  pets:           { label: 'Pets',           labelEn: 'Pets',            color: 'var(--cat-pets)',          icon: 'paw' },
  impostos:       { label: 'Impostos',       labelEn: 'Taxes',           color: 'var(--cat-impostos)',      icon: 'fileText' },
  seguros:        { label: 'Seguros',        labelEn: 'Insurance',       color: 'var(--cat-seguros)',       icon: 'shield' },
  servicos:       { label: 'Serviços',       labelEn: 'Services',        color: 'var(--cat-servicos)',      icon: 'tool' },
  presentes:      { label: 'Presentes',      labelEn: 'Gifts',           color: 'var(--cat-presentes)',     icon: 'gift' },
  doacoes:        { label: 'Doações',        labelEn: 'Donations',       color: 'var(--cat-doacoes)',       icon: 'heart' },

  // Income
  salario:        { label: 'Salário',        labelEn: 'Salary',          color: 'var(--cat-mercado)',       icon: 'arrowDown' },
  freelance:      { label: 'Freelance',      labelEn: 'Freelance',       color: 'var(--cat-educacao)',      icon: 'arrowDown' },
  investimentos:  { label: 'Investimentos',  labelEn: 'Investments',     color: 'var(--cat-investimentos)', icon: 'trending' },

  // Transfers
  transferencia:  { label: 'Transferência',  labelEn: 'Transfer',        color: 'var(--cat-transferencia)', icon: 'swap' },

  // Catch-all
  outros:         { label: 'Outros',         labelEn: 'Other',           color: 'var(--cat-outros)',        icon: 'wallet' },
};
