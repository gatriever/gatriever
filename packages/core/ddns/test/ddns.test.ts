import { describe, it, expect, vi } from "vitest";
import { DdnsResolverService, IpDiffEngine } from "@core/ddns";
import type { RouterConfig } from "@core/schemas";
import dns from "node:dns/promises";

describe("@gatriever/ddns: Resolver & Diff Engine", () => {
  describe("DdnsResolverService", () => {
    it("should resolve hostname to IPv4 address", async () => {
      vi.spyOn(dns, "resolve4").mockResolvedValueOnce(["188.115.42.10"]);

      const resolver = new DdnsResolverService();
      const ip = await resolver.resolveHostname("home.example.com");

      expect(ip).toBe("188.115.42.10");
      expect(dns.resolve4).toHaveBeenCalledWith("home.example.com");
    });

    it("should handle DNS lookup failures gracefully", async () => {
      vi.spyOn(dns, "resolve4").mockRejectedValueOnce(new Error("ENOTFOUND"));

      const resolver = new DdnsResolverService();
      const ip = await resolver.resolveHostname("non-existent-domain.xyz");

      expect(ip).toBeNull();
    });

    it("should resolve multiple routers concurrently", async () => {
      vi.spyOn(dns, "resolve4")
        .mockResolvedValueOnce(["1.1.1.1"])
        .mockResolvedValueOnce(["2.2.2.2"]);

      const resolver = new DdnsResolverService();
      const routers: RouterConfig[] = [
        { id: "r1", name: "R1", hostname: "r1.com" },
        { id: "r2", name: "R2", hostname: "r2.com" },
      ];

      const results = await resolver.resolveAll(routers);
      expect(results.get("r1")).toBe("1.1.1.1");
      expect(results.get("r2")).toBe("2.2.2.2");
    });
  });

  describe("IpDiffEngine", () => {
    const engine = new IpDiffEngine();

    it("should detect when IP has changed", () => {
      const router: RouterConfig = {
        id: "home",
        name: "Home",
        hostname: "home.com",
        lastKnownIp: "188.115.42.10",
      };

      const diff = engine.detectChange(router, "188.115.88.99");
      expect(diff.hasChanged).toBe(true);
      expect(diff.oldIp).toBe("188.115.42.10");
      expect(diff.newIp).toBe("188.115.88.99");
    });

    it("should detect unchanged IP and skip update", () => {
      const router: RouterConfig = {
        id: "home",
        name: "Home",
        hostname: "home.com",
        lastKnownIp: "188.115.42.10",
      };

      const diff = engine.detectChange(router, "188.115.42.10");
      expect(diff.hasChanged).toBe(false);
    });

    it("should detect initial IP discovery", () => {
      const router: RouterConfig = {
        id: "home",
        name: "Home",
        hostname: "home.com",
      };

      const diff = engine.detectChange(router, "188.115.42.10");
      expect(diff.hasChanged).toBe(true);
      expect(diff.oldIp).toBeUndefined();
      expect(diff.newIp).toBe("188.115.42.10");
    });
  });
});
