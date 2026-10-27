import { describe, it, expect } from "vitest";
import { ALL_NETWORK_SCENARIOS, SCENARIO_HANDSHAKE, SCENARIO_MULTI_CLIENT, SCENARIO_PORT_CONFLICT, SCENARIO_WIRE_DISSECTION } from "../scenarios";

describe("Network Scenario Integrity & Deterministic State Models", () => {
  it("contains all 4 required scenarios with valid IDs and non-empty steps", () => {
    expect(ALL_NETWORK_SCENARIOS.length).toBe(4);

    for (const scenario of ALL_NETWORK_SCENARIOS) {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.steps.length).toBeGreaterThanOrEqual(3);

      // Verify each step has sequential indices and non-empty explanations
      scenario.steps.forEach((step, index) => {
        expect(step.stepIndex).toBe(index);
        expect(step.title).toBeTruthy();
        expect(step.explanation.length).toBeGreaterThan(15);
        expect(step.hosts.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  describe("SCENARIO_HANDSHAKE", () => {
    it("starts in idle LISTEN state and establishes 4-tuple connection", () => {
      const step0 = SCENARIO_HANDSHAKE.steps[0];
      expect(step0.activeSockets.some((s) => s.state === "LISTEN")).toBe(true);
      expect(step0.activePacket).toBeNull();

      // Step 1: SYN dispatched
      const step1 = SCENARIO_HANDSHAKE.steps[1];
      expect(step1.activePacket?.flags.syn).toBe(true);
      expect(step1.activeSockets.some((s) => s.state === "SYN_SENT")).toBe(true);

      // Step 2: SYN-ACK
      const step2 = SCENARIO_HANDSHAKE.steps[2];
      expect(step2.activePacket?.flags.syn).toBe(true);
      expect(step2.activePacket?.flags.ack).toBe(true);

      // Step 3: Established
      const step3 = SCENARIO_HANDSHAKE.steps[3];
      const establishedSockets = step3.activeSockets.filter((s) => s.state === "ESTABLISHED");
      expect(establishedSockets.length).toBe(2); // Client + Server socket pair
    });
  });

  describe("SCENARIO_MULTI_CLIENT", () => {
    it("disambiguates two concurrent connections to the same server port using 4-tuples", () => {
      const finalStep = SCENARIO_MULTI_CLIENT.steps[2];
      const establishedServerSockets = finalStep.activeSockets.filter(
        (s) => s.hostId === "server-multi" && s.state === "ESTABLISHED"
      );

      expect(establishedServerSockets.length).toBe(2);

      // Both connect to local port 443
      expect(establishedServerSockets[0].localPort).toBe(443);
      expect(establishedServerSockets[1].localPort).toBe(443);

      // But their remote IPs differ (192.168.1.10 vs 192.168.1.11)
      const remoteIps = establishedServerSockets.map((s) => s.remoteIp);
      expect(remoteIps).toContain("192.168.1.10");
      expect(remoteIps).toContain("192.168.1.11");
    });
  });

  describe("SCENARIO_PORT_CONFLICT", () => {
    it("models EADDRINUSE collision and subsequent resolution to port 8081", () => {
      const step1Conflict = SCENARIO_PORT_CONFLICT.steps[1];
      const conflictApp = step1Conflict.hosts[0].applications.find((a) => a.id === "flask-app");
      expect(conflictApp?.status).toBe("conflict");

      const step2Resolved = SCENARIO_PORT_CONFLICT.steps[2];
      const listeningSockets = step2Resolved.activeSockets.filter((s) => s.state === "LISTEN");
      expect(listeningSockets.length).toBe(2);

      const ports = listeningSockets.map((s) => s.localPort);
      expect(ports).toContain(8080);
      expect(ports).toContain(8081);
    });
  });

  describe("SCENARIO_WIRE_DISSECTION", () => {
    it("encapsulates headers across all layers down to Ethernet frame", () => {
      const finalStep = SCENARIO_WIRE_DISSECTION.steps[3];
      const header = finalStep.activePacket?.headerData;

      expect(header).toBeDefined();
      expect(header?.ethernet.srcMac).toBeTruthy();
      expect(header?.ip.srcIp).toBe("192.168.1.10");
      expect(header?.transport.dstPort).toBe(80);
      expect(header?.payload.rawData).toContain("GET /index.html");
    });
  });
});
