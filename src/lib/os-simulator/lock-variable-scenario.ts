export interface LockStepState {
  activeProcess: "processA" | "processB" | "none";
  processAState: "running" | "suspended" | "idle" | "busy-waiting" | "terminated";
  processBState: "running" | "suspended" | "idle" | "busy-waiting" | "terminated";
  processACodeLine: number | null; // index into PROCESS_A_CODE_NAIVE or TSL code
  processBCodeLine: number | null;
  registerRa: number | null; // Process A's private register copy of LOCK
  registerRb: number | null; // Process B's private register copy of LOCK
  sharedLock: 0 | 1;         // The single shared LOCK variable in memory
  lockHeldBy: "processA" | "processB" | "none";
  lockRaceDetected: boolean;  // true when both processes simultaneously believe LOCK is 0
  isContextSwitch: boolean;
  isAtomicTSL: boolean;       // true on the TSL step in Scenario B — triggers special glow
  explanation: string;
  noteTitle?: string;
  noteContent?: string;
  chapter: string;
}

export interface LockScenario {
  id: string;
  title: string;
  description: string;
  steps: LockStepState[];
}

// ────────────────────────────────────────────────────────────────────────────
// SCENARIO A: Naive Lock Variable — The Race Condition
// Process A checks lock (sees 0), gets preempted, Process B also sees 0 and
// enters. A resumes and also enters. Both are in the critical section. 💥
// ────────────────────────────────────────────────────────────────────────────
export const LOCK_VARIABLE_SCENARIO_A: LockScenario = {
  id: "lock-variable-naive",
  title: "The Race Condition (Lock Fails)",
  description:
    "A context switch between the CHECK and the SET lets both processes see LOCK = 0 and enter the critical section simultaneously.",
  steps: [
    // ── Prologue ──────────────────────────────────────────────────────────
    {
      chapter: "The Promised Fix",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "After seeing the Printer Spooler disaster, a programmer proposes a fix: a shared LOCK variable. If LOCK = 0, the resource is free. If LOCK = 1, someone is using it. Simple, right?",
      noteTitle: "The Lock Variable Idea",
      noteContent:
        "Before entering the critical section, a process checks LOCK. If it is 0, it sets it to 1 and proceeds. When done, it sets LOCK back to 0. This is the earliest software attempt at mutual exclusion.",
    },
    {
      chapter: "The Promised Fix",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "The `while (LOCK == 1)` loop compiles into 3 assembly instructions: LOAD, CMP, and JNE. You can click '3 instructions ↗' above to see them. Let's watch what happens.",
      noteTitle: "Under the Hood: Assembly 101",
      noteContent:
        "The CPU doesn't understand `while` loops. It uses basic instructions: LOAD (read memory to CPU), CMP (Compare values), and JNE (Jump if Not Equal). Click '3 instructions ↗' to see the actual CPU commands executing this loop.",
    },

    // ── Process A starts ──────────────────────────────────────────────────
    {
      chapter: "Process A Starts",
      activeProcess: "processA",
      processAState: "running",
      processBState: "idle",
      processACodeLine: 0, // LOAD Ra, LOCK
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Process A wants to enter its critical section. It hits the `while` loop, which reads the shared LOCK value into its private CPU register.",
    },
    {
      chapter: "Process A Starts",
      activeProcess: "processA",
      processAState: "running",
      processBState: "idle",
      processACodeLine: 0, // LOAD Ra, LOCK
      processBCodeLine: null,
      registerRa: 0,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Ra = 0. The lock is free! Process A moves to the next underlying instruction to verify this.",
      noteTitle: "Two Separate Instructions",
      noteContent:
        "The critical flaw: reading the lock and setting it are TWO SEPARATE instructions. There is a window of vulnerability between them. The OS can interrupt any time.",
    },
    {
      chapter: "Process A Starts",
      activeProcess: "processA",
      processAState: "running",
      processBState: "idle",
      processACodeLine: 1, // CMP Ra, 0
      processBCodeLine: null,
      registerRa: 0,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Process A executes a CMP instruction under the hood. The condition 'lock is free' is TRUE. A is about to break out of the while loop...",
    },

    // ── Context Switch ────────────────────────────────────────────────────
    {
      chapter: "The Fatal Interrupt",
      activeProcess: "none",
      processAState: "suspended",
      processBState: "idle",
      processACodeLine: 1,
      processBCodeLine: null,
      registerRa: 0,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: true,
      isAtomicTSL: false,
      explanation:
        "CONTEXT SWITCH! The OS timer fires and preempts Process A — right after it confirmed the lock is free, but BEFORE it could write LOCK = 1 to claim it. Ra = 0 is saved on the stack.",
      noteTitle: "The Danger Zone",
      noteContent:
        "A is suspended mid-protocol. It has verified the lock is free but has NOT claimed it yet. The shared LOCK in memory is still 0.",
    },

    // ── Process B enters ──────────────────────────────────────────────────
    {
      chapter: "The Fatal Interrupt",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 1,
      processBCodeLine: 0, // LOAD Rb, LOCK
      registerRa: 0,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Process B gets the CPU. It also wants to enter its critical section. It hits the `while` loop and reads the shared LOCK variable into its own register.",
    },
    {
      chapter: "The Fatal Interrupt",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 1,
      processBCodeLine: 0,
      registerRa: 0,
      registerRb: 0,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Rb = 0. LOCK is still 0 in memory because A was suspended before it could write 1. From B's perspective, the lock looks completely free.",
    },
    {
      chapter: "The Fatal Interrupt",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 1,
      processBCodeLine: 1, // CMP Rb, 0
      registerRa: 0,
      registerRb: 0,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Process B executes a CMP instruction. Since Rb = 0, the condition is true. B breaks out of the `while` loop and proceeds to `LOCK = 1`.",
    },
    {
      chapter: "The Fatal Interrupt",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 1,
      processBCodeLine: 3, // STORE LOCK, 1
      registerRa: 0,
      registerRb: 0,
      sharedLock: 1,
      lockHeldBy: "processB",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Process B executes `LOCK = 1;`. It now believes it holds the lock and enters its critical section. LOCK in memory is now 1.",
      noteTitle: "B Is Inside",
      noteContent:
        "Process B is now executing inside the critical section. According to the protocol, the critical section should be exclusive — no other process should be able to enter right now.",
    },

    // ── A resumes ─────────────────────────────────────────────────────────
    {
      chapter: "Mutual Exclusion Violated",
      activeProcess: "none",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 1,
      processBCodeLine: 4,
      registerRa: 0,
      registerRb: 0,
      sharedLock: 1,
      lockHeldBy: "processB",
      lockRaceDetected: false,
      isContextSwitch: true,
      isAtomicTSL: false,
      explanation:
        "CONTEXT SWITCH! The OS brings Process A back. A's saved context is restored — Ra is still 0 (the stale value it read before being suspended).",
    },
    {
      chapter: "Mutual Exclusion Violated",
      activeProcess: "processA",
      processAState: "running",
      processBState: "running",
      processACodeLine: 3, // STORE LOCK, 1 — A thinks it's free, proceeds
      processBCodeLine: 4,
      registerRa: 0,
      registerRb: 0,
      sharedLock: 1,
      lockHeldBy: "processB",
      lockRaceDetected: true,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "A resumes from where it left off — its Ra is still 0, it already broke out of the `while` loop! It blindly executes `LOCK = 1;` and enters its critical section. BOTH processes are now inside. The lock failed completely.",
      noteTitle: "Mutual Exclusion = VIOLATED",
      noteContent:
        "Both Process A and Process B are simultaneously inside the critical section. The very race condition we tried to prevent has happened — inside the lock mechanism itself.",
    },
    {
      chapter: "Mutual Exclusion Violated",
      activeProcess: "none",
      processAState: "terminated",
      processBState: "terminated",
      processACodeLine: 4,
      processBCodeLine: 4,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "The lock variable failed because it takes at least 2 instructions to check-and-set — creating a window the OS can exploit. The solution requires hardware: an atomic Test-and-Set-Lock (TSL) instruction. Switch to Scenario B to see the fix.",
      noteTitle: "Key Insight",
      noteContent:
        "No purely software lock can close this gap on its own. The hardware must provide an atomic read-modify-write instruction that cannot be interrupted. This is what TSL does.",
    },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// SCENARIO B: TSL — The Hardware Fix
// TSL Reg, LOCK is one uninterruptible bus cycle. It atomically reads LOCK
// and sets it to 1. The second process correctly finds LOCK = 1 and waits.
// ────────────────────────────────────────────────────────────────────────────
export const LOCK_VARIABLE_SCENARIO_B: LockScenario = {
  id: "lock-variable-tsl",
  title: "TSL — The Hardware Fix",
  description:
    "The TSL instruction atomically reads and sets LOCK in one bus cycle. Even a context switch at the same moment cannot break mutual exclusion.",
  steps: [
    // ── Prologue ──────────────────────────────────────────────────────────
    {
      chapter: "The Hardware Solution",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "The TSL (Test and Set Lock) instruction is a special CPU operation. It reads the current value of LOCK into a register AND sets LOCK to 1 — all in a single, uninterruptible memory bus cycle.",
      noteTitle: "What is TSL?",
      noteContent:
        "TSL Reg, LOCK is equivalent to: { Reg = LOCK; LOCK = 1; } but executed atomically. The memory bus is locked during this operation — no other CPU or DMA device can access memory until TSL completes.",
    },
    {
      chapter: "The Hardware Solution",
      activeProcess: "none",
      processAState: "idle",
      processBState: "idle",
      processACodeLine: null,
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "The `test_and_set()` function compiles into a special `TSL` assembly instruction. Let's see this in action.",
      noteTitle: "The Key Difference",
      noteContent:
        "In Scenario A we had 2 instructions (LOAD then STORE). TSL collapses them into 1 atomic instruction — eliminating the vulnerability window entirely.",
    },

    // ── Process A claims lock with TSL ─────────────────────────────────────
    {
      chapter: "Process A Claims the Lock",
      activeProcess: "processA",
      processAState: "running",
      processBState: "idle",
      processACodeLine: 0, // TSL Ra, LOCK
      processBCodeLine: null,
      registerRa: null,
      registerRb: null,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: true,
      explanation:
        "Process A calls `test_and_set()`. Under the hood, this executes the atomic `TSL Ra, LOCK` instruction. In a single bus cycle, Ra receives the OLD value of LOCK (0), and LOCK is set to 1 in memory. This cannot be interrupted.",
      noteTitle: "Atomic = Uninterruptible",
      noteContent:
        "While TSL is executing, the memory bus is physically locked. Even if a timer interrupt fires at this exact moment, it is queued and only handled AFTER TSL completes.",
    },
    {
      chapter: "Process A Claims the Lock",
      activeProcess: "processA",
      processAState: "running",
      processBState: "idle",
      processACodeLine: 4,
      processBCodeLine: null,
      registerRa: 0,
      registerRb: null,
      sharedLock: 1,
      lockHeldBy: "processA",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "TSL completed. Ra = 0. LOCK is now 1 in memory. Process A checks `while (old != 0)`. The condition is false, so A successfully enters the critical section.",
      noteTitle: "Lock Claimed!",
      noteContent:
        "LOCK is now 1 in shared memory. Any other process that tries TSL now will get Ra = 1 (already locked) and be forced to busy-wait.",
    },

    // ── Context switch — exactly where it failed in Scenario A ──────────
    {
      chapter: "The Same Dangerous Moment",
      activeProcess: "none",
      processAState: "suspended",
      processBState: "idle",
      processACodeLine: 4,
      processBCodeLine: null,
      registerRa: 0,
      registerRb: null,
      sharedLock: 1,
      lockHeldBy: "processA",
      lockRaceDetected: false,
      isContextSwitch: true,
      isAtomicTSL: false,
      explanation:
        "CONTEXT SWITCH! The OS preempts Process A at the same moment it was preempted in Scenario A. But this time, LOCK is already 1 in memory because TSL was atomic.",
      noteTitle: "The Difference",
      noteContent:
        "In Scenario A, A was preempted BEFORE setting LOCK. Now with TSL, LOCK was set atomically during the same instruction. The context switch happens TOO LATE to matter.",
    },

    // ── Process B tries and is blocked ─────────────────────────────────────
    {
      chapter: "The Same Dangerous Moment",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "running",
      processACodeLine: 4,
      processBCodeLine: 0, // TSL Rb, LOCK
      registerRa: 0,
      registerRb: null,
      sharedLock: 1,
      lockHeldBy: "processA",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: true,
      explanation:
        "Process B gets the CPU and calls `test_and_set()`. The underlying atomic operation reads LOCK into Rb and sets LOCK to 1. But LOCK was already 1 — so Rb gets the value 1.",
    },
    {
      chapter: "The Same Dangerous Moment",
      activeProcess: "processB",
      processAState: "suspended",
      processBState: "busy-waiting",
      processACodeLine: 4,
      processBCodeLine: 2, // JNE — loop back
      registerRa: 0,
      registerRb: 1,
      sharedLock: 1,
      lockHeldBy: "processA",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "The `while (old != 0)` condition is evaluated. Rb is 1, meaning the condition is TRUE. B loops back and is forced to busy-wait, correctly blocked outside the critical section.",
      noteTitle: "Mutual Exclusion Holds!",
      noteContent:
        "Process B is spinning — burning CPU cycles — but it is correctly OUTSIDE the critical section. This is exactly what we want. A and B can never both be inside simultaneously.",
    },

    // ── A resumes and releases ─────────────────────────────────────────────
    {
      chapter: "Orderly Handoff",
      activeProcess: "none",
      processAState: "suspended",
      processBState: "busy-waiting",
      processACodeLine: 4,
      processBCodeLine: 2,
      registerRa: 0,
      registerRb: 1,
      sharedLock: 1,
      lockHeldBy: "processA",
      lockRaceDetected: false,
      isContextSwitch: true,
      isAtomicTSL: false,
      explanation:
        "CONTEXT SWITCH! Process A gets the CPU back. It finishes its work inside the critical section and is ready to release the lock.",
    },
    {
      chapter: "Orderly Handoff",
      activeProcess: "processA",
      processAState: "running",
      processBState: "busy-waiting",
      processACodeLine: 5, // LOCK = 0 (release)
      processBCodeLine: 2,
      registerRa: 0,
      registerRb: 1,
      sharedLock: 0,
      lockHeldBy: "none",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: false,
      explanation:
        "Process A executes `LOCK = 0;`, releasing the lock. LOCK in shared memory is now 0 again. Process B's busy-wait loop will detect this on its next iteration.",
      noteTitle: "Releasing the Lock",
      noteContent:
        "A simple STORE is sufficient to release the lock. Only ACQUIRING the lock requires the atomic TSL. Releasing is just writing 0.",
    },
    {
      chapter: "Orderly Handoff",
      activeProcess: "processB",
      processAState: "terminated",
      processBState: "running",
      processACodeLine: null,
      processBCodeLine: 4, // B successfully enters critical section
      registerRa: null,
      registerRb: null,
      sharedLock: 1,
      lockHeldBy: "processB",
      lockRaceDetected: false,
      isContextSwitch: false,
      isAtomicTSL: true,
      explanation:
        "Process B's busy-wait loop runs again. It calls `test_and_set()` — Rb gets 0 (was free), LOCK is set to 1. The `while` condition is now FALSE. B exits the loop and enters the critical section. Mutual exclusion is maintained throughout.",
      noteTitle: "TSL: The Verdict",
      noteContent:
        "TSL achieves mutual exclusion by making the check-and-set operation atomic. The trade-off is busy waiting (CPU cycles wasted spinning). The next evolution — Semaphores — solves this by putting waiting processes to sleep instead.",
    },
  ],
};
