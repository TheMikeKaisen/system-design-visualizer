# Agent Instructions & Workflow Protocol

> [!IMPORTANT]
> **CRITICAL FIRST STEPS FOR ANY AI AGENT WORKING IN THIS REPOSITORY**:
> 1. **FIRST, READ THE RULES**: Consult [`Agent Rules/Rules.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/Agent%20Rules/Rules.md) before performing any action.
> 2. **SECOND, READ ARCHITECTURE DECISIONS**: Consult [`DecisionsAndAnalysis/decisions.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/DecisionsAndAnalysis/decisions.md) and [`DecisionsAndAnalysis/Network decisions.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/DecisionsAndAnalysis/Network%20decisions.md) to understand system architecture, episode standards, and historical decisions.

---

## 🚨 RULE #1: NEVER STAGE OR COMMIT CHANGES (EVER)
**NEVER run `git add`, `git commit`, `git push`, or any command that stages or commits changes. EVER.**
- Keep all modifications, newly created files, and edits as unstaged working tree changes.
- The user will personally inspect git diffs, test the app, and handle git staging/committing.
- Only read-only git commands are permitted: `git status`, `git diff`, `git log`.

---

## 🧭 RULE #2: ARCHITECTURE & DECISION INTEGRITY
- **STRICT ARCHITECTURAL & STYLE FREEZE**: Agents MUST NOT change the existing style, visual design, or component architecture in any way unless explicitly approved by the user. Because most episodes share similar canonical components (e.g. shells, playback bars, explanation bars, dropdowns), any change to an existing component or style risks breaking the UI across other episodes. Always preserve existing styles, parameterize via backward-compatible props/slots, and never tamper with established visual themes.
- Any non-trivial refactoring, feature addition, or UI change must consult [`DecisionsAndAnalysis/decisions.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/DecisionsAndAnalysis/decisions.md) before implementation.
- Every completed architectural or UI change must be documented by appending a new Decision Record to `DecisionsAndAnalysis/decisions.md`.
- For Computer Networks episodes, strictly adhere to [`DecisionsAndAnalysis/Network decisions.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/DecisionsAndAnalysis/Network%20decisions.md).

---

## 🛠️ RULE #3: SKILL WORKFLOW
Before making ANY code changes:
1. Determine whether an existing skill applies (`superpowers-plan`, `superpowers-tdd`, `superpowers-debug`, etc.).
2. Search `/skills` or `.agent/skills/`.
3. Load ONLY the most relevant skill.
4. Follow the workflow prescribed by that skill.

---

## 🔬 RULE #4: SIMULATION GUIDELINES (7 RULES)
When creating or editing runtime simulators:
1. **Data-Driven State Isolation**: Strict `SimulationScenario` discrete step-by-step models.
2. **Transparency Rendering**: Render complete collections (dim inactive/suspended frames/queues).
3. **Strict React Key Strategies**: Deterministic composite keys (e.g. `${context.id}-${variable.name}`). Never use array index.
4. **Explicit Terminal Theming**: Hardcoded readable colors (`text-zinc-200`, `text-zinc-400`, `bg-[#0b0c0f]`).
5. **Multi-Modal Feedback**: Step badge, explanation banner, line highlight, state pulse.
6. **Execution Context Lifecycle**: Call stack must start empty at Step 0, and end empty.
7. **Strict Two-Phase Context Creation**: Creation phase (`var: undefined`, `let: <TDZ>`) must precede execution assignments.

---

## 🧩 RULE #6: ZERO-DUPLICATION & COMPONENT REUSE (MANDATORY)
**NEVER create a new component if an existing component or primitive already exists.**
1. **Search Before Building**: Inspect `src/components/ui/`, `src/components/network-simulator/`, `src/components/os-simulator/`, and `src/components/javascript/` before authoring any new component.
2. **Reuse Canonical Primitives**:
   - Navigation & Shell: `NetworkEpisodeShell`, `OSKernelShell`, `OSConcurrencyShell`, `AppNavbar`.
   - Selectors: `ScenarioDropdown` (never write ad-hoc inline `<select>` or custom dropdown buttons for scenarios).
   - Playback & Controls: `NetworkPlaybackBar` (handles both desktop footer and mobile bottom dock).
   - Explanations & Notes: `InteractiveExplanationBar` (keyword highlighting, concept chips, persistent dialogues).
   - Catalog Cards: `EpisodeCard` (subject routes), `DisciplineCard` & `EditorialDisciplineCard` (`/learning-paths`).
3. **Extend, Do Not Fork**: If an existing component lacks an accent color or option, parameterize it with props rather than cloning it into a new file.

---

## 📱 RULE #7: RESPONSIVE FIDELITY FOR LARGER & SHORTER SCREENS
Every simulator, episode, and learning path MUST look and feel world-class on **both larger screens (desktop `lg:`) and shorter screens (mobile `< sm`)**:
1. **Mobile Scrollability**: NEVER lock mobile viewports in `h-screen overflow-hidden`. Use `min-h-screen overflow-y-auto lg:h-screen lg:overflow-hidden` so users can scroll through all panels naturally on mobile.
2. **Docked Mobile Playback Bar**: On smaller screens (`< sm`), playback controls must be fixed to the viewport bottom (`fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]`), rendering only the 3 core buttons (`Prev`, `Play/Pause`, `Next`). Hide keyboard shortcut legends, step counters, and speed controls on mobile to prevent clutter.
3. **Content Clearance**: Content containers (`<main>`) must declare bottom clearance (`pb-20 sm:pb-4`) so bottommost table rows or inspector fields are never occluded behind the mobile playback bar.
4. **Touch Ergonomics & Auto-Open Prevention**:
   - Minimum 44px × 44px touch targets with `touch-manipulation` and tactile `:active:scale-95` feedback.
   - Popovers and dialogues must **NEVER** automatically open from hover, scroll, or focus events on touch devices. Popovers require an explicit user tap (`onClick`), must be pinned open with a backdrop, and must auto-dismiss on step navigation (`safeIndex` change).

---

## 🧹 RULE #8: CLEAN CODE, ACCESSIBILITY & STATE HYGIENE
1. **Zero Dead Code**: No unused imports, orphaned styles, lingering `console.log` statements, or commented-out code blocks.
2. **WAI-ARIA Accessibility**:
   - Interactive triggers must be native `<button>` or semantic elements with visible focus rings (`focus-visible:ring-1` or `focus-visible:ring-2`).
   - Use correct ARIA roles (`role="dialog"`, `role="tab"`, `role="tablist"`, `role="combobox"`), with matching `aria-controls`, `aria-expanded`, and `aria-selected` attributes.
   - Never auto-trigger popovers or modals on `onFocus` (WCAG 3.2.1 On Focus). Focus indicates target location; activation requires explicit action (Enter, Space, or tap).
3. **Defensive State Retention**: When stepping forward or backward, retain active user selections (e.g. selected socket, selected process) across steps using stable identifiers or tuples. Do not blindly reset selections to index 0 on every step transition.
4. **Clean Route Teardown**: When navigating away from a simulator, clear state in the store's cleanup hook (Decision 002) to prevent ghost states or race conditions when reopening.

---

## 📬 RULE #9: NOTIFICATION SYSTEM & GITOPS RELEASE INTEGRITY (MANDATORY)
To ensure the transactional email pipeline, AWS serverless workers, and GitOps release automation remain 100% resilient and isolated against regressions:
1. **Never Import From `@/workers/*` in Next.js App Router**:
   - `src/workers/dispatch.ts` and `src/workers/fanout.ts` are standalone AWS Lambda worker scripts containing Node.js/Lambda dependencies (`react-dom/server`, AWS SDK handlers) that violate Next.js Turbopack compiler boundaries.
   - Any shared utility (e.g. Resend client, Prisma database client, environment parsing) MUST live in `src/lib/` (e.g. `src/lib/resend.ts`, `src/lib/db.ts`, `src/lib/env.ts`).
   - App Router routes (`src/app/**`) and UI components must NEVER import from `src/workers/dispatch` or `src/workers/fanout`.
2. **Episode Metadata Structure & AST Parser Preservation**:
   - When authoring or editing episodes in `src/app/<subject>/episodes.tsx`, metadata array export names MUST remain exact (`JAVASCRIPT_EPISODES`, `OPERATING_SYSTEMS_EPISODES`, `JAVA_EPISODES`, `COMPUTER_NETWORKS_EPISODES`, `BACKEND_EPISODES`, `FRONTEND_EPISODES`).
   - The TypeScript AST parser in `scripts/detect-new-episodes.ts` scans these exact export names.
   - The `date` property MUST be either `"Coming Soon"` or a standard ISO/release date `"YYYY-MM-DD"`. Transitioning an episode from `"Coming Soon"` to a release date triggers automated notification fanout.
   - Any new discipline track must be registered in `SUBJECT_FILE_MAP` in `scripts/detect-new-episodes.ts` and in Prisma's `SubjectChannel` enum.
3. **SQS-First Safe Ordering Architecture**:
   - In `src/app/api/internal/episodes/publish/route.ts`, enqueueing to the AWS SQS Fanout Queue MUST ALWAYS occur before writing to PostgreSQL.
   - If SQS enqueue fails, the endpoint returns HTTP 500 and NEVER touches the database (preventing phantom releases).
   - If SQS succeeds but the database write fails, the endpoint returns HTTP 202 Accepted because the Lambda worker will idempotently backfill the `PublishedEpisode` record.
   - Never reverse this order.
4. **Resend API Mocking in Test Suites**:
   - Any test suite that exercises notification routes (`/api/notifications/subscribe`, `/api/notifications/verify`, `/api/internal/episodes/publish`) MUST mock `@/lib/resend` and `@/workers/dispatch`.
   - Never let test suites make live outbound network requests to Resend.
5. **RFC 8058 Compliance & Unsubscribe Headers**:
   - Email templates generated in `src/emails/` must always inject RFC 8058 `List-Unsubscribe` and `List-Unsubscribe-Post` headers.
   - The unsubscribe endpoints must support both JSON API payloads and standard `application/x-www-form-urlencoded` form submissions for 1-click unsubscriptions.
6. **Database Schema Safeguards**:
   - Models `Subscriber`, `Subscription`, and `PublishedEpisode` in `prisma/schema.prisma` are strictly locked.
   - Never modify, drop, or rename columns without explicit user consent and running migrations (`npx prisma migrate dev` / `npx prisma migrate deploy`).
   - Retain composite indexes (`[status, isVerified]`, `[subject, episodeId]`) for query performance.

---

## 🧪 RULE #5: RIGOROUS VERIFICATION
Before declaring completion:
- `npx tsc --noEmit` must pass with 0 errors.
- `npx eslint <touched_files>` must pass with 0 errors / 0 warnings.
- `npm test` must pass all Vitest suites.
- Add unit tests for new components or utilities.

<!-- BEGIN:nextjs-agent-rules -->
# Next.js Notice
This version has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->
