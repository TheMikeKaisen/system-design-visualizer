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
  description?: string;
  timelineLabel?: string;
  question?: string;
  explanation?: string;
  keyTakeaway?: string;
  interviewInsight?: string;
}

export interface ScenarioScriptStep {
  narrative: ScenarioNarrative;
  actions: ScenarioStep[];
  autoAdvance?: boolean;
  durationMs?: number;
  requiredExperiments?: string[];
  excludedExperiments?: string[];
  quiz?: {
    question: string;
    options: { text: string; correct: boolean }[];
    explanation: string;
  }[];
}

export interface ScenarioScript {
  id: string;
  title: string;
  steps: ScenarioScriptStep[];
}
