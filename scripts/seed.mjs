/**
 * Seed script: populates MongoDB with demo data for local/staging testing.
 * Run with: npm run seed
 *
 * Idempotent — safe to run multiple times (upserts on stable keys).
 *
 * Creates one demo tenant with a full staff hierarchy and a small menu so
 * every flow (provisioning → menu → QR → order) can be exercised end to end
 * against real DB records. Every login is verified against MongoDB; there are
 * no in-memory/mocked users.
 *
 * Demo passwords default to "password" (override with DEMO_PASSWORD).
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI non definita nel file .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Schema definitions (mirrored from src/lib/server/models to stay self-contained)
// ---------------------------------------------------------------------------

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    logoUrl: { type: String, default: null },
    active: { type: Boolean, default: true },
    settings: { type: Object, default: {} }
  },
  { timestamps: true }
);

const staffUserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['superuser', 'gestore', 'lavoratore'], required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true }, // cents, never float
    category: { type: String, default: 'generale' },
    available: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // null = unlimited
    imageUrl: { type: String, default: null },
    allergens: { type: [String], default: [] }
  },
  { timestamps: true }
);

const qrSourceSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    token: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['table', 'takeaway', 'cart', 'delivery'], default: 'table' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
const StaffUser = mongoose.models.StaffUser || mongoose.model('StaffUser', staffUserSchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
const QrSource = mongoose.models.QrSource || mongoose.model('QrSource', qrSourceSchema);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'password';

const SUPERUSER_USERNAME = (process.env.SUPERUSER_USERNAME || 'superadmin').toLowerCase();
const SUPERUSER_PASSWORD = process.env.SUPERUSER_PASSWORD || DEMO_PASSWORD;

const TENANT_NAME = 'Pub del Centro';

// price in cents (CLAUDE.md §6: prices are integers, never floats)
const menu = [
  {
    name: 'Panino pulled pork',
    description: 'Pulled pork, coleslaw, salsa BBQ',
    price: 750,
    category: 'panini'
  },
  {
    name: 'Hamburger classico',
    description: 'Manzo, cheddar, insalata, pomodoro',
    price: 850,
    category: 'panini'
  },
  {
    name: 'Patatine fritte',
    description: 'Porzione abbondante',
    price: 400,
    category: 'contorni',
    stock: 50
  },
  {
    name: 'Birra artigianale 0,4l',
    description: 'Bionda alla spina',
    price: 500,
    category: 'bevande'
  },
  { name: 'Acqua naturale 0,5l', description: '', price: 150, category: 'bevande' }
];

const qrSources = [
  { label: 'Tavolo 1', type: 'table' },
  { label: 'Tavolo 2', type: 'table' },
  { label: 'Asporto', type: 'takeaway' }
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('🔗  Connessione a MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connesso.\n');

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const superuserHash =
    SUPERUSER_PASSWORD === DEMO_PASSWORD ? demoHash : await bcrypt.hash(SUPERUSER_PASSWORD, 12);

  // Superuser (global, no tenant)
  console.log('🛡️   Superuser…');
  const superuser = await StaffUser.findOneAndUpdate(
    { username: SUPERUSER_USERNAME },
    { $set: { role: 'superuser', tenantId: null, passwordHash: superuserHash, active: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`   • ${superuser.username} (superuser)`);

  // Demo tenant
  console.log('\n🏪  Tenant demo…');
  const tenant = await Tenant.findOneAndUpdate(
    { name: TENANT_NAME },
    { $set: { active: true }, $setOnInsert: { logoUrl: null, settings: {} } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`   • ${tenant.name} (${tenant._id})`);

  // Gestore + lavoratore of the demo tenant
  console.log('\n👤  Staff del tenant…');
  const staff = [
    { username: 'gestore', role: 'gestore' },
    { username: 'lavoratore', role: 'lavoratore' }
  ];
  for (const s of staff) {
    const result = await StaffUser.findOneAndUpdate(
      { username: s.username },
      { $set: { role: s.role, tenantId: tenant._id, passwordHash: demoHash, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`   • ${result.username} (${result.role})`);
  }

  // Menu items (scoped to the tenant)
  console.log('\n🍔  Menu…');
  for (const item of menu) {
    const result = await MenuItem.findOneAndUpdate(
      { tenantId: tenant._id, name: item.name },
      {
        $set: {
          description: item.description,
          price: item.price,
          category: item.category,
          available: true
        },
        $setOnInsert: { stock: item.stock ?? null, imageUrl: null, allergens: [] }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`   • ${result.name} — €${(result.price / 100).toFixed(2)}`);
  }

  // QR sources (token assigned once, on insert, so re-seeding keeps it stable)
  console.log('\n🔳  Sorgenti QR…');
  for (const qr of qrSources) {
    const result = await QrSource.findOneAndUpdate(
      { tenantId: tenant._id, label: qr.label },
      { $set: { type: qr.type, active: true }, $setOnInsert: { token: randomUUID() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`   • ${result.label} (${result.type}) → /menu/${result.token}`);
  }

  console.log('\n✅  Seed completato!\n');
  console.log('┌──────────────┬──────────────┬──────────┐');
  console.log('│ Ruolo        │ Username     │ Password │');
  console.log('├──────────────┼──────────────┼──────────┤');
  console.log(
    `│ Superuser    │ ${SUPERUSER_USERNAME.padEnd(12)} │ ${SUPERUSER_PASSWORD.padEnd(8)} │`
  );
  console.log(`│ Gestore      │ gestore      │ ${DEMO_PASSWORD.padEnd(8)} │`);
  console.log(`│ Lavoratore   │ lavoratore   │ ${DEMO_PASSWORD.padEnd(8)} │`);
  console.log('└──────────────┴──────────────┴──────────┘');
  console.log(`\nTenant demo: "${tenant.name}". I clienti ordinano via QR (nessun login).`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Errore durante il seed:', err);
  process.exit(1);
});
