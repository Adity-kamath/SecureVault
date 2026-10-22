# 🛡️ SecureVault · Enterprise Credential Management Platform (MERN)

> A production-grade, zero-knowledge credential management system built on the **MERN** stack (MongoDB, Express.js, React 18, Node.js). Engineered with **AES-256-GCM authenticated encryption**, **bcrypt master password hashing**, **Role-Based Access Control (RBAC)**, **granular credential sharing**, and **tamper-evident audit logging**.

---

## 📑 Table of Contents
1. [Architecture & Security Principles](#1-architecture--security-principles)
2. [Project Structure](#2-project-structure)
3. [How to Import into VS Code](#3-how-to-import-into-vs-code)
4. [Prerequisites & Dependencies](#4-prerequisites--dependencies)
5. [How to Run the Project Manually](#5-how-to-run-the-project-manually)
6. [Database Setup & Seeding](#6-database-setup--seeding)
7. [Demo Accounts & Credentials](#7-demo-accounts--credentials)
8. [API Endpoints & Postman](#8-api-endpoints--postman)
9. [Step-by-Step GitHub Push Guide](#9-step-by-step-github-push-guide)
10. [Troubleshooting (Windows & VS Code)](#10-troubleshooting-windows--vs-code)

---

## 1. Architecture & Security Principles

```text
       React 18 Client (Vite + Modern UI)
                     │
                     │  (Bearer JWT in Authorization Header)
                     ▼
          Express.js REST API Layer
  ┌──────────────────┴──────────────────────────────────────────────────────┐
  │  1. Token Authenticator (JWT signature & active account validation)     │
  │  2. RBAC Guard ('admin' vs 'employee' route isolation)                  │
  │  3. express-validator (Sanitization and strict schema enforcement)     │
  │  4. Controller Layer:                                                   │
  │       • AES-256-GCM cipher with fresh 16-byte random IV per secret      │
  │       • 16-byte HMAC auth-tag verification upon decipher                │
  │       • zxcvbn entropy scoring for password health analysis             │
  │  5. Immutable Audit Trail (userId, action, IP, timestamp, details)      │
  └──────────────────┬──────────────────────────────────────────────────────┘
                     │
                     ▼
             MongoDB Database
    (Local MongoDB / MongoDB Atlas / Embedded MongoMemoryServer)
```

### Core Security Safeguards
- **Zero-Knowledge Admin Boundary**: Administrators **never** receive decrypted credentials or ciphertext. They only access aggregated organisation risk metrics, user management, and audit trails.
- **AES-256-GCM Vault Encryption**: Stored credentials use Galois/Counter Mode with a unique 16-byte IV per credential record, ensuring both confidentiality and cryptographic authenticity.
- **Master Password Security**: User passwords are encrypted with `bcrypt` (12 salt rounds).
- **Cascading Permission Revocation**: Deactivating an employee instantly revokes all associated shared credential access (`SharedAccess`).
- **Audit Logging**: Every action (`login`, `create`, `view`, `edit`, `share`, `revoke`, `delete`) is immutably logged with the client IP and timestamp.

---

## 2. Project Structure

> 💡 **Detailed Documentation**: For a comprehensive, file-by-file explanation of what every module and file does, refer to [`MODULES.md`](./MODULES.md).

The project is cleanly divided into **Frontend (`frontend`)**, **Backend (`backend`)**, **Database (`database`)**, **Config (`config`)**, **Others (`others`)**, and **Documentation (`docs`)**:

```text
fsd-project / SecureVault/
├── frontend/                            # 🌐 FRONTEND (React 18 + Vite)
│   ├── index.html                       # HTML entry shell
│   ├── vite.config.js                   # Vite config with /api reverse proxy
│   ├── package.json                     # Frontend dependencies & scripts
│   └── src/
│       ├── main.jsx                     # Application bootstrap
│       ├── App.jsx                      # Routing & RBAC route protection
│       ├── index.css                    # Modern Tailwind/Glassmorphism-styled UI
│       ├── context/AuthContext.jsx      # JWT session state management
│       ├── services/api.js              # Axios instance with auto JWT interceptor
│       ├── components/                  # Modals, Navbar, Sidebar, Strength meters
│       └── pages/                       # Login, Register, Vault, Health, Admin
│
├── backend/                             # ⚙️ BACKEND (Express.js REST API)
│   ├── server.js                        # Express app & route mounting
│   ├── package.json                     # Backend dependencies & scripts
│   ├── controllers/                     # Auth, Credentials, Health, Admin
│   ├── middleware/                      # Auth JWT, RBAC guards, Error handling
│   ├── routes/                          # REST route definitions
│   └── utils/                           # AES-256-GCM crypto, zxcvbn, Audit logger
│
├── database/                            # 🗄️ DATABASE (Schemas, Seeders, Config)
│   ├── config/db.js                     # MongoDB connection & in-memory fallback
│   ├── models/                          # Mongoose Schemas (User, Credential, etc.)
│   ├── seed.js                          # Self-contained database seeder
│   ├── sample_data.json                 # Reference JSON export of initial fixtures
│   └── README.md                        # Dedicated database setup & schema guide
│
├── config/                              # 🔐 ENVIRONMENT & CONFIGURATION
│   ├── .env                             # Local configuration (excluded from git)
│   └── .env.example                     # Environment variables template
│
├── others/                              # 🛠️ UTILITIES & SCRIPTS
│   ├── postman_collection.json          # Postman API test collection (v2.1)
│   ├── generate_diagrams.py             # Architecture & sequence diagram generator
│   └── update_report.py                 # Project documentation report updater
│
├── docs/                                # 📚 PRESENTATIONS & DOCUMENTATION
│   ├── presentations/                   # Review 0, Review 1, and Screen PPTX files
│   ├── screenshots/                     # Full-resolution UI screenshots
│   ├── diagrams/                        # Generated architecture & class diagrams
│   └── README.md                        # Documentation index
│
├── .vscode/                             # 💻 VS CODE INTEGRATION
│   ├── launch.json                      # F5 Debugger configurations
│   ├── tasks.json                       # 1-Click tasks (Start Full Stack, Seed, etc.)
│   ├── settings.json                    # Formatter & workspace preferences
│   └── extensions.json                  # Recommended extensions
│
├── SecureVault.code-workspace           # 🚀 VS CODE WORKSPACE IMPORT FILE
├── .gitignore                           # Excludes node_modules, .env, dist, logs
├── package.json                         # Root orchestrator with concurrent scripts
└── README.md                            # Main project guide
```

---

## 3. How to Import into VS Code

You can open this project in VS Code in **either of two ways**:

### Option A: Using the `.code-workspace` File (Recommended)
1. Launch **Visual Studio Code**.
2. Click **File** → **Open Workspace from File...**
3. Select the file: `SecureVault.code-workspace`.
4. VS Code will automatically display 4 cleanly organized sections in your Explorer:
   - 🌐 **Frontend (Client)**
   - ⚙️ **Backend (Server)**
   - 🗄️ **Database**
   - 📁 **Project Root & Docs**

### Option B: Opening the Folder Directly
1. Launch **Visual Studio Code**.
2. Click **File** → **Open Folder...**
3. Select this folder (`fsd project`).
4. VS Code loads all files, terminal configurations, and tasks automatically.

---

## 4. Prerequisites & Dependencies

Before running the application, make sure you have:
- **Node.js**: `v18.0.0` or newer installed (`node -v`)
- **npm**: `v9.0.0` or newer (`npm -v`)
- **Git**: Installed for version control (`git --version`)
- *(Optional)* **MongoDB**: Local MongoDB Community Server running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.  
  *(Note: If you do not have MongoDB installed, SecureVault will automatically launch an **in-memory MongoDB database** so the app still runs immediately out of the box!)*

---

## 5. How to Run the Project Manually

### Step 1: Install Dependencies
Open a terminal in the root directory and run:
```bash
npm run install:all
```
*(This installs root dependencies, backend packages, and frontend packages in one command.)*

### Step 2: Configure Environment Variables
Verify that `config/.env` exists. If not, copy it from the template:
```bash
# On Windows PowerShell:
Copy-Item config/.env.example config/.env

# On Mac/Linux:
cp config/.env.example config/.env
```
Default `config/.env` configuration:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/securevault
JWT_SECRET=sv_jwt_sec_9f482a6e03c411ea8a60aa000400fe67ba8921dc8f7e2a9b
JWT_EXPIRES_IN=8h
ENCRYPTION_KEY=e83a9d7c2b5104f6931e5088274cf192d6e38b417c9502a4bf6281dc394801ea
CLIENT_URL=http://localhost:3000
```

### Step 3: Seed the Database
Populate the database with sample employees, administrator, credentials, permissions, and audit trails:
```bash
npm run seed
```

### Step 4: Start the Application

You can start both Frontend and Backend together or in separate terminals:

#### Method 1: Single Command (Concurrent Run - Easiest)
In your root terminal:
```bash
npm run dev
```
*(This launches the Express backend on port `5000` and the React frontend on port `3000` concurrently in one terminal!)*

#### Method 2: Two Separate Terminals
- **Terminal 1 (Backend Server):**
  ```bash
  npm run server
  ```
  *Runs on `http://localhost:5000`*

- **Terminal 2 (React Frontend):**
  ```bash
  npm run client
  ```
  *Runs on `http://localhost:3000`*

#### Method 3: VS Code Built-in Tasks
1. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS).
2. Type `Tasks: Run Task` and press Enter.
3. Select **`🚀 Start Full Stack (Client + Server)`**.

---

## 6. Database Setup & Seeding

SecureVault provides **three flexible database options**:

| Mode | Configuration | When to use |
|---|---|---|
| **Embedded MongoDB** | Automatic fallback | Zero-setup demonstrations when MongoDB is not installed locally. |
| **Local MongoDB** | `MONGO_URI=mongodb://127.0.0.1:27017/securevault` | Standard local development with MongoDB Community Server / Docker. |
| **MongoDB Atlas** | `MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/securevault` | Cloud deployment and remote collaboration. |

For detailed database schemas, indexing rules, and collections documentation, see [`database/README.md`](file:///database/README.md).

---

## 7. Demo Accounts & Credentials

All seeded demo accounts use the master password:
```text
MasterPassword123!@#
```

| Role | Name | Email | Permissions & Mockup Features |
|---|---|---|---|
| **Admin** | Meera S. | `meera@company.com` | Access to Admin Dashboard, Org Health Distribution, User Management, Audit Log & CSV Export. |
| **Employee** | Aditya K. | `aditya@company.com` | Personal Vault, AWS Console (reused password), Share with colleagues modal. |
| **Employee** | Rahul M. | `rahul@company.com` | Has shared access to AWS Console (view only) and Jira Enterprise. |
| **Employee** | Sneha P. | `sneha@company.com` | Has shared access to AWS Console (edit permission). |
| **Employee** | Kiran T. | `kiran@company.com` | Inactive status (demonstrates cascade access revocation). |

---

## 8. API Endpoints & Postman

The REST API exposes clean, secure endpoints:

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new employee account
- `POST /api/auth/login` — Authenticate and receive signed JWT
- `GET /api/auth/profile` — Fetch authenticated user profile

### Credentials Vault (`/api/credentials`)
- `GET /api/credentials` — List user credentials + shared items
- `POST /api/credentials` — Encrypt and store new credential
- `GET /api/credentials/:id/reveal` — On-demand AES decryption
- `PUT /api/credentials/:id` — Update credential
- `DELETE /api/credentials/:id` — Delete credential and revoke shares
- `POST /api/credentials/:id/share` — Share credential with colleague (view/edit)
- `DELETE /api/credentials/:id/share/:userId` — Revoke colleague access

### Password Health (`/api/health`)
- `GET /api/health/my-health` — Strength scores, reused passwords, compromised accounts

### Admin Governance (`/api/admin`)
- `GET /api/admin/dashboard` — Org-level metrics & real-time risk counts
- `GET /api/admin/users` — Employee directory & status toggle
- `PUT /api/admin/users/:id/status` — Activate/Deactivate employee
- `GET /api/admin/health` — Organisation-wide entropy distribution
- `GET /api/admin/audit-logs` — Tamper-evident audit logs with CSV export

### Testing with Postman
Import the [`postman_collection.json`](file:///postman_collection.json) file directly into Postman. It includes pre-written tests that automatically extract the JWT token upon login and attach it to subsequent requests.

---

## 9. Step-by-Step GitHub Push Guide

To push this project to your GitHub repository:

### Step 1: Open Terminal in the Project Root
Make sure your terminal is inside `c:\Users\Aditya\Music\fsd project`.

### Step 2: Initialize Git Repository
```bash
git init
```

### Step 3: Check Git Status
```bash
git status
```
*(Notice that `node_modules` and `.env` are automatically ignored thanks to `.gitignore`!)*

### Step 4: Stage and Commit All Files
```bash
git add .
git commit -m "feat: initial commit of SecureVault MERN credential management platform"
```

### Step 5: Rename Branch to `main`
```bash
git branch -M main
```

### Step 6: Create a New Repository on GitHub
1. Go to [GitHub](https://github.com/new).
2. Create a new repository named `SecureVault` (or `fsd-project`).
3. Leave "Initialize this repository with a README" **unchecked** (we already have one).

### Step 7: Link Your Remote and Push
Replace `<YOUR_GITHUB_USERNAME>` with your GitHub username:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/SecureVault.git
git push -u origin main
```

---

## 10. Troubleshooting (Windows & VS Code)

### Issue: "Running scripts is disabled on this system" (PowerShell ExecutionPolicy)
If you see `File C:\... cannot be loaded because running scripts is disabled on this system`:
1. Open PowerShell as Administrator.
2. Run:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
3. Or in your current terminal session:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

### Issue: Port 5000 or Port 3000 Already in Use
If the server reports `EADDRINUSE: address already in use :::5000`:
- **Find process**:
  ```powershell
  Get-NetTCPConnection -LocalPort 5000
  ```
- **Stop process**:
  ```powershell
  Stop-Process -Id <OwningProcessId> -Force
  ```
- Or change `PORT=5001` in `server/.env` and update `client/vite.config.js` proxy target.

### Issue: MongoDB Connection Refused
If MongoDB is not running locally, **do not worry!** The backend will automatically fall back to an embedded in-memory MongoDB instance and auto-seed the demo accounts.

---

## 👥 Contributors & License
- **Author**: SecureVault Team
- **Course**: Full Stack Development (FSD) Project
- **License**: ISC
