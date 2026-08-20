import crypto from "node:crypto";

export interface GoogleServiceAccountKey {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

export type GA4Credentials = string | GoogleServiceAccountKey | Record<string, unknown>;

export class GoogleAuth {
  private credentials: GoogleServiceAccountKey;
  private cachedToken?: {
    accessToken: string;
    expiresAt: number;
  };

  constructor(credentials: GA4Credentials) {
    if (typeof credentials === "string") {
      try {
        this.credentials = JSON.parse(credentials) as GoogleServiceAccountKey;
      } catch {
        throw new Error("Invalid JSON string passed as Google Service Account credentials");
      }
    } else {
      this.credentials = credentials as GoogleServiceAccountKey;
    }

    if (!this.credentials.client_email || !this.credentials.private_key) {
      throw new Error("Google Service Account credentials must contain 'client_email' and 'private_key'");
    }
  }

  /**
   * Generates a signed JWT and exchanges it for a Google OAuth2 access token.
   * Caches token until 5 minutes before expiry.
   */
  async getAccessToken(
    scopes = [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
    ]
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if valid for at least another 5 minutes (300s)
    if (this.cachedToken && this.cachedToken.expiresAt - now > 300) {
      return this.cachedToken.accessToken;
    }

    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    const payload = {
      iss: this.credentials.client_email,
      scope: Array.isArray(scopes) ? scopes.join(" ") : scopes,
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const base64UrlEncode = (obj: Record<string, unknown>): string =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");

    const unsignedJwt = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(unsignedJwt);
    const signature = signer.sign(this.credentials.private_key, "base64url");

    const jwt = `${unsignedJwt}.${signature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to obtain Google access token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };

    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: now + data.expires_in,
    };

    return data.access_token;
  }
}
