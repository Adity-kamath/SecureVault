const mongoose = require('mongoose');

/**
 * Connect to MongoDB database with auto-reconnect and error logging.
 */
const connectDB = async () => {
  const targetUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securevault';

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database] Local MongoDB unavailable at ${targetUri} (${error.message}).`);

    if (process.env.NODE_ENV === 'production') {
      console.error('[Database Error] Cannot proceed in production without valid MongoDB URI.');
      process.exit(1);
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
