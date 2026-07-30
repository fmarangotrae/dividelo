type DecimalLike = { toNumber: () => number } | number;

export function formatCOP(value: number | bigint | DecimalLike, opts: { hideSymbol?: boolean } = {}): string {
  const num = typeof value === 'bigint' ? Number(value) : typeof value === 'object' && value && 'toNumber' in value ? (value as { toNumber: () => number }).toNumber() : Number(value);
  return new Intl.NumberFormat('es-CO', {
    style: opts.hideSymbol ? 'decimal' : 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}
