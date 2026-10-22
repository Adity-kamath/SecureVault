import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

DOC_PATH = r'docs\SecureVault_Project_Report.docx'

print("Loading document:", DOC_PATH)
doc = docx.Document(DOC_PATH)

# ==========================================
# 1. INSERT IMAGES INTO RELEVANT TABLE CELLS
# ==========================================
# Mapping table index -> image path
table_image_map = {
    3: (r'docs\diagrams\system_architecture.png', Inches(5.8)),
    5: (r'docs\diagrams\class_diagram.png', Inches(5.8)),
    6: (r'docs\diagrams\sequence_diagram.png', Inches(5.8)),
    9: (r'docs\screenshots\SecureVault — Login.jpg', Inches(5.6)),
    10: (r'docs\screenshots\SecureVault — Employee Registration.jpg', Inches(5.6)),
    11: (r'docs\screenshots\SecureVault — My Credentials.jpg', Inches(5.6)),
    12: (r'docs\screenshots\SecureVault — Add Credential.jpg', Inches(5.6)),
    13: (r'docs\screenshots\SecureVault — Credential Detail.jpg', Inches(5.6)),
    14: (r'docs\screenshots\SecureVault — Share with Colleagues.jpg', Inches(5.6)),
    15: (r'docs\screenshots\SecureVault — My Password Health.jpg', Inches(5.6)),
    16: (r'docs\screenshots\SecureVault — Admin Organisation Dashboard.jpg', Inches(5.6)),
    17: (r'docs\screenshots\SecureVault — User Management.jpg', Inches(5.6)),
    18: (r'docs\screenshots\SecureVault — Organisation Password Health.jpg', Inches(5.6)),
    19: (r'docs\screenshots\SecureVault — Audit Log.jpg', Inches(5.6)),
}

for tbl_idx, (img_path, width) in table_image_map.items():
    if not os.path.exists(img_path):
        print(f"ERROR: Image not found: {img_path}")
        continue
    tbl = doc.tables[tbl_idx]
    
    # Remove existing borders so the screenshot / diagram renders cleanly
    tblPr = tbl._tbl.tblPr
    tblBorders = tblPr.find(qn('w:tblBorders'))
    if tblBorders is not None:
        tblPr.remove(tblBorders)
    # Add subtle thin border or no border
    new_borders = parse_xml(r'''
        <w:tblBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
        </w:tblBorders>
    ''')
    tblPr.append(new_borders)

    cell = tbl.cell(0, 0)
    # Clear existing placeholder text
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run()
    run.add_picture(img_path, width=width)
    print(f"Inserted image for Table {tbl_idx}: {os.path.basename(img_path)}")

# ==========================================
# 2. CODE SNIPPETS DEFINITION
# ==========================================

CODE_SNIPPETS = {}

# 3. Database Connection
CODE_SNIPPETS[3] = """// database/config/db.js - MongoDB Connection with MongoMemoryServer In-Memory Fallback
const mongoose = require('mongoose');

const connectDB = async () => {
  const targetUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securevault';

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Auto-seed if the database is empty in production
    if (process.env.NODE_ENV === 'production') {
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Database] Empty DB detected in production. Auto-seeding demo data...');
        const seedData = require('../seed');
        await seedData();
      }
    }
  } catch (error) {
    console.warn(`[Database] Local MongoDB unavailable (${error.message}). Starting embedded fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({ instance: { dbName: 'securevault' } });
      const memUri = mongod.getUri();

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      await mongoose.connect(memUri, { autoIndex: true });
      console.log(`[Database] Embedded MongoMemoryServer active at: ${memUri}`);

      // Auto-seed demo dataset (Admin Meera + Employees)
      const seedData = require('../seed');
      await seedData();
      console.log('[Database] Demo dataset seeded into in-memory database successfully.');
    } catch (memErr) {
      console.error(`[Database Error] Embedded fallback failed: ${memErr.message}`);
    }
  }
};

module.exports = connectDB;"""

# 5. User Model
CODE_SNIPPETS[5] = """// database/models/User.js - Mongoose Schema with bcrypt Password Hashing & Sanitization
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid work email']
    },
    masterPasswordHash: {
      type: String,
      required: [true, 'Master password hash is required']
    },
    role: {
      type: String,
      enum: ['employee', 'admin'],
      default: 'employee'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Method to verify candidate password against bcrypt master hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.masterPasswordHash);
};

// Static method to generate bcrypt hash with cost factor of 12 salt rounds
userSchema.statics.hashPassword = async function (plaintextPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plaintextPassword, salt);
};

// Zero-knowledge sanitization: strip sensitive master hash from serialized JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.masterPasswordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);"""

