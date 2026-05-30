# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js Version Warning

**This is NOT the Next.js you know.** This project runs Next.js **16.2.6** with React 19.2.4 — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint
```

There are no tests in this project.

Admin credentials are required via environment variables before the admin panel works:
```
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>
```

## Architecture Overview

**NNVPS** is a Thai VPS rental shop — customers browse available Windows farm machines, register/login, top up balance via PromptPay QR, and rent machines that expose AnyDesk credentials.

### Pages
- `app/page.tsx` — Customer-facing shop (~1970 lines). All UI components are defined inline in a single file: `PCCard`, `LoginPanel`, `UserPanel`, `RentalInfoModal`, `CountdownTimerInline`, marble SVG backgrounds, footer, etc.
- `app/admin/page.tsx` — Admin dashboard (~1400 lines). Similarly monolithic: `AdminDashboard`, `DashboardTab`, `MachinesTab`, `AgentTab`, `UsersTab`, `PaymentsTab` all in one file.
- `app/download/page.tsx` — Download page for the Windows agent installer.

### Data Layer

`lib/data.ts` defines the canonical types (`Machine`, `User`, `Payment`) and seed data (`INIT_MACHINES`, `INIT_USERS`, `INIT_PAYMENTS`).

`lib/store.ts` holds three in-memory singleton stores:
- `store` (DataStore) — machines, users, payments. **Resets to seed data on every server restart.**
- `agentStore` (AgentStore) — in-memory agent registry with 15s online timeout.
- `commandStore` (CommandStore) — in-memory queue for commands sent to agents.

`lib/agentStore.ts` is a **separate file-based** implementation that persists to `data/agents.json` and `data/commands.json`, and saves screenshots to `public/screenshots/`. This is a parallel implementation — some API routes use one, some use the other (see below).

### API Routes

| Route | Store used |
|---|---|
| `/api/machines`, `/api/machines/[id]` | `lib/store` (in-memory) |
| `/api/users`, `/api/users/[id]` | `lib/store` (in-memory) |
| `/api/admin/login` | env vars only |
| `/api/agent/heartbeat` | `lib/store` agentStore (in-memory) |
| `/api/agent/list` | `lib/store` agentStore (in-memory) |
| `/api/agent/command` | `lib/store` commandStore (in-memory) |
| `/api/agent/setpassword` | `lib/store` store + commandStore |
| `/api/agent/register` | `lib/agentStore` (file-based) |
| `/api/agent/screenshot` | `lib/agentStore` (file-based) |

**Known inconsistency:** `register` and `screenshot` write to the file-based `lib/agentStore`, but `list` reads from the in-memory `lib/store` agentStore. Agents registered via `/api/agent/register` will not appear in the admin Agents tab — only those that sent a heartbeat to `/api/agent/heartbeat` will.

### Agent System

Windows machines run a PowerShell agent (`public/NNVPS-Agent.ps1`, installer at `public/install.ps1` and `agent/install.ps1`). The agent:
- Sends heartbeat every 5s to `/api/agent/heartbeat` with CPU/RAM stats
- Polls `/api/agent/command` for pending commands (e.g., `setPassword`)
- Confirms completed commands via `/api/agent/confirm`
- Posts screenshots to `/api/agent/screenshot` (saved to `public/screenshots/{machineId}.jpg`)

Admin can remotely randomize a machine's AnyDesk password via the Agents tab, which queues a `setPassword` command.

### Authentication

- **Customer sessions**: `localStorage` keys `vps_user` and `vps_logged_in`. Passwords stored and compared in plaintext in the user object.
- **Admin session**: `sessionStorage` key `admin_authed`. Credentials validated against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.

### UI Conventions

- All page components are `'use client'` and live in single large files.
- Bilingual support (Thai/English) via a `LANG` constant with a `LangPack` type — `lang` state toggles between `'th'` and `'en'`.
- Dark/light theme toggled by `dark` boolean state. Dark = black marble + gold (`#D4AF37`), Light = white marble + pink.
- Machine status flows: Admin status (`'active' | 'available' | 'stopped' | 'maintenance'`) maps to storefront status (`'active' | 'available' | 'stopped' | 'expired'`) in `machineToVPS()` in `app/page.tsx`.
- Prices are in Thai Baht (฿), stored as integers on `Machine.priceWeekly` and `Machine.priceMonthly`.

### PWA

Configured via `next-pwa` in `next.config.ts` (currently just `turbopack: {}`). PWA manifest is at `public/manifest.json`. Icons `public/icon-192.png` and `public/icon-512.png` need to be generated (see `PWA_SETUP.md` and `scripts/generate-icons.html`).
