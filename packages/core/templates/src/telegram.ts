import type { SiteAnalyticsReport, PageViewMetric } from "@gatriever/analytics";
import type { RouterConfig } from "@gatriever/schemas";

/**
 * Format a GA4 analytics report as Telegram Markdown text.
 */
export function formatTelegramReport(
  report: SiteAnalyticsReport,
  routers: RouterConfig[] = []
): string {
  const lines: string[] = [];

  lines.push(`📊 *Report for ${report.propertyName}*`);
  lines.push(`_Last ${report.days} days_\n`);

  lines.push(`👥 *Active Users:* ${report.overview.activeUsers.toLocaleString("en-US")}`);
  lines.push(`👀 *Page Views:* ${report.overview.pageViews.toLocaleString("en-US")}`);
  lines.push(`🔄 *Sessions:* ${report.overview.sessions.toLocaleString("en-US")}`);
  lines.push(`🎯 *Conversions:* ${report.overview.conversions.toLocaleString("en-US")}\n`);

  if (report.topPages.length > 0) {
    lines.push(`📄 *Top Pages:*`);
    report.topPages.forEach((page: PageViewMetric, i: number) => {
      lines.push(`${i + 1}. \`${page.path}\` — ${page.views.toLocaleString("en-US")} views (${page.users.toLocaleString("en-US")} users)`);
    });
    lines.push("");
  }

  if (routers.length > 0) {
    lines.push(`🌐 *Active DDNS Routers:*`);
    routers.forEach((r) => {
      const ipText = r.lastKnownIp ? `\`${r.lastKnownIp}\`` : "_pending_";
      lines.push(`• *${r.name}*: ${ipText}`);
    });
  }

  return lines.join("\n");
}

export function formatDdnsStatusMessage(routers: RouterConfig[]): string {
  if (routers.length === 0) {
    return "🌐 *DDNS Status:* No routers configured.";
  }

  const lines: string[] = ["🌐 *DDNS Routers Status:*", ""];
  for (const r of routers) {
    const ipText = r.lastKnownIp ? `\`${r.lastKnownIp}\`` : "⚠️ _unresolved_";
    const checked = r.lastCheckedAt
      ? new Date(r.lastCheckedAt).toLocaleTimeString("en-US")
      : "never";
    lines.push(`• *${r.name}* (\`${r.id}\`)`);
    lines.push(`  Host: \`${r.hostname}\``);
    lines.push(`  IP: ${ipText} _(checked: ${checked})_`);
    lines.push("");
  }

  return lines.join("\n");
}
