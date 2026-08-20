import type { IStorageAdapter } from "./types.js";
import type { UserData } from "@gatriever/schemas";

export class MemoryStorageAdapter implements IStorageAdapter {
  private users: Map<string, UserData> = new Map();

  async getUser(userId: string): Promise<UserData | null> {
    const user = this.users.get(userId);
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  async saveUser(userId: string, data: UserData): Promise<void> {
    this.users.set(userId, JSON.parse(JSON.stringify(data)));
  }

  async getUsersForSchedule(targetTime: string): Promise<UserData[]> {
    const result: UserData[] = [];
    for (const user of this.users.values()) {
      if (user.schedule?.enabled && user.schedule.time === targetTime) {
        result.push(JSON.parse(JSON.stringify(user)));
      }
    }
    return result;
  }

  async findUsersWithDueDdns(now: Date = new Date()): Promise<UserData[]> {
    const result: UserData[] = [];
    const nowIso = now.toISOString();

    for (const user of this.users.values()) {
      if (user.ddns?.enabled && user.ddns.nextRunAt && user.ddns.nextRunAt <= nowIso) {
        result.push(JSON.parse(JSON.stringify(user)));
      }
    }
    return result;
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }
}
