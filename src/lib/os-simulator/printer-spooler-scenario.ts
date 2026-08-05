export interface ChapterMeta {
  title: string;
  startStep: number;
  endStep: number;
}

export interface SpoolerStepState {
  activeProcess: "processA" | "processB" | "none";
  processAState: "running" | "suspended" | "idle" | "terminated";
  processBState: "running" | "suspended" | "idle" | "terminated";
  processACodeLine: number | null;
  processBCodeLine: number | null;
  registerRa: number | null;
  registerRb: number | null;
  sharedIN: number;       // The shared "next free slot" pointer
  isContextSwitch: boolean;
  spoolerSlots: (string | null)[]; // 8-slot array of filenames
  corruptedSlot: number | null;    // index of the overwritten slot
  explanation: string;
  noteTitle?: string;
  noteContent?: string;
  toastMessage?: string;
  chapter: string;
}

export interface SpoolerScenario {
  id: string;
  title: string;
  description: string;
  chapters: ChapterMeta[];
  steps: SpoolerStepState[];
}

const INITIAL_SPOOLER = [
  "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
  "doc5.pdf", "doc6.pdf", "doc7.pdf", null
] as (string | null)[];

export const PRINTER_SPOOLER_SCENARIO_A: SpoolerScenario = {
  id: "printer-spooler-a",
  title: "Process B's Job is Lost",
  description: "Process A is preempted after reading IN. Process B completes its print job queueing. Then A resumes and overwrites B's job.",
  chapters: [
    { title: "What Are We Watching?", startStep: 0, endStep: 3 },
    { title: "The Race Begins (Scenario A)", startStep: 4, endStep: 11 },
    { title: "The Verdict", startStep: 12, endStep: 13 },
  ],
  steps: [
    {
      chapter: "What Are We Watching?",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Welcome to Episode 6. We have a Printer Spooler Directory with 8 slots. 7 are full. Both Process A and Process B want to print a file.",
      noteTitle: "The Spooler Directory",
      noteContent: "Instead of sending jobs straight to the printer, processes put files in a directory. A background 'printer daemon' reads them one by one.",
    },
    {
      chapter: "What Are We Watching?",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "The OS uses a shared variable called 'IN' to track the next empty slot. Right now, IN = 7.",
      noteTitle: "The Shared Variable",
      noteContent: "Both processes need to read IN, write their file into that slot, and then update IN to point to the next free slot.",
    },
    {
      chapter: "What Are We Watching?",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Because there's only one slot left, this is a race. If they don't coordinate, things will go wrong.",
      noteTitle: "Read-Modify-Write",
      noteContent: "Queueing a print job is a Read-Modify-Write sequence. It is not atomic. The OS can interrupt a process halfway through.",
    },
    {
      chapter: "What Are We Watching?",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Let's watch what happens when Process A gets interrupted right after reading the IN variable.",
      noteTitle: "Registers",
      noteContent: "Each process has a private register (Ra and Rb) to hold its local copy of the IN variable while it works.",
      toastMessage: "Starting Simulation"
    },
    // Race Begins
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "processA",
      processAState: "running",
      processBState: "idle",
      processACodeLine: 0,
      processBCodeLine: null,
      registerRa: 7,
      registerRb: null,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Process A runs first. It reads the shared IN variable (7) and stores it in its private register (Ra). It plans to use slot 7.",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "none",
      processAState: "suspended",
      processBState: "idle",
      processACodeLine: 0,
      processBCodeLine: null,
      registerRa: 7,
      registerRb: null,
      sharedIN: 7,
      isContextSwitch: true,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "BAM! The OS's clock interrupt fires. The CPU scheduler forcibly suspends Process A to let another process run.",
      noteTitle: "Context Switch",
      noteContent: "Process A's state (Ra = 7) is saved to its PCB. It is now asleep, blissfully unaware of what's about to happen.",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 0,
      processBCodeLine: 0,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Process B wakes up and starts its code. It also reads the shared IN variable. Since A never updated it, B also reads 7 into its register (Rb).",
      noteTitle: "The Fatal Flaw",
      noteContent: "Both processes now firmly believe that slot 7 belongs to them.",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 0,
      processBCodeLine: 1,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: null,
      explanation: "Process B continues executing. It writes its print job ('report.pdf') into slot 7.",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 0,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: null,
      explanation: "Process B finishes by incrementing its local copy (Rb+1 = 8) and storing it back into the shared IN variable. B is done!",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "none",
      processAState: "suspended",
      processBState: "terminated",
      processACodeLine: 0,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: true,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: null,
      explanation: "Process B terminates. The OS schedules Process A to run again, restoring its saved state (Ra = 7).",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "processA",
      processAState: "running",
      processBState: "terminated",
      processACodeLine: 1,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: 7,
      explanation: "DISASTER! Process A resumes where it left off. It writes its file ('photo.jpg') into slot 7 (because Ra=7), completely overwriting B's 'report.pdf'!",
      noteTitle: "Lost Update",
      noteContent: "Process A had no idea that Process B had snuck in and used slot 7 while it was asleep.",
    },
    {
      chapter: "The Race Begins (Scenario A)",
      activeProcess: "processA",
      processAState: "running",
      processBState: "terminated",
      processACodeLine: 2,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: 7,
      explanation: "Process A increments its local copy (Ra+1 = 8) and stores it into IN. The IN variable was already 8, so it doesn't change.",
    },
    // Verdict
    {
      chapter: "The Verdict",
      activeProcess: "none",
      processAState: "terminated",
      processBState: "terminated",
      processACodeLine: 2,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: 7,
      explanation: "The printer daemon will print 'photo.jpg', but Process B's 'report.pdf' is gone forever. To the OS, nothing looks wrong because IN is correct.",
      noteTitle: "Silent Failure",
      noteContent: "Unlike a crash, race conditions cause silent data corruption. Process B will sit there wondering why its document never printed.",
    },
    {
      chapter: "The Verdict",
      activeProcess: "none",
      processAState: "terminated",
      processBState: "terminated",
      processACodeLine: 2,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: 7,
      explanation: "This is why we need Critical Sections! We must use Mutexes or Semaphores to lock the spooler directory so only one process can access it at a time.",
    }
  ]
};

