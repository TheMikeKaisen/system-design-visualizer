export interface JavaArrayScenario {
  id: string;
  title: string;
  description: string;
  steps: JavaArrayState[];
}

export interface JavaArrayState {
  id: string;
  explanation: string;
  notes?: { title: string; content: string }[];
  toastMessage?: string;
  code: string;
  activeLine: number | null;

  // The JVM Memory Areas
  stack: StackFrame[];
  heap: Record<string, HeapObject>; // Keyed by address e.g., "0x100"

  // Global visual flags
  showObjectHeaders?: boolean;
  showByteLevel?: boolean;
  highlightedAddresses?: string[];
}

export interface StackFrame {
  name: string; // e.g. "main()"
  variables: StackVariable[];
}

export interface StackVariable {
  name: string;
  type: string;
  value: string | number | boolean | null; 
  // If it's a reference, 'value' should match a key in the heap (e.g. "0x100"), 
  // or be "null". Otherwise it's a literal primitive (e.g. "5").
}

export type HeapObject = PrimitiveArray | ObjectArray | ClassInstance;

export interface PrimitiveArray {
  type: "PrimitiveArray";
  elementType: "int" | "byte" | "boolean" | "short" | "long" | "float" | "double" | "char";
  length: number;
  elements: (number | string | boolean)[];
  isGarbageCollected?: boolean;
}

export interface ObjectArray {
  type: "ObjectArray";
  elementType: string; // e.g., "Student" or "int[]"
  length: number;
  elements: (string | null)[]; // Array of heap addresses or null
  isGarbageCollected?: boolean;
}

export interface ClassInstance {
  type: "ClassInstance";
  className: string;
  fields?: Record<string, string | number | boolean | null>;
  isGarbageCollected?: boolean;
}
