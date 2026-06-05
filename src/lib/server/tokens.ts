// Opaque, non-sequential tokens for qrToken / trackToken / idempotency keys.
// Must not be guessable or enumerable (CLAUDE.md §9).
import { randomBytes } from 'node:crypto';

export function opaqueToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Short, human-typeable initial password for a freshly provisioned staff account
 * (shown once at creation; the user can change it later). Not a secret token —
 * it is meant to be read off a screen and typed.
 */
export function generateInitialPassword(): string {
  return randomBytes(6).toString('base64url'); // ~8 chars
}
