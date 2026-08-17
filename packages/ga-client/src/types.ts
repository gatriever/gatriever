export interface OverviewMetrics {
  activeUsers: number;
  sessions: number;
  pageViews: number;
  conversions: number;
}

export interface PageViewMetric {
  path: string;
  views: number;
  users: number;
}

export interface SiteAnalyticsReport {
  propertyName: string;
  propertyId: string;
  days: number;
  overview: OverviewMetrics;
  topPages: PageViewMetric[];
}

export type GA4Credentials = Record<string, unknown> | string;
