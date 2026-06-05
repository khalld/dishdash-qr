import type { Actions, PageServerLoad } from './$types';
import QRCode from 'qrcode';
import { requireStaffTenant } from '$lib/server/tenant';
import {
  listQrSources,
  createQrSource,
  countTableSources
} from '$lib/server/repositories/qr-repository';

// QR generator — scoped to the gestore's tenant. Each source's QR encodes the
// public menu URL for its opaque token; the customer scans it to open the menu.
// Real QR images are produced here with the `qrcode` package (replacing the
// prototype's CSS placeholder glyph).
export const load: PageServerLoad = async ({ locals, url }) => {
  const tenantId = requireStaffTenant(locals.user);
  const sources = await listQrSources(tenantId);

  const codes = await Promise.all(
    sources.map(async (s) => {
      const menuUrl = `${url.origin}/menu/${s.token}`;
      const dataUrl = await QRCode.toDataURL(menuUrl, { margin: 1, width: 256 });
      return { id: s.id, label: s.label, token: s.token, menuUrl, dataUrl };
    })
  );

  return { codes };
};

export const actions: Actions = {
  // Append a new "Tavolo N" source with a fresh opaque token.
  generate: async ({ locals }) => {
    const tenantId = requireStaffTenant(locals.user);
    const n = (await countTableSources(tenantId)) + 1;
    await createQrSource(tenantId, `Tavolo ${n}`, 'table');
    return { ok: true };
  }
};
