import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreakerMachine } from "../CircuitBreakerMachine";

describe("CircuitBreakerMachine", () => {
  let cb: CircuitBreakerMachine;

  beforeEach(() => {
    cb = new CircuitBreakerMachine(3, 5000); // threshold=3, timeout=5s
  });

  it("starts CLOSED", () => {
    expect(cb.getState()).toBe("CLOSED");
    expect(cb.canPass(0)).toBe(true);
  });

  it("opens after failure threshold reached", () => {
    cb.recordFailure(0);
    cb.recordFailure(0);
    expect(cb.getState()).toBe("CLOSED"); // Not yet
    cb.recordFailure(0);
    expect(cb.getState()).toBe("OPEN");
  });

  it("rejects packets when OPEN", () => {
    cb.recordFailure(0); cb.recordFailure(0); cb.recordFailure(0);
    expect(cb.getState()).toBe("OPEN");
    expect(cb.canPass(1000)).toBe(false);
  });

  it("increments shedCount when OPEN", () => {
    cb.recordFailure(0); cb.recordFailure(0); cb.recordFailure(0);
    cb.canPass(100);
    cb.canPass(200);
    expect(cb.getStatus().shedCount).toBe(2);
  });

  it("transitions to HALF_OPEN after timeout", () => {
    cb.recordFailure(0); cb.recordFailure(0); cb.recordFailure(0);
    expect(cb.getState()).toBe("OPEN");
    cb.canPass(6000); // After 5s timeout
    expect(cb.getState()).toBe("HALF_OPEN");
  });

  it("allows exactly one probe in HALF_OPEN", () => {
    cb.recordFailure(0); cb.recordFailure(0); cb.recordFailure(0);
    // Transition to HALF_OPEN and allow the first probe
    expect(cb.canPass(6000)).toBe(true);  
    // Second probe rejected
    expect(cb.canPass(6001)).toBe(false); 
  });

  it("closes after successful probe", () => {
    cb.recordFailure(0); cb.recordFailure(0); cb.recordFailure(0);
    cb.canPass(6000); // HALF_OPEN and Probe
    cb.recordSuccess();
    expect(cb.getState()).toBe("CLOSED");
    expect(cb.getStatus().failureCount).toBe(0);
  });

  it("re-opens after failed probe", () => {
    cb.recordFailure(0); cb.recordFailure(0); cb.recordFailure(0);
    cb.canPass(6000); // HALF_OPEN and Probe
    cb.recordFailure(6002); // Probe fails
    expect(cb.getState()).toBe("OPEN");
  });

  it("success in CLOSED resets failure count", () => {
    cb.recordFailure(0); cb.recordFailure(0);
    cb.recordSuccess();
    expect(cb.getStatus().failureCount).toBe(0);
    // Now need 3 more failures to open
    cb.recordFailure(0); cb.recordFailure(0);
    expect(cb.getState()).toBe("CLOSED");
    cb.recordFailure(0);
    expect(cb.getState()).toBe("OPEN");
  });
});
