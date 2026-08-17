export interface SiteConfig {
  name: string;
  propertyId: string;
}

export interface UserSchedule {
  enabled: boolean;
  time: string; // HH:MM in UTC or local user timezone
}

export interface UserData {
  userId: string;
  sites: SiteConfig[];
  gaCredentialsEncrypted?: string;
  schedule: UserSchedule;
}

export interface IStorageAdapter {
  getUser(userId: string): Promise<UserData | null>;
  saveUser(userId: string, data: UserData): Promise<void>;
  getUsersForSchedule(targetTime: string): Promise<UserData[]>;
  deleteUser(userId: string): Promise<void>;
}
