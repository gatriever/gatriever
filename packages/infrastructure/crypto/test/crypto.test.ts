import { describe, it, expect } from "vitest";
import { encryptCredentials, decryptCredentials } from "@infra/crypto";

describe("@gatriever/crypto: AES-256-GCM", () => {
  const secret = "test-encryption-secret-32-chars-key!";
  const sampleJson = JSON.stringify({
    type: "service_account",
    project_id: "test-ga4-project",
    client_email: "test@test-ga4-project.iam.gserviceaccount.com",
  });

  it("should encrypt plaintext into base64 string", () => {
    const encrypted = encryptCredentials(sampleJson, secret);
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(sampleJson.length);
    expect(encrypted).not.toBe(sampleJson);
  });

  it("should decrypt ciphertext back to original plaintext", () => {
    const encrypted = encryptCredentials(sampleJson, secret);
    const decrypted = decryptCredentials(encrypted, secret);
    expect(decrypted).toBe(sampleJson);
  });

  it("should fail decryption with invalid secret key", () => {
    const encrypted = encryptCredentials(sampleJson, secret);
    expect(() => decryptCredentials(encrypted, "wrong-secret-key-123")).toThrow();
  });
});
