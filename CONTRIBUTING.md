# Contributing to Yarrtorio

Thank you for your interest in contributing to Yarrtorio! This guide will help you get started.

## Quick Links

- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Building & Packaging](#building--packaging)
- [Adding New Features](#adding-new-features)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Future Improvements](#future-improvements)
- [Issue Reporting](https://github.com/Auserwaulth/yarrtorio-electron/blob/main/ISSUES.md)

## Development Setup

### Prerequisites

- Node.js 20+
- npm
- Windows (for building/packaging)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Auserwaulth/yarrtorio-electron.git
cd yarrtorio-electron

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command                    | Description                            |
| -------------------------- | -------------------------------------- |
| `npm run dev`              | Start Electron + Vite dev mode         |
| `npm run build`            | Build main, preload, and renderer      |
| `npm run preview`          | Preview the built app                  |
| `npm run typecheck`        | TypeScript check without emitting      |
| `npm run dist`             | Build Windows NSIS + portable packages |
| `npm run dist:linux`       | Build Linux AppImage (x64)             |
| `npm run dist:linux:arm64` | Build Linux AppImage (arm64)           |
| `npm run lint`             | Run ESLint                             |
| `npm run format`           | Format code with Prettier              |

## Architecture Overview

Yarrtorio uses Electron with a secure separation between renderer, preload, and main processes.

### Renderer

The renderer hosts the dashboard, browse, installed, and settings pages. It keeps app state in a small store and uses feature hooks for settings and mod actions.

### Preload Bridge

The preload layer exposes a typed `window.electronApi` surface for:

- app metadata
- mod browsing and management
- download queue operations
- settings read/write and file pickers
- opening external URLs

### Main Process

The main process registers IPC handlers for:

- `mods:*`
- `downloads:*`
- `settings:*`
- `app:*`
- `external:*`

It also owns filesystem access, notification dispatch, queue execution, mod-list mutation, and all requests to the Factorio mod portal/API.

## Requirements

- Node.js 20+
- npm
- Windows (for building/packaging) and Linux (AppImage) are supported packaging targets
- A valid Factorio mods folder for installed-mod management
- Network access to the Factorio Mod Portal/API for browse/details/download planning

## Building & Packaging

### Building

To build the app for distribution, run:

```bash
npm install
npm run dist
```

This will:

1. Run `npm run build` to compile main, preload, and renderer using electron-vite
2. Use electron-builder to create Windows packages

You can also run `npm run build` alone if you just want the compiled output without packaging. The built files will be in the `out` folder.

### Output

After building, the distributable files will be in the `release` folder:

- `Yarrtorio-Setup-<version>-x64.exe` - NSIS installer (Windows)
- `Yarrtorio-Portable-<version>-x64.exe` - Portable executable (Windows)
- `Yarrtorio-<version>-x64.AppImage` - AppImage (Linux x64)
- `Yarrtorio-<version>-arm64.AppImage` - AppImage (Linux arm64)

### Packaging Targets

The project is configured to produce builds for Windows and Linux via `electron-builder`:

#### Windows

- NSIS installer
- Portable executable

#### Linux

- AppImage (x64 and arm64)

Icons live under `resources/icons`. The PNG icon is used for Linux builds.

## Adding New Features

### Add a New Setting

Typical flow:

1. Add the field to `AppSettings` in the shared types
2. Add validation/defaults in `settingsSchema` using Zod
3. Add default persistence in `settings-service`
4. Surface it in the renderer settings fallback/state
5. Add UI in `SettingsPage`
6. Consume the setting where behavior changes

### Add a New IPC Action

Typical flow:

1. Add the channel to `src/shared/contracts/ipc-contracts.ts`
2. Expose it through preload (`src/preload/api/`)
3. Implement the main-process handler in `src/main/ipc/handlers/`
4. Register it in `src/main/ipc/register-ipc.ts`
5. Call it from renderer actions/hooks

## Coding Standards

- **TypeScript** - All code should be typed
- **Prettier** - Format code before committing (`npm run format`)
- **ESLint** - No lint errors before committing (`npm run lint`)
- **Component Structure** - Use functional components with hooks
- **State Management** - Use the existing app store pattern

### Project Structure Overview

```text
src/
├─ main/
│  ├─ downloads/      # queue, worker, progress tracking, staging, checksum
│  ├─ ipc/            # IPC registration and handlers
│  ├─ mods/           # installed mods, parsing, resolver, portal mapping/cache
│  ├─ services/       # settings persistence
│  ├─ utils/          # shared main-process helpers
│  └─ windows/        # BrowserWindow creation
├─ preload/
│  ├─ api/            # typed API bridge modules
│  └─ types/          # preload-side typings
├─ renderer/
│  └─ src/
│     ├─ components/  # UI components
│     ├─ features/    # page/action hooks
│     ├─ hooks/       # bootstrap logic
│     ├─ pages/       # dashboard, browse, installed, settings
│     ├─ state/       # browse reducer and defaults
│     ├─ store/       # app store
│     └─ utils/       # theme helpers
└─ shared/
   ├─ constants/      # app constants and theme lists
   ├─ contracts/      # IPC channel contracts
   ├─ types/          # shared app/mod typings
   └─ validation/     # Zod schemas
```

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes following the coding standards
4. **Run** `npm run lint` and fix any issues
5. **Run** `npm run format` to format code
6. **Run** `npm run typecheck` to ensure no type errors
7. **Commit** your changes with clear commit messages
8. **Push** to your fork
9. **Submit** a Pull Request

### Commit Message Format

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Future Improvements

Areas where contributions are welcome:

- [ ] Tests for reducers, mappers, and settings/mod parser flows
- [ ] Screenshots and media for the README
- [ ] Additional theme options
- [ ] Mod update notifications
- [ ] Bulk operations for installed mods

---

Built with ❤️ for the Factorio modding community
