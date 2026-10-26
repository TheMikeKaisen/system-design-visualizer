import { describe, it, expect } from "vitest";
import { GREET_SCENARIO } from "../engine";
import { ALL_HOISTING_SCENARIOS } from "../hoisting-scenarios";
import { ALL_SCOPE_SCENARIOS } from "../scope-scenarios";
import { LET_CONST_SCENARIOS } from "../let-const-scenarios";
import { BLOCK_SCOPE_SCENARIOS } from "../block-scope-scenarios";
import { ALL_CLOSURE_SCENARIOS } from "../closure-scenarios";
import { ALL_EVENT_LOOP_SCENARIOS } from "../event-loop-scenarios";
import type { SimulationScenario } from "../engine";

const ALL_CURRICULUM_SCENARIOS: { episode: string; scenarios: SimulationScenario[] }[] = [
  { episode: "Episode 1: Call Stack", scenarios: [GREET_SCENARIO] },
  { episode: "Episode 2: Hoisting", scenarios: ALL_HOISTING_SCENARIOS },
  { episode: "Episode 3: Scope Chain", scenarios: ALL_SCOPE_SCENARIOS },
  { episode: "Episode 4: Let & Const", scenarios: LET_CONST_SCENARIOS },
  { episode: "Episode 5: Block Scope", scenarios: BLOCK_SCOPE_SCENARIOS },
  { episode: "Episode 6: Closures", scenarios: ALL_CLOSURE_SCENARIOS },
  { episode: "Episode 7: Event Loop", scenarios: ALL_EVENT_LOOP_SCENARIOS },
];

describe("Curriculum Scenario Integrity Inspector", () => {
  ALL_CURRICULUM_SCENARIOS.forEach(({ episode, scenarios }) => {
    describe(episode, () => {
      it(`contains scenarios with valid metadata and non-empty steps`, () => {
        expect(scenarios.length).toBeGreaterThan(0);
        scenarios.forEach((scenario) => {
          expect(scenario.id, `Scenario in ${episode} must have an id`).toBeTruthy();
          expect(scenario.title, `Scenario ${scenario.id} must have a title`).toBeTruthy();
          expect(scenario.code.trim().length, `Scenario ${scenario.id} code cannot be empty`).toBeGreaterThan(0);
          expect(scenario.steps.length, `Scenario ${scenario.id} must have at least 2 steps`).toBeGreaterThanOrEqual(2);
        });
      });

      scenarios.forEach((scenario) => {
        describe(`Scenario: ${scenario.title} (${scenario.id})`, () => {
          const codeLines = scenario.code.split("\n");

          it("initial step (Step 0) has clean start state", () => {
            const step0 = scenario.steps[0];
            expect(step0).toBeDefined();
            expect(step0.explanation.trim().length).toBeGreaterThan(0);

            // Step 0 shouldn't have accumulated console output
            if (step0.consoleOutput) {
              expect(step0.consoleOutput.length).toBe(0);
            }

            // Step 0 queues should be empty if defined
            if (step0.microtaskQueue) {
              expect(step0.microtaskQueue.length).toBe(0);
            }
            if (step0.callbackQueue) {
              expect(step0.callbackQueue.length).toBe(0);
            }
          });

          it("every step points to a valid non-empty line of code when currentLine is set", () => {
            scenario.steps.forEach((step, stepIndex) => {
              expect(step.explanation.trim().length, `Step ${stepIndex} in ${scenario.id} must have an explanation`).toBeGreaterThan(0);

              if (step.currentLine !== null) {
                expect(
                  step.currentLine,
                  `Step ${stepIndex} in ${scenario.id}: currentLine (${step.currentLine}) must be >= 1`
                ).toBeGreaterThanOrEqual(1);

                expect(
                  step.currentLine,
                  `Step ${stepIndex} in ${scenario.id}: currentLine (${step.currentLine}) exceeds total lines (${codeLines.length})`
                ).toBeLessThanOrEqual(codeLines.length);

                const referencedLine = codeLines[step.currentLine - 1];
                expect(
                  referencedLine.trim().length,
                  `Step ${stepIndex} in ${scenario.id}: line ${step.currentLine} is empty/blank in code:\n${scenario.code}`
                ).toBeGreaterThan(0);
              }
            });
          });

          it("call stack execution contexts have valid structure", () => {
            scenario.steps.forEach((step, stepIndex) => {
              if (step.callStack) {
                step.callStack.forEach((context, ctxIndex) => {
                  expect(context.id, `Step ${stepIndex} context ${ctxIndex} must have id`).toBeTruthy();
                  expect(context.name, `Step ${stepIndex} context ${ctxIndex} must have name`).toBeTruthy();
                  expect(
                    ["Creation Phase", "Execution Phase"],
                    `Step ${stepIndex} context ${context.name} phase must be valid`
                  ).toContain(context.phase);
                  expect(Array.isArray(context.variables), `Step ${stepIndex} context ${context.name} variables must be array`).toBe(true);
                });
              }
            });
          });
        });
      });
    });
  });
});
