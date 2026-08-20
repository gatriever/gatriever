import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  RouterIdSchema,
  RouterConfigSchema,
  DdnsConfigSchema,
  UserDataSchema,
  validateRouterId,
  GatrieverConfigSchema,
} from "../src/index.js";

describe("@gatriever/core: Valibot Schemas", () => {
  describe("RouterIdSchema", () => {
    it("should accept valid slug router IDs", () => {
      expect(v.safeParse(RouterIdSchema, "home-tenet").success).toBe(true);
      expect(v.safeParse(RouterIdSchema, "office_kyivstar_1").success).toBe(true);
      expect(v.safeParse(RouterIdSchema, "vpn").success).toBe(true);
      expect(validateRouterId("home-tenet")).toBe(true);
    });

    it("should reject invalid router IDs", () => {
      expect(v.safeParse(RouterIdSchema, "Home Tenet").success).toBe(false);
      expect(v.safeParse(RouterIdSchema, "home/router").success).toBe(false);
      expect(v.safeParse(RouterIdSchema, "").success).toBe(false);
      expect(validateRouterId("Home Tenet")).toBe(false);
    });
  });

  describe("RouterConfigSchema", () => {
    it("should parse valid router config", () => {
      const result = v.safeParse(RouterConfigSchema, {
        id: "home-tenet",
        name: "Home Router (Tenet)",
        hostname: "home.example.com",
        lastKnownIp: "188.115.42.10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.id).toBe("home-tenet");
        expect(result.output.hostname).toBe("home.example.com");
      }
    });

    it("should fail on invalid hostname or IP", () => {
      const result = v.safeParse(RouterConfigSchema, {
        id: "home",
        name: "Home",
        hostname: "",
        lastKnownIp: "invalid-ip",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("DdnsConfigSchema", () => {
    it("should parse valid ddns config with multiple routers", () => {
      const result = v.safeParse(DdnsConfigSchema, {
        enabled: true,
        cronExpression: "*/15 * * * *",
        routers: [
          { id: "home", name: "Home", hostname: "home.example.com" },
          { id: "office", name: "Office", hostname: "office.example.com" },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.routers?.length).toBe(2);
      }
    });
  });

  describe("UserDataSchema", () => {
    it("should validate full user data structure", () => {
      const result = v.safeParse(UserDataSchema, {
        userId: "123456789",
        sites: [{ name: "Podhound", propertyId: "548543981" }],
        schedule: { enabled: true, time: "09:00" },
        ddns: {
          enabled: true,
          cronExpression: "*/15 * * * *",
          routers: [{ id: "home", name: "Home", hostname: "home.example.com" }],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("GatrieverConfigSchema", () => {
    it("should validate default configuration", () => {
      const config = v.parse(GatrieverConfigSchema, {});
      expect(config.target).toBe("firebase");
      expect(config.storage).toBe("stateless");
      expect(config.features?.bot).toBe(true);
    });
  });
});
