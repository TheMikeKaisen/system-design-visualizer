import { describe, it, expect } from "vitest";
import {
  ALL_HTTP_SCENARIOS,
  SCENARIO_HTTP_CANONICAL_GET,
  SCENARIO_HTTP_CONNECTION_REUSE,
  SCENARIO_HTTP_RESOURCE_CREATION,
  SCENARIO_HTTP_AUTH_ROUTING,
  SCENARIO_HTTP_CONDITIONAL_CACHING,
  SCENARIO_HTTP_GATEWAY_FAILURES,
  SCENARIO_HTTP_FAILURE_BOUNDARIES,
} from "../http-scenarios";
import {
  HTTP_GLOSSARY,
  HTTP_TERM_PATTERNS,
  formatRawHttpRequest,
  formatRawHttpResponse,
} from "../http-engine";

describe("HTTP Scenarios Integrity (Episode 4)", () => {
  it("exports all 7 curated educational scenarios", () => {
    expect(ALL_HTTP_SCENARIOS).toHaveLength(7);
    expect(ALL_HTTP_SCENARIOS.map((s) => s.id)).toEqual([
      "http-canonical-get",
      "http-connection-reuse",
      "http-resource-creation",
      "http-auth-routing",
      "http-conditional-caching",
      "http-gateway-failures",
      "http-failure-boundaries",
    ]);
  });

  it("contains rich glossary with 30+ RFC definitions and valid command examples", () => {
    const glossaryKeys = Object.keys(HTTP_GLOSSARY);
    expect(glossaryKeys.length).toBeGreaterThanOrEqual(30);
    glossaryKeys.forEach((key) => {
      const entry = HTTP_GLOSSARY[key];
      expect(entry.term).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.explanation.length).toBeGreaterThan(20);
      if (entry.commandExample) {
        expect(entry.commandExample.command.length).toBeGreaterThan(5);
        expect(entry.commandExample.purpose.length).toBeGreaterThan(5);
      }
    });

    // Verify key status codes and headers are documented
    expect(HTTP_GLOSSARY["200 OK"]).toBeDefined();
    expect(HTTP_GLOSSARY["201 Created"]).toBeDefined();
    expect(HTTP_GLOSSARY["304 Not Modified"]).toBeDefined();
    expect(HTTP_GLOSSARY["401 Unauthorized"]).toBeDefined();
    expect(HTTP_GLOSSARY["403 Forbidden"]).toBeDefined();
    expect(HTTP_GLOSSARY["404 Not Found"]).toBeDefined();
    expect(HTTP_GLOSSARY["500 Internal Server Error"]).toBeDefined();
    expect(HTTP_GLOSSARY["502 Bad Gateway"]).toBeDefined();
    expect(HTTP_GLOSSARY["504 Gateway Timeout"]).toBeDefined();
    expect(HTTP_GLOSSARY["ETag"]).toBeDefined();
    expect(HTTP_GLOSSARY["If-None-Match"]).toBeDefined();
    expect(HTTP_GLOSSARY["Keep-Alive"]).toBeDefined();
    expect(HTTP_GLOSSARY["CORS"]).toBeDefined();
    expect(HTTP_GLOSSARY["Preflight"]).toBeDefined();
    expect(HTTP_GLOSSARY["TTFB"]).toBeDefined();
  });

  it("contains comprehensive term patterns for highlighted keywords", () => {
    expect(HTTP_TERM_PATTERNS.length).toBeGreaterThanOrEqual(25);
    expect(HTTP_TERM_PATTERNS).toContain("GET /api/users/42");
    expect(HTTP_TERM_PATTERNS).toContain("200 OK");
    expect(HTTP_TERM_PATTERNS).toContain("304 Not Modified");
    expect(HTTP_TERM_PATTERNS).toContain("Keep-Alive");
    expect(HTTP_TERM_PATTERNS).toContain("CORS");
    expect(HTTP_TERM_PATTERNS).toContain("fetch()");
    expect(HTTP_TERM_PATTERNS).toContain("res.json()");
  });

  it("enforces step index sequence and non-empty data across all scenarios", () => {
    ALL_HTTP_SCENARIOS.forEach((scenario) => {
      expect(scenario.steps.length).toBeGreaterThanOrEqual(2);
      scenario.steps.forEach((step, idx) => {
        expect(step.stepIndex).toBe(idx);
        expect(step.id).toBeDefined();
        expect(step.title.length).toBeGreaterThan(5);
        expect(step.badge.length).toBeGreaterThan(2);
        expect(step.explanation.length).toBeGreaterThan(15);
        expect(step.httpData).toBeDefined();
        expect(step.httpData.client).toBeDefined();
        expect(step.httpData.wire).toBeDefined();
        expect(step.httpData.backend).toBeDefined();
        expect(step.httpData.waterfall).toBeDefined();
        expect(step.httpData.request).toBeDefined();
      });
    });
  });

  describe("Scenario 1: Canonical GET /api/users/42 (200 OK)", () => {
    it("traces cold-start latency and 2-phase fetch lifecycle", () => {
      const steps = SCENARIO_HTTP_CANONICAL_GET.steps;
      expect(steps.length).toBe(7);

      // Step 0: cold start DNS
      expect(steps[0].httpData.waterfall.dnsMs).toBeGreaterThan(0);
      expect(steps[0].httpData.client.fetchPhase).toBe("initiating");

      // Step 1: TCP + TLS handshakes
      expect(steps[1].httpData.waterfall.tcpMs).toBeGreaterThan(0);
      expect(steps[1].httpData.waterfall.tlsMs).toBeGreaterThan(0);

      // Step 5: TTFB headers arrival (Phase 1)
      expect(steps[5].httpData.client.fetchPhase).toBe("headers_received");
      expect(steps[5].httpData.response?.statusCode).toBe(200);

      // Step 6: Body parsed stream (Phase 2)
      expect(steps[6].httpData.client.fetchPhase).toBe("body_parsed");
      expect(steps[6].httpData.client.reactState.componentState).toBe("success");
      expect(steps[6].httpData.response?.body).toContain("Alice Cooper");
    });
  });

  describe("Scenario 2: Connection Reuse & Keep-Alive", () => {
    it("bypasses DNS, TCP, and TLS handshakes, yielding sub-25ms response", () => {
      const steps = SCENARIO_HTTP_CONNECTION_REUSE.steps;
      expect(steps.length).toBe(4);

      // Step 1: Reused connection has 0ms DNS, TCP, TLS
      const step1 = steps[1].httpData.waterfall;
      expect(step1.dnsMs).toBe(0);
      expect(step1.tcpMs).toBe(0);
      expect(step1.tlsMs).toBe(0);
      expect(step1.isReusedConnection).toBe(true);

      // Final step: sub-25ms total duration
      const finalStep = steps[3].httpData;
      expect(finalStep.waterfall.totalMs).toBeLessThanOrEqual(25);
      expect(finalStep.response?.headers["Connection"]).toBe("keep-alive");
      expect(finalStep.response?.headers["Keep-Alive"]).toContain("timeout=60");
    });
  });

  describe("Scenario 3: Resource Creation (POST /api/users, 201 Created)", () => {
    it("handles request body, Content-Length, and Location header", () => {
      const steps = SCENARIO_HTTP_RESOURCE_CREATION.steps;
      expect(steps.length).toBe(3);

      const step0 = steps[0].httpData;
      expect(step0.request.method).toBe("POST");
      expect(step0.request.body).toBeDefined();
      expect(step0.request.headers["Content-Length"]).toBe("43");

      const finalStep = steps[2].httpData;
      expect(finalStep.response?.statusCode).toBe(201);
      expect(finalStep.response?.headers["Location"]).toBe("/api/users/43");
      expect(finalStep.backend.databaseQuery?.query).toContain("INSERT INTO users");
    });
  });

  describe("Scenario 4: Auth & Routing (401 vs 403 vs 404)", () => {
    it("differentiates 401 unauthenticated, 403 forbidden, and 404 not found", () => {
      const steps = SCENARIO_HTTP_AUTH_ROUTING.steps;
      expect(steps.length).toBe(3);

      // Step 0: 401 with WWW-Authenticate
      expect(steps[0].httpData.response?.statusCode).toBe(401);
      expect(steps[0].httpData.response?.headers["WWW-Authenticate"]).toBeDefined();

      // Step 1: 403 Forbidden with valid identity but insufficient role
      expect(steps[1].httpData.response?.statusCode).toBe(403);
      expect(steps[1].httpData.request.headers["Authorization"]).toContain("Bearer");

      // Step 2: 404 Not Found
      expect(steps[2].httpData.response?.statusCode).toBe(404);
    });
  });

  describe("Scenario 5: Conditional GET & Caching (304 Not Modified)", () => {
    it("revalidates ETag and sends 0 body bytes over network", () => {
      const steps = SCENARIO_HTTP_CONDITIONAL_CACHING.steps;
      expect(steps.length).toBe(3);

      // Step 0: Initial seed
      expect(steps[0].httpData.response?.headers["ETag"]).toBeDefined();

      // Step 1: Refresh sends If-None-Match
      expect(steps[1].httpData.request.headers["If-None-Match"]).toBeDefined();

      // Step 2: 304 response with zero body bytes
      const step2 = steps[2].httpData;
      expect(step2.response?.statusCode).toBe(304);
      expect(step2.response?.body).toBeUndefined();
      expect(step2.waterfall.contentDownloadMs).toBe(0);
      expect(step2.waterfall.cacheStatus).toBe("revalidated_304");
    });
  });

  describe("Scenario 6: Gateway & Upstream Failures (502 vs 504)", () => {
    it("simulates upstream crash (502) and upstream timeout (504)", () => {
      const steps = SCENARIO_HTTP_GATEWAY_FAILURES.steps;
      expect(steps.length).toBe(2);

      // Step 0: 502 Bad Gateway
      expect(steps[0].httpData.response?.statusCode).toBe(502);
      expect(steps[0].httpData.backend.edgeNginx.status).toBe("upstream_error");

      // Step 1: 504 Gateway Timeout
      expect(steps[1].httpData.response?.statusCode).toBe(504);
      expect(steps[1].httpData.backend.edgeNginx.status).toBe("upstream_timeout");
    });
  });

  describe("Scenario 7: Failure Boundaries", () => {
    it("distinguishes transport drop, 500 error, CORS block, and preflight reject", () => {
      const steps = SCENARIO_HTTP_FAILURE_BOUNDARIES.steps;
      expect(steps.length).toBe(4);

      // Step 0: Transport Error
      expect(steps[0].httpData.client.fetchPhase).toBe("error");
      expect(steps[0].httpData.response).toBeUndefined();

      // Step 1: Server 500 (Promise resolves with res.ok === false)
      expect(steps[1].httpData.response?.statusCode).toBe(500);

      // Step 2: CORS Block
      expect(steps[2].httpData.client.reactState.errorPreview).toContain("CORS");

      // Step 3: Preflight OPTIONS
      expect(steps[3].httpData.request.method).toBe("OPTIONS");
      expect(steps[3].httpData.response?.statusCode).toBe(405);
    });
  });

  describe("Helper Utilities", () => {
    it("formats raw HTTP request with CRLF line endings", () => {
      const raw = formatRawHttpRequest({
        method: "GET",
        path: "/api/users/42",
        url: "https://api.example.com/api/users/42",
        httpVersion: "HTTP/1.1",
        headers: { Host: "api.example.com", Accept: "application/json" },
      });
      expect(raw).toBe("GET /api/users/42 HTTP/1.1\r\nHost: api.example.com\r\nAccept: application/json\r\n\r\n");
    });

    it("formats raw HTTP response with CRLF delimiters and payload", () => {
      const raw = formatRawHttpResponse({
        httpVersion: "HTTP/1.1",
        statusCode: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json", "Content-Length": "15" },
        body: '{"status":"ok"}',
      });
      expect(raw).toBe(
        'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 15\r\n\r\n{"status":"ok"}'
      );
    });
  });
});
