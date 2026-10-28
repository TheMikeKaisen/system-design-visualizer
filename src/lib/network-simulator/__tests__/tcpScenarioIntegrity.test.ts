import { describe, it, expect } from "vitest";
import {
  ALL_TCP_SCENARIOS,
  SCENARIO_TCP_HANDSHAKE,
  SCENARIO_TCP_SYN_LOSS,
  SCENARIO_TCP_CONNECTION_REFUSED,
  SCENARIO_TCP_TEARDOWN,
  SCENARIO_TCP_SYN_FLOOD,
  SCENARIO_TCP_SIMULTANEOUS_OPEN,
} from "../tcp-scenarios";
import { TCP_GLOSSARY, TCP_TERM_PATTERNS } from "../tcp-engine";

describe("TCP Scenarios Integrity (Episode 3)", () => {
  it("exports all 6 curated RFC scenarios", () => {
    expect(ALL_TCP_SCENARIOS).toHaveLength(6);
    expect(ALL_TCP_SCENARIOS.map((s) => s.id)).toEqual([
      "tcp-canonical-handshake",
      "tcp-syn-loss-rto",
      "tcp-connection-refused-rst",
      "tcp-teardown-time-wait",
      "tcp-syn-flood-cookies",
      "tcp-simultaneous-open",
    ]);
  });

  it("contains rich glossary with 35+ highlighted concepts, all 11 RFC 793 FSM states, and non-empty definitions", () => {
    const glossaryKeys = Object.keys(TCP_GLOSSARY);
    expect(glossaryKeys.length).toBeGreaterThanOrEqual(35);
    glossaryKeys.forEach((key) => {
      const entry = TCP_GLOSSARY[key];
      expect(entry.term).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.explanation.length).toBeGreaterThan(20);
    });
    expect(TCP_TERM_PATTERNS.length).toBeGreaterThanOrEqual(35);

    // Verify all 11 RFC 793 FSM states have dedicated glossary entries
    const fsmStates = [
      "closed",
      "listen",
      "syn_sent",
      "syn_rcvd",
      "established",
      "fin_wait_1",
      "fin_wait_2",
      "closing",
      "time_wait",
      "close_wait",
      "last_ack",
    ];
    fsmStates.forEach((st) => {
      expect(TCP_GLOSSARY[st]).toBeDefined();
      expect(TCP_GLOSSARY[st].category).toContain("State");
    });

    // Verify distinct compound terms do not shadow base flags
    expect(TCP_GLOSSARY["syn-ack"].title).toContain("SYN-ACK");
    expect(TCP_GLOSSARY["syn backlog"].title).toContain("SYN Backlog");
    expect(TCP_GLOSSARY["syn cookie"].title).toContain("Stateless SYN Cookies");
    expect(TCP_GLOSSARY["fin_wait_1"].title).toContain("FIN_WAIT_1");
  });

  describe("SCENARIO_TCP_HANDSHAKE (Canonical 3-Way Handshake & First Data)", () => {
    const steps = SCENARIO_TCP_HANDSHAKE.steps;

    it("has strictly sequential step indices starting at 0", () => {
      expect(steps.length).toBe(7);
      steps.forEach((step, idx) => {
        expect(step.stepIndex).toBe(idx);
        expect(step.id).toBe(`step-${idx}`);
        expect(step.explanation.length).toBeGreaterThan(15);
      });
    });

    it("demonstrates SYN phantom byte consumption in Step 1", () => {
      const step1 = steps[1];
      expect(step1.tcpData.client.state).toBe("SYN_SENT");
      expect(step1.tcpData.wire.activeSegment?.flags.syn).toBe(true);
      expect(step1.tcpData.wire.activeSegment?.options?.mss).toBe(1460);
      expect(step1.tcpData.wire.activeSegment?.options?.windowScale).toBe(7);
      // SYN consumes 1 phantom sequence number: 9000 -> 9001
      expect(step1.tcpData.sequenceArithmetic.clientNextSeq).toBe(9001);
    });

    it("demonstrates SYN-ACK dual acknowledgment in Step 2", () => {
      const step2 = steps[2];
      expect(step2.tcpData.server.listenState).toBe("LISTEN");
      expect(step2.tcpData.server.backlog.synBacklog.current).toBe(1);
      const seg = step2.tcpData.wire.activeSegment!;
      expect(seg.flags.syn).toBe(true);
      expect(seg.flags.ack).toBe(true);
      expect(seg.seqNumber).toBe(3000);
      expect(seg.ackNumber).toBe(9001);
    });

    it("verifies pure ACK in Step 3 consumes 0 sequence numbers", () => {
      const step3 = steps[3];
      expect(step3.tcpData.client.state).toBe("ESTABLISHED");
      const seg = step3.tcpData.wire.activeSegment!;
      expect(seg.flags.ack).toBe(true);
      expect(seg.flags.syn).toBeUndefined();
      expect(seg.payloadLength).toBe(0);
      // Client seq remains 9001 because pure ACK consumes 0 bytes!
      expect(seg.seqNumber).toBe(9001);
      expect(step3.tcpData.sequenceArithmetic.clientNextSeq).toBe(9001);
    });

    it("promotes connection to accept queue on server in Step 4", () => {
      const step4 = steps[4];
      expect(step4.tcpData.server.backlog.synBacklog.current).toBe(0);
      expect(step4.tcpData.server.backlog.acceptQueue.current).toBe(1);
      expect(step4.tcpData.server.childSockets).toHaveLength(1);
      expect(step4.tcpData.server.childSockets[0].state).toBe("ESTABLISHED");
    });

    it("advances sequence arithmetic with payload octets in Steps 5 and 6", () => {
      const step5 = steps[5];
      expect(step5.tcpData.wire.activeSegment?.payloadLength).toBe(50);
      expect(step5.tcpData.wire.activeSegment?.flags.psh).toBe(true);
      expect(step5.tcpData.sequenceArithmetic.clientNextSeq).toBe(9051); // 9001 + 50 = 9051

      const step6 = steps[6];
      expect(step6.tcpData.wire.activeSegment?.ackNumber).toBe(9051);
    });
  });

  describe("SCENARIO_TCP_SYN_LOSS (RTO & Exponential Backoff)", () => {
    const steps = SCENARIO_TCP_SYN_LOSS.steps;

    it("models initial RTO of 1000ms in Step 0", () => {
      expect(steps[0].tcpData.client.rtoTimer?.timeoutMs).toBe(1000);
      expect(steps[0].tcpData.client.rtoTimer?.retransmissions).toBe(0);
    });

    it("marks segment as dropped on the wire in Step 1", () => {
      expect(steps[1].tcpData.wire.dropped).toBe(true);
      expect(steps[1].tcpData.wire.activeSegment?.dropped).toBe(true);
    });

    it("doubles timeout to 2000ms via Exponential Backoff upon expiration in Step 2", () => {
      const step2 = steps[2];
      expect(step2.tcpData.client.rtoTimer?.timeoutMs).toBe(2000);
      expect(step2.tcpData.client.rtoTimer?.retransmissions).toBe(1);
    });

    it("retransmits identical sequence number 9000 in Step 3", () => {
      const step3 = steps[3];
      expect(step3.tcpData.wire.activeSegment?.seqNumber).toBe(9000);
      expect(step3.tcpData.wire.activeSegment?.flags.syn).toBe(true);
    });

    it("completes recovery and cancels RTO timer in Step 4", () => {
      const step4 = steps[4];
      expect(step4.tcpData.client.state).toBe("ESTABLISHED");
      expect(step4.tcpData.client.rtoTimer?.running).toBe(false);
    });
  });

  describe("SCENARIO_TCP_CONNECTION_REFUSED (Unbound Port & RST)", () => {
    const steps = SCENARIO_TCP_CONNECTION_REFUSED.steps;

    it("targets closed port 8080 in Step 0", () => {
      expect(steps[0].tcpData.wire.activeSegment?.dstPort).toBe(8080);
      expect(steps[0].tcpData.server.listenState).toBe("CLOSED");
    });

    it("returns immediate RST, ACK segment with Ack=9001 in Step 1", () => {
      const rstSeg = steps[1].tcpData.wire.activeSegment!;
      expect(rstSeg.flags.rst).toBe(true);
      expect(rstSeg.flags.ack).toBe(true);
      expect(rstSeg.ackNumber).toBe(9001);
    });

    it("triggers instant ECONNREFUSED and transitions to CLOSED in Step 2", () => {
      const step2 = steps[2];
      expect(step2.tcpData.client.state).toBe("CLOSED");
      expect(step2.tcpData.client.activeSyscall).toContain("ECONNREFUSED");
    });
  });

  describe("SCENARIO_TCP_TEARDOWN (4-Way FIN Teardown & TIME_WAIT)", () => {
    const steps = SCENARIO_TCP_TEARDOWN.steps;

    it("transitions client to FIN_WAIT_1 in Step 1", () => {
      expect(steps[1].tcpData.client.state).toBe("FIN_WAIT_1");
      expect(steps[1].tcpData.wire.activeSegment?.flags.fin).toBe(true);
      expect(steps[1].tcpData.sequenceArithmetic.clientNextSeq).toBe(9052);
    });

    it("transitions server to CLOSE_WAIT and client to FIN_WAIT_2 in Step 2", () => {
      expect(steps[2].tcpData.server.childSockets[0].state).toBe("CLOSE_WAIT");
      expect(steps[2].tcpData.client.state).toBe("FIN_WAIT_2");
    });

    it("server sends FIN and enters LAST_ACK in Step 3", () => {
      expect(steps[3].tcpData.server.childSockets[0].state).toBe("LAST_ACK");
      expect(steps[3].tcpData.wire.activeSegment?.flags.fin).toBe(true);
    });

    it("client enters TIME_WAIT with 2*MSL (60s) timer in Step 4", () => {
      expect(steps[4].tcpData.client.state).toBe("TIME_WAIT");
      expect(steps[4].tcpData.client.rtoTimer?.timeoutMs).toBe(60000);
    });

    it("releases socket into CLOSED state upon timer expiration in Step 5", () => {
      expect(steps[5].tcpData.client.state).toBe("CLOSED");
      expect(steps[5].tcpData.server.childSockets).toHaveLength(0);
    });
  });

  describe("SCENARIO_TCP_SYN_FLOOD (Backlog Saturation & Stateless SYN Cookies)", () => {
    const steps = SCENARIO_TCP_SYN_FLOOD.steps;

    it("saturates SYN backlog to 128/128 (100%) in Step 1", () => {
      expect(steps[1].tcpData.server.backlog.synBacklog.current).toBe(128);
      expect(steps[1].tcpData.server.backlog.synCookiesActive).toBe(false);
    });

    it("activates Stateless SYN Cookies in Step 2", () => {
      expect(steps[2].tcpData.server.backlog.synCookiesActive).toBe(true);
    });

    it("encodes connection state in Cookie ISN in Step 3", () => {
      const seg = steps[3].tcpData.wire.activeSegment!;
      expect(seg.options?.synCookie).toBe(true);
      expect(seg.seqNumber).toBe(2135633424);
    });

    it("validates Cookie in Step 4 and instantiates socket in Accept Queue", () => {
      const step4 = steps[4];
      expect(step4.tcpData.server.backlog.synCookiesValidated).toBe(1);
      expect(step4.tcpData.server.backlog.acceptQueue.current).toBe(1);
      expect(step4.tcpData.client.state).toBe("ESTABLISHED");
    });
  });

  describe("SCENARIO_TCP_SIMULTANEOUS_OPEN (P2P NAT Hole Punching)", () => {
    const steps = SCENARIO_TCP_SIMULTANEOUS_OPEN.steps;

    it("both peers enter SYN_SENT in Step 1", () => {
      expect(steps[1].tcpData.client.state).toBe("SYN_SENT");
      expect(steps[1].tcpData.server.listenState).toBe("SYN_SENT");
    });

    it("transitions both peers directly to SYN_RCVD in Step 2", () => {
      expect(steps[2].tcpData.client.state).toBe("SYN_RCVD");
      expect(steps[2].tcpData.server.listenState).toBe("SYN_RCVD");
    });

    it("both peers enter ESTABLISHED simultaneously in Step 4", () => {
      expect(steps[4].tcpData.client.state).toBe("ESTABLISHED");
      expect(steps[4].tcpData.server.listenState).toBe("ESTABLISHED");
    });
  });
});
