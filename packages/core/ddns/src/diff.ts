import type { RouterConfig } from "@gatriever/schemas";

export interface IpDiffResult {
  router: RouterConfig;
  oldIp?: string;
  newIp?: string;
  hasChanged: boolean;
}

export class IpDiffEngine {
  /**
   * Compare resolved IP with router's last known IP.
   */
  detectChange(router: RouterConfig, resolvedIp: string | null): IpDiffResult {
    if (!resolvedIp) {
      return {
        router,
        oldIp: router.lastKnownIp,
        hasChanged: false,
      };
    }

    const hasChanged = router.lastKnownIp !== resolvedIp;

    return {
      router,
      oldIp: router.lastKnownIp,
      newIp: resolvedIp,
      hasChanged,
    };
  }

  /**
   * Filter and return only the routers that have changed IPs.
   */
  filterChanged(
    routers: RouterConfig[],
    resolvedIps: Map<string, string | null>
  ): IpDiffResult[] {
    const diffs: IpDiffResult[] = [];

    for (const router of routers) {
      const resolvedIp = resolvedIps.get(router.id) ?? null;
      const diff = this.detectChange(router, resolvedIp);
      if (diff.hasChanged) {
        diffs.push(diff);
      }
    }

    return diffs;
  }
}
