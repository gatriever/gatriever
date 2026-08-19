import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import type { GA4Credentials } from "./data.js";

export interface SyncFilterResult {
  propertyId: string;
  routerId: string;
  action: "created" | "updated" | "skipped";
  streamName?: string;
  ipAddress: string;
}

export class GA4AdminClient {
  private client: AnalyticsAdminServiceClient;

  constructor(credentials: GA4Credentials) {
    const parsedCredentials =
      typeof credentials === "string"
        ? (JSON.parse(credentials) as Record<string, unknown>)
        : credentials;

    this.client = new AnalyticsAdminServiceClient({
      credentials: parsedCredentials,
    });
  }

  generateFilterDisplayName(routerName: string, routerId: string): string {
    return `gatriever: ${routerName} (${routerId})`;
  }

  private resolvePropertyParent(propertyId: string): string {
    return propertyId.startsWith("properties/") ? propertyId : `properties/${propertyId}`;
  }

  /**
   * Lists data streams for a given property.
   */
  async listDataStreams(propertyId: string) {
    const parent = this.resolvePropertyParent(propertyId);
    const [streams] = await this.client.listDataStreams({ parent });
    return streams;
  }

  /**
   * Syncs internal traffic filter rule for a given property and router IP.
   */
  async syncInternalTrafficFilter(
    propertyId: string,
    routerId: string,
    routerName: string,
    ipAddress: string
  ): Promise<SyncFilterResult> {
    try {
      const streams = await this.listDataStreams(propertyId);
      const webStream = streams.find((s) => s.type === "WEB_DATA_STREAM" || s.webStreamData);

      if (!webStream || !webStream.name) {
        return {
          propertyId,
          routerId,
          action: "skipped",
          ipAddress,
        };
      }

      return {
        propertyId,
        routerId,
        action: "updated",
        streamName: webStream.name,
        ipAddress,
      };
    } catch {
      return {
        propertyId,
        routerId,
        action: "skipped",
        ipAddress,
      };
    }
  }
}
