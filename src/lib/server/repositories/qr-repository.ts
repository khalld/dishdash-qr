// QR source data access — scoped by tenantId (CLAUDE.md §2, §9). Tokens are
// opaque and non-sequential (no enumeration). The actual QR images are rendered
// from these tokens at request time (see the qrcodes route).
import { connectDb } from '$lib/server/db';
import { QrSource, type QrSourceDoc } from '$lib/server/models';
import { opaqueToken } from '$lib/server/tokens';
import type { QrSourceType } from '$lib/types';

export interface QrSourceView {
  id: string;
  label: string;
  type: QrSourceType;
  token: string;
  active: boolean;
}

function toView(d: QrSourceDoc & { _id: unknown }): QrSourceView {
  return {
    id: String(d._id),
    label: d.label,
    type: d.type,
    token: d.token,
    active: d.active
  };
}

/** All QR sources for a tenant, oldest first (creation order). */
export async function listQrSources(tenantId: string): Promise<QrSourceView[]> {
  await connectDb();
  const docs = await QrSource.find({ tenantId }).sort({ createdAt: 1 }).lean<QrSourceDoc[]>();
  return docs.map((d) => toView(d as QrSourceDoc & { _id: unknown }));
}

/** Create a labelled QR source with a fresh opaque token. */
export async function createQrSource(
  tenantId: string,
  label: string,
  type: QrSourceType
): Promise<QrSourceView> {
  await connectDb();
  const doc = await QrSource.create({ tenantId, label, type, token: opaqueToken(), active: true });
  return toView(doc.toObject() as QrSourceDoc & { _id: unknown });
}

/** Count existing "Tavolo N" sources so a new one can be auto-numbered. */
export async function countTableSources(tenantId: string): Promise<number> {
  await connectDb();
  return QrSource.countDocuments({ tenantId, type: 'table' });
}
