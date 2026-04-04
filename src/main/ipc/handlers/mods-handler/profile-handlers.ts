import electron from "electron";
import {
  buildUniqueProfileName,
  compareProfileContents,
  readProfileExportPackage,
  sanitizeProfileFileName,
  writeProfileExportPackage,
} from "../../../mods/mod-list-profile-transfer.ts";
import type { IpcMainInvokeEvent } from "electron";
import type {
  AppSettings,
  ExportModListProfileResult,
  ImportModListProfileResult,
  ModListEntry,
  ModListProfileComparison,
  ModListProfile,
  OperationResult,
} from "../../../../shared/types/mod.ts";
import {
  modListProfileCreateSchema,
  modListProfileDiffSchema,
  modListProfileExportSchema,
  modListProfileRemoveSchema,
  modListProfileSwitchSchema,
  modListProfileUpdateSchema,
} from "../../../../shared/validation/schemas.ts";
import type { SettingsService } from "../../../services/settings-service";

interface ProfileDialogApi {
  showSaveDialog: typeof dialog.showSaveDialog;
  showOpenDialog: typeof dialog.showOpenDialog;
  createProfileId?: () => string;
  parseProfileMods?: (profileId: string) => Promise<ModListEntry[]>;
  writeProfileStorage?: (
    profileId: string,
    mods: ModListEntry[],
  ) => Promise<void>;
  deleteProfileStorage?: (profileId: string) => Promise<void>;
  readExportPackage?: typeof readProfileExportPackage;
  writeExportPackage?: typeof writeProfileExportPackage;
}

const { dialog } = electron;

function buildProfileName(name: string): string {
  return name.trim() || "Untitled list";
}

function buildProfileFileName(name: string): string {
  return `${sanitizeProfileFileName(name)}.yarrtorio-profile.json`;
}

function getProfileById(
  settings: AppSettings,
  profileId: string,
): ModListProfile | null {
  return (
    settings.modListProfiles.find((profile) => profile.id === profileId) ?? null
  );
}

async function getProfileStorageApi() {
  return import("../../../mods/mod-parser.ts");
}

export function createProfileHandlers(
  settingsService: SettingsService,
  dialogApi: ProfileDialogApi = dialog,
) {
  const createProfileId = dialogApi.createProfileId ?? (() => crypto.randomUUID());
  const readExportPackage =
    dialogApi.readExportPackage ?? readProfileExportPackage;
  const writeExport =
    dialogApi.writeExportPackage ?? writeProfileExportPackage;

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
        id: createProfileId(),
        name: buildProfileName(parsed.data.name),
      };

      const { createModListProfileStorage } = await getProfileStorageApi();
      await createModListProfileStorage(settings, profile.id);

      try {
        return {
          ok: true,
          data: await settingsService.saveSettings({
            ...settings,
            modListProfiles: [...settings.modListProfiles, profile],
          }),
        };
      } catch (error) {
        const { deleteModListProfileStorage } = await getProfileStorageApi();
        await deleteModListProfileStorage(profile.id).catch(() => undefined);
        throw error;
      }
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

      const { switchActiveModListProfile } = await getProfileStorageApi();
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

        const { switchActiveModListProfile } = await getProfileStorageApi();
        await switchActiveModListProfile(settings, fallbackProfile.id);
      }

      const { deleteModListProfileStorage } = await getProfileStorageApi();
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

    diffModListProfiles: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<ModListProfileComparison>> => {
      const parsed = modListProfileDiffSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      if (parsed.data.leftProfileId === parsed.data.rightProfileId) {
        return {
          ok: false,
          error: "Choose two different mod-list profiles to compare.",
        };
      }

      const settings = await settingsService.getSettings();
      const leftProfile = getProfileById(settings, parsed.data.leftProfileId);
      const rightProfile = getProfileById(settings, parsed.data.rightProfileId);

      if (!leftProfile || !rightProfile) {
        return { ok: false, error: "Mod-list profile was not found." };
      }

      const { parseProfileModList } = await getProfileStorageApi();
      const [leftMods, rightMods] = await Promise.all([
        parseProfileModList(leftProfile.id),
        parseProfileModList(rightProfile.id),
      ]);

      return {
        ok: true,
        data: compareProfileContents(
          leftProfile,
          rightProfile,
          leftMods,
          rightMods,
        ),
      };
    },

    exportModListProfile: async (
      _event: IpcMainInvokeEvent,
      input: unknown,
    ): Promise<OperationResult<ExportModListProfileResult>> => {
      const parsed = modListProfileExportSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, error: "Invalid mod-list profile payload." };
      }

      const settings = await settingsService.getSettings();
      const profile = getProfileById(settings, parsed.data.profileId);

      if (!profile) {
        return { ok: false, error: "Mod-list profile was not found." };
      }

      const result = await dialogApi.showSaveDialog({
        defaultPath: buildProfileFileName(profile.name),
        filters: [
          { name: "Yarrtorio profile", extensions: ["json"] },
          { name: "All files", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { ok: false, error: "Profile export cancelled." };
      }

      const mods = dialogApi.parseProfileMods
        ? await dialogApi.parseProfileMods(profile.id)
        : await (await getProfileStorageApi()).parseProfileModList(profile.id);
      await writeExport(result.filePath, profile.name, mods);

      return {
        ok: true,
        data: {
          profileName: profile.name,
          filePath: result.filePath,
          modCount: mods.length,
        },
      };
    },

    importModListProfile: async (): Promise<
      OperationResult<ImportModListProfileResult>
    > => {
      const result = await dialogApi.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "JSON files", extensions: ["json"] },
          { name: "All files", extensions: ["*"] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, error: "Profile import cancelled." };
      }

      const filePath = result.filePaths[0]!;
      const settings = await settingsService.getSettings();
      let imported: Awaited<ReturnType<typeof readProfileExportPackage>>;

      try {
        imported = await readExportPackage(filePath);
      } catch {
        return {
          ok: false,
          error: "Selected file is not a valid mod-list profile export.",
        };
      }

      const profile: ModListProfile = {
        id: createProfileId(),
        name: buildUniqueProfileName(
          settings.modListProfiles.map((profile) => profile.name),
          imported.profile.name,
        ),
      };

      if (dialogApi.writeProfileStorage) {
        await dialogApi.writeProfileStorage(profile.id, imported.mods);
      } else {
        await (
          await getProfileStorageApi()
        ).writeModListProfileStorage(profile.id, imported.mods);
      }

      try {
        const nextSettings = await settingsService.saveSettings({
          ...settings,
          modListProfiles: [...settings.modListProfiles, profile],
        });

        return {
          ok: true,
          data: {
            importedProfile: profile,
            settings: nextSettings,
            modCount: imported.mods.length,
          },
        };
      } catch (error) {
        if (dialogApi.deleteProfileStorage) {
          await dialogApi.deleteProfileStorage(profile.id).catch(() => undefined);
        } else {
          await (
            await getProfileStorageApi()
          ).deleteModListProfileStorage(profile.id).catch(() => undefined);
        }
        throw error;
      }
    },
  };
}
