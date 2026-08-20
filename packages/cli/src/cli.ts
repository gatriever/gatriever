import { prepareDeployment } from "./assembler.js";
import { setTelegramWebhook } from "./webhook.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "help") {
    console.log(`
🐾 Gatriever CLI - Serverless & Multiplatform Bot Assembler

Usage:
  gatriever prepare            Assemble deployment directory according to package.json
  gatriever set-webhook        Register Webhook URL with Telegram API
  gatriever help               Show this help message

Options for set-webhook:
  --token <token>              Telegram Bot Token (or TELEGRAM_BOT_TOKEN env)
  --url <url>                  Target Webhook URL
  --secret <secret>            Optional Secret Token for header verification
`);
    process.exit(0);
  }

  if (command === "prepare") {
    console.log("📦 Preparing Gatriever deployment artifacts...");
    try {
      const result = await prepareDeployment(process.cwd());
      console.log(`✅ Assembled target [${result.target}] in '${result.outDir}'`);
      console.log(`   - Bundles: ${result.copiedBundles.join(", ")}`);
      console.log(`   - Generated: ${result.generatedFiles.join(", ")}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed to prepare deployment: ${msg}`);
      process.exit(1);
    }
    return;
  }

  if (command === "set-webhook") {
    let token = process.env.TELEGRAM_BOT_TOKEN;
    let url = "";
    let secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--token" && args[i + 1]) token = args[++i];
      if (args[i] === "--url" && args[i + 1]) url = args[++i];
      if (args[i] === "--secret" && args[i + 1]) secret = args[++i];
    }

    if (!token || !url) {
      console.error("❌ Both --token (or TELEGRAM_BOT_TOKEN) and --url are required.");
      process.exit(1);
    }

    console.log(`📡 Registering Telegram Webhook URL: ${url}`);
    try {
      const res = await setTelegramWebhook({ token, url, secretToken: secret });
      console.log(`✅ Webhook set successfully: ${res.description || "OK"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed to set webhook: ${msg}`);
      process.exit(1);
    }
    return;
  }

  console.error(`❌ Unknown command '${command}'. Use 'gatriever --help' for usage.`);
  process.exit(1);
}

main().catch((err) => {
  console.error("Fatal CLI error:", err);
  process.exit(1);
});
