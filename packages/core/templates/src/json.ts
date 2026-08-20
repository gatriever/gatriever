import type { SiteAnalyticsReport } from "@gatriever/analytics";

/**
 * Format report as clean JSON output.
 */
export function formatJsonReport(report: SiteAnalyticsReport): string {
  return JSON.stringify(report, null, 2);
}
