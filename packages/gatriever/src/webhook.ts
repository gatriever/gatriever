/**
 * Native Telegram Webhook helper using built-in fetch.
 * Zero external dependencies.
 */
export interface SetWebhookOptions {
  token: string;
  url: string;
  secretToken?: string;
  dropPendingUpdates?: boolean;
}

export interface SetWebhookResponse {
  ok: boolean;
  result?: boolean;
  description?: string;
  error_code?: number;
}

export async function setTelegramWebhook(options: SetWebhookOptions): Promise<SetWebhookResponse> {
  const { token, url, secretToken, dropPendingUpdates = false } = options;

  if (!token) {
    throw new Error("Telegram bot token is required to set webhook");
  }
  if (!url) {
    throw new Error("Webhook URL is required");
  }

  const endpoint = `https://api.telegram.org/bot${token}/setWebhook`;
  const body: Record<string, unknown> = {
    url,
    drop_pending_updates: dropPendingUpdates,
  };

  if (secretToken) {
    body.secret_token = secretToken;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as SetWebhookResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram setWebhook failed (${data.error_code || response.status}): ${data.description || "Unknown error"}`
    );
  }

  return data;
}
