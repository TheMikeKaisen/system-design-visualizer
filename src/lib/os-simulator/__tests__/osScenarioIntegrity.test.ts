import { describe, it, expect } from "vitest";
import { PROCESS_STATES_SCENARIO } from "../process-states-scenario";
import {
  createCpuSchedulingScenario,
  CPU_SCHEDULING_SCENARIO,
} from "../cpu-scheduling-scenario";
import { PCB_SCENARIO } from "../pcb-scenario";
import {
  PRODUCER_CONSUMER_SCENARIO_A,
  PRODUCER_CONSUMER_SCENARIO_B,
} from "../producer-consumer-scenario";
import {
  PRINTER_SPOOLER_SCENARIO_A,
  PRINTER_SPOOLER_SCENARIO_B,
} from "../printer-spooler-scenario";
import {
  LOCK_VARIABLE_SCENARIO_A,
  LOCK_VARIABLE_SCENARIO_B,
} from "../lock-variable-scenario";
import {
  computeUniversalScheduling,
  DEFAULT_UNIVERSAL_PROCESSES,
} from "../universal-engine";
import type { OSSimulationScenario } from "../engine";

describe("OS Scenario Schema & State Integrity Tests", () => {
  const coreScenarios: { name: string; scenario: OSSimulationScenario }[] = [
    { name: "PROCESS_STATES_SCENARIO", scenario: PROCESS_STATES_SCENARIO },
    {
      name: "CPU_SCHEDULING_SCENARIO (Default)",
      scenario: CPU_SCHEDULING_SCENARIO,
    },
    {
      name: "CPU_SCHEDULING_SCENARIO (Non-Preemptive)",
      scenario: createCpuSchedulingScenario("non_preemptive"),
    },
    {
      name: "CPU_SCHEDULING_SCENARIO (Preemptive)",
      scenario: createCpuSchedulingScenario("preemptive"),
    },
    { name: "PCB_SCENARIO", scenario: PCB_SCENARIO },
  ];

  describe.each(coreScenarios)("Core Scenario: $name", ({ scenario }) => {
    it("has valid metadata and non-empty chapters and steps", () => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.description).toBeTruthy();
      expect(scenario.chapters.length).toBeGreaterThan(0);
      expect(scenario.steps.length).toBeGreaterThan(0);
    });

    it("verifies chapters cover valid bounds and are ordered sequentially", () => {
      scenario.chapters.forEach((chapter, index) => {
        expect(chapter.title).toBeTruthy();
        expect(chapter.startStep).toBeGreaterThanOrEqual(0);
        expect(chapter.endStep).toBeLessThan(scenario.steps.length);
        expect(chapter.startStep).toBeLessThanOrEqual(chapter.endStep);

        if (index > 0) {
          const prevChapter = scenario.chapters[index - 1];
          expect(chapter.startStep).toBeGreaterThanOrEqual(prevChapter.endStep);
        }
      });
    });

    it("validates step continuity, non-empty explanations, and process references", () => {
      scenario.steps.forEach((step, index) => {
        expect(step.explanation.trim().length).toBeGreaterThan(0);
        expect(step.chapter.trim().length).toBeGreaterThan(0);

        // CPU process must exist in processes object if assigned
        if (step.cpu.currentProcess) {
          expect(step.processes[step.cpu.currentProcess]).toBeDefined();
        }

        // All queue references must point to existing processes
        const processIdQueues = [
          ...step.newQueue,
          ...step.readyQueue,
          ...step.suspendedQueue,
          ...step.terminatedList,
        ];
        processIdQueues.forEach((pid) => {
          expect(
            step.processes[pid],
            `Process ${pid} in queue at step ${index} must exist in step.processes`
          ).toBeDefined();
        });

        // waitQueue entries must also point to valid processes
        step.waitQueue.forEach((entry) => {
          expect(
            step.processes[entry.processId],
            `Waiting process ${entry.processId} at step ${index} must exist in step.processes`
          ).toBeDefined();
        });

        // Memory gauge consistency
        expect(step.memory.totalMB).toBeGreaterThan(0);
        expect(step.memory.usedMB).toBeGreaterThanOrEqual(0);
        expect(step.memory.usedMB).toBeLessThanOrEqual(step.memory.totalMB);
        expect(step.memory.usedPct).toBeGreaterThanOrEqual(0);
        expect(step.memory.usedPct).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Producer-Consumer Scenarios (Race vs Sync)", () => {
    const pcScenarios = [
      { name: "Scenario A (Race Condition)", scenario: PRODUCER_CONSUMER_SCENARIO_A },
      { name: "Scenario B (Reverse Race)", scenario: PRODUCER_CONSUMER_SCENARIO_B },
    ];

    it.each(pcScenarios)("$name has valid step structure and buffer bounds", ({ scenario }) => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.steps.length).toBeGreaterThan(0);
      expect(scenario.chapters.length).toBeGreaterThan(0);

      scenario.steps.forEach((step) => {
        expect(step.explanation.trim().length).toBeGreaterThan(0);
        expect(step.sharedMemoryCount).toBeGreaterThanOrEqual(0);
        expect(step.buffer.length).toBe(8);
        expect(["producer", "consumer", "none"]).toContain(step.activeThread);
        expect(["running", "suspended", "idle", "terminated"]).toContain(step.producerState);
        expect(["running", "suspended", "idle", "terminated"]).toContain(step.consumerState);
      });
    });

    it("verifies Scenario A and B produce corrupted outcomes (lost updates)", () => {
      const finalA = PRODUCER_CONSUMER_SCENARIO_A.steps[PRODUCER_CONSUMER_SCENARIO_A.steps.length - 1];
      const finalB = PRODUCER_CONSUMER_SCENARIO_B.steps[PRODUCER_CONSUMER_SCENARIO_B.steps.length - 1];

      // Expected was 3, but Scenario A ends with 4 and Scenario B with 2
      expect(finalA.sharedMemoryCount).toBe(4);
      expect(finalB.sharedMemoryCount).toBe(2);
    });
  });

  describe("Printer Spooler Scenarios (Race vs Mutex)", () => {
    const spoolerScenarios = [
      { name: "Scenario A (Spooler Race)", scenario: PRINTER_SPOOLER_SCENARIO_A },
      { name: "Scenario B (Spooler Mutex)", scenario: PRINTER_SPOOLER_SCENARIO_B },
    ];

    it.each(spoolerScenarios)("$name has valid spooler slots and shared pointer", ({ scenario }) => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.steps.length).toBeGreaterThan(0);

      scenario.steps.forEach((step) => {
        expect(step.explanation.trim().length).toBeGreaterThan(0);
        expect(step.spoolerSlots.length).toBe(8);
        expect(step.sharedIN).toBeGreaterThanOrEqual(0);
        expect(step.sharedIN).toBeLessThanOrEqual(8);
      });
    });

    it("verifies Scenario A detects an overwritten corrupted spooler slot", () => {
      const corruptedStep = PRINTER_SPOOLER_SCENARIO_A.steps.find(
        (s) => s.corruptedSlot !== null
      );
      expect(corruptedStep).toBeDefined();
      expect(corruptedStep?.corruptedSlot).toBe(7);
    });
  });

  describe("Lock Variables & TSL Scenarios", () => {
    const lockScenarios = [
      { name: "Scenario A (Naive Lock)", scenario: LOCK_VARIABLE_SCENARIO_A },
      { name: "Scenario B (Hardware TSL)", scenario: LOCK_VARIABLE_SCENARIO_B },
    ];

    it.each(lockScenarios)("$name has valid lock states and register tracking", ({ scenario }) => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.steps.length).toBeGreaterThan(0);

      scenario.steps.forEach((step) => {
        expect(step.explanation.trim().length).toBeGreaterThan(0);
        expect([0, 1]).toContain(step.sharedLock);
        expect(["processA", "processB", "none"]).toContain(step.activeProcess);
      });
    });

    it("verifies Scenario A triggers lock race detected while Scenario B does not", () => {
      const raceDetectedA = LOCK_VARIABLE_SCENARIO_A.steps.some(
        (s) => s.lockRaceDetected === true
      );
      const raceDetectedB = LOCK_VARIABLE_SCENARIO_B.steps.some(
        (s) => s.lockRaceDetected === true
      );
      expect(raceDetectedA).toBe(true);
      expect(raceDetectedB).toBe(false);
    });
  });

  describe("Universal CPU Scheduler Engine", () => {
    it("computes valid FCFS schedule with non-negative metrics", () => {
      const sim = computeUniversalScheduling(DEFAULT_UNIVERSAL_PROCESSES, "FCFS");
      expect(sim.ganttBlocks.length).toBeGreaterThan(0);
      expect(sim.metrics.avgWaitingTime).toBeGreaterThanOrEqual(0);
      expect(sim.metrics.avgTurnaroundTime).toBeGreaterThanOrEqual(0);
      expect(sim.metrics.cpuUtilization).toBeGreaterThan(0);
      expect(sim.processResults.length).toBe(DEFAULT_UNIVERSAL_PROCESSES.length);
    });

    it("computes valid Round Robin schedule with time quantum", () => {
      const sim = computeUniversalScheduling(DEFAULT_UNIVERSAL_PROCESSES, "RR", 2);
      expect(sim.ganttBlocks.length).toBeGreaterThan(0);
      sim.processResults.forEach((proc) => {
        expect(proc.completionTime).toBeGreaterThan(0);
        expect(proc.turnaroundTime).toBeGreaterThan(0);
      });
    });

    it("computes valid SJF and SRTF schedules", () => {
      const sjfSim = computeUniversalScheduling(DEFAULT_UNIVERSAL_PROCESSES, "SJF");
      const srtfSim = computeUniversalScheduling(DEFAULT_UNIVERSAL_PROCESSES, "SRTF");
      expect(sjfSim.ganttBlocks.length).toBeGreaterThan(0);
      expect(srtfSim.ganttBlocks.length).toBeGreaterThan(0);
    });
  });
});
