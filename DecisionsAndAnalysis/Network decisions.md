# Computer Networks — Architectural Decisions & Episode Standards

> [!IMPORTANT]
> **MANDATE FOR ALL FUTURE AGENTS & CONTRIBUTORS**:
> Episode 1 (*IP Addresses, Ports & Sockets — How Network Connections Work*) is the gold standard for all future Computer Networks episodes (e.g., DNS Resolution, Subnetting & Routing, TLS 1.3 Handshake, HTTP/2 & HTTP/3 Multiplexing).
> 
> **THE ZERO-DUPLICATION PRINCIPLE ACROSS ALL SCREEN SIZES**:
> 1. **NEVER** create a new component if an existing component or primitive already exists.
> 2. **ALWAYS** reuse the established components (`NetworkEpisodeShell`, `ScenarioDropdown`, `NetworkPlaybackBar`, `useNetworkKeyboardShortcuts`, `InteractiveExplanationBar`, `NetworkTopologyCanvas`, `SocketTablePanel`, `PacketInspectorPanel`) for **both larger (desktop/laptop) and shorter (mobile/tablet) screens**.
> 3. **DO NOT** create separate or divergent playback bars, headers, or shells for different screen sizes. The canonical components already encapsulate the responsive bifurcations cleanly.
> 4. **DO NOT** deviate from this architecture unless a future episode introduces an entirely new conceptual paradigm (e.g., 3D routing mesh) that cannot be expressed with existing components.

---

## 1. Episode Anatomical Standard

Every Computer Networks episode must adhere to this unified structural layout:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Standard Episode Navigation Bar                                     │
│    [ < Back ]  |  EPISODE X  •  Episode Title    [ ScenarioDropdown ▾] │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Interactive Docked Explanation Bar                                  │
│    [● Pulse] [Step X of Y] [Context Badge]  Step Title                 │
│    Narrative paragraph with in-situ highlighted keywords               │
│    [Inspect Concepts: ▾ Chip 1, ▾ Chip 2]                              │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Main Stage (Desktop: 2-Column Grid | Mobile: Vertically Scrollable) │
│    ┌───────────────────────────────┬─────────────────────────────────┐ │
│    │ Left (7 Cols):                │ Right (5 Cols):                 │ │
│    │ Network Topology Canvas       │ Tabbed Telemetry Context Panel  │ │
│    │ - Client Host & Ports         │ [ Sockets (N) ] [ Packet (•) ]  │ │
│    │ - Wire Substrate & Bus        │ ─────────────────────────────── │ │
│    │ - In-Flight Packet Transition │ Active tab view: Socket Table   │ │
│    │ - Server Host & Interfaces    │ or Wire Packet Inspector        │ │
│    └───────────────────────────────┴─────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Persistent Bottom Playback Controller (Sticky on Mobile)            │
│    Timeline Step X/Y  |  [↺ Reset] [< Prev] [▶ Play] [Next >]  | Speed │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Reusable Primitives Registry

Future agents must directly import and reuse these verified primitives:

