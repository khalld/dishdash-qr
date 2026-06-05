// Order state machine — the ONLY place order transitions are decided.
// Never mutate `status` directly in repositories or routes (CLAUDE.md §7).
//
// Every transition checks the source state AND the actor's role. Tenant
// ownership is enforced by the caller (the actor may only act on orders of
// their own tenant); the superuser never operates on operational orders.
import type { Actor, OrderStatus } from '$lib/types';

export interface Transition {
  from: OrderStatus;
  to: OrderStatus;
  actors: Actor[];
  /** Assign the progressive order number on this transition (once). */
  assignsNumber?: boolean;
}

// MVP transition table — mirrors docs/specifica-funzionale.md §6.
export const TRANSITIONS: readonly Transition[] = [
  { from: 'CARRELLO', to: 'IN_ATTESA', actors: ['client'] },
  { from: 'IN_ATTESA', to: 'CONFERMATA', actors: ['gestore'], assignsNumber: true },
  { from: 'IN_ATTESA', to: 'RIFIUTATA', actors: ['gestore'] },
  { from: 'IN_ATTESA', to: 'ANNULLATA', actors: ['client'] },
  { from: 'CONFERMATA', to: 'IN_PREPARAZIONE', actors: ['lavoratore'] },
  { from: 'IN_PREPARAZIONE', to: 'PRONTA', actors: ['lavoratore'] },
  { from: 'PRONTA', to: 'CONSEGNATA', actors: ['lavoratore', 'gestore'] }
];

// Future home-delivery branch (CLAUDE.md §10) — predisposed, NOT wired into the
// MVP machine. Kept here so the design is explicit:
//   { from: 'PRONTA', to: 'IN_CONSEGNA', actors: ['lavoratore', 'gestore'] },
//   { from: 'IN_CONSEGNA', to: 'CONSEGNATA', actors: ['lavoratore', 'gestore'] }

export function findTransition(from: OrderStatus, to: OrderStatus): Transition | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to);
}

export function canTransition(from: OrderStatus, to: OrderStatus, actor: Actor): boolean {
  const t = findTransition(from, to);
  return !!t && t.actors.includes(actor);
}

/** Statuses an order can move to from `from`, restricted to what `actor` may do. */
export function allowedNextStatuses(from: OrderStatus, actor: Actor): OrderStatus[] {
  return TRANSITIONS.filter((t) => t.from === from && t.actors.includes(actor)).map((t) => t.to);
}

export class InvalidTransitionError extends Error {
  constructor(
    public from: OrderStatus,
    public to: OrderStatus,
    public actor: Actor
  ) {
    super(`Transizione non consentita: ${from} → ${to} (attore: ${actor})`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Validate a transition, returning the matched rule. Throws
 * InvalidTransitionError when the (from, to, actor) triple is not allowed.
 * Callers must additionally enforce tenant ownership before persisting.
 */
export function assertTransition(from: OrderStatus, to: OrderStatus, actor: Actor): Transition {
  const t = findTransition(from, to);
  if (!t || !t.actors.includes(actor)) throw new InvalidTransitionError(from, to, actor);
  return t;
}
