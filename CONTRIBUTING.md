# Contributing to Yarrtorio

Thank you for your interest in contributing to Yarrtorio! This guide will help you get started.

## Quick Links

- [Development Setup](#development-setup)
- [Adding New Features](#adding-new-features)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Future Improvements](#future-improvements)

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

| Command             | Description                            |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Electron + Vite dev mode         |
| `npm run build`     | Build main, preload, and renderer      |
| `npm run preview`   | Preview the built app                  |
| `npm run typecheck` | TypeScript check without emitting      |
| `npm run dist`      | Build Windows NSIS + portable packages |
| `npm run lint`      | Run ESLint                             |
| `npm run format`    | Format code with Prettier              |

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

```
src/
├─ main/           # Electron main process
│  ├─ downloads/   # Download queue & workers
│  ├─ ipc/         # IPC handlers
│  ├─ mods/        # Mod management
│  └─ services/    # Settings, migrations
├─ preload/        # Context bridge
├─ renderer/       # React UI
│  ├─ components/  # Reusable UI components
│  ├─ features/    # Page-specific logic
│  └─ pages/       # Dashboard, Browse, Installed, Settings
└─ shared/         # Shared types, contracts, constants
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
