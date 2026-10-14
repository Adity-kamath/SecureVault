/**
 * SecureVault Database Seeder
 * Run with: node database/seed.js
 * Or from project root: npm run seed
 */
const path = require('path');

// Ensure server environment variables are loaded
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const seedData = require('../server/seed');

console.log('[Database Seed Runner] Initiating database seeding from database/seed.js...');

seedData()
  .then(() => {
    console.log('[Database Seed Runner] Database population complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Database Seed Runner Error]:', err);
    process.exit(1);
  });
