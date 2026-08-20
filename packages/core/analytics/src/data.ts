import { GoogleAuth, type GA4Credentials } from "./auth.js";

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

export { GA4Credentials };

interface RunReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}

export class GA4DataClient {
  private auth: GoogleAuth;
  private defaultPropertyId?: string;

  constructor(credentials: GA4Credentials, defaultPropertyId?: string) {
    this.auth = new GoogleAuth(credentials);
    this.defaultPropertyId = defaultPropertyId;
  }

  private resolvePropertyId(propertyId?: string): string {
    const id = propertyId || this.defaultPropertyId;
    if (!id) {
      throw new Error("No GA4 propertyId provided or configured.");
    }
    return id.replace(/^properties\//, "");
  }

  private async request(propertyId: string, body: Record<string, unknown>): Promise<RunReportResponse> {
    const token = await this.auth.getAccessToken([
      "https://www.googleapis.com/auth/analytics.readonly",
    ]);

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GA4 Data API error (${response.status}): ${errorText}`);
    }

    return (await response.json()) as RunReportResponse;
  }

  async getOverview(days = 7, propertyId?: string): Promise<OverviewMetrics> {
    const propId = this.resolvePropertyId(propertyId);
    const response = await this.request(propId, {
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
    const propId = this.resolvePropertyId(propertyId);
    const response = await this.request(propId, {
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
