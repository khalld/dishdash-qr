/**
 * Create the initial superuser account if missing.
 * Run with: npm run create-superuser
 *
 * The superuser is the only account provisioned out-of-band: there is no
 * public registration (see CLAUDE.md §3). It is a global, cross-tenant
 * StaffUser with role "superuser" and no tenantId.
 *
 * Idempotent upsert — safe to run multiple times. Creates the account if
 * missing, otherwise resets its password to the configured value so the
 * login credentials always match the secret after every deploy.
 *
 * Credentials are read from the environment (no hardcoded values):
 *   SUPERUSER_USERNAME   (optional, default: "superadmin")
 *   SUPERUSER_PASSWORD   (required, min 8 chars)
 *   MONGODB_URI          (required)
 *
 * CLI override (handy for a one-off local bootstrap):
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

const username = (process.argv[2] || process.env.SUPERUSER_USERNAME || 'superadmin')
  .toLowerCase()
  .trim();
const password = process.argv[3] || process.env.SUPERUSER_PASSWORD;

if (!password) {
  console.error(
    '❌  Password mancante. Imposta SUPERUSER_PASSWORD nel file .env oppure passala come argomento:'
  );
  console.error('    npm run create-superuser -- <username> <password>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('❌  La password deve avere almeno 8 caratteri.');
  process.exit(1);
}

// Mirrors src/lib/server/models/staff-user.ts to keep the script self-contained.
// The superuser is global: role "superuser" and tenantId is null.
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

const StaffUser = mongoose.models.StaffUser || mongoose.model('StaffUser', staffUserSchema);

async function run() {
  console.log('🔗  Connessione a MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connesso.\n');

  const existing = await StaffUser.findOne({ username });
  const passwordHash = await bcrypt.hash(password, 12);

  const superuser = await StaffUser.findOneAndUpdate(
    { username },
    { $set: { role: 'superuser', tenantId: null, passwordHash, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(
    existing
      ? `🛡️   Superuser "${superuser.username}" aggiornato (password reimpostata).`
      : `🛡️   Superuser "${superuser.username}" creato.`
  );
  console.log('\nOra puoi accedere dalla pagina di login dello staff.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌  Errore durante la creazione del superuser:', err);
  process.exit(1);
});
