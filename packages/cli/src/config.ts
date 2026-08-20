import * as v from "valibot";

export const TargetEnvironmentSchema = v.picklist(["firebase", "docker", "node"]);
export type TargetEnvironment = v.InferOutput<typeof TargetEnvironmentSchema>;

export const FeaturesConfigSchema = v.object({
  bot: v.optional(v.boolean(), true),
  api: v.optional(v.boolean(), false),
  ddns: v.optional(
    v.object({
      enabled: v.boolean(),
      cron: v.optional(v.string(), "*/15 * * * *"),
    }),
    { enabled: false, cron: "*/15 * * * *" }
  ),
});
export type FeaturesConfig = v.InferOutput<typeof FeaturesConfigSchema>;

export const GatrieverConfigSchema = v.object({
  target: v.optional(TargetEnvironmentSchema, "firebase"),
  outDir: v.optional(v.string(), "deploy"),
  features: v.optional(FeaturesConfigSchema, {
    bot: true,
    api: false,
    ddns: { enabled: false, cron: "*/15 * * * *" },
  }),
});
export type GatrieverConfig = v.InferOutput<typeof GatrieverConfigSchema>;

export const PackageJsonConfigSchema = v.object({
  name: v.optional(v.string()),
  gatriever: v.optional(GatrieverConfigSchema),
});