# 6. Password Hashing and Registration
CODE_SNIPPETS[6] = """// backend/controllers/authController.js - Registration Controller with zxcvbn Strength Check
const register = async (req, res, next) => {
  try {
    const { name, email, masterPassword, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Evaluate master password entropy using zxcvbn
    const health = evaluatePassword(masterPassword, [name, email]);
    if (health.score < 2) {
      return res.status(400).json({
        success: false,
        message: 'Master password is too weak. Please include symbols, mixed case, and numbers.',
        feedback: health
      });
    }

    // Hash master password with 12 salt rounds using bcrypt
    const masterPasswordHash = await User.hashPassword(masterPassword);

    const user = await User.create({
      name,
      email,
      masterPasswordHash,
      role: role && ['employee', 'admin'].includes(role) ? role : 'employee',
      isActive: true
    });

    const token = generateToken(user);

    // Write immutable audit log entry
    await logAuditEvent({
      userId: user._id,
      action: 'register',
      req,
      details: `Account registered with role ${user.role}`
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};"""

# 7. Login and JWT Generation
CODE_SNIPPETS[7] = """// backend/controllers/authController.js - User Authentication & JWT Generation
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET || 'sv_jwt_sec_9f482a6e03c411ea8a60aa000400fe67ba8921dc8f7e2a9b',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or master password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by an administrator.'
      });
    }

    const isMatch = await user.comparePassword(masterPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or master password.'
      });
    }

    const token = generateToken(user);

    // Record login in audit trail
    await logAuditEvent({
      userId: user._id,
      action: 'login',
      req,
      details: 'User authenticated successfully'
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};"""

# 8. Authentication Middleware
CODE_SNIPPETS[8] = """// backend/middleware/auth.js - Stateless JWT Verification Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed token.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sv_jwt_sec_9f482a6e03c411ea8a60aa000400fe67ba8921dc8f7e2a9b'
    );

    const user = await User.findById(decoded.id).select('-masterPasswordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. User account does not exist.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.'
    });
  }
};

module.exports = { authenticateToken };"""

# 9. Create API
CODE_SNIPPETS[9] = """// backend/controllers/credentialController.js - Encrypted Credential Creation (AES-256-GCM)
const createCredential = async (req, res, next) => {
  try {
    const { title, username, password, url } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to store credentials.'
      });
    }

    // 1. Evaluate password entropy with zxcvbn
    const health = evaluatePassword(password, [req.user.name, req.user.email, title, username]);

    // 2. Authenticated encryption: generate random 16-byte IV, cipher text, and 16-byte GCM tag
    const { encryptedPassword, iv, authTag } = encryptPassword(password);

    // 3. Persist encrypted payload to database
    const credential = await Credential.create({
      ownerId: req.user._id,
      title: title.trim(),
      username: username.trim(),
      url: (url || '').trim(),
      encryptedPassword,
      iv,
      authTag,
      strengthScore: health.score,
      lastUpdated: new Date()
    });

    // 4. Record action in audit log
    await logAuditEvent({
      userId: req.user._id,
      action: 'create',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Created credential "${credential.title}" with strength score ${health.score}/4`
    });

    const responseObj = credential.toJSON();
    responseObj.accessLevel = 'owner';
    responseObj.isOwner = true;
    responseObj.sharedWith = [];

    res.status(201).json({
      success: true,
      message: 'Credential encrypted and saved successfully.',
      credential: responseObj
    });
  } catch (error) {
    next(error);
  }
};"""

