import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStorageAdapter } from "../src/index.js";
import type { UserData } from "@gatriever/schemas";

describe("@gatriever/storage: MemoryStorageAdapter", () => {
  let storage: MemoryStorageAdapter;

  const sampleUser: UserData = {
    userId: "user-123",
    sites: [{ name: "Test Site", propertyId: "987654" }],
    schedule: { enabled: true, time: "09:00" },
    ddns: {
      enabled: true,
      cronExpression: "*/15 * * * *",
      nextRunAt: new Date(Date.now() - 60000).toISOString(),
      routers: [
        { id: "home", name: "Home Router", hostname: "home.example.com", lastKnownIp: "1.2.3.4" },
      ],
    },
  };

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it("should save and retrieve user data", async () => {
    await storage.saveUser("user-123", sampleUser);
    const user = await storage.getUser("user-123");
    expect(user).toEqual(sampleUser);
  });

  it("should return null for non-existent user", async () => {
    const user = await storage.getUser("non-existent");
    expect(user).toBeNull();
  });

  it("should find users with due DDNS sync", async () => {
    await storage.saveUser("user-123", sampleUser);

    const futureUser: UserData = {
      userId: "user-456",
      sites: [],
      schedule: { enabled: false, time: "09:00" },
      ddns: {
        enabled: true,
        cronExpression: "*/15 * * * *",
        nextRunAt: new Date(Date.now() + 3600000).toISOString(),
        routers: [{ id: "office", name: "Office", hostname: "office.example.com" }],
      },
    };
    await storage.saveUser("user-456", futureUser);

    const dueUsers = await storage.findUsersWithDueDdns(new Date());
    expect(dueUsers.length).toBe(1);
    expect(dueUsers[0].userId).toBe("user-123");
  });

  it("should delete user", async () => {
    await storage.saveUser("user-123", sampleUser);
    await storage.deleteUser("user-123");
    const user = await storage.getUser("user-123");
    expect(user).toBeNull();
  });
});
