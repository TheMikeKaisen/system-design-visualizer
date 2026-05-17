# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Phase 4: Persistence Layer**
  - **Serialization:** Added `diagramSerializer.ts` using `zod` for strict schema validation.
  - **Local Storage:** Added `localStoragePersistence.ts` with safe wrapper functions to handle SSR and browser quota limits.
  - **File I/O:** Added `fileIO.ts` for native browser-based export (`.sysvis.json`) and import via file picker.
  - **State Management:** Implemented `useDiagramStore.ts` to track diagram metadata, `isDirty` flags, and manage autosave synchronization.
  - **Autosave:** Added `useAutoSave.ts` using imperative Zustand subscriptions (debounced 2s) to prevent unnecessary React re-renders.
  - **UI/UX Overhaul:** Updated `Toolbar.tsx` with `DiagramControls` and `DiagramNameInput` (with dirty indicator). Created `DiagramBrowser.tsx` (the "Open" dialog) providing a list of saved diagrams.
  - **Routing:** Configured URL-based routing via `src/app/(canvas)/[diagramId]/page.tsx` and created a resolution page (`/resolve`) to handle automatic redirection to the last-opened diagram.
  - **Database Integration:** Scaffolded `prisma` and `@prisma/client`. Created `prisma/schema.prisma` with a JSON-based `Diagram` model. Implemented REST API endpoints (`/api/diagrams`) for saving and retrieving diagrams from a Postgres database.
