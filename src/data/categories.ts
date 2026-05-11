import type { CategoryMeta } from '../types';

export const CATS: Record<string, CategoryMeta> = {
  mercado:      { label: 'Mercado',       color: 'var(--cat-mercado)',     icon: 'cart' },
  restaurante:  { label: 'Restaurante',   color: 'var(--cat-restaurante)', icon: 'utensils' },
  transporte:   { label: 'Transporte',    color: 'var(--cat-transporte)',  icon: 'car' },
  casa:         { label: 'Casa',          color: 'var(--cat-casa)',        icon: 'house' },
  saude:        { label: 'Saúde',         color: 'var(--cat-saude)',       icon: 'heart' },
  lazer:        { label: 'Lazer',         color: 'var(--cat-lazer)',       icon: 'film' },
  trabalho:     { label: 'Trabalho',      color: 'var(--cat-trabalho)',    icon: 'briefcase' },
  assinaturas:  { label: 'Assinaturas',   color: 'var(--cat-assinaturas)', icon: 'repeat' },
  educacao:     { label: 'Educação',      color: 'var(--cat-educacao)',    icon: 'book' },
  salario:      { label: 'Salário',       color: 'var(--cat-mercado)',     icon: 'arrowDown' },
  freelance:    { label: 'Freelance',     color: 'var(--cat-educacao)',    icon: 'arrowDown' },
  outros:       { label: 'Outros',        color: 'var(--cat-outros)',      icon: 'wallet' },
};
