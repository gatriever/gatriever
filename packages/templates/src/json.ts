import type { SiteAnalyticsReport } from "@gatriever/ga-client";

export interface ApiResponseFormat {
  status: "success" | "error";
  data?: SiteAnalyticsReport;
  timestamp: string;
  error?: string;
}

/**
 * Format a GA4 analytics report into a standard REST API response format.
 */
export function formatJsonReport(report: SiteAnalyticsReport): ApiResponseFormat {
  return {
    status: "success",
    timestamp: new Date().toISOString(),
    data: report,
  };
}

/**
 * Format an error into a standard REST API response format.
 */
export function formatJsonError(error: string): ApiResponseFormat {
  return {
    status: "error",
    timestamp: new Date().toISOString(),
    error,
  };
}
