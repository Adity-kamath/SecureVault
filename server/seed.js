require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Credential = require('./models/Credential');
const SharedAccess = require('./models/SharedAccess');
const AuditLog = require('./models/AuditLog');
const { encryptPassword } = require('./utils/crypto');
const { evaluatePassword } = require('./utils/passwordHealth');

const seedData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securevault';
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`[Seed] Connected to MongoDB at ${mongoUri}`);
      } catch (connErr) {
        console.warn(`[Seed] Local MongoDB unavailable (${connErr.message}). Testing seed with embedded in-memory MongoDB...`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({ instance: { dbName: 'securevault' } });
        await mongoose.connect(mongod.getUri());
        console.log('[Seed] Connected to embedded in-memory MongoDB.');
      }
    }

    // Clear existing data
    await User.deleteMany({});
    await Credential.deleteMany({});
    await SharedAccess.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('[Seed] Cleared existing records.');

    // 1. Create Users
    const defaultPassword = 'MasterPassword123!@#';
    const hash = await User.hashPassword(defaultPassword);

    const meera = await User.create({
      name: 'Meera S.',
      email: 'meera@company.com',
      masterPasswordHash: hash,
      role: 'admin',
      isActive: true
    });

    const aditya = await User.create({
      name: 'Aditya K.',
      email: 'aditya@company.com',
      masterPasswordHash: hash,
      role: 'employee',
      isActive: true
    });

    const rahul = await User.create({
      name: 'Rahul M.',
      email: 'rahul@company.com',
      masterPasswordHash: hash,
      role: 'employee',
      isActive: true
    });

    const sneha = await User.create({
      name: 'Sneha P.',
      email: 'sneha@company.com',
      masterPasswordHash: hash,
      role: 'employee',
      isActive: true
    });

    const kiran = await User.create({
      name: 'Kiran T.',
      email: 'kiran@company.com',
      masterPasswordHash: hash,
      role: 'employee',
      isActive: false // Inactive employee as in mockup
    });

    console.log('[Seed] Created users (Admin: Meera, Employees: Aditya, Rahul, Sneha, Kiran).');

    // 2. Create Credentials for Aditya
    const reusedPass = 'SharedPass123!@#';
    const strongPass1 = 'Qm7#vR2!pLx9@Tz4';
    const weakPass = 'welcome123';
    const ninetyTwoDaysAgo = new Date(Date.now() - 92 * 24 * 60 * 60 * 1000);

    const credsToCreate = [
      {
        ownerId: aditya._id,
        title: 'AWS Console',
        username: 'admin@corp',
        url: 'https://aws.amazon.com',
        pass: reusedPass,
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        ownerId: aditya._id,
        title: 'GitHub',
        username: 'aditya-org',
        url: 'https://github.com',
        pass: reusedPass, // Reused!
        lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        ownerId: aditya._id,
        title: 'Vendor Portal',
        username: 'aditya_v',
        url: 'https://vendor.example.com',
        pass: strongPass1,
        lastUpdated: new Date()
      },
      {
        ownerId: aditya._id,
        title: 'Legacy Intranet',
        username: 'aditya_intra',
        url: 'https://intranet.internal',
        pass: weakPass, // Weak
        lastUpdated: ninetyTwoDaysAgo // Old (90d+)
      },
      {
        ownerId: rahul._id,
        title: 'Jira Enterprise',
        username: 'rahul.m',
        url: 'https://jira.company.com',
        pass: 'JiraComplex#99Sec',
        lastUpdated: new Date()
      }
    ];

    const createdCreds = [];
    for (const c of credsToCreate) {
      const enc = encryptPassword(c.pass);
      const health = evaluatePassword(c.pass);
      const doc = await Credential.create({
        ownerId: c.ownerId,
        title: c.title,
        username: c.username,
        url: c.url,
        encryptedPassword: enc.encryptedPassword,
        iv: enc.iv,
        authTag: enc.authTag,
        strengthScore: health.score,
        lastUpdated: c.lastUpdated
      });
      createdCreds.push(doc);
    }

    console.log('[Seed] Created credentials with AES-256-GCM encryption.');

    // 3. Create Shared Access (AWS Console shared with Rahul & Sneha)
    const awsCred = createdCreds.find((c) => c.title === 'AWS Console');
    if (awsCred) {
      await SharedAccess.create({
        credentialId: awsCred._id,
        sharedWith: rahul._id,
        sharedBy: aditya._id,
        permission: 'view'
      });

      await SharedAccess.create({
        credentialId: awsCred._id,
        sharedWith: sneha._id,
        sharedBy: aditya._id,
        permission: 'edit'
      });
      console.log('[Seed] Created shared access records.');
    }

    // 4. Create Audit Logs matching screenshot
    const now = new Date();
    await AuditLog.create([
      {
        userId: aditya._id,
        action: 'share',
        credentialId: awsCred._id,
        credentialTitle: 'AWS Console',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000), // Today 10:47 approx
        details: 'Shared AWS Console with Rahul (view) and Sneha (edit)',
        ipAddress: '192.168.1.45'
      },
      {
        userId: rahul._id,
        action: 'view',
        credentialId: createdCreds[1]._id,
        credentialTitle: 'GitHub',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // Today 10:42 approx
        details: 'Decrypted and revealed credentials for GitHub',
        ipAddress: '192.168.1.88'
      },
      {
        userId: sneha._id,
        action: 'edit',
        credentialId: createdCreds[4]._id,
        credentialTitle: 'Jira',
        timestamp: new Date(now.getTime() - 115 * 60 * 1000), // Today 09:15 approx
        details: 'Updated account details for Jira',
        ipAddress: '192.168.1.102'
      },
      {
        userId: kiran._id,
        action: 'create',
        credentialId: createdCreds[2]._id,
        credentialTitle: 'Vendor Portal',
        timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000), // Yesterday 17:30 approx
        details: 'Created encrypted entry for Vendor Portal',
        ipAddress: '192.168.1.67'
      },
      {
        userId: aditya._id,
        action: 'delete',
        credentialTitle: 'Old FTP Server',
        timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1000), // Yesterday 16:02 approx
        details: 'Deleted old decommissioned server credentials',
        ipAddress: '192.168.1.45'
      },
      {
        userId: meera._id,
        action: 'login',
        timestamp: new Date(now.getTime() - 27 * 60 * 60 * 1000), // Yesterday 09:00 approx
        details: 'Admin authentication from secure workstation',
        ipAddress: '10.0.0.12'
      }
    ]);

    console.log('[Seed] Created tamper-evident audit log records.');
    console.log('\n=========================================');
    console.log('Seed completed successfully!');
    console.log('Sample Logins (Password: MasterPassword123!@#):');
    console.log('  Admin:    meera@company.com');
    console.log('  Employee: aditya@company.com');
    console.log('  Employee: rahul@company.com');
    console.log('  Employee: sneha@company.com');
    console.log('=========================================\n');
    return true;
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedData().then(() => process.exit(0));
}

module.exports = seedData;
