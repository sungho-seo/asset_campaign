export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatDateMD(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

export function cn(...inputs: Array<string | undefined | null | false>): string {
  return inputs.filter(Boolean).join(' ');
}
