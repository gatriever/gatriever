import type { SiteAnalyticsReport } from "@gatriever/ga-client";

/**
 * Format a GA4 analytics report as Telegram Markdown (V1) text.
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
    topPages.forEach((page, idx) => {
      lines.push(
        `${idx + 1}. \`${page.path}\` — ${page.views} переглядів (${page.users} юзерів)`
      );
    });
  }

  return lines.join("\n");
}
