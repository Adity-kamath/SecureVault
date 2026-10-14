# 🗄️ SecureVault · Database Documentation

This directory contains the database design, schemas, seed utilities, and reference datasets for the **SecureVault** credential management platform.

---

## 1. Overview & Architecture

SecureVault utilizes **MongoDB** via the **Mongoose ODM**. The database architecture is designed with strict security constraints:

- **AES-256-GCM Credential Storage**: Password fields are never stored in plaintext or reversible single-hash formats. Each credential document stores an encrypted ciphertext, a unique 16-byte random Initialization Vector (IV), and a 16-byte authentication tag (GCM auth tag).
- **Master Password Security**: User master passwords are encrypted using `bcrypt` (12 salt rounds).
- **Zero-Knowledge Admin Boundary**: Admins can query aggregate health stats, user lists, and audit logs, but the database schemas and queries prevent decrypting passwords for unauthorized users.
- **Cascading Permission Revocation**: When an employee is deactivated, related `SharedAccess` documents are revoked.
- **Immutable Audit Trail**: The `AuditLog` collection records all security-sensitive events with TTL / immutable timestamps and indexes.

---

## 2. Collections & Schemas

### `users`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `name` | String | Employee/Admin full name |
| `email` | String | Unique email (lowercase, indexed) |
| `masterPasswordHash`| String | `bcrypt` hash (12 rounds) |
| `role` | String | `'admin'` or `'employee'` |
| `isActive` | Boolean | Account status (default: `true`) |
| `createdAt` | Date | Creation timestamp |

### `credentials`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `ownerId` | ObjectId | Reference to `users._id` (indexed) |
| `title` | String | Service/account title (e.g. AWS Console) |
| `username` | String | Stored username/email |
| `url` | String | Login URL |
| `encryptedPassword`| String | AES-256-GCM ciphertext in hex |
| `iv` | String | 16-byte random IV in hex |
| `authTag` | String | 16-byte GCM authentication tag in hex |
| `strengthScore` | Number | zxcvbn password score (`0` to `4`) |
| `lastUpdated` | Date | Password change timestamp |

### `sharedaccesses`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `credentialId` | ObjectId | Reference to `credentials._id` (indexed) |
| `sharedWith` | ObjectId | Reference to `users._id` (recipient) |
| `sharedBy` | ObjectId | Reference to `users._id` (owner) |
| `permission` | String | `'view'` or `'edit'` |
| `createdAt` | Date | Grant timestamp |

### `auditlogs`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique identifier |
| `userId` | ObjectId | User triggering event |
| `action` | String | `'login'`, `'create'`, `'view'`, `'edit'`, `'share'`, `'revoke'`, `'delete'` |
| `credentialId` | ObjectId | Optional reference |
| `credentialTitle` | String | Name of credential at time of event |
| `details` | String | Human-readable event description |
| `ipAddress` | String | Client IP address |
| `timestamp` | Date | Immutable timestamp (indexed) |

---

## 3. Database Connection Modes

SecureVault supports three ways to run MongoDB:

### Option A: Automatic Embedded Database (Zero Setup!)
If local MongoDB is **not** installed on your machine, `server/config/db.js` automatically starts an embedded **MongoMemoryServer** and seeds the initial dataset. No manual database installation is required for development or demonstrations!

### Option B: Local MongoDB Server
If you have MongoDB Community Server or MongoDB via Docker running locally on port 27017:
```bash
# Verify MongoDB service is running
mongosh "mongodb://127.0.0.1:27017/securevault"
```
Ensure your `server/.env` contains:
```ini
MONGO_URI=mongodb://127.0.0.1:27017/securevault
```

### Option C: MongoDB Atlas (Cloud)
To connect to a cloud MongoDB Atlas cluster, update `server/.env`:
```ini
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/securevault?retryWrites=true&w=majority
```

---

## 4. Seeding Data

To populate sample users, encrypted credentials, shared permissions, and audit logs:
```bash
# From project root:
npm run seed

# Or run directly:
node database/seed.js
```

Sample logins created by the seeder (all use master password `MasterPassword123!@#`):
- **Admin**: `meera@company.com`
- **Employee**: `aditya@company.com`
- **Employee**: `rahul@company.com`
- **Employee**: `sneha@company.com`
- **Inactive Employee**: `kiran@company.com`
