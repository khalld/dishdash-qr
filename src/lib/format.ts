// Shared formatting helpers (safe to import from client components).

/** Format integer cents as a EUR string for UI, e.g. 1500 -> "15,00 €". */
export function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

/** Format a timestamp as a 24h HH:MM clock, e.g. an order's createdAt -> "20:14". */
export function formatTime(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Parse a user-typed euro amount into integer cents. Accepts both comma and
 * dot decimals ("5,00" / "5.00" / "5"). Returns null when not a valid amount.
 * Money is integer cents end to end — never floats (CLAUDE.md §6).
 */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}
