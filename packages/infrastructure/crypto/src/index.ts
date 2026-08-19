import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a string using AES-256-GCM.
 * Output format: base64(iv + authTag + encryptedData)
 */
export function encryptCredentials(plainText: string, secretKey: string): string {
  const key = deriveKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts a string encrypted with AES-256-GCM.
 */
export function decryptCredentials(cipherTextBase64: string, secretKey: string): string {
  const key = deriveKey(secretKey);
  const buffer = Buffer.from(cipherTextBase64, "base64");

  if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data buffer length");
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
