from PIL import Image, ImageDraw, ImageFont
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

os.makedirs(r'docs\diagrams', exist_ok=True)

# Try to load Arial or fallback to default
try:
    font_title = ImageFont.truetype('arial.ttf', 24)
    font_heading = ImageFont.truetype('arialbd.ttf', 18)
    font_body = ImageFont.truetype('arial.ttf', 14)
    font_small = ImageFont.truetype('arial.ttf', 12)
except Exception:
    font_title = ImageFont.load_default()
    font_heading = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_small = ImageFont.load_default()

def make_arch_diagram():
    w, h = 1600, 960
    img = Image.new('RGB', (w, h), color='#F8FAFC')
    draw = ImageDraw.Draw(img)
    
    # Title Banner
    draw.rectangle([(0, 0), (w, 80)], fill='#0F172A')
    draw.text((w//2, 40), 'SECUREVAULT - THREE-TIER SYSTEM ARCHITECTURE', fill='#F8FAFC', font=font_title, anchor='mm')
    
    # Tier 1: Client Tier
    draw.rounded_rectangle([(60, 110), (480, 910)], radius=12, fill='#EFF6FF', outline='#3B82F6', width=2)
    draw.rectangle([(60, 110), (480, 165)], fill='#2563EB')
    draw.text((270, 137), 'PRESENTATION TIER (CLIENT)', fill='#FFFFFF', font=font_heading, anchor='mm')
    
    client_boxes = [
        ('React 18 SPA (Vite Engine)', '#DBEAFE', '#1E40AF'),
        ('AuthContext & JWT Session (localStorage)', '#FFFFFF', '#1E293B'),
        ('Axios HTTP Client + Bearer Interceptor', '#FFFFFF', '#1E293B'),
        ('Credential Vault View & Filter Controls', '#FFFFFF', '#1E293B'),
        ('On-Demand Decrypt / Reveal Modal', '#FFFFFF', '#1E293B'),
        ('Real-Time zxcvbn Entropy Strength Meter', '#FFFFFF', '#1E293B'),
        ('Role-Based ProtectedRoute Guards', '#FFFFFF', '#1E293B'),
        ('Admin Governance & Audit Log Views', '#FFFFFF', '#1E293B'),
    ]
    y = 185
    for title, bg, fg in client_boxes:
        draw.rounded_rectangle([(80, y), (460, y+68)], radius=8, fill=bg, outline='#93C5FD', width=1)
        draw.text((270, y+34), title, fill=fg, font=font_body, anchor='mm')
        y += 85

    # Tier 2: Application Tier
    draw.rounded_rectangle([(540, 110), (1060, 910)], radius=12, fill='#F0FDF4', outline='#10B981', width=2)
    draw.rectangle([(540, 110), (1060, 165)], fill='#059669')
    draw.text((800, 137), 'APPLICATION TIER (EXPRESS REST API)', fill='#FFFFFF', font=font_heading, anchor='mm')
    
    api_boxes = [
        ('Sequential Middleware Security Pipeline', '#DCFCE7', '#065F46'),
        ('1. CORS Whitelist & JSON Body Parser', '#FFFFFF', '#1E293B'),
        ('2. JWT Verification (middleware/auth.js)', '#FFFFFF', '#1E293B'),
        ('3. Role Guard (middleware/rbac.js: admin/employee)', '#FFFFFF', '#1E293B'),
        ('4. Input Validation (express-validator)', '#FFFFFF', '#1E293B'),
        ('Core Controllers & Cryptographic Engine', '#DCFCE7', '#065F46'),
        ('AES-256-GCM Vault Engine (Node crypto)', '#FEF3C7', '#92400E'),
        ('bcrypt Hashing (12 Salt Rounds) & Auth', '#FEF3C7', '#92400E'),
        ('Async Audit Logger & Cascade Revocation', '#FFFFFF', '#1E293B'),
    ]
    y = 180
    for title, bg, fg in api_boxes:
        draw.rounded_rectangle([(560, y), (1040, y+62)], radius=8, fill=bg, outline='#86EFAC', width=1)
        draw.text((800, y+31), title, fill=fg, font=font_body, anchor='mm')
        y += 75

    # Tier 3: Data Tier
    draw.rounded_rectangle([(1120, 110), (1540, 910)], radius=12, fill='#FAF5FF', outline='#A855F7', width=2)
    draw.rectangle([(1120, 110), (1540, 165)], fill='#7E22CE')
    draw.text((1330, 137), 'DATABASE TIER (MONGODB)', fill='#FFFFFF', font=font_heading, anchor='mm')
    
    db_boxes = [
        ('Mongoose ODM Schema Layer', '#F3E8FF', '#581C87'),
        ('users Collection (bcrypt hashes, roles)', '#FFFFFF', '#1E293B'),
        ('credentials Collection (AES ciphertext + IV + Tag)', '#FEF2F2', '#991B1B'),
        ('sharedaccesses Collection (RBAC sharing)', '#FFFFFF', '#1E293B'),
        ('auditlogs Collection (immutable trails, IP)', '#FFFFFF', '#1E293B'),
        ('Database Engines Supported:', '#F3E8FF', '#581C87'),
        ('Local MongoDB / Cloud Atlas Cluster', '#FFFFFF', '#1E293B'),
        ('In-Memory Embedded Fallback Engine', '#DCFCE7', '#166534'),
    ]
    y = 185
    for title, bg, fg in db_boxes:
        draw.rounded_rectangle([(1140, y), (1520, y+68)], radius=8, fill=bg, outline='#D8B4FE', width=1)
        draw.text((1330, y+34), title, fill=fg, font=font_body, anchor='mm')
        y += 85

    # Arrows
    # Client <-> Server
    draw.line([(480, 510), (540, 510)], fill='#2563EB', width=4)
    draw.polygon([(535, 502), (545, 510), (535, 518)], fill='#2563EB')
    draw.polygon([(485, 502), (475, 510), (485, 518)], fill='#2563EB')
    draw.text((510, 485), 'HTTPS / JSON', fill='#1E40AF', font=font_small, anchor='mm')
    draw.text((510, 535), 'JWT Bearer', fill='#1E40AF', font=font_small, anchor='mm')

    # Server <-> DB
    draw.line([(1060, 510), (1120, 510)], fill='#059669', width=4)
    draw.polygon([(1115, 502), (1125, 510), (1115, 518)], fill='#059669')
    draw.polygon([(1065, 502), (1055, 510), (1065, 518)], fill='#059669')
    draw.text((1090, 485), 'TCP / Wire', fill='#065F46', font=font_small, anchor='mm')
    draw.text((1090, 535), 'Mongoose', fill='#065F46', font=font_small, anchor='mm')

    img.save(r'docs\diagrams\system_architecture.png', quality=95)
    print('Generated docs/diagrams/system_architecture.png')

def make_class_diagram():
    w, h = 1600, 960
    img = Image.new('RGB', (w, h), color='#F8FAFC')
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([(0, 0), (w, 80)], fill='#0F172A')
    draw.text((w//2, 40), 'SECUREVAULT - CORE DOMAIN CLASS DIAGRAM', fill='#F8FAFC', font=font_title, anchor='mm')
    
    # User Class (80, 110, 540, 500)
    draw.rounded_rectangle([(80, 110), (540, 500)], radius=8, fill='#FFFFFF', outline='#2563EB', width=2)
    draw.rectangle([(80, 110), (540, 160)], fill='#2563EB')
    draw.text((310, 135), '<<Mongoose Model>> User', fill='#FFFFFF', font=font_heading, anchor='mm')
    user_attrs = [
        '- _id: ObjectId',
        '- name: String',
        '- email: String [unique, indexed]',
        '- masterPasswordHash: String (bcrypt 12-rounds)',
        '- role: Enum [admin, employee]',
        '- isActive: Boolean = true',
        '- createdAt: Date',
        '- updatedAt: Date'
    ]
    user_methods = [
        '+ comparePassword(candidatePassword): Promise<Boolean>',
        '+ generateAuthToken(): String (JWT)',
        '+ toJSON(): Object (sanitises masterPasswordHash)'
    ]
    y = 175
    for a in user_attrs:
        draw.text((100, y), a, fill='#1E293B', font=font_body, anchor='lm')
        y += 24
    draw.line([(80, y+5), (540, y+5)], fill='#CBD5E1', width=1)
    y += 20
    for m in user_methods:
        draw.text((100, y), m, fill='#0F766E', font=font_body, anchor='lm')
        y += 24

    # Credential Class (620, 110, 1100, 510)
    draw.rounded_rectangle([(620, 110), (1100, 510)], radius=8, fill='#FFFFFF', outline='#DC2626', width=2)
    draw.rectangle([(620, 110), (1100, 160)], fill='#DC2626')
    draw.text((860, 135), '<<Mongoose Model>> Credential', fill='#FFFFFF', font=font_heading, anchor='mm')
    cred_attrs = [
        '- _id: ObjectId',
        '- owner: ObjectId -> User [ref, indexed]',
        '- title: String',
        '- username: String',
        '- encryptedPassword: String (AES-256-GCM ciphertext hex)',
        '- iv: String (16 bytes hex, unique per record)',
        '- authTag: String (16 bytes hex, AEAD verification)',
        '- url: String',
        '- notes: String',
        '- tags: [String]',
        '- strengthScore: Number (0..4 zxcvbn entropy)',
        '- createdAt: Date',
        '- updatedAt: Date'
    ]
    y = 175
    for a in cred_attrs:
        draw.text((640, y), a, fill='#1E293B', font=font_body, anchor='lm')
        y += 25

    # SharedAccess Class (80, 570, 540, 920)
    draw.rounded_rectangle([(80, 570), (540, 920)], radius=8, fill='#FFFFFF', outline='#059669', width=2)
    draw.rectangle([(80, 570), (540, 620)], fill='#059669')
    draw.text((310, 595), '<<Mongoose Model>> SharedAccess', fill='#FFFFFF', font=font_heading, anchor='mm')
    share_attrs = [
        '- _id: ObjectId',
        '- credentialId: ObjectId -> Credential [ref]',
        '- ownerId: ObjectId -> User [ref]',
        '- sharedWithUserId: ObjectId -> User [ref]',
        '- permission: Enum [view, edit]',
        '- createdAt: Date',
        '------------------------------------------------',
        'Indexes: Compound (credentialId, sharedWithUserId)',
        'Cascade: Auto-revoked upon owner/recipient deactivation',
        'Security: View-only users cannot re-share or delete'
    ]
    y = 635
    for a in share_attrs:
        draw.text((100, y), a, fill='#1E293B', font=font_body, anchor='lm')
        y += 28

    # AuditLog Class (620, 570, 1100, 920)
    draw.rounded_rectangle([(620, 570), (1100, 920)], radius=8, fill='#FFFFFF', outline='#7C3AED', width=2)
    draw.rectangle([(620, 570), (1100, 620)], fill='#7C3AED')
    draw.text((860, 595), '<<Mongoose Model>> AuditLog', fill='#FFFFFF', font=font_heading, anchor='mm')
    audit_attrs = [
        '- _id: ObjectId',
        '- userId: ObjectId -> User [ref, indexed]',
        '- action: Enum [LOGIN, LOGOUT, CREATE, VIEW,',
        '               EDIT, SHARE, REVOKE, DELETE]',
        '- targetType: Enum [credential, user, session]',
        '- targetId: ObjectId',
        '- ipAddress: String (client IP capture)',
        '- userAgent: String (client browser / OS)',
        '- details: Object (metadata, changed fields)',
        '- timestamp: Date [indexed, immutable append-only]'
    ]
    y = 635
    for a in audit_attrs:
        draw.text((640, y), a, fill='#1E293B', font=font_body, anchor='lm')
        y += 27

    # CryptoEngine Box (1180, 220, 1540, 750)
    draw.rounded_rectangle([(1180, 220), (1540, 750)], radius=8, fill='#EFF6FF', outline='#2563EB', width=2)
    draw.rectangle([(1180, 220), (1540, 270)], fill='#1E40AF')
    draw.text((1360, 245), '<<Utility Engine>> CryptoEngine', fill='#FFFFFF', font=font_heading, anchor='mm')
    crypto_methods = [
        '- ALGORITHM: aes-256-gcm',
        '- KEY: Buffer (32 bytes from ENCRYPTION_KEY)',
        '- IV_LENGTH: 16 bytes random per credential',
        '- AUTH_TAG_LENGTH: 16 bytes',
        '--------------------------------------------',
        '+ encrypt(plaintext): {',
        '    encrypted: String (hex),',
        '    iv: String (hex),',
        '    authTag: String (hex)',
        '  }',
        '--------------------------------------------',
        '+ decrypt(encrypted, iv, authTag):',
        '    plaintext: String',
        '--------------------------------------------',
        '+ generatePassword(options): String',
        '+ hashMaster(password): String (bcrypt 12)',
        '+ verifyMaster(pwd, hash): Boolean'
    ]
    y = 285
    for cm in crypto_methods:
        draw.text((1200, y), cm, fill='#1E3A8A', font=font_body, anchor='lm')
        y += 27

    # Connector Lines
    # User 1 -- * Credential
    draw.line([(540, 250), (620, 250)], fill='#1E293B', width=2)
    draw.text((550, 235), '1', fill='#1E293B', font=font_small)
    draw.text((605, 235), '0..*', fill='#1E293B', font=font_small)
    draw.text((580, 265), 'owns', fill='#475569', font=font_small, anchor='mm')

    # Credential 1 -- * SharedAccess
    draw.line([(700, 510), (700, 540), (450, 540), (450, 570)], fill='#1E293B', width=2)
    draw.text((710, 520), '1', fill='#1E293B', font=font_small)
    draw.text((430, 555), '0..*', fill='#1E293B', font=font_small)
    draw.text((575, 530), 'shared via', fill='#475569', font=font_small, anchor='mm')

    # User 1 -- * AuditLog
    draw.line([(350, 500), (350, 540), (750, 540), (750, 570)], fill='#1E293B', width=2)
    draw.text((360, 510), '1', fill='#1E293B', font=font_small)
    draw.text((760, 555), '0..*', fill='#1E293B', font=font_small)
    draw.text((550, 550), 'generates', fill='#475569', font=font_small, anchor='mm')

    # Credential uses CryptoEngine
    draw.line([(1100, 310), (1180, 310)], fill='#2563EB', width=2)
    draw.polygon([(1175, 305), (1185, 310), (1175, 315)], fill='#2563EB')
    draw.text((1140, 295), '<<uses>>', fill='#2563EB', font=font_small, anchor='mm')

    img.save(r'docs\diagrams\class_diagram.png', quality=95)
    print('Generated docs/diagrams/class_diagram.png')

def make_sequence_diagram():
    w, h = 1600, 960
    img = Image.new('RGB', (w, h), color='#F8FAFC')
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([(0, 0), (w, 80)], fill='#0F172A')
    draw.text((w//2, 40), 'SECUREVAULT - CREDENTIAL REVEAL SEQUENCE FLOW', fill='#F8FAFC', font=font_title, anchor='mm')
    
    actors = [
        ('User / Browser', 140, '#2563EB'),
        ('React Client\n(CredentialsPage)', 420, '#0284C7'),
        ('Auth & RBAC\nMiddleware', 710, '#0D9488'),
        ('Credential\nController', 990, '#D97706'),
        ('Crypto Engine\n(AES-256-GCM)', 1250, '#DC2626'),
        ('MongoDB Database\n(Credentials & Logs)', 1500, '#7C3AED')
    ]
    
    for title, x, color in actors:
        draw.rounded_rectangle([(x-85, 110), (x+85, 160)], radius=6, fill=color)
        lines = title.split('\n')
        if len(lines) == 1:
            draw.text((x, 135), lines[0], fill='#FFFFFF', font=font_body, anchor='mm')
        else:
            draw.text((x, 125), lines[0], fill='#FFFFFF', font=font_body, anchor='mm')
            draw.text((x, 145), lines[1], fill='#FFFFFF', font=font_body, anchor='mm')
        # Lifeline
        draw.line([(x, 160), (x, 900)], fill='#CBD5E1', width=2)
        # Bottom box
        draw.rounded_rectangle([(x-65, 905), (x+65, 935)], radius=4, fill='#94A3B8')
        draw.text((x, 920), lines[0][:14], fill='#FFFFFF', font=font_small, anchor='mm')

    steps = [
        (140, 420, 200, '1. Clicks "Reveal Password" icon button', True, '#1E293B'),
        (420, 710, 255, '2. GET /api/credentials/:id/reveal [Bearer JWT]', True, '#0284C7'),
        (710, 710, 310, '3. Verify token signature, expiration & active user', False, '#0D9488'),
        (710, 990, 365, '4. Next(): Attaches req.user (userId, role)', True, '#0D9488'),
        (990, 1500, 420, '5. Query Credential by ID & check ownership/SharedAccess', True, '#D97706'),
        (1500, 990, 475, '6. Returns record with {encryptedPassword, iv, authTag}', True, '#7C3AED'),
        (990, 1250, 530, '7. crypto.decrypt(encryptedPassword, iv, authTag)', True, '#D97706'),
        (1250, 1250, 585, '8. Check 16-byte Auth Tag for tampering / bit-flip attacks', False, '#DC2626'),
        (1250, 990, 640, '9. Returns verified plaintext credential string', True, '#DC2626'),
        (990, 1500, 695, '10. logAction("VIEW", userId, ipAddress, docId)', True, '#059669'),
        (990, 420, 750, '11. HTTP 200 OK: { password: "PlaintextSecret" }', True, '#059669'),
        (420, 140, 810, '12. Unmasks password in UI & enables 1-click clipboard copy', True, '#2563EB'),
    ]

    for x1, x2, y, label, is_call, col in steps:
        if x1 == x2: # Self invocation
            draw.rectangle([(x1-8, y-8), (x1+8, y+35)], fill='#E2E8F0', outline=col, width=2)
            draw.line([(x1+8, y), (x1+40, y), (x1+40, y+25), (x1+8, y+25)], fill=col, width=2)
            draw.polygon([(x1+8, y+25), (x1+18, y+20), (x1+18, y+30)], fill=col)
            draw.text((x1+48, y+12), label, fill=col, font=font_body, anchor='lm')
        else:
            draw.rectangle([(x1-4, y-4), (x1+4, y+4)], fill=col)
            draw.rectangle([(x2-4, y-4), (x2+4, y+4)], fill=col)
            draw.line([(x1, y), (x2, y)], fill=col, width=2)
            if x2 > x1:
                draw.polygon([(x2, y), (x2-12, y-6), (x2-12, y+6)], fill=col)
            else:
                draw.polygon([(x2, y), (x2+12, y-6), (x2+12, y+6)], fill=col)
            draw.text(((x1+x2)//2, y-14), label, fill=col, font=font_body, anchor='mm')

    img.save(r'docs\diagrams\sequence_diagram.png', quality=95)
    print('Generated docs/diagrams/sequence_diagram.png')

make_arch_diagram()
make_class_diagram()
make_sequence_diagram()
