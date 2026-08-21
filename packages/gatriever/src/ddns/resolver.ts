import dns from "node:dns/promises";
import type { RouterConfig } from "@gatriever/schemas";

export class DdnsResolverService {
  /**
   * Resolves IPv4 address for a given hostname. Returns null if DNS lookup fails.
   */
  async resolveHostname(hostname: string): Promise<string | null> {
    try {
      const addresses = await dns.resolve4(hostname);
      return addresses && addresses.length > 0 ? addresses[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves IP addresses for multiple routers concurrently.
   */
  async resolveAll(routers: RouterConfig[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    const promises = routers.map(async (router) => {
      const ip = await this.resolveHostname(router.hostname);
      results.set(router.id, ip);
    });

    await Promise.allSettled(promises);
    return results;
  }
}
