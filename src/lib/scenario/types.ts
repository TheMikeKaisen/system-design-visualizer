export type NodeStatus = "idle" | "processing" | "success" | "error";

export type ScenarioStep = 
  | { action: "tooltip"; nodeId: string; message: string }
  | { action: "highlight"; elementIds: string[] }
  | { action: "animate-asset"; sourceId: string; targetId: string; assetType: "file" | "binary" | "gear" | "dot"; durationMs: number }
  | { action: "show-code"; nodeId: string; codeSnippet: string }
  | { action: "clear" }
  | { action: "node-status"; nodeId: string; status: NodeStatus };

export interface ScenarioNarrative {
  title: string;
  description: string;
}

export interface ScenarioScriptStep {
  narrative: ScenarioNarrative;
  actions: ScenarioStep[];
  autoAdvance?: boolean; // If false, guided mode pauses here
  durationMs?: number; // How long to wait before auto-advancing
  requiredExperiments?: string[]; // Only run if ALL these are active
  excludedExperiments?: string[]; // Only run if NONE of these are active
}

export interface ScenarioScript {
  id: string;
  title: string;
  steps: ScenarioScriptStep[];
}
