import type { CategoryMeta } from '../types';

export const CATS: Record<string, CategoryMeta> = {
  // Expenses
  mercado:        { label: 'Mercado',        labelEn: 'Grocery',         color: '#4CAF50', icon: 'cart' },
  restaurante:    { label: 'Restaurante',    labelEn: 'Restaurant',      color: '#E57373', icon: 'utensils' },
  alimentacao:    { label: 'Alimenta\u00e7\u00e3o',    labelEn: 'Food Delivery',   color: '#FF8A65', icon: 'coffee' },
  transporte:     { label: 'Transporte',     labelEn: 'Transport',       color: '#5C6BC0', icon: 'car' },
  casa:           { label: 'Casa',           labelEn: 'Housing',         color: '#AB47BC', icon: 'house' },
  utilities:      { label: 'Contas',         labelEn: 'Utilities',       color: '#A1887F', icon: 'zap' },
  saude:          { label: 'Sa\u00fade',          labelEn: 'Health',          color: '#EC407A', icon: 'heart' },
  lazer:          { label: 'Lazer',          labelEn: 'Entertainment',   color: '#FFB74D', icon: 'film' },
  trabalho:       { label: 'Trabalho',       labelEn: 'Work',            color: '#78909C', icon: 'briefcase' },
  assinaturas:    { label: 'Assinaturas',    labelEn: 'Subscriptions',   color: '#AED581', icon: 'repeat' },
  educacao:       { label: 'Educa\u00e7\u00e3o',       labelEn: 'Education',       color: '#4DD0E1', icon: 'book' },
  compras:        { label: 'Compras',        labelEn: 'Shopping',        color: '#CE93D8', icon: 'shoppingBag' },
  viagem:         { label: 'Viagem',         labelEn: 'Travel',          color: '#4DB6AC', icon: 'plane' },
  pets:           { label: 'Pets',           labelEn: 'Pets',            color: '#FFAB91', icon: 'paw' },
  impostos:       { label: 'Impostos',       labelEn: 'Taxes',           color: '#A1887F', icon: 'fileText' },
  seguros:        { label: 'Seguros',        labelEn: 'Insurance',       color: '#7E57C2', icon: 'shield' },
  servicos:       { label: 'Servi\u00e7os',       labelEn: 'Services',        color: '#5C8BBF', icon: 'tool' },
  presentes:      { label: 'Presentes',      labelEn: 'Gifts',           color: '#F48FB1', icon: 'gift' },
  doacoes:        { label: 'Doa\u00e7\u00f5es',        labelEn: 'Donations',       color: '#F06292', icon: 'heart' },

  // Income
  salario:        { label: 'Sal\u00e1rio',        labelEn: 'Salary',          color: '#4CAF50', icon: 'arrowDown' },
  freelance:      { label: 'Freelance',      labelEn: 'Freelance',       color: '#4DD0E1', icon: 'arrowDown' },
  investimentos:  { label: 'Investimentos',  labelEn: 'Investments',     color: '#26A69A', icon: 'trending' },

  // Transfers
  transferencia:  { label: 'Transfer\u00eancia',  labelEn: 'Transfer',        color: '#78909C', icon: 'swap' },

  // Catch-all
  outros:         { label: 'Outros',         labelEn: 'Other',           color: '#90A4AE', icon: 'wallet' },
};
