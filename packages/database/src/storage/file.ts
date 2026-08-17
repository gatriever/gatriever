import fs from "node:fs/promises";
import path from "node:path";
import type { IStorageAdapter, UserData } from "../types.js";

export class FileStorageAdapter implements IStorageAdapter {
  private filePath: string;

  constructor(filePath: string = "./data/users.json") {
    this.filePath = path.resolve(filePath);
  }

  private async readAll(): Promise<Record<string, UserData>> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async writeAll(data: Record<string, UserData>): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async getUser(userId: string): Promise<UserData | null> {
    const data = await this.readAll();
    return data[userId] || null;
  }

  async saveUser(userId: string, user: UserData): Promise<void> {
    const data = await this.readAll();
    data[userId] = user;
    await this.writeAll(data);
  }

  async getUsersForSchedule(targetTime: string): Promise<UserData[]> {
    const data = await this.readAll();
    return Object.values(data).filter(
      (u) => u.schedule?.enabled && u.schedule?.time === targetTime
    );
  }

  async deleteUser(userId: string): Promise<void> {
    const data = await this.readAll();
    delete data[userId];
    await this.writeAll(data);
  }
}
