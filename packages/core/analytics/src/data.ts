import { BetaAnalyticsDataClient } from "@google-analytics/data";

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

export type GA4Credentials = string | Record<string, unknown>;

export class GA4DataClient {
  private client: BetaAnalyticsDataClient;
  private defaultPropertyId?: string;

  constructor(credentials: GA4Credentials, defaultPropertyId?: string) {
    this.defaultPropertyId = defaultPropertyId;
    const parsedCredentials =
      typeof credentials === "string"
        ? (JSON.parse(credentials) as Record<string, unknown>)
        : credentials;

    this.client = new BetaAnalyticsDataClient({
      credentials: parsedCredentials,
    });
  }

  private resolvePropertyId(propertyId?: string): string {
    const id = propertyId || this.defaultPropertyId;
    if (!id) {
      throw new Error("No GA4 propertyId provided or configured.");
    }
    return id.startsWith("properties/") ? id : `properties/${id}`;
  }

  async getOverview(days = 7, propertyId?: string): Promise<OverviewMetrics> {
    const prop = this.resolvePropertyId(propertyId);
    const [response] = await this.client.runReport({
      property: prop,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "conversions" },
      ],
    });

    const metrics: OverviewMetrics = {
      activeUsers: 0,
      sessions: 0,
      pageViews: 0,
      conversions: 0,
    };

    if (response.rows && response.rows.length > 0) {
      const values = response.rows[0].metricValues || [];
      metrics.activeUsers = Number.parseInt(values[0]?.value || "0", 10);
      metrics.sessions = Number.parseInt(values[1]?.value || "0", 10);
      metrics.pageViews = Number.parseInt(values[2]?.value || "0", 10);
      metrics.conversions = Number.parseInt(values[3]?.value || "0", 10);
    }

    return metrics;
  }

  async getTopPages(
    days = 7,
    limit = 5,
    propertyId?: string
  ): Promise<PageViewMetric[]> {
    const prop = this.resolvePropertyId(propertyId);
    const [response] = await this.client.runReport({
      property: prop,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      limit,
    });

    const pages: PageViewMetric[] = [];
    if (response.rows) {
      for (const row of response.rows) {
        const path = row.dimensionValues?.[0]?.value || "/";
        const views = Number.parseInt(row.metricValues?.[0]?.value || "0", 10);
        const users = Number.parseInt(row.metricValues?.[1]?.value || "0", 10);
        pages.push({ path, views, users });
      }
    }

    return pages;
  }

  async getFullReport(
    propertyName: string,
    propertyId: string,
    days = 7,
    topPagesLimit = 5
  ): Promise<SiteAnalyticsReport> {
    const [overview, topPages] = await Promise.all([
      this.getOverview(days, propertyId),
      this.getTopPages(days, topPagesLimit, propertyId),
    ]);

    return {
      propertyName,
      propertyId,
      days,
      overview,
      topPages,
    };
  }
}
