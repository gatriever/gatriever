import type { SiteAnalyticsReport } from "@gatriever/analytics";

/**
 * Format report as clean JSON output.
 */
export function formatJsonReport(report: SiteAnalyticsReport): string {
  return JSON.stringify(
    {
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    },
    null,
    2
  );
}
