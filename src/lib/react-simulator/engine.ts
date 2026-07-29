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
  highlight?: boolean; // For flashing when updated
}

export interface ReactStepState {
  id: string;
  explanation: string;
  toastMessage?: string;
  
  // Code Panel
  jsxCode?: string;
  compiledCode?: string;
  activeLine?: number;
  showCompiled?: boolean; // Whether to show Babel output instead of JSX

  // Trees
  virtualDom?: VirtualDOMNode | null;
  oldVirtualDom?: VirtualDOMNode | null;
  realDom?: RealDOMNode | null;

  // Visual effects
  activeAction?: string; // e.g., "reconciliation", "diffing"
}

export interface ReactSimulationScenario {
  id: string;
  title: string;
  description: string;
  steps: ReactStepState[];
}
