import type { RouterConfig } from "@gatriever/schemas";

export interface IpDiffResult {
  router: RouterConfig;
  hasChanged: boolean;
  oldIp?: string;
  newIp?: string;
}

export class IpDiffEngine {
  /**
   * Compares the newly resolved IP with the router's last known IP.
   */
  detectChange(router: RouterConfig, resolvedIp: string | null): IpDiffResult {
    if (!resolvedIp) {
      return {
        router,
        hasChanged: false,
        oldIp: router.lastKnownIp,
      };
    }

    const hasChanged = router.lastKnownIp !== resolvedIp;
    return {
      router,
      hasChanged,
      oldIp: router.lastKnownIp,
      newIp: resolvedIp,
    };
  }

  /**
   * Filters and returns only routers whose IP has changed.
   */
  filterChanged(
    routers: RouterConfig[],
    resolvedIps: Map<string, string | null>
  ): IpDiffResult[] {
    const diffs: IpDiffResult[] = [];
    for (const router of routers) {
      const resolved = resolvedIps.get(router.id) ?? null;
      const diff = this.detectChange(router, resolved);
      if (diff.hasChanged) {
        diffs.push(diff);
      }
    }
    return diffs;
  }
}
