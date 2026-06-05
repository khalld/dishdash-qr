// Order-status presentation: Italian labels + Bootstrap contextual classes.
// Client-safe (no server imports) so both components and pages can reuse it.
// Status shown as a state token stays UPPER_SNAKE_CASE; status shown to people
// is the Sentence-case label here (see the design handoff §conventions).
import type { OrderStatus } from '$lib/types';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  CARRELLO: 'Carrello',
  IN_ATTESA: 'In attesa di conferma',
  CONFERMATA: 'Confermata',
  IN_PREPARAZIONE: 'In preparazione',
  PRONTA: 'Pronta',
  IN_CONSEGNA: 'In consegna',
  CONSEGNATA: 'Consegnata',
  RIFIUTATA: 'Rifiutata',
  ANNULLATA: 'Annullata'
};

// Each status maps to a Bootstrap `text-bg-*` contextual color. Status is always
// communicated with a pill text badge, never an icon.
export const STATUS_CLASS: Record<OrderStatus, string> = {
  CARRELLO: 'text-bg-secondary',
  IN_ATTESA: 'text-bg-warning',
  CONFERMATA: 'text-bg-info',
  IN_PREPARAZIONE: 'text-bg-info',
  PRONTA: 'text-bg-success',
  IN_CONSEGNA: 'text-bg-info',
  CONSEGNATA: 'text-bg-success',
  RIFIUTATA: 'text-bg-danger',
  ANNULLATA: 'text-bg-danger'
};

// The customer tracking stepper walks these five steps; the short labels are
// the customer-facing names for each.
export const TRACK_STEPS = [
  'IN_ATTESA',
  'CONFERMATA',
  'IN_PREPARAZIONE',
  'PRONTA',
  'CONSEGNATA'
] as const satisfies readonly OrderStatus[];

export const STEP_LABEL: Record<(typeof TRACK_STEPS)[number], string> = {
  IN_ATTESA: 'In attesa',
  CONFERMATA: 'Confermata',
  IN_PREPARAZIONE: 'In preparazione',
  PRONTA: 'Pronta',
  CONSEGNATA: 'Consegnata'
};
