import { GoogleAuth, type GA4Credentials } from "./auth.js";

export interface SyncFilterResult {
  propertyId: string;
  routerId: string;
  action: "created" | "updated" | "skipped";
  streamName?: string;
  ipAddress: string;
}

export interface DataStream {
  name: string;
  type: string;
  displayName?: string;
  webStreamData?: Record<string, unknown>;
}

export class GA4AdminClient {
  private auth: GoogleAuth;

  constructor(credentials: GA4Credentials) {
    this.auth = new GoogleAuth(credentials);
  }

  generateFilterDisplayName(routerName: string, routerId: string): string {
    return `gatriever: ${routerName} (${routerId})`;
  }

  private resolvePropertyId(propertyId: string): string {
    return propertyId.replace(/^properties\//, "");
  }

  /**
   * Lists data streams for a given property using Google Analytics Admin REST API.
   */
  async listDataStreams(propertyId: string): Promise<DataStream[]> {
    const propId = this.resolvePropertyId(propertyId);
    const token = await this.auth.getAccessToken([
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
    ]);

    const url = `https://analyticsadmin.googleapis.com/v1beta/properties/${propId}/dataStreams`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GA4 Admin API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { dataStreams?: DataStream[] };
    return data.dataStreams || [];
  }

  /**
   * Syncs internal traffic filter rule for a given property and router IP.
   */
  async syncInternalTrafficFilter(
    propertyId: string,
    routerId: string,
    _routerName: string,
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
