const path = require('path');
const Module = require('module');

// Ensure database config and models can resolve backend dependencies
const backendNodeModules = path.resolve(__dirname, '../../backend/node_modules');
process.env.NODE_PATH = [backendNodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database with auto-reconnect and error logging.
 */
const connectDB = async () => {
  const targetUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securevault';

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed if the database is empty (first deployment)
    if (process.env.NODE_ENV === 'production') {
      try {
        const User = require('../models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log('[Database] Empty database detected in production. Auto-seeding demo data...');
          const seedData = require('../seed');
          await seedData();
          console.log('[Database] Demo dataset seeded successfully.');
        } else {
          console.log(`[Database] Database has ${userCount} existing users. Skipping seed.`);
        }
      } catch (seedErr) {
        console.error(`[Database] Auto-seed failed: ${seedErr.message}`);
      }
    }
  } catch (error) {
    console.warn(`[Database] Local MongoDB unavailable at ${targetUri} (${error.message}).`);

    if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
      console.error(`[Database Error] Could not connect to provided MONGO_URI in production: ${error.message}`);
      process.exit(1);
    }

    if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URI) {
      console.error('[Database Warning] No MONGO_URI provided in production environment.');
      console.log('[Database] Attempting embedded database or fallback...');
    }

    try {
      console.log('[Database] Starting embedded MongoMemoryServer for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({ instance: { dbName: 'securevault' } });
      const memUri = mongod.getUri();

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const conn = await mongoose.connect(memUri, { autoIndex: true });
      console.log(`[Database] Embedded MongoDB running at: ${memUri}`);

      // Auto-seed demo accounts and credentials
      const seedData = require('../seed');
      console.log('[Database] Auto-seeding demo data...');
      await seedData();
      console.log('[Database] Demo dataset loaded successfully.');
    } catch (memErr) {
      console.error(`[Database Error] Embedded MongoDB failed: ${memErr.message}`);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] Runtime connection error: ${err.message}`);
});

module.exports = connectDB;
