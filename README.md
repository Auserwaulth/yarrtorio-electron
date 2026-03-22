<div align="center">

[![Electron](https://img.shields.io/badge/Electron-40.8.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![daisyUI](https://img.shields.io/badge/daisyUI-5-13C6D3?logo=daisyui)](https://daisyui.com)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2026.3.22-4B5563?logo=npm)](https://www.npmjs.com)
[![Build](https://github.com/Auserwaulth/yarrtorio-electron/actions/workflows/ci.yml/badge.svg)](https://github.com/Auserwaulth/yarrtorio-electron/actions)

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Platform](<https://img.shields.io/badge/Platform-Windows%20(x64)-0078D4?logo=windows>)](https://www.microsoft.com/windows) [![Platform](<https://img.shields.io/badge/Platform-Linux%20(x64%2Farm64)-FCC624?logo=linux&logoColor=black>)](https://linux.org)
![visitors](https://visitor-badge.laobi.icu/badge?page_id=Auserwaulth.yarrtorio-electron)

# Yarrtorio

Desktop Factorio mod downloader and manager built with Electron, Vite, React, TypeScript, Tailwind CSS, and daisyUI.

</div>

## Quick Navigation

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Settings](#settings)
- [Download Behavior](#download-behavior)
- [Data Sources](#data-sources)
- [Contributing](#contributing)
- [Issue Reporting](https://github.com/Auserwaulth/yarrtorio-electron/blob/main/ISSUES.md)
- [Credits](#credits)

## Overview

Yarrtorio is a desktop app for browsing Factorio mods, viewing release details, queuing downloads, syncing against `mod-list.json`, and managing installed mod archives from a local mods folder.

The app uses Electron for the desktop shell, a React renderer for the UI, and a preload bridge plus IPC handlers to keep the renderer isolated from Node.js and file-system access.

## Features

- Browse Factorio mods with search, tabs, tag filters, version filters, and pagination
- View full mod details, releases, dependencies, images, source/homepage/license links, and descriptions
- Queue downloads for a selected version, with optional dependency downloads
- Track download state for queued, running, completed, failed, and cancelled downloads
- Read installed mods from a local Factorio mods folder
- Delete installed archives, queue updates, and toggle enabled state through `mod-list.json`
- Sync local downloads from `mod-list.json`
- Save local app settings such as mod folder, custom `mod-list.json` path, download concurrency, notification preference, and theme
- Cache mod browse datasets and mod details to reduce repeated portal/API calls
- Show desktop notifications when downloads complete or fail
- Package for Windows as both NSIS installer and portable build

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app in development

```bash
npm run dev
```

### 3. Configure settings in the app

Open **Settings** and set:

- **Mod Folder**: your local Factorio `mods` directory
- **mod-list.json path**: optional; leave empty to use `<modsFolder>/mod-list.json`

### 4. Browse or sync mods

- Use **Browse** to search and inspect mods
- Use **Sync from mod-list** to queue mods from your Factorio mod list
- Use **Installed** to update, delete, or toggle installed mods

## Settings

The app persists settings in Electron's `userData` directory. Current settings in source include:

- `modsFolder`
- `modListPath`
- `concurrency`
- `ignoreDisabledMods`
- `includeDisabledModsByDefault`
- `desktopNotifications`
- `theme`

## Download Behavior

Downloads are queued in the main process. The queue concurrency is configurable in Settings. When a download completes or fails, the main process can dispatch a desktop notification if notifications are enabled and supported by the OS.

## Data Sources

Yarrtorio consumes the Factorio Mod Portal/API for:

- browse datasets
- mod details
- release information
- dependency parsing inputs
- portal extras such as images, homepage/source/license links

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and prerequisites
- Architecture overview
- Project structure
- Building & packaging instructions
- How to add new features
- Coding standards and pull request process

## Credits

This project started from a much simpler tool.

The original idea and early implementation were created by friends of mine as a PowerShell (.ps1) script that helped automate downloading locally.

That script inspired me to build a full desktop application around the same problem — improving usability, adding a graphical interface, download queueing, caching, settings management, and a more structured architecture.

#### Original PowerShell prototype:

Undefined8331

Zsoltzsozso828

Photemy

#### Desktop application (Electron version):

Zoard3945 (Auserwaulth)