export const PRINTER_SPOOLER_SCENARIO_B: SpoolerScenario = {
  id: "printer-spooler-b",
  title: "Process A's Job is Lost",
  description: "Process B is preempted first. Process A queues its job, then Process B overwrites it.",
  chapters: [
    { title: "The Race Begins (Scenario B)", startStep: 0, endStep: 7 },
    { title: "The Verdict", startStep: 8, endStep: 9 },
  ],
  steps: [
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "processB",
      processAState: "idle",
      processBState: "running",
      processACodeLine: null,
      processBCodeLine: 0,
      registerRa: null,
      registerRb: 7,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Let's reverse it. This time, Process B runs first. It reads IN=7 into its register Rb.",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "none",
      processAState: "idle",
      processBState: "suspended",
      processACodeLine: null,
      processBCodeLine: 0,
      registerRa: null,
      registerRb: 7,
      sharedIN: 7,
      isContextSwitch: true,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Context Switch! The OS preempts Process B.",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "processA",
      processAState: "running",
      processBState: "suspended",
      processACodeLine: 0,
      processBCodeLine: 0,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [...INITIAL_SPOOLER],
      corruptedSlot: null,
      explanation: "Process A starts. It also reads IN=7 into Ra.",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "processA",
      processAState: "running",
      processBState: "suspended",
      processACodeLine: 1,
      processBCodeLine: 0,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 7,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: null,
      explanation: "Process A writes 'photo.jpg' into slot 7.",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "processA",
      processAState: "running",
      processBState: "suspended",
      processACodeLine: 2,
      processBCodeLine: 0,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: null,
      explanation: "Process A updates IN to 8. Process A is completely finished.",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "none",
      processAState: "terminated",
      processBState: "suspended",
      processACodeLine: 2,
      processBCodeLine: 0,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: true,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "photo.jpg"
      ],
      corruptedSlot: null,
      explanation: "Process A terminates. The OS resumes Process B.",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "processB",
      processAState: "terminated",
      processBState: "running",
      processACodeLine: 2,
      processBCodeLine: 1,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: 7,
      explanation: "DISASTER! Process B resumes, looks at its old saved register (Rb=7), and writes 'report.pdf' into slot 7, destroying Process A's photo!",
    },
    {
      chapter: "The Race Begins (Scenario B)",
      activeProcess: "processB",
      processAState: "terminated",
      processBState: "running",
      processACodeLine: 2,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: 7,
      explanation: "Process B sets IN to 8 (Rb+1), unaware of the destruction it caused.",
    },
    {
      chapter: "The Verdict",
      activeProcess: "none",
      processAState: "terminated",
      processBState: "terminated",
      processACodeLine: 2,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: 7,
      explanation: "This time, Process A's 'photo.jpg' was permanently lost.",
    },
    {
      chapter: "The Verdict",
      activeProcess: "none",
      processAState: "terminated",
      processBState: "terminated",
      processACodeLine: 2,
      processBCodeLine: 2,
      registerRa: 7,
      registerRb: 7,
      sharedIN: 8,
      isContextSwitch: false,
      spoolerSlots: [
        "doc1.pdf", "doc2.pdf", "doc3.pdf", "doc4.pdf", 
        "doc5.pdf", "doc6.pdf", "doc7.pdf", "report.pdf"
      ],
      corruptedSlot: 7,
      explanation: "No matter which process gets interrupted, if we don't lock the critical section, data will be lost.",
    }
  ]
};
