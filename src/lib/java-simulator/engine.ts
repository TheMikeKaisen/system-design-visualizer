export interface JavaSimulationState {
  id: string;
  explanation: string;
  toastMessage?: string;
  code: string;
  activeLine: number | null;
  
  // Bit Representation State
  sourceBits?: string; 
  sourceType?: 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'char' | 'boolean';
  sourceValue?: string;
  
  targetBits?: string; 
  targetType?: 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'char' | 'boolean';
  targetValue?: string;
  
  // Special Visual Effects
  visualEffect?: {
    type: 'none' | 'bit-surgery' | 'odometer' | 'red-wall' | 'fractional-erasure' | 'precision-loss' | 'unicode-lookup';
    surgeryDraggable?: boolean; // For user interaction
    blockedReason?: string; // For red-wall
    odometerValues?: number[]; // For odometer
    erasedFraction?: string; // For fractional erasure
  };

  // Interview Challenge Mode
  challenge?: {
    question: string;
    options: string[];
    correctAnswer: number; // index
    notes?: string;
  };
}

export interface JavaSimulationScenario {
  id: string;
  title: string;
  description: string;
  isChallengeMode?: boolean;
  steps: JavaSimulationState[];
}
