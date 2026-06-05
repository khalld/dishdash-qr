// Opaque, non-sequential tokens for qrToken / trackToken / idempotency keys.
// Must not be guessable or enumerable (CLAUDE.md §9).
import { randomBytes } from 'node:crypto';

export function opaqueToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}
