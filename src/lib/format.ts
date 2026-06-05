// Shared formatting helpers (safe to import from client components).

/** Format integer cents as a EUR string for UI, e.g. 1500 -> "15,00 €". */
export function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}
