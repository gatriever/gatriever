import { webhookCallback } from "grammy";
import { createTelegramBot, type TelegramBotOptions } from "../core.js";

export function createFirebaseBotHandler(options: TelegramBotOptions = {}) {
  const bot = createTelegramBot(options);
  // 'express' or 'http' callback compatible with Firebase Functions onRequest
  return webhookCallback(bot, "express");
}

export default createFirebaseBotHandler;
