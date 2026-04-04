import { z } from "zod";
import { daisyThemes } from "../constants/themes.ts";
import {
  factorioVersions,
  modCategories,
  modPortalTabs,
  modTags,
} from "../types/mod.ts";

export const profileIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z0-9._-]+$/);

export const modListEntrySchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean(),
  version: z.string().optional(),
});

export const settingsSchema = z.object({
  version: z.number().default(1),
  modsFolder: z.string().default(""),
  factorioPath: z.string().default(""),
  modListProfiles: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      }),
    )
    .default([]),
  activeModListProfileId: z.string().default("default"),
  modListPath: z.string().optional(),
  snackbarPosition: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .default("top-right"),
  concurrency: z.number().int().min(1).max(8).default(3),
  ignoreDisabledMods: z.boolean().default(true),
  includeDisabledModsByDefault: z.boolean().default(false),
  desktopNotifications: z.boolean().default(true),
  theme: z.union([z.literal("system"), z.enum(daisyThemes)]).default("system"),
});

export const modListFileSchema = z.object({
  mods: z.array(modListEntrySchema),
});

export const browseFiltersSchema = z.object({
  query: z.string().default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(24),
  tab: z.enum(modPortalTabs).default("recently_updated"),
  version: z.enum(factorioVersions).default("2.0"),
  categories: z.array(z.enum(modCategories)).default([]),
  includeCategories: z.boolean().default(true),
  tags: z.array(z.enum(modTags)).default([]),
  includeTags: z.boolean().default(true),
  includeDeprecated: z.boolean().default(false),
});

export const manageInstalledModSchema = z.object({
  modName: z.string().min(1),
  fileName: z.string().min(1),
});

export const setModEnabledSchema = z.object({
  modName: z.string().min(1),
  enabled: z.boolean(),
  relatedModNames: z.array(z.string().min(1)).optional().default([]),
});

export const modToggleImpactSchema = z.object({
  modName: z.string().min(1),
  enabled: z.boolean(),
});

export const downloadEnqueueSchema = z.object({
  modName: z.string().min(1),
  version: z.string().min(1),
  includeDependencies: z.boolean().optional().default(false),
});

export const syncRequestSchema = z.object({
  includeDisabled: z.boolean().default(false),
});

export const modListProfileCreateSchema = z.object({
  name: z.string().trim().min(1),
});

export const modListProfileUpdateSchema = z.object({
  profileId: profileIdSchema,
  name: z.string().trim().min(1),
});

export const modListProfileSwitchSchema = z.object({
  profileId: profileIdSchema,
});

export const modListProfileRemoveSchema = z.object({
  profileId: profileIdSchema,
});

export const modListProfileDiffSchema = z
  .object({
    leftProfileId: profileIdSchema,
    rightProfileId: profileIdSchema,
  })
  .refine((value) => value.leftProfileId !== value.rightProfileId, {
    message: "Choose two different mod-list profiles to compare.",
    path: ["rightProfileId"],
  });

export const modListProfileExportSchema = z.object({
  profileId: profileIdSchema,
});

export const modListProfileImportSchema = z.object({});