| Component / Utility | File Path | Purpose & Capabilities |
| :--- | :--- | :--- |
| **`NetworkEpisodeShell`** | [`src/components/network-simulator/NetworkEpisodeShell.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/network-simulator/NetworkEpisodeShell.tsx) | Master responsive shell coordinating simulation store, auto-play timers, keyboard shortcuts, and viewports. |
| **`ScenarioDropdown`** | [`src/components/ui/ScenarioDropdown.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/ScenarioDropdown.tsx) | Accessible, framer-motion powered scenario selector with active indicators, badges, keyboard navigation (<kbd>↑</kbd>/<kbd>↓</kbd>/<kbd>Esc</kbd>), and mobile containment. |
| **`InteractiveExplanationBar`** | [`src/components/network-simulator/InteractiveExplanationBar.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/network-simulator/InteractiveExplanationBar.tsx) | Educational narrative parser highlighting 25+ networking keywords, step concept chips, and touch-persistent concept popovers with terminal examples (`ss`, `tcpdump`, `lsof`, `sysctl`). |
| **`useNetworkKeyboardShortcuts`** | [`src/hooks/useNetworkKeyboardShortcuts.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/hooks/useNetworkKeyboardShortcuts.ts) | Unified keyboard controls: <kbd>Space</kbd> (play/pause), <kbd>→</kbd> (next step), <kbd>←</kbd> (prev step), <kbd>R</kbd> (reset), with text input exclusion. |
| **`useNetworkSimulationStore`** | [`src/store/useNetworkSimulationStore.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/store/useNetworkSimulationStore.ts) | Zustand discrete simulation store with deterministic state transitions, step bounds checking, and `resolveSelectedSocket` preserving selection across steps. |
| **`NetworkTopologyCanvas`** | [`src/components/network-simulator/NetworkTopologyCanvas.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/network-simulator/NetworkTopologyCanvas.tsx) | Host endpoint visualization (MAC, IP, dynamic applications, local ports) and wire bus with in-flight packet animations respecting `prefers-reduced-motion`. |
| **`SocketTablePanel`** | [`src/components/network-simulator/SocketTablePanel.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/network-simulator/SocketTablePanel.tsx) | Kernel socket telemetry table rendering protocol, local address:port, peer address:port, state, and process name with accessible listbox selection. |
| **`PacketInspectorPanel`** | [`src/components/network-simulator/PacketInspectorPanel.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/network-simulator/PacketInspectorPanel.tsx) | Multi-layer wire inspection (Ethernet frame, IP packet, TCP segment, Application payload), 8-bit TCP control flags register (`RFC 793`), active layer illumination, and 4-tuple correlation. |
| **`NetworkPlaybackBar`** | [`src/components/network-simulator/NetworkPlaybackBar.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/network-simulator/NetworkPlaybackBar.tsx) | Unified playback controller. On mobile (`< sm`), attaches fixed at the bottom with a focused 3-button layout (`Prev`, `Play`, `Next`) without keyboard shortcut text or step count. On desktop (`sm:`), expands into a full static footer with timeline step count, reset button, speed controls, and keyboard shortcut legends. |
| **`EpisodeCard`** | [`src/components/ui/EpisodeCard.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/ui/EpisodeCard.tsx) | Catalog card for subject overview pages with dynamic badges, scenario pills, and accessible links. |
| **`EditorialDisciplineCard`** | [`src/components/learning-paths/EditorialDisciplineCard.tsx`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/components/learning-paths/EditorialDisciplineCard.tsx) | Catalog card for `/learning-paths` with side-by-side icon and title, dynamic episode badge, and curated topic pills. |

---

## 3. Core Architectural Decisions for Computer Networks