# 10. Read API
CODE_SNIPPETS[10] = """// backend/controllers/credentialController.js - List Accessible Credentials & On-Demand Reveal
// 1. Retrieve all credentials accessible to user (owned + shared records)
const getCredentials = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const ownedCredentials = await Credential.find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    const sharedAccessList = await SharedAccess.find({ sharedWith: userId })
      .populate({ path: 'credentialId', select: '-encryptedPassword -iv -authTag' })
      .populate('sharedBy', 'name email')
      .lean();

    const formattedOwned = await Promise.all(
      ownedCredentials.map(async (cred) => {
        const shares = await SharedAccess.find({ credentialId: cred._id })
          .populate('sharedWith', 'name email')
          .lean();
        delete cred.encryptedPassword;
        delete cred.iv;
        delete cred.authTag;
        return {
          ...cred,
          accessLevel: 'owner',
          isOwner: true,
          sharedWith: shares.map((s) => ({
            userId: s.sharedWith?._id,
            name: s.sharedWith?.name,
            email: s.sharedWith?.email,
            permission: s.permission,
            sharedAt: s.createdAt
          }))
        };
      })
    );

    const formattedShared = sharedAccessList
      .filter((s) => s.credentialId != null)
      .map((s) => ({
        ...s.credentialId,
        accessLevel: s.permission,
        isOwner: false,
        sharedBy: { id: s.sharedBy?._id, name: s.sharedBy?.name, email: s.sharedBy?.email },
        sharedAt: s.createdAt
      }));

    res.status(200).json({
      success: true,
      count: formattedOwned.length + formattedShared.length,
      credentials: [...formattedOwned, ...formattedShared]
    });
  } catch (error) {
    next(error);
  }
};

// 2. On-demand authenticated decryption & reveal
const revealPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { credential, accessLevel } = await resolveAccess(id, req.user._id);

    if (!credential || !accessLevel) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found or you lack permission to view this password.'
      });
    }

    const decryptedPassword = decryptPassword(credential.encryptedPassword, credential.iv, credential.authTag);

    await logAuditEvent({
      userId: req.user._id,
      action: 'view',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Revealed password for "${credential.title}" (Access: ${accessLevel})`
    });

    res.status(200).json({
      success: true,
      password: decryptedPassword,
      strengthScore: credential.strengthScore
    });
  } catch (error) {
    next(error);
  }
};"""

# 11. Update
CODE_SNIPPETS[11] = """// backend/controllers/credentialController.js - Update Credential with Re-encryption
const updateCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, username, password, url } = req.body;

    const { credential, accessLevel } = await resolveAccess(id, req.user._id);
    if (!credential) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }

    if (accessLevel !== 'owner' && accessLevel !== 'edit') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You have view-only access to this credential.'
      });
    }

    if (title !== undefined) credential.title = title.trim();
    if (username !== undefined) credential.username = username.trim();
    if (url !== undefined) credential.url = url.trim();

    let passwordUpdated = false;
    if (password) {
      const health = evaluatePassword(password, [req.user.name, req.user.email, credential.title, credential.username]);
      const enc = encryptPassword(password);
      credential.encryptedPassword = enc.encryptedPassword;
      credential.iv = enc.iv;
      credential.authTag = enc.authTag;
      credential.strengthScore = health.score;
      passwordUpdated = true;
    }

    credential.lastUpdated = new Date();
    await credential.save();

    await logAuditEvent({
      userId: req.user._id,
      action: 'edit',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Updated credential "${credential.title}". Password updated: ${passwordUpdated}`
    });

    const responseObj = credential.toJSON();
    responseObj.accessLevel = accessLevel;
    responseObj.isOwner = accessLevel === 'owner';

    res.status(200).json({
      success: true,
      message: 'Credential updated successfully.',
      credential: responseObj
    });
  } catch (error) {
    next(error);
  }
};"""

# 12. Delete
CODE_SNIPPETS[12] = """// backend/controllers/credentialController.js - Delete Credential & Cascade Revoke Shares
const deleteCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const credential = await Credential.findById(id);

    if (!credential) {
      return res.status(404).json({ success: false, message: 'Credential not found.' });
    }

    // Strict ownership boundary: only owner can delete credential
    if (credential.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the credential owner can delete it.'
      });
    }

    // Cascade deletion: purge all SharedAccess entries referencing this credential
    const sharesRevoked = await SharedAccess.deleteMany({ credentialId: credential._id });

    await Credential.findByIdAndDelete(id);

    await logAuditEvent({
      userId: req.user._id,
      action: 'delete',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Deleted credential "${credential.title}". Purged ${sharesRevoked.deletedCount} shared grants.`
    });

    res.status(200).json({
      success: true,
      message: 'Credential and all associated shared access records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};"""

