/**
 * Bootstrap the initial staff accounts if missing.
 * Run with: npm run create-superuser
 *
 * Provisions, out-of-band, the staff accounts that cannot be created through
 * public registration (there is none — see CLAUDE.md §3):
 *   - superuser  : global, cross-tenant StaffUser (role "superuser", tenantId null);
 *   - gestore    : tenant-scoped manager of an EXISTING tenant;
 *   - lavoratore : tenant-scoped worker of the same tenant.
 *
 * The gestore and lavoratore are attached to the tenant named
 * BOOTSTRAP_TENANT_NAME, which MUST already exist (created by the superuser
 * in-app, or via `npm run seed`). This script NEVER creates a tenant — tenant
 * provisioning stays the superuser's prerogative — and aborts if it is missing.
 *
 * Idempotent upsert — safe to run multiple times. Creates each account if
 * missing, otherwise resets its password to the configured value so the login
 * credentials always match the secrets after every deploy.
 *
 * Credentials are read from the environment (no hardcoded values):
 *   MONGODB_URI           (required)
 *   SUPERUSER_USERNAME    (optional, default: "superadmin")
 *   SUPERUSER_PASSWORD    (required, min 8 chars)
 *   GESTORE_USERNAME      (optional, default: "gestore")
 *   GESTORE_PASSWORD      (required, min 8 chars)
 *   LAVORATORE_USERNAME   (optional, default: "lavoratore")
 *   LAVORATORE_PASSWORD   (required, min 8 chars)
 *   BOOTSTRAP_TENANT_NAME (required — existing tenant gestore/lavoratore belong to)
 *
 * CLI override for the superuser (handy for a one-off local bootstrap):
 *   npm run create-superuser -- <username> <password>
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI non definita nel file .env');
  process.exit(1);
}

// Read all staff credentials up front so the script fails fast (before
// connecting to the DB) if anything required is missing.
const superuserUsername = (process.argv[2] || process.env.SUPERUSER_USERNAME || 'superadmin')
  .toLowerCase()
  .trim();
const superuserPassword = process.argv[3] || process.env.SUPERUSER_PASSWORD;

const gestoreUsername = (process.env.GESTORE_USERNAME || 'gestore').toLowerCase().trim();
const gestorePassword = process.env.GESTORE_PASSWORD;

const lavoratoreUsername = (process.env.LAVORATORE_USERNAME || 'lavoratore').toLowerCase().trim();
const lavoratorePassword = process.env.LAVORATORE_PASSWORD;

// Tenant the gestore/lavoratore are attached to. Must already exist (see run()).
const tenantName = (process.env.BOOTSTRAP_TENANT_NAME || '').trim();

function requirePassword(value, envVar, extraHint) {
  if (!value) {
    console.error(`❌  Password mancante: imposta ${envVar} nel file .env.`);
    if (extraHint) console.error(extraHint);
    process.exit(1);
  }
  if (value.length < 8) {
    console.error(`❌  ${envVar}: la password deve avere almeno 8 caratteri.`);
    process.exit(1);
  }
}

requirePassword(
  superuserPassword,
  'SUPERUSER_PASSWORD',
  '    In alternativa: npm run create-superuser -- <username> <password>'
);
requirePassword(gestorePassword, 'GESTORE_PASSWORD');
requirePassword(lavoratorePassword, 'LAVORATORE_PASSWORD');

if (!tenantName) {
  console.error(
    '❌  BOOTSTRAP_TENANT_NAME non definita: indica il tenant esistente a cui legare gestore e lavoratore.'
  );
  process.exit(1);
}

// Schemas mirror src/lib/server/models to keep the script self-contained.
// The superuser is global (tenantId null); gestore/lavoratore carry a tenantId.
const staffUserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['superuser', 'gestore', 'lavoratore'],
      required: true
    },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    logoUrl: { type: String, default: null },
    active: { type: Boolean, default: true },
    settings: { type: Object, default: {} }
  },
  { timestamps: true }
);

const StaffUser = mongoose.models.StaffUser || mongoose.model('StaffUser', staffUserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

// Idempotent upsert of one staff user; resets the password so credentials always
// track the configured secret. `tenantId` is null for the global superuser.
async function upsertStaffUser({ username, role, tenantId, password }) {
  const existing = await StaffUser.findOne({ username });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await StaffUser.findOneAndUpdate(
    { username },
    { $set: { role, tenantId, passwordHash, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { user, created: !existing };
}

function report(emoji, label, result) {
  console.log(
    result.created
      ? `${emoji}  ${label} "${result.user.username}" creato.`
      : `${emoji}  ${label} "${result.user.username}" aggiornato (password reimpostata).`
  );
}

async function run() {
  console.log('🔗  Connessione a MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connesso.\n');

  // Superuser — global, no tenant. Bootstrapped first: it is independent of any
  // tenant and is the one account CI always needs (see CLAUDE.md §13).
  const superuser = await upsertStaffUser({
    username: superuserUsername,
    role: 'superuser',
    tenantId: null,
    password: superuserPassword
  });
  report('🛡️ ', 'Superuser', superuser);

  // Gestore & lavoratore are tenant-scoped: the target tenant MUST already
  // exist. This script never creates tenants (CLAUDE.md §3), so abort if absent.
  const tenant = await Tenant.findOne({ name: tenantName });
  if (!tenant) {
    console.error(
      `\n❌  Tenant "${tenantName}" inesistente. Crealo prima (area superuser o "npm run seed"), poi rilancia.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`\n🏪  Tenant "${tenant.name}" (${tenant._id}).`);

  const gestore = await upsertStaffUser({
    username: gestoreUsername,
    role: 'gestore',
    tenantId: tenant._id,
    password: gestorePassword
  });
  report('👤 ', 'Gestore', gestore);

  const lavoratore = await upsertStaffUser({
    username: lavoratoreUsername,
    role: 'lavoratore',
    tenantId: tenant._id,
    password: lavoratorePassword
  });
  report('🧑‍🍳 ', 'Lavoratore', lavoratore);

  console.log('\nOra puoi accedere dalla pagina di login dello staff.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌  Errore durante il bootstrap degli account staff:', err);
  process.exit(1);
});
