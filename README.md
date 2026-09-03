# Shiksha Setu

*"Five-Minute Assessment. Next-Day Teaching Action."*

Shiksha Setu is an offline-first Progressive Web App (PWA) for rapid classroom assessments, built with React, TypeScript, and Vite. It installs on desktop and mobile home screens and works fully offline after the first load.

## Tech Stack

- React + TypeScript
- Vite (with `vite-plugin-pwa`)
- Dexie (IndexedDB) for offline storage
- Recharts, jsPDF, Papaparse, Zod

## Getting Started

```powershell
npm install
npm run dev
```

## Build & Offline Preview

```powershell
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

See [DEMO_GUIDE.md](DEMO_GUIDE.md) for full install/demo instructions, including mobile installation and offline verification.

## Testing

```powershell
npm run test
```

## Project Structure

- `src/` — application source (assessment flow, knowledge graph, data layer, views)
- `public/` — static assets
- `scripts/` — build/utility scripts (e.g. icon generation)
- `html-prototype/` — standalone HTML prototype