# 13. Express Routes
CODE_SNIPPETS[13] = """// backend/routes/credentialRoutes.js - REST API Route Definitions & Middleware Pipeline
const express = require('express');
const router = express.Router();
const {
  getCredentials,
  createCredential,
  getCredentialById,
  revealPassword,
  updateCredential,
  deleteCredential,
  generatePassword
} = require('../controllers/credentialController');
const {
  shareCredential,
  revokeShare,
  getCredentialShares,
  getActiveColleagues
} = require('../controllers/shareController');
const { authenticateToken } = require('../middleware/auth');
const {
  credentialValidation,
  credentialUpdateValidation,
  shareValidation
} = require('../middleware/validate');

// All credential routes require active session JWT
router.use(authenticateToken);

// Active colleagues lookup for sharing selector
router.get('/colleagues/active', getActiveColleagues);

// List and Create
router.get('/', getCredentials);
router.post('/', credentialValidation, createCredential);

// Cryptographic password generator
router.post('/generate', generatePassword);

// Colleague sharing endpoints
router.get('/:id/share', getCredentialShares);
router.post('/:id/share', shareValidation, shareCredential);
router.delete('/:id/share/:userId', revokeShare);

// CRUD operations on individual credential
router.get('/:id', getCredentialById);
router.get('/:id/reveal', revealPassword);
router.put('/:id', credentialUpdateValidation, updateCredential);
router.delete('/:id', deleteCredential);

module.exports = router;"""

# 14. Main Server File
CODE_SNIPPETS[14] = """// backend/server.js - Express App Bootstrap, Middleware Stack & Server Startup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../database/config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize database connection (with MongoMemoryServer development fallback)
connectDB();

const app = express();

// Security and request parsing
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

// Liveness probe
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'online', timestamp: new Date().toISOString(), service: 'SecureVault REST API' });
});

// Mount modular API routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/credentials', require('./routes/credentialRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Production client serving
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

// 404 Catch-all handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SecureVault API] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

module.exports = app;"""

# 15. React Login Component
CODE_SNIPPETS[15] = """// frontend/src/pages/LoginPage.jsx - React 18 Login Screen with Quick-Fill Demo Accounts
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, masterPassword);
      if (res.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, role) => {
    setEmail(demoEmail);
    setMasterPassword('MasterPassword123!@#');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f5', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand-icon" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Sign in to SecureVault</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Zero-knowledge encrypted credential management</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input type="email" placeholder="name@company.com" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <input type="password" placeholder="••••••••••••••••" className="form-input" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
            Instant Demo Logins
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => handleDemoFill('meera@company.com', 'admin')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '12px' }}>
              <UserCheck size={13} color="#0f766e" />
              <span>Admin (Meera)</span>
            </button>
            <button type="button" onClick={() => handleDemoFill('aditya@company.com', 'employee')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '12px' }}>
              <UserCheck size={13} color="#059669" />
              <span>Employee (Aditya)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;"""

# 16. Admin Dashboard Logic
CODE_SNIPPETS[16] = """// frontend/src/pages/AdminDashboardPage.jsx - Admin Security Governance Data Fetching
import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Calls GET /api/admin/dashboard (Zero-knowledge: aggregated metadata only)
        const res = await adminService.getDashboard();
        if (res.success) {
          setData(res.dashboard);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading organisation security overview...</div>;
  }

  const { stats, issues, recentActivity } = data || { stats: {}, issues: {}, recentActivity: [] };
  // stats contains: { employees: 3, credentials: 12, orgHealthScore: 84, needAttention: 2 }
  // issues contains: { weak: 1, reused: 2, old: 1 }
  // recentActivity contains the 10 most recent immutable audit log records

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Organisation Overview</h1>
        <p className="page-subtitle">Acme Technologies · live security posture across all employees</p>
      </div>
      {/* Metrics Cards, Issue Ratios, and Real-Time Audit Activity Feed rendered here */}
    </div>
  );
};

export default AdminDashboardPage;"""

