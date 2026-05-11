const PT_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PT_MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function currentMonth() { return PT_MONTHS[new Date().getMonth()]; }
export function currentMonthShort() { return PT_MONTHS_SHORT[new Date().getMonth()]; }
export function currentYear() { return new Date().getFullYear(); }
export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-');
  return `${PT_MONTHS[parseInt(m) - 1]} \u00b7 ${y}`;
}
export function monthLabelShort(monthKey: string) {
  const [y, m] = monthKey.split('-');
  return `${PT_MONTHS_SHORT[parseInt(m) - 1]} \u00b7 ${y}`;
}
export function monthLabelUpper(monthKey: string) {
  const [y, m] = monthKey.split('-');
  return `${PT_MONTHS_SHORT[parseInt(m) - 1].toUpperCase()} \u00b7 ${y}`;
}
export function daysRemainingInMonth() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return last - d.getDate();
}
export function previousMonthShort() {
  const idx = (new Date().getMonth() - 1 + 12) % 12;
  return PT_MONTHS_SHORT[idx].toLowerCase();
}
export function nextMonth() {
  const idx = (new Date().getMonth() + 1) % 12;
  const year = new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  return `${PT_MONTHS[idx]} ${year}`;
}
export function nextMonthLabel() {
  const idx = (new Date().getMonth() + 1) % 12;
  const year = new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  return `${PT_MONTHS[idx]} \u00b7 ${year}`;
}
export function surroundingMonthsShort() {
  const now = new Date().getMonth();
  const result: string[] = [];
  for (let i = -2; i <= 2; i++) {
    const idx = (now + i + 12) % 12;
    result.push(PT_MONTHS_SHORT[idx]);
  }
  return result;
}
