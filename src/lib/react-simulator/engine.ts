// ---------------------------------------------------------------------------
// VIRTUAL DOM / REAL DOM (used by Episode 1)
// ---------------------------------------------------------------------------
export interface VirtualDOMNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children: (VirtualDOMNode | string)[];
  diffStatus?: "added" | "removed" | "changed" | "unchanged" | "none";
}

export interface RealDOMNode {
  id: string;
  type: string;
  text?: string;
  attributes: Record<string, string>;
  children: RealDOMNode[];
  highlight?: boolean;
}

// ---------------------------------------------------------------------------
// COMPONENT TREE (used by Episode 2 — Props & One-Way Data Flow)
// ---------------------------------------------------------------------------
export interface ComponentTreeNode {
  id: string;
  name: string;
  isActive?: boolean;      // highlighted with glowing border
  isParent?: boolean;
  state?: { name: string; value: string }[];
  props?: {
    name: string;
    value: string;
    isFunction?: boolean;
    isReadOnly?: boolean;
    isNew?: boolean;
  }[];
  children: ComponentTreeNode[];
}

// Props Inspector panel (Episode 2)
export interface PropsInspectorEntry {
  name: string;
  value: string;
  isFunction?: boolean;
  isReadOnly?: boolean;
  isNew?: boolean; // animate highlight when value changes
}

// ---------------------------------------------------------------------------
// SNAPSHOT + UPDATE QUEUE (used by Episode 3 — useState Batching)
// ---------------------------------------------------------------------------
export interface SnapshotEntry {
  name: string;
  value: string;
  isStale?: boolean; // red/amber highlight — reading stale value
}

export interface UpdateQueueEntry {
  id: string;
  type: "value" | "fn";
  displayLabel: string;  // e.g. "set 1" or "prev => prev + 1"
  resolvedTo?: string;   // shown after processing
  isProcessed?: boolean;
  isStale?: boolean;     // marks value-based calls that used a stale snapshot
}

// ---------------------------------------------------------------------------
// NOTES (shared)
// ---------------------------------------------------------------------------
export interface StepNote {
  title: string;
  content: string;
}

// ---------------------------------------------------------------------------
// STEP STATE — single unified model for all episodes
// ---------------------------------------------------------------------------
export interface ReactStepState {
  id: string;
  explanation: string;
  toastMessage?: string;
  notes?: StepNote[];

  // --- Episode 1: Code Panel ---
  jsxCode?: string;
  compiledCode?: string;
  activeLine?: number;
  showCompiled?: boolean;

  // --- Episode 1: Trees ---
  virtualDom?: VirtualDOMNode | null;
  oldVirtualDom?: VirtualDOMNode | null;
  realDom?: RealDOMNode | null;

  // --- Episode 1: Visual effects ---
  activeAction?: string; // e.g. "reconciliation", "diffing"

  // --- Episode 2: Props & State ---
  componentTree?: ComponentTreeNode | null;
  propsInspector?: PropsInspectorEntry[] | null;

  // --- Episode 3: useState Batching ---
  snapshotValues?: SnapshotEntry[];
  updateQueue?: UpdateQueueEntry[];
  resolvedValue?: string | null;  // final value after queue processing
  renderCount?: number;           // which render cycle we're on

  // --- Episode 4: useEffect Lifecycle ---
  effectPhase?: "render" | "dom-update" | "paint" | "effect-runs" | null;
  depArrayMode?: "no-array" | "empty" | "with-value";  // which dep array form is shown
  depArrayCurrent?: string | null;   // e.g. '"u2"'
  depArrayPrevious?: string | null;  // e.g. '"u1"' or 'none (first render)'
  depArrayChanged?: boolean;         // true = red (run), false = green (skip)

  // --- Episode 5: Cleanup & Race Conditions ---
  cleanupMoment?: "first-run" | "dep-changed" | "unmount" | null; // which lifecycle moment is active
  cleanupPhase?: "effect-setup" | "cleanup-runs" | "new-effect" | null; // within a dep-change sequence
  raceConditionRequests?: RaceConditionRequest[]; // in-flight requests for race panel
  cancelledRequestId?: string | null; // which request was blocked by cleanup

  // --- Episode 6: useLayoutEffect Timing ---
  timingMode?: "use-effect" | "use-layout-effect" | "both";
  useEffectPhaseActive?: "render" | "dom-update" | "paint" | "effect" | null;
  useLayoutEffectPhaseActive?: "render" | "dom-update" | "layout-effect" | "paint" | null;
  viewportElementPosition?: "initial" | "wrong" | "correct";
  viewportShowFlickerFlash?: boolean; // triggers the flicker animation
  viewportLabel?: string;             // label on the element in the viewport

  // --- Episode 7: useRef ---
  useRefMode?: "state-vs-ref" | "dom-ref" | "react-memory" | null;
  stateValue?: number | string | null;
  refValue?: number | string | null;
  letValue?: number | string | null;
  isRenderTriggered?: boolean;
  domNodeExists?: boolean;
  refCurrentStatus?: "null" | "dom-node";
  activeBoxId?: string; 
  boxShelfStatus?: "shelf" | "handed-down" | "mutating" | null;
}

// ---------------------------------------------------------------------------
// RACE CONDITION PANEL (used by Episode 5)
// ---------------------------------------------------------------------------
export interface RaceConditionRequest {
  id: string;
  label: string;       // e.g. 'Fetch user "u1"'
  status: "in-flight" | "resolved" | "blocked" | "applied";
  isSlow?: boolean;    // the stale request that arrives late
}

// ---------------------------------------------------------------------------
// SCENARIO
// ---------------------------------------------------------------------------
export type LayoutMode = "vdom" | "props-flow" | "usestate-batching" | "use-effect" | "use-effect-cleanup" | "use-layout-effect" | "use-ref";

export interface ReactSimulationScenario {
  id: string;
  title: string;
  description: string;
  layoutMode: LayoutMode;
  steps: ReactStepState[];
}
