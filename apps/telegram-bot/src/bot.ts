import { Bot } from "grammy";
import type { IStorageAdapter } from "@gatriever/database";
import { decryptCredentials, encryptCredentials } from "@gatriever/database";
import { GA4Client } from "@gatriever/ga-client";
import { formatTelegramReport } from "@gatriever/templates/telegram";

export function createBot(
  token: string,
  storage: IStorageAdapter,
  secretKey: string
) {
  const bot = new Bot(token);

  // Command: /start
  bot.command("start", async (ctx) => {
    const userId = String(ctx.from?.id);
    let user = await storage.getUser(userId);

    if (!user) {
      user = {
        userId,
        sites: [],
        schedule: { enabled: false, time: "09:00" },
      };
      await storage.saveUser(userId, user);
    }

    const text = [
      "🐕 *gatriever* — Твій особистий GA4 Analytics Retriever!",
      "",
      "Приноситиме зведення Google Analytics прямо у Telegram.",
      "",
      "📌 *Доступні команди:*",
      "📊 `/stat` — Швидка статистика",
      "➕ `/add_site <property_id> <назва>` — Додати ресурс GA4",
      "📋 `/list_sites` — Перелік підключених сайтів",
      "🔑 Надішли JSON-файл ключа сервісного акаунту для автовидалення та шифрування",
      "🔔 `/schedule_on` / 🔕 `/schedule_off` — Сповіщення",
      "⏰ `/set_time <HH:MM>` — Час щоденного дайджесту",
    ].join("\n");

    await ctx.reply(text, { parse_mode: "Markdown" });
  });

  // Command: /list_sites
  bot.command("list_sites", async (ctx) => {
    const userId = String(ctx.from?.id);
    const user = await storage.getUser(userId);

    if (!user || user.sites.length === 0) {
      await ctx.reply(
        "📋 У тебе ще немає підключених сайтів.\nВикористай `/add_site <property_id> <назва>`.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const list = user.sites
      .map((s, i) => `${i + 1}. *${s.name}* (ID: \`${s.propertyId}\`)`)
      .join("\n");

    await ctx.reply(`📋 *Підключені сайти GA4:*\n\n${list}`, {
      parse_mode: "Markdown",
    });
  });

  // Command: /add_site <property_id> <name>
  bot.command("add_site", async (ctx) => {
    const userId = String(ctx.from?.id);
    const args = (ctx.match || "").trim().split(/\s+/);

    if (args.length < 2 || !args[0]) {
      await ctx.reply(
        "❌ Невірний формат.\nВикористання: `/add_site <property_id> <назва_сайту>`\nПриклад: `/add_site 548543981 Podhound`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const propertyId = args[0];
    const name = args.slice(1).join(" ");

    const user = (await storage.getUser(userId)) || {
      userId,
      sites: [],
      schedule: { enabled: false, time: "09:00" },
    };

    user.sites.push({ propertyId, name });
    await storage.saveUser(userId, user);

    await ctx.reply(
      `✅ Сайт *${name}* (Property ID: \`${propertyId}\`) успішно додано!`,
      { parse_mode: "Markdown" }
    );
  });

  // Command: /stat
  bot.command("stat", async (ctx) => {
    const userId = String(ctx.from?.id);
    const user = await storage.getUser(userId);

    if (!user || user.sites.length === 0) {
      await ctx.reply("❌ Немає підключених сайтів. Використай `/add_site`!");
      return;
    }

    if (!user.gaCredentialsEncrypted) {
      await ctx.reply(
        "🔑 Не налаштовано JSON-ключ сервісного акаунту.\nНадішли JSON файл ключа в чат."
      );
      return;
    }

    await ctx.reply("⏳ Завантажую дані з GA4...");

    try {
      const credentialsJson = decryptCredentials(
        user.gaCredentialsEncrypted,
        secretKey
      );

      for (const site of user.sites) {
        const gaClient = new GA4Client(credentialsJson, site.propertyId);
        const report = await gaClient.getFullReport(site.name, site.propertyId, 7, 5);
        const messageText = formatTelegramReport(report);

        await ctx.reply(messageText, { parse_mode: "Markdown" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.reply(`❌ Помилка під час отримання аналітики: ${message}`);
    }
  });

  // Auto-delete credentials JSON documents sent by user
  bot.on("message:document", async (ctx) => {
    const doc = ctx.message.document;
    if (doc.file_name?.endsWith(".json")) {
      const userId = String(ctx.from?.id);

      try {
        const file = await ctx.getFile();
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        const res = await fetch(fileUrl);
        const jsonText = await res.text();

        // Validate JSON
        JSON.parse(jsonText);

        const encrypted = encryptCredentials(jsonText, secretKey);
        const user = (await storage.getUser(userId)) || {
          userId,
          sites: [],
          schedule: { enabled: false, time: "09:00" },
        };

        user.gaCredentialsEncrypted = encrypted;
        await storage.saveUser(userId, user);

        // Delete message from chat for security!
        await ctx.deleteMessage();

        await ctx.reply(
          "🔒 *Креденшелі успішно отримано, зашифровано (AES-256) та видалено з історії чату!*",
          { parse_mode: "Markdown" }
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        await ctx.reply(`❌ Не вдалося обробити JSON-файл: ${message}`);
      }
    }
  });

  return bot;
}
