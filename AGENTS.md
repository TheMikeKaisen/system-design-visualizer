<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## JavaScript Simulation Guidelines
When creating new "Episodes" or Scenarios (like the Call Stack simulator), abide by these 5 core rules:

1. **Data-Driven State Isolation**: Never hardcode simulation logic into React components. Define a strict, step-by-step `SimulationScenario` JSON/Object model. Every change in the stack, memory, or UI overlay must be represented as a discrete "Step" in the data layer.
2. **The "Transparency" Rendering Principle**: When rendering arrays/stacks (like Call Stacks, Memory Heaps, or Queues), render the ENTIRE collection. Highlight and expand the active element, but always render inactive/suspended elements in a collapsed or dimmed state. Do not hide background contexts.
3. **Strict React Key Strategies**: Never use array indices as React `key` props when mapping simulation data. Construct unique, deterministic keys (e.g., `key={\`\${executionContext.id}-\${variable.name}\`}`) to prevent severe state-leakage and animation bugs during context swaps.
4. **Explicit Theming for "Terminal" UIs**: When building panels with forced backgrounds (like a dark Code Editor or black Console), hardcode the text colors (e.g., `text-gray-200`). Standard adaptive classes like `text-foreground` will invert to black in Light Mode and become invisible.
5. **Multi-modal Feedback Architecture**: Every simulation step must contain multiple vectors of feedback. The data model should support: a text explanation (Banner), a brief notification (Toast), and a visual spotlight/overlay action (e.g., "Looking for variable...").
6. **Execution Context Lifecycle**: When creating scenarios that deal with the execution context, ensure that the execution context (call stack) is explicitly empty in the very first step (Engine Initialization), and empty again in the final step (Engine Destruction or Halted state), mirroring the design of Episodes 1 and 2.
7. **Strict Two-Phase Context Creation**: Every new Execution Context pushed to the Call Stack MUST undergo a discrete "Creation Phase" step before any "Execution Phase" steps. During the "Creation Phase" step, you must highlight the function declaration line. `var` variables must be initialized to `undefined`, and `let`/`const` variables must be explicitly set to `<TDZ>`. You may not "fast-forward" variable assignments. You must transition to the "Execution Phase" in subsequent steps, explicitly highlighting each variable assignment line one-by-one as the engine parses them.
