import { Bot } from "grammy";
import type { IStorageAdapter } from "@gatriever/storage";
import { decryptCredentials, encryptCredentials } from "@gatriever/crypto";
import { GA4DataClient } from "@gatriever/analytics";
import {
  formatTelegramReport,
  formatDdnsStatusMessage,
} from "@gatriever/templates";
import { validateRouterId } from "@gatriever/schemas";

export function createBot(
  token: string,
  storage: IStorageAdapter,
  secretKey: string
) {
  const bot = new Bot(token);

  // Command: /start
  bot.command("start", async (ctx) => {
    const welcomeText = `
🐾 *Welcome to Gatriever Bot!*

I help you monitor GA4 analytics and manage dynamic IP filters for internal traffic.

*Available Commands:*
• /report - View today's traffic report for configured sites
• /sync - Force a manual DDNS check & sync with GA4
• /status - Check the status of monitored routers and last known IPs
• /add_router <id> <name> <hostname> - Register a dynamic IP router
• /remove_router <id> - Remove a registered router
• /set_credentials <json> - Securely save your GA4 Service Account JSON
• /schedule <HH:MM> - Enable daily morning analytics reports (or /schedule off)
`;
    await ctx.reply(welcomeText, { parse_mode: "Markdown" });
  });

  // Command: /report
  bot.command("report", async (ctx) => {
    const userId = String(ctx.from?.id);
    const user = await storage.getUser(userId);

    if (!user || user.sites.length === 0) {
      return ctx.reply("⚠️ No GA4 properties configured yet. Contact admin or setup sites.");
    }

    if (!user.gaCredentialsEncrypted) {
      return ctx.reply("⚠️ Service Account credentials not found. Use /set_credentials to upload.");
    }

    await ctx.reply("⏳ Fetching analytics reports...");

    try {
      const credentialsJson = decryptCredentials(
        user.gaCredentialsEncrypted,
        secretKey
      );
      const dataClient = new GA4DataClient(credentialsJson);

      for (const site of user.sites) {
        const report = await dataClient.getFullReport(
          site.name,
          site.propertyId,
          1
        );
        const text = formatTelegramReport(report, user.ddns?.routers || []);
        await ctx.reply(text, { parse_mode: "Markdown" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await ctx.reply(`❌ Failed to retrieve reports: ${message}`);
    }
  });

  // Command: /status
  bot.command("status", async (ctx) => {
    const userId = String(ctx.from?.id);
    const user = await storage.getUser(userId);

    const routers = user?.ddns?.routers || [];
    const text = formatDdnsStatusMessage(routers);
    await ctx.reply(text, { parse_mode: "Markdown" });
  });

  // Command: /add_router <id> <name> <hostname>
  bot.command("add_router", async (ctx) => {
    const userId = String(ctx.from?.id);
    const text = ctx.match?.trim();

    if (!text) {
      return ctx.reply(
        "Usage: `/add_router <slug-id> <Router Name> <hostname.ddns.net>`\nExample: `/add_router home Home Router myhome.tenet.ua`",
        { parse_mode: "Markdown" }
      );
    }

    const parts = text.split(" ");
    if (parts.length < 3) {
      return ctx.reply("⚠️ Please provide id, name, and hostname (3 arguments).");
    }

    const id = parts[0];
    const hostname = parts[parts.length - 1];
    const name = parts.slice(1, -1).join(" ");

    if (!validateRouterId(id)) {
      return ctx.reply("❌ Router ID must be lowercase alphanumeric and hyphens/underscores only.");
    }

    const user = (await storage.getUser(userId)) || {
      userId,
      sites: [],
      schedule: { enabled: false, time: "09:00" },
    };

    const routers = user.ddns?.routers || [];
    const existingIndex = routers.findIndex((r) => r.id === id);

    const newRouter = { id, name, hostname };

    if (existingIndex >= 0) {
      routers[existingIndex] = newRouter;
    } else {
      routers.push(newRouter);
    }

    user.ddns = {
      enabled: user.ddns?.enabled ?? true,
      cronExpression: user.ddns?.cronExpression ?? "*/15 * * * *",
      routers,
    };

    await storage.saveUser(userId, user);
    await ctx.reply(`✅ Router *${name}* (\`${id}\`) saved with host \`${hostname}\`!`, {
      parse_mode: "Markdown",
    });
  });

  // Command: /remove_router <id>
  bot.command("remove_router", async (ctx) => {
    const userId = String(ctx.from?.id);
    const id = ctx.match?.trim();

    if (!id) {
      return ctx.reply("Usage: `/remove_router <slug-id>`", { parse_mode: "Markdown" });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.ddns?.routers) {
      return ctx.reply("⚠️ No routers found.");
    }

    user.ddns.routers = user.ddns.routers.filter((r) => r.id !== id);
    await storage.saveUser(userId, user);

    await ctx.reply(`✅ Router \`${id}\` removed.`, { parse_mode: "Markdown" });
  });

  // Command: /set_credentials <json>
  bot.command("set_credentials", async (ctx) => {
    const userId = String(ctx.from?.id);
    const jsonStr = ctx.match?.trim();

    if (!jsonStr) {
      return ctx.reply("Usage: `/set_credentials <Service Account JSON content>`", {
        parse_mode: "Markdown",
      });
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.client_email || !parsed.private_key) {
        return ctx.reply("❌ Invalid service account JSON: missing client_email or private_key.");
      }

      const encrypted = encryptCredentials(jsonStr, secretKey);

      const user = (await storage.getUser(userId)) || {
        userId,
        sites: [],
        schedule: { enabled: false, time: "09:00" },
      };

      user.gaCredentialsEncrypted = encrypted;
      await storage.saveUser(userId, user);

      await ctx.reply("🔒 Service Account credentials securely encrypted and saved!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      await ctx.reply(`❌ Failed to parse credentials JSON: ${message}`);
    }
  });

  // Command: /schedule <HH:MM> or <off>
  bot.command("schedule", async (ctx) => {
    const userId = String(ctx.from?.id);
    const time = ctx.match?.trim();

    if (!time) {
      return ctx.reply("Usage: `/schedule 09:00` or `/schedule off`", { parse_mode: "Markdown" });
    }

    const user = (await storage.getUser(userId)) || {
      userId,
      sites: [],
      schedule: { enabled: false, time: "09:00" },
    };

    if (time.toLowerCase() === "off") {
      user.schedule.enabled = false;
      await storage.saveUser(userId, user);
      return ctx.reply("🔕 Daily reports disabled.");
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return ctx.reply("⚠️ Invalid time format. Use HH:MM in 24h format (e.g. `09:30`).");
    }

    user.schedule.enabled = true;
    user.schedule.time = time;
    await storage.saveUser(userId, user);

    await ctx.reply(`🔔 Daily reports scheduled for *${time}*!`, { parse_mode: "Markdown" });
  });

  return bot;
}
