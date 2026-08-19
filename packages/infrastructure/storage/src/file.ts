import fs from "node:fs/promises";
import path from "node:path";
import type { IStorageAdapter, UserData } from "./types.js";

export class FileStorageAdapter implements IStorageAdapter {
  private filePath: string;

  constructor(filePath: string = "./data/storage.json") {
    this.filePath = path.resolve(filePath);
  }

  private async readData(): Promise<Record<string, UserData>> {
    try {
      const content = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async writeData(data: Record<string, UserData>): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }

  async getUser(userId: string): Promise<UserData | null> {
    const data = await this.readData();
    return data[userId] || null;
  }

  async saveUser(userId: string, user: UserData): Promise<void> {
    const data = await this.readData();
    data[userId] = user;
    await this.writeData(data);
  }

  async getUsersForSchedule(targetTime: string): Promise<UserData[]> {
    const data = await this.readData();
    return Object.values(data).filter(
      (u) => u.schedule?.enabled && u.schedule.time === targetTime
    );
  }

  async findUsersWithDueDdns(now: Date = new Date()): Promise<UserData[]> {
    const data = await this.readData();
    const nowIso = now.toISOString();
    return Object.values(data).filter(
      (u) => u.ddns?.enabled && u.ddns.nextRunAt && u.ddns.nextRunAt <= nowIso
    );
  }

  async deleteUser(userId: string): Promise<void> {
    const data = await this.readData();
    delete data[userId];
    await this.writeData(data);
  }
}
