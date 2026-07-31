export interface OOPVariable {
  id: string;
  name: string;
  type: string; // e.g., 'int', 'String', 'Student'
  value: string; // "null", "0", "@1001", '"Aditya"'
  isReference: boolean;
  refId?: string; // If it's a reference, what heap object ID it points to
}

export interface OOPStackFrame {
  id: string;
  methodName: string;
  variables: OOPVariable[];
  isActive: boolean;
}

export interface OOPHeapObject {
  id: string; // e.g., "@1001"
  className: string;
  fields: OOPVariable[];
  isNew?: boolean; // For tracking newly created objects to trigger bloom animation
  highlightedFieldId?: string; // For tracking which field is currently being mutated
}

export interface OOPMemoryState {
  id: string;
  explanation: string;
  code: string;
  activeLine: number | null;
  stackFrames: OOPStackFrame[];
  heapObjects: OOPHeapObject[];
  consoleOutput: string[];
}

export interface OOPSimulationScenario {
  id: string;
  title: string;
  description: string;
  steps: OOPMemoryState[];
}
