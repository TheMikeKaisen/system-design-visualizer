# Agent Instructions & Workflow Protocol

> [!IMPORTANT]
> **CRITICAL FIRST STEPS FOR ANY AI AGENT WORKING IN THIS REPOSITORY**:
> 1. **FIRST, READ THE RULES**: Consult [`Agent Rules/Rules.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/Agent%20Rules/Rules.md) before performing any action.
> 2. **SECOND, READ ARCHITECTURE DECISIONS**: Consult [`DecisionsAndAnalysis/decisions.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/DecisionsAndAnalysis/decisions.md) to understand the system architecture and all historical decisions (Records 001 through 007).

---

## 🚨 RULE #1: NEVER STAGE OR COMMIT CHANGES (EVER)
**NEVER run `git add`, `git commit`, `git push`, or any command that stages or commits changes. EVER.**
- Keep all modifications, newly created files, and edits as unstaged working tree changes.
- The user will personally inspect git diffs, test the app, and handle git staging/committing.
- Only read-only git commands are permitted: `git status`, `git diff`, `git log`.

---

## 🧭 RULE #2: ARCHITECTURE & DECISION INTEGRITY
- Any non-trivial refactoring, feature addition, or UI change must consult [`DecisionsAndAnalysis/decisions.md`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/DecisionsAndAnalysis/decisions.md) before implementation.
- Every completed architectural or UI change must be documented by appending a new Decision Record to `DecisionsAndAnalysis/decisions.md`.

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
