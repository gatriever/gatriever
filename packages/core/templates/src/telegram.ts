import type { SiteAnalyticsReport, PageViewMetric } from "@gatriever/analytics";
import type { RouterConfig } from "@gatriever/schemas";

/**
 * Format a GA4 analytics report as Telegram Markdown text.
 */
export function formatTelegramReport(report: SiteAnalyticsReport): string {
  const { propertyName, propertyId, days, overview, topPages } = report;

  const lines = [
    `📊 *Звіт GA4: ${propertyName}*`,
    `🏷 ID: \`${propertyId}\` (останні ${days} днів)`,
    "",
    `👥 *Активні користувачі:* \`${overview.activeUsers}\``,
    `🔄 *Сесії:* \`${overview.sessions}\``,
    `👁 *Перегляди сторінок:* \`${overview.pageViews}\``,
    `🎯 *Конверсії:* \`${overview.conversions}\``,
    "",
    "🔝 *Топ сторінок:*",
  ];

  if (topPages.length === 0) {
    lines.push("_Немає даних за вибраний період_");
  } else {
    topPages.forEach((page: PageViewMetric, idx: number) => {
      lines.push(
        `${idx + 1}. \`${page.path}\` — ${page.views} переглядів (${page.users} юзерів)`
      );
    });
  }

  return lines.join("\n");
}

/**
 * Format DDNS IP change alert for Telegram.
 */
export function formatDdnsIpChangedAlert(
  router: RouterConfig,
  oldIp: string | undefined,
  newIp: string,
  gaUpdatedSitesCount: number
): string {
  return [
    `🌐 *Зміна IP-адреси мережі!*`,
    `🖥 Роутер: *${router.name}* (\`${router.id}\`)`,
    `📡 Хост: \`${router.hostname}\``,
    "",
    oldIp ? `🔴 Старий IP: \`${oldIp}\`` : `⚪️ Перше виявлення`,
    `🟢 Новий IP: \`${newIp}\``,
    "",
    gaUpdatedSitesCount > 0
      ? `✅ Фільтри внутрішнього трафіку оновлено для ${gaUpdatedSitesCount} сайтів у GA4.`
      : `ℹ️ GA4-фільтри не оновлювались (немає підключених ключів або сайтів).`,
  ].join("\n");
}

/**
 * Format DDNS status for Telegram.
 */
export function formatDdnsStatusMessage(routers: RouterConfig[]): string {
  if (routers.length === 0) {
    return "📋 *DDNS Моніторинг:* роутери ще не налаштовані.\nВикористайте `/set_ddns <hostname> <id> <назва>`";
  }

  const list = routers
    .map(
      (r: RouterConfig, i: number) =>
        `${i + 1}. *${r.name}* (\`${r.id}\`)\n   🌐 \`${r.hostname}\` ➔ IP: \`${r.lastKnownIp || "не визначено"}\``
    )
    .join("\n\n");

  return `📋 *Підключені DDNS-роутери:*\n\n${list}`;
}
