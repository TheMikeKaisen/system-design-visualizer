import { describe, it, expect } from "vitest";
import {
  ALL_DNS_SCENARIOS,
  SCENARIO_DNS_COLD_CACHE,
  SCENARIO_DNS_WARM_CACHE,
  SCENARIO_DNS_CNAME_CHAIN,
  SCENARIO_DNS_NXDOMAIN,
} from "../dns-scenarios";

describe("DNS Scenarios Integrity", () => {
  it("exports all 4 standard scenarios", () => {
    expect(ALL_DNS_SCENARIOS).toHaveLength(4);
    expect(ALL_DNS_SCENARIOS.map((s) => s.id)).toEqual([
      "dns-cold-cache",
      "dns-warm-cache",
      "dns-cname-chain",
      "dns-nxdomain",
    ]);
  });

  describe("SCENARIO_DNS_COLD_CACHE", () => {
    it("has strictly sequential step indices starting at 0", () => {
      const steps = SCENARIO_DNS_COLD_CACHE.steps;
      expect(steps.length).toBeGreaterThanOrEqual(8);
      steps.forEach((step, idx) => {
        expect(step.stepIndex).toBe(idx);
        expect(step.id).toBe(`step-${idx}`);
        expect(step.explanation.length).toBeGreaterThan(10);
      });
    });

    it("includes Glue records in the Root referral response (Step 3)", () => {
      const step3 = SCENARIO_DNS_COLD_CACHE.steps[3];
      expect(step3.dnsData.activeDnsPacket).not.toBeNull();
      const packet = step3.dnsData.activeDnsPacket!;
      expect(packet.type).toBe("REFERRAL");
      expect(packet.message.additionals.length).toBeGreaterThan(0);
      expect(packet.message.additionals[0].type).toBe("A");
      expect(packet.message.additionals[0].data).toBe("192.5.6.30");
    });

    it("concludes with resolved IP and Authoritative Answer (Step 8)", () => {
      const finalStep = SCENARIO_DNS_COLD_CACHE.steps[SCENARIO_DNS_COLD_CACHE.steps.length - 1];
      expect(finalStep.dnsData.client.resolvedIp).toBe("203.0.113.10");
      expect(finalStep.dnsData.resolver.status).toBe("RESOLVED");
      expect(finalStep.dnsData.caches.some((c) => c.tier === "browser" && c.value === "203.0.113.10")).toBe(true);
    });
  });

  describe("SCENARIO_DNS_WARM_CACHE", () => {
    it("demonstrates multi-tier latency reduction and cache hits", () => {
      const steps = SCENARIO_DNS_WARM_CACHE.steps;
      // Step 1: Browser cache hit
      expect(steps[1].dnsData.client.browserCacheStatus).toBe("HIT");
      expect(steps[1].dnsData.client.resolvedIp).toBe("203.0.113.10");

      // Step 2: Browser TTL expires
      expect(steps[2].dnsData.client.browserCacheStatus).toBe("MISS");

      // Step 3: OS cache hit
      expect(steps[3].dnsData.client.osCacheStatus).toBe("HIT");

      // Step 4: Resolver referral hit bypassing root & TLD
      expect(steps[4].dnsData.resolver.cacheStatus).toBe("REFERRAL_HIT");
    });
  });

  describe("SCENARIO_DNS_CNAME_CHAIN", () => {
    it("handles canonical alias indirection to CDN edge", () => {
      const steps = SCENARIO_DNS_CNAME_CHAIN.steps;
      // Step 1: Authoritative returns CNAME
      const cnameReply = steps[1].dnsData.activeDnsPacket!;
      expect(cnameReply.message.answers[0].type).toBe("CNAME");
      expect(cnameReply.message.answers[0].data).toBe("d123.cloudfront.net");

      // Step 2: Composite response includes both CNAME and A record
      const finalReply = steps[2].dnsData.activeDnsPacket!;
      expect(finalReply.message.answers).toHaveLength(2);
      expect(finalReply.message.answers[0].type).toBe("CNAME");
      expect(finalReply.message.answers[1].type).toBe("A");
    });
  });

  describe("SCENARIO_DNS_NXDOMAIN", () => {
    it("models RFC 2308 negative response and SOA negative caching", () => {
      const steps = SCENARIO_DNS_NXDOMAIN.steps;
      // Step 1: Reply with NXDOMAIN and SOA record
      const reply = steps[1].dnsData.activeDnsPacket!;
      expect(reply.message.flags.rcode).toBe("NXDOMAIN (3)");
      expect(reply.message.authorities[0].type).toBe("SOA");
      expect(reply.message.authorities[0].ttl).toBe(900);

      // Step 2: Resolver caches negative result
      const finalStep = steps[2];
      expect(finalStep.dnsData.resolver.status).toBe("NXDOMAIN_CACHED");
      expect(finalStep.dnsData.caches[0].status).toBe("NEGATIVE");
      expect(finalStep.dnsData.caches[0].ttlRemaining).toBe(900);
    });
  });
});
