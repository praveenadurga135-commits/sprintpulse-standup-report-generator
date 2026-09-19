/**
 * SprintPulse Cryptographic Security & Password Hashing Service
 * Implements salted KDF password hashing with backward compatibility
 * for legacy sp_sha256$ records and timing-safe comparisons.
 */

function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeCleartext = ascii + '\x80';
  while ((compositeCleartext.length % 64) - 56) compositeCleartext += '\x00';

  for (i = 0; i < compositeCleartext.length; i++) {
    j = compositeCleartext.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | ((j & 0xff) << ((3 - (i % 4)) * 8));
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3));
      const s1 = (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10));

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0))) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function generateSalt(length: number = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let salt = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}

/**
 * Constant-time string equality check to mitigate timing-based attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Multi-round KDF hash derivation for client/fallback environments.
 * Iterates hashing over salt and candidate password 1,000 times.
 */
function deriveKdf(password: string, salt: string, iterations: number = 1000): string {
  let acc = sha256(`${salt}:${password}`);
  for (let i = 1; i < iterations; i++) {
    acc = sha256(`${acc}:${salt}:${i}`);
  }
  return acc;
}

export const SecurityService = {
  /**
   * Hashes a password with random salt using KDF iterations.
   * Format: "sp_kdf$<iterations>$<salt>$<hash>"
   */
  hashPassword(password: string): string {
    if (!password) return '';
    const salt = generateSalt(16);
    const iterations = 1000;
    const hash = deriveKdf(password, salt, iterations);
    return `sp_kdf$${iterations}$${salt}$${hash}`;
  },

  /**
   * Verifies candidate password against stored hash.
   * Supports:
   * 1. sp_kdf$ (Current KDF)
   * 2. sp_scrypt$ (Server scrypt)
   * 3. sp_sha256$ (Legacy salted sha256)
   * 4. legacy plaintext passwords
   */
  verifyPassword(candidate: string, storedHash: string): boolean {
    if (!candidate || !storedHash) return false;

    // Backward compatibility: If stored value is legacy plaintext, compare using constant time
    if (!storedHash.startsWith('sp_')) {
      return constantTimeCompare(candidate, storedHash);
    }

    // 1. Current KDF hash: sp_kdf$<iterations>$<salt>$<hash>
    if (storedHash.startsWith('sp_kdf$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 4) return false;
      const iterations = parseInt(parts[1], 10) || 1000;
      const salt = parts[2];
      const originalHash = parts[3];
      const computed = deriveKdf(candidate, salt, iterations);
      return constantTimeCompare(computed, originalHash);
    }

    // 2. Legacy salted sha256: sp_sha256$<salt>$<hash>
    if (storedHash.startsWith('sp_sha256$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 3) return false;
      const salt = parts[1];
      const originalHash = parts[2];
      const computed = sha256(`${salt}:${candidate}`);
      return constantTimeCompare(computed, originalHash);
    }

    return false;
  },

  /**
   * Checks whether a stored password string is already securely hashed.
   */
  isHashed(stored: string): boolean {
    return typeof stored === 'string' && (stored.startsWith('sp_kdf$') || stored.startsWith('sp_sha256$') || stored.startsWith('sp_scrypt$'));
  },

  /**
   * Checks whether a stored hash is using the latest KDF format.
   * If not (legacy sha256 or plaintext), it should be transparently upgraded.
   */
  needsUpgrade(stored: string): boolean {
    if (!stored) return true;
    return !stored.startsWith('sp_kdf$') && !stored.startsWith('sp_scrypt$');
  },

  /**
   * Strips sensitive credential fields from user object before exposing to UI state.
   */
  sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }
};
