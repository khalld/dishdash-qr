// Server-side price math — the source of truth for totals (CLAUDE.md §8).
// All money is in integer cents; never use floats for money.

export interface PricedLine {
  unitPrice: number; // cents
  qty: number;
}

export function lineTotal(unitPrice: number, qty: number): number {
  return unitPrice * qty;
}

export function computeTotal(lines: readonly PricedLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l.unitPrice, l.qty), 0);
}

// For UI formatting of cents, use formatEuros from '$lib/format' (a shared,
// non-server module that client components are allowed to import).
