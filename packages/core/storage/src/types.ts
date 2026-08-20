import type { UserData } from "@gatriever/schemas";

export interface IStorageAdapter {
  getUser(userId: string): Promise<UserData | null>;
  saveUser(userId: string, data: UserData): Promise<void>;
  getUsersForSchedule(targetTime: string): Promise<UserData[]>;
  findUsersWithDueDdns(now?: Date): Promise<UserData[]>;
  deleteUser(userId: string): Promise<void>;
}
