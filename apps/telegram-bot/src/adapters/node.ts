import { createTelegramBot, type TelegramBotOptions } from "../core.js";

export async function startNodeBot(options: TelegramBotOptions = {}) {
  const bot = createTelegramBot(options);
  console.log("🚀 Starting @gatriever/telegram-bot in Long Polling mode (Node/Docker)...");
  await bot.start();
}

if (process.env.NODE_ENV !== "test") {
  startNodeBot().catch((err) => {
    console.error("❌ Failed to start telegram-bot:", err);
    process.exit(1);
  });
}

export default startNodeBot;
