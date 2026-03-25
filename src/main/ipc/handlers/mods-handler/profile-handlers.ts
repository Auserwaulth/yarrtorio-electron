import {
  modListProfileCreateSchema,
  modListProfileRemoveSchema,
  modListProfileSwitchSchema,
  modListProfileUpdateSchema,
} from "@shared/validation/schemas";
import {
  createModListProfileStorage,
  deleteModListProfileStorage,
  switchActiveModListProfile,
} from "../../../mods/mod-parser";
import type { IpcMainInvokeEvent } from "electron";
import type {
  AppSettings,
  ModListProfile,
  OperationResult,
} from "@shared/types/mod";
import type { SettingsService } from "../../../services/settings-service";

function buildProfileName(name: string): string {
  return name.trim() || "Untitled list";
}

export function createProfileHandlers(settingsService: SettingsService) {
  return {
    createModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileCreateSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();
      if (!settings.modsFolder) {
        return { ok: false, error: "Mods folder is not configured." };
      }

      const profile: ModListProfile = {
        id: crypto.randomUUID(),
        name: buildProfileName(parsed.data.name),
      };

      await createModListProfileStorage(settings, profile.id);

      return {
        ok: true,
        data: await settingsService.saveSettings({
          ...settings,
          modListProfiles: [...settings.modListProfiles, profile],
        }),
      };
    },

    renameModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileUpdateSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();

      return {
        ok: true,
        data: await settingsService.saveSettings({
          ...settings,
          modListProfiles: settings.modListProfiles.map((profile) =>
            profile.id === parsed.data.profileId
              ? { ...profile, name: buildProfileName(parsed.data.name) }
              : profile,
          ),
        }),
      };
    },

    switchModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileSwitchSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();

      if (!settings.modsFolder) {
        return { ok: false, error: "Mods folder is not configured." };
      }

      const targetProfile = settings.modListProfiles.find(
        (profile) => profile.id === parsed.data.profileId,
      );

      if (!targetProfile) {
        return { ok: false, error: "Mod-list profile was not found." };
      }

      await switchActiveModListProfile(settings, targetProfile.id);

      return {
        ok: true,
        data: await settingsService.saveSettings({
          ...settings,
          activeModListProfileId: targetProfile.id,
        }),
      };
    },

    removeModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<AppSettings>> => {
      const parsed = modListProfileRemoveSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();
      const targetProfile = settings.modListProfiles.find(
        (profile) => profile.id === parsed.data.profileId,
      );

      if (!targetProfile) {
        return { ok: false, error: "Mod-list profile was not found." };
      }

      if (settings.modListProfiles.length <= 1) {
        return {
          ok: false,
          error: "At least one mod-list profile is required.",
        };
      }

      const remainingProfiles = settings.modListProfiles.filter(
        (profile) => profile.id !== parsed.data.profileId,
      );

      if (settings.activeModListProfileId === parsed.data.profileId) {
        const fallbackProfile = remainingProfiles[0];

        if (!fallbackProfile) {
          return {
            ok: false,
            error: "No fallback mod-list profile was found.",
          };
        }

        if (!settings.modsFolder) {
          return { ok: false, error: "Mods folder is not configured." };
        }

        await switchActiveModListProfile(settings, fallbackProfile.id);
      }

      await deleteModListProfileStorage(parsed.data.profileId);

      return {
        ok: true,
        data: await settingsService.saveSettings({
          ...settings,
          modListProfiles: remainingProfiles,
          activeModListProfileId:
            settings.activeModListProfileId === parsed.data.profileId
              ? remainingProfiles[0]!.id
              : settings.activeModListProfileId,
        }),
      };
    },
  };
}
