const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit initialization vector

/**
 * Derives a strict 32-byte (256-bit) buffer key from the environment variable.
 * Enforces AES-256 key constraints while gracefully handling hex or raw strings.
 */
const getEncryptionKey = () => {
  const envKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  // If 64 hex characters (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // If already 32 bytes raw string
  if (Buffer.byteLength(envKey, 'utf8') === 32) {
    return Buffer.from(envKey, 'utf8');
  }

  // Derive fixed 32-byte key via SHA-256 if arbitrary length string was provided
  return crypto.createHash('sha256').update(envKey).digest();
};

/**
 * Encrypts a plaintext password using AES-256-GCM.
 * Generates a fresh cryptographically random 16-byte IV for every encryption.
 * Computes an authentication tag to detect any tampering with ciphertext.
 *
 * @param {string} plaintext - Plaintext password to encrypt
 * @returns {{ encryptedPassword: string, iv: string, authTag: string }} Hex-encoded strings
 */
const encryptPassword = (plaintext) => {
  if (plaintext === undefined || plaintext === null) {
    throw new Error('Cannot encrypt undefined or null password');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedPassword: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Decrypts AES-256-GCM ciphertext using the stored IV and auth tag.
 * Validates integrity: throws an error if ciphertext or tag was tampered with.
 *
 * @param {string} encryptedHex - Hex string of encrypted ciphertext
 * @param {string} ivHex - Hex string of initialization vector
 * @param {string} authTagHex - Hex string of 16-byte authentication tag
 * @returns {string} Decrypted plaintext password
 */
const decryptPassword = (encryptedHex, ivHex, authTagHex) => {
  if (!encryptedHex || !ivHex || !authTagHex) {
    throw new Error('Missing encryption components (ciphertext, IV, or auth tag)');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedData = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: integrity check failed or invalid authentication tag');
  }
};

/**
 * Generates a cryptographically strong random password.
 *
 * @param {object} options
 * @param {number} options.length - Length of password (default: 16)
 * @param {boolean} options.uppercase - Include A-Z (default: true)
 * @param {boolean} options.lowercase - Include a-z (default: true)
 * @param {boolean} options.numbers - Include 0-9 (default: true)
 * @param {boolean} options.symbols - Include special characters (default: true)
 * @returns {string} Secure password
 */
const generateSecurePassword = (options = {}) => {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  let chars = '';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

  const randomBytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
};

module.exports = {
  encryptPassword,
  decryptPassword,
  generateSecurePassword
};
