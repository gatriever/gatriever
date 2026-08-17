import type { IStorageAdapter, UserData } from "../types.js";

export class MemoryStorageAdapter implements IStorageAdapter {
  private users: Map<string, UserData> = new Map();

  async getUser(userId: string): Promise<UserData | null> {
    return this.users.get(userId) || null;
  }

  async saveUser(userId: string, data: UserData): Promise<void> {
    this.users.set(userId, data);
  }

  async getUsersForSchedule(targetTime: string): Promise<UserData[]> {
    const matched: UserData[] = [];
    for (const user of this.users.values()) {
      if (user.schedule.enabled && user.schedule.time === targetTime) {
        matched.push(user);
      }
    }
    return matched;
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }
}
