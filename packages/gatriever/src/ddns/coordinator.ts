import { DdnsResolverService } from "./resolver.js";
import { IpDiffEngine, type IpDiffResult } from "./diff.js";
import { GA4AdminClient } from "@gatriever/analytics";
import type { UserData, RouterConfig } from "@gatriever/schemas";
import type { IStorageAdapter } from "@gatriever/storage";
import { decryptCredentials } from "@gatriever/crypto";

export interface SyncUserResult {
  userId: string;
  changedRouters: IpDiffResult[];
  gaUpdates: number;
}

export class DdnsSyncCoordinator {
  private resolver: DdnsResolverService;
  private diffEngine: IpDiffEngine;
  private storage: IStorageAdapter;
  private secretKey: string;

  constructor(storage: IStorageAdapter, secretKey: string) {
    this.resolver = new DdnsResolverService();
    this.diffEngine = new IpDiffEngine();
    this.storage = storage;
    this.secretKey = secretKey;
  }

  async syncUser(user: UserData): Promise<SyncUserResult> {
    const routers = user.ddns?.routers || [];
    if (routers.length === 0) {
      return { userId: user.userId, changedRouters: [], gaUpdates: 0 };
    }

    const resolvedIps = await this.resolver.resolveAll(routers);
    const changedRouters = this.diffEngine.filterChanged(routers, resolvedIps);

    let gaUpdates = 0;

    // If any IP changed and user has credentials, sync to GA4
    if (changedRouters.length > 0 && user.gaCredentialsEncrypted) {
      try {
        const credentialsJson = decryptCredentials(
          user.gaCredentialsEncrypted,
          this.secretKey
        );
        const adminClient = new GA4AdminClient(credentialsJson);

        for (const diff of changedRouters) {
          if (!diff.newIp) continue;

          for (const site of user.sites) {
            const res = await adminClient.syncInternalTrafficFilter(
              site.propertyId,
              diff.router.id,
              diff.router.name,
              diff.newIp
            );
            if (res.action !== "skipped") {
              gaUpdates++;
            }
          }
        }
      } catch {
        // Continue saving updated router IPs even if GA4 admin sync throws
      }
    }

    // Update router state in user model
    const nowIso = new Date().toISOString();
    const updatedRouters: RouterConfig[] = routers.map((r: RouterConfig) => {
      const resolved = resolvedIps.get(r.id);
      return {
        ...r,
        lastKnownIp: resolved || r.lastKnownIp,
        lastCheckedAt: nowIso,
      };
    });

    const nextRun = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const updatedUser: UserData = {
      ...user,
      ddns: {
        enabled: user.ddns?.enabled ?? true,
        cronExpression: user.ddns?.cronExpression ?? "*/15 * * * *",
        nextRunAt: nextRun,
        routers: updatedRouters,
      },
    };

    await this.storage.saveUser(user.userId, updatedUser);

    return {
      userId: user.userId,
      changedRouters,
      gaUpdates,
    };
  }

  async syncAllDueUsers(now: Date = new Date()): Promise<SyncUserResult[]> {
    const dueUsers = await this.storage.findUsersWithDueDdns(now);
    const results: SyncUserResult[] = [];

    for (const user of dueUsers) {
      const res = await this.syncUser(user);
      results.push(res);
    }

    return results;
  }
}