# 17. REST API Request and Response Examples
CODE_SNIPPETS[17] = """/* 17. REST API Request and Response Examples */

// Example 1: User Login
// POST /api/auth/login
// Request Body:
{
  "email": "aditya@company.com",
  "masterPassword": "MasterPassword123!@#"
}

// Response (HTTP 200 OK):
{
  "success": true,
  "message": "Authentication successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "660c1f20b3a8c512d4e80001",
    "name": "Aditya K.",
    "email": "aditya@company.com",
    "role": "employee",
    "isActive": true,
    "createdAt": "2026-03-15T09:30:00.000Z"
  }
}

// Example 2: Create Encrypted Credential
// POST /api/credentials
// Headers: Authorization: Bearer <token>
// Request Body:
{
  "title": "AWS Production Console",
  "username": "sysadmin@company.com",
  "password": "V!8x#kP9$2mQ@wZ7",
  "url": "https://signin.aws.amazon.com/console"
}

// Response (HTTP 201 Created):
{
  "success": true,
  "message": "Credential encrypted and saved successfully.",
  "credential": {
    "id": "660c2b50b3a8c512d4e80042",
    "title": "AWS Production Console",
    "username": "sysadmin@company.com",
    "url": "https://signin.aws.amazon.com/console",
    "strengthScore": 4,
    "accessLevel": "owner",
    "isOwner": true,
    "sharedWith": [],
    "createdAt": "2026-03-20T11:15:30.000Z",
    "updatedAt": "2026-03-20T11:15:30.000Z"
  }
}

// Example 3: Reveal Credential Password On-Demand
// GET /api/credentials/660c2b50b3a8c512d4e80042/reveal
// Headers: Authorization: Bearer <token>

// Response (HTTP 200 OK):
{
  "success": true,
  "password": "V!8x#kP9$2mQ@wZ7",
  "strengthScore": 4
}"""

# ==========================================
# 3. REPLACING CODE PLACEHOLDERS IN DOCX
# ==========================================

# Helper to format code paragraphs
def insert_code_block(target_p, code_text):
    lines = code_text.split('\n')
    for line in lines:
        new_p = doc.add_paragraph()
        new_p.style = 'Normal'
        new_p.paragraph_format.space_before = Pt(0)
        new_p.paragraph_format.space_after = Pt(1.5)
        new_p.paragraph_format.line_spacing = 1.05
        run = new_p.add_run(line if line.strip() else ' ')
        run.font.name = 'Courier New'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        target_p._p.addprevious(new_p._p)

# Search paragraphs with placeholders and insert
paragraphs_to_remove = []

for p in doc.paragraphs:
    txt = p.text.strip()
    if '[ Check this tree' in txt:
        paragraphs_to_remove.append(p)
    elif '[ ADD Code' in txt or '[ADD Code' in txt or '[ ADD CODE' in txt or '[ADD CODE' in txt:
        if 'MongoDB connection' in txt:
            insert_code_block(p, CODE_SNIPPETS[3])
            paragraphs_to_remove.append(p)
        elif 'User schema' in txt:
            insert_code_block(p, CODE_SNIPPETS[5])
            paragraphs_to_remove.append(p)
        elif 'Registration controller' in txt:
            insert_code_block(p, CODE_SNIPPETS[6])
            paragraphs_to_remove.append(p)
        elif 'Login controller' in txt:
            insert_code_block(p, CODE_SNIPPETS[7])
            paragraphs_to_remove.append(p)
        elif 'JWT middleware' in txt:
            insert_code_block(p, CODE_SNIPPETS[8])
            paragraphs_to_remove.append(p)
        elif 'Create' in txt:
            insert_code_block(p, CODE_SNIPPETS[9])
            paragraphs_to_remove.append(p)
        elif 'Read' in txt:
            insert_code_block(p, CODE_SNIPPETS[10])
            paragraphs_to_remove.append(p)
        elif 'Update' in txt:
            insert_code_block(p, CODE_SNIPPETS[11])
            paragraphs_to_remove.append(p)
        elif 'Delete' in txt:
            insert_code_block(p, CODE_SNIPPETS[12])
            paragraphs_to_remove.append(p)
        elif 'Routes' in txt:
            insert_code_block(p, CODE_SNIPPETS[13])
            paragraphs_to_remove.append(p)
        elif 'Express server' in txt:
            insert_code_block(p, CODE_SNIPPETS[14])
            paragraphs_to_remove.append(p)
        elif 'React login' in txt:
            insert_code_block(p, CODE_SNIPPETS[15])
            paragraphs_to_remove.append(p)
        elif 'Fetching dashboard data' in txt:
            insert_code_block(p, CODE_SNIPPETS[16])
            paragraphs_to_remove.append(p)
        elif 'Request' in txt:
            insert_code_block(p, CODE_SNIPPETS[17])
            paragraphs_to_remove.append(p)
        elif 'Response' in txt:
            # Already handled in section 17
            paragraphs_to_remove.append(p)

print(f"Removing {len(paragraphs_to_remove)} placeholder paragraphs...")
for p in paragraphs_to_remove:
    p._p.getparent().remove(p._p)

print("Saving updated document...")
doc.save(DOC_PATH)
print("SUCCESS: SecureVault_Project_Report.docx updated successfully!")
