import * as v from "valibot";

export const RouterIdSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z0-9_-]+$/, "Slug format required (a-z, 0-9, _, -)")
);

export const validateRouterId = (id: string): boolean => {
  return v.safeParse(RouterIdSchema, id).success;
};

export const RouterConfigSchema = v.object({
  id: RouterIdSchema,
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  hostname: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  lastKnownIp: v.optional(v.pipe(v.string(), v.ip())),
  lastCheckedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
});

export type RouterConfig = v.InferOutput<typeof RouterConfigSchema>;

export const DdnsConfigSchema = v.object({
  enabled: v.optional(v.boolean(), true),
  cronExpression: v.optional(v.string(), "*/15 * * * *"),
  nextRunAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  routers: v.optional(v.array(RouterConfigSchema), []),
});

export type DdnsConfig = v.InferOutput<typeof DdnsConfigSchema>;

export const SiteConfigSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  propertyId: v.pipe(v.string(), v.minLength(1)),
});

export type SiteConfig = v.InferOutput<typeof SiteConfigSchema>;

export const UserScheduleSchema = v.object({
  enabled: v.optional(v.boolean(), false),
  time: v.optional(v.string(), "09:00"),
});

export type UserSchedule = v.InferOutput<typeof UserScheduleSchema>;

export const UserDataSchema = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
  sites: v.array(SiteConfigSchema),
  gaCredentialsEncrypted: v.optional(v.string()),
  schedule: UserScheduleSchema,
  ddns: v.optional(DdnsConfigSchema),
});

export type UserData = v.InferOutput<typeof UserDataSchema>;