### Decision 1: Deterministic Data-Driven Engine
- The simulation logic is 100% decoupled from animation and presentation.
- Every scenario is defined as a series of discrete `NetworkSimulationStep` states in [`scenarios.ts`](file:///C:/Users/computer/Downloads/system-design-visualizer/system-design-visualizer/src/lib/network-simulator/scenarios.ts).
- Animation (packet motion along the wire, state pulses) is purely an illustrative projection of the deterministic state and never determines simulation progress.
- Jumping directly to any step index (via slider or controls) renders the exact state deterministically without race conditions or transition artifacts.

### Decision 2: Socket State Retention Across Navigation
- When learners step forward or backward through timeline steps, their selected socket inspection must **not** be reset to index 0 if that socket remains present in the target step.
- `useNetworkSimulationStore` uses `resolveSelectedSocket`:
  - First attempts exact ID match (`s.id === selectedSocket.id`).
  - Next attempts 4-tuple match (`(srcIP, srcPort, destIP, destPort)`).
  - Falls back gracefully to `activeSockets[0]` only if the selected socket was legitimately closed or destroyed.

### Decision 3: Authentic Protocol Fidelity
- **TCP Control Flags Register**: Display the RFC 793 8-bit control register (`[CWR|ECE|URG|ACK|PSH|RST|SYN|FIN]`) with illuminated active bits in the Wire Packet Inspector.
- **Socket 4-Tuple Demux**: In multi-client scenarios, explicitly visualize how multiple TCP connections to port 80/443 coexist on the server by virtue of distinct client source ports.
- **Port Conflict Handling**: Demonstrate `EADDRINUSE` failures when two applications attempt to bind to the same IP:port without `SO_REUSEPORT`.
- **Wire Dissection**: Visually distinguish encapsulated layers from pending unencapsulated layers during protocol stack traversal.

### Decision 4: Mobile-First Responsiveness & Viewport Ergonomics (Larger vs Shorter Screens)
- **Large & Desktop Viewport (`lg:` / `xl:`)**:
  - Two-column grid stage (`lg:grid-cols-12`) with side-by-side Topology Canvas (7 cols) and Context Telemetry (5 cols).
  - Fixed viewport containment (`lg:h-screen lg:overflow-hidden`) preventing unnecessary full-page scrolling while maximizing concurrent visual data.
  - Desktop playback bar sits as a clean layout footer with full step counter (`Step X of Y`), reset button (`Reset (R)`), speed selector pills (`1x`, `1.5x`, `2x`), and keyboard shortcut hints (`Space`, `←`, `→`).
- **Shorter & Mobile Viewport (`< lg` / `< sm`)**:
  - The outer shell is scrollable (`min-h-screen overflow-y-auto`) — **NEVER** lock mobile viewports in `h-screen overflow-hidden`.
  - The Topology Canvas and Context Panels stack naturally in vertical document flow.
  - The playback bar (`NetworkPlaybackBar`) becomes **fixed at the viewport bottom** (`fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md`) with hardware safe-area padding (`pb-[env(safe-area-inset-bottom)]`).
  - On smaller screens (`< sm`), it renders **only** the 3 core controls: `Previous`, `Play / Pause`, and `Next`. Timeline step text, reset button, speed selectors, and keyboard shortcut legends are hidden to avoid clutter.
  - Main container has bottom clearance (`pb-20 sm:pb-4`) to ensure the bottommost items in the socket table and packet inspector are never occluded behind the fixed dock.
  - All interactive elements use `touch-manipulation`, minimum 44px tap targets, and `:active` press feedback (`active:scale-95`).

### Decision 5: Touch-Persistent Concept Dialogues & Auto-Open Prevention
- **Desktop Interaction**: Hovering over highlighted narrative keywords or concept chips displays an educational popover after a 140ms intent delay. Moving the mouse away dismisses it after 180ms. Clicking pins it open.
- **Mobile & Touch Devices (`pointer: coarse` / `hover: none`)**:
  - **Auto-Open Prevention**: Hover and focus listeners must **NEVER** automatically open popovers on touch devices. Synthetic mouse events during finger scrolling and DOM focus shifts are completely ignored.
  - **Explicit Tap Activation**: Concept dialogues only open upon deliberate user tap (`onClick`), pinning the dialog open with a dimming backdrop (`fixed inset-0 bg-black/60`).
  - **Deterministic Cleanup on Navigation**: Whenever the user navigates steps (`safeIndex` changes via `Next`, `Prev`, `Reset`, or scenario switch), any active concept dialogue and pending timeouts are immediately cleared to prevent dialogs from lingering across steps.
  - **Dismissal**: Can be dismissed by tapping the `<X>` close button, tapping the backdrop/outside, or pressing <kbd>Esc</kbd>. Learners can comfortably scroll through commands on small screens without accidental dismissal.

---

## 4. Verification Protocol for Future Episodes

Before declaring completion of any new Computer Networks episode or scenario:
1. **Scenario Integrity Test**: Add unit tests in `src/lib/network-simulator/__tests__/` asserting step progression, packet presence, socket state transitions, and step note completeness.
2. **TypeScript Compilation**: `npx tsc --noEmit` must pass with **0 errors**.
3. **ESLint Verification**: `npx eslint <touched_files>` must pass with **0 errors and 0 warnings**.
4. **Vitest Suite**: `npm test` must pass all test suites green.
5. **Mandatory Rule #1**: **NEVER run `git add`, `git commit`, or `git push`**. All changes must remain unstaged in the working tree for user inspection.
