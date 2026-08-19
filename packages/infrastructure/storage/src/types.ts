export interface SiteConfig {
  name: string;
  propertyId: string;
}

export interface RouterConfig {
  id: string;
  name: string;
  hostname: string;
  lastKnownIp?: string;
  lastCheckedAt?: string;
}

export interface DdnsConfig {
  enabled: boolean;
  cronExpression: string;
  nextRunAt?: string;
  routers: RouterConfig[];
}

export interface UserSchedule {
  enabled: boolean;
  time: string;
}

export interface UserData {
  userId: string;
  sites: SiteConfig[];
  gaCredentialsEncrypted?: string;
  schedule: UserSchedule;
  ddns?: DdnsConfig;
}

export interface IStorageAdapter {
  getUser(userId: string): Promise<UserData | null>;
  saveUser(userId: string, data: UserData): Promise<void>;
  getUsersForSchedule(targetTime: string): Promise<UserData[]>;
  findUsersWithDueDdns(now?: Date): Promise<UserData[]>;
  deleteUser(userId: string): Promise<void>;
}
