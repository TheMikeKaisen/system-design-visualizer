/**
 * HTTP Simulation Domain Types, Models & Educational Glossary.
 * Follows RFC 7230 / 7231 (HTTP/1.1 Message Syntax & Semantics), RFC 9110 (HTTP Semantics),
 * RFC 9112 (HTTP/1.1), RFC 8446 (TLS 1.3), and W3C Fetch Specification.
 */

import type { ConceptDefinition } from "@/components/network-simulator/InteractiveExplanationBar";
import type { NetworkScenarioStep, NetworkSimulationScenario } from "./engine";

// ─────────────────────────────────────────────────────────────
// 1. HTTP Protocol Types
// ─────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH";

export type HttpVersion = "HTTP/1.1" | "HTTP/2";

export interface HttpRequestData {
  method: HttpMethod;
  url: string;
  path: string;
  httpVersion: HttpVersion;
  headers: Record<string, string>;
  body?: string;
  rawAscii?: string;
}

export interface HttpResponseData {
  statusCode: number;
  statusText: string;
  httpVersion: HttpVersion;
  headers: Record<string, string>;
  body?: string;
  rawAscii?: string;
}

export interface HttpWaterfallTiming {
  dnsMs: number;
  tcpMs: number;
  tlsMs: number;
  requestSentMs: number;
  ttfbMs: number;
  contentDownloadMs: number;
  totalMs: number;
  isReusedConnection?: boolean;
  cacheStatus?: "miss" | "hit" | "revalidated_304";
}

export interface HttpClientState {
  url: string;
  fetchPhase:
    | "idle"
    | "initiating"
    | "sending_headers"
    | "waiting_ttfb"
    | "headers_received"
    | "streaming_body"
    | "body_parsed"
    | "error";
  phaseDescription?: string;
  reactState: {
    componentName: string;
    codeSnippet: string;
    highlightedLine?: number;
    componentState: "idle" | "loading" | "success" | "error";
    dataPreview?: string;
    errorPreview?: string;
  };
  activeSocket: {
    localPort: number;
    remotePort: number;
    reused: boolean;
    tlsVersion: string;
  };
  browserCache?: {
    etag?: string;
    hasCachedEntry: boolean;
    cacheControl?: string;
  };
}

export interface HttpMiddlewareStep {
  name: string;
  role: "cors" | "rate_limit" | "auth" | "body_parser" | "router" | "handler" | "error_handler";
  status: "pending" | "executing" | "passed" | "rejected";
  durationMs?: number;
  logMessage?: string;
}

export interface HttpBackendState {
  edgeNginx: {
    status:
      | "idle"
      | "receiving"
      | "routing"
      | "proxying_upstream"
      | "responding"
      | "upstream_error"
      | "upstream_timeout";
    upstreamTarget?: string;
    proxyConfig?: string;
    port: number;
  };
  middlewarePipeline: HttpMiddlewareStep[];
  databaseQuery?: {
    query: string;
    status: "pending" | "executing" | "hit" | "miss" | "timeout" | "crashed";
    durationMs?: number;
    resultPreview?: string;
  };
}

export interface HttpWirePacket {
  id: string;
  direction:
    | "client-to-server"
    | "server-to-client"
    | "proxy-to-app"
    | "app-to-proxy";
  type:
    | "DNS"
    | "TCP_SYN"
    | "TLS_HANDSHAKE"
    | "HTTP_REQ"
    | "HTTP_RESP_HEADERS"
    | "HTTP_RESP_BODY"
    | "TCP_RST"
    | "OPTIONS_PREFLIGHT";
  label: string;
  protocol: "HTTP/1.1" | "TLS 1.3" | "TCP" | "DNS";
  summary: string;
  isEncrypted: boolean;
  progressPct: number; // 0 to 100
}

export interface HttpWireState {
  inFlightPacket?: HttpWirePacket | null;
  connectionReuse: boolean;
}

export interface HttpStepData {
  activeRegion: "client" | "wire" | "proxy" | "backend" | "all";
  client: HttpClientState;
  wire: HttpWireState;
  backend: HttpBackendState;
  request: HttpRequestData;
  response?: HttpResponseData;
  waterfall: HttpWaterfallTiming;
  stepCategory: "network" | "client_runtime" | "proxy" | "middleware" | "database" | "cache";
}

export interface HttpScenarioStep extends NetworkScenarioStep {
  httpData: HttpStepData;
}

export interface HttpSimulationScenario extends NetworkSimulationScenario {
  steps: HttpScenarioStep[];
}

// ─────────────────────────────────────────────────────────────
// 2. Helper Formatting Utilities
// ─────────────────────────────────────────────────────────────

export function formatRawHttpRequest(req: HttpRequestData): string {
  const lines: string[] = [];
  lines.push(`${req.method} ${req.path} ${req.httpVersion}\r\n`);
  for (const [header, val] of Object.entries(req.headers)) {
    lines.push(`${header}: ${val}\r\n`);
  }
  lines.push("\r\n");
  if (req.body) {
    lines.push(req.body);
  }
  return lines.join("");
}

export function formatRawHttpResponse(res: HttpResponseData): string {
  const lines: string[] = [];
  lines.push(`${res.httpVersion} ${res.statusCode} ${res.statusText}\r\n`);
  for (const [header, val] of Object.entries(res.headers)) {
    lines.push(`${header}: ${val}\r\n`);
  }
  lines.push("\r\n");
  if (res.body) {
    lines.push(res.body);
  }
  return lines.join("");
}

// ─────────────────────────────────────────────────────────────
// 3. Educational Glossary (30+ RFC Definitions)
// ─────────────────────────────────────────────────────────────

export const HTTP_GLOSSARY: Record<string, ConceptDefinition> = {
  "GET": {
    term: "GET Method",
    category: "HTTP Request Methods (RFC 9110)",
    title: "HTTP GET Method",
    explanation:
      "Requests a representation of the specified resource. Requests using GET should only retrieve data and must be safe (read-only) and idempotent (multiple identical requests yield identical server state).",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/users/42",
      purpose: "Inspect raw response headers and body for a GET request",
    },
  },
  "POST": {
    term: "POST Method",
    category: "HTTP Request Methods (RFC 9110)",
    title: "HTTP POST Method",
    explanation:
      "Submits an entity to the specified resource, often causing a change in state or side effects on the server (e.g. creating a record, submitting a form). Neither safe nor idempotent.",
    commandExample: {
      platform: "Universal",
      command: "curl -i -X POST https://api.example.com/api/users -H 'Content-Type: application/json' -d '{\"name\":\"Charlie\"}'",
      purpose: "Send a JSON payload in request body to create a resource",
    },
  },
  "OPTIONS": {
    term: "OPTIONS Method",
    category: "HTTP Request Methods (RFC 9110)",
    title: "HTTP OPTIONS / CORS Preflight",
    explanation:
      "Requests permitted communication options for the target resource. Extensively used by browsers in CORS preflight checks prior to non-simple cross-origin requests.",
    commandExample: {
      platform: "Universal",
      command: "curl -i -X OPTIONS https://api.example.com/api/users/42 -H 'Origin: https://frontend.dev' -H 'Access-Control-Request-Method: PUT'",
      purpose: "Simulate browser CORS preflight check",
    },
  },
  "200 OK": {
    term: "200 OK",
    category: "HTTP Status Codes (RFC 9110)",
    title: "200 OK Status Code",
    explanation:
      "The request has succeeded. For GET, the resource has been fetched and is transmitted in the message body. For POST, it describes the outcome of the action.",
    commandExample: {
      platform: "Universal",
      command: "curl -s -o /dev/null -w '%{http_code}\\n' https://api.example.com/healthz",
      purpose: "Extract only the numerical status code from an HTTP response",
      output: "200",
    },
  },
  "201 Created": {
    term: "201 Created",
    category: "HTTP Status Codes (RFC 9110)",
    title: "201 Created Status Code",
    explanation:
      "The request has succeeded and led to the creation of a new resource. The new resource's URI is typically delivered in the Location response header.",
    commandExample: {
      platform: "Universal",
      command: "curl -i -X POST https://api.example.com/api/users -d '...' | grep -i Location",
      purpose: "Retrieve the Location URI of newly created resource",
      output: "Location: /api/users/43",
    },
  },
  "304 Not Modified": {
    term: "304 Not Modified",
    category: "HTTP Caching (RFC 9111)",
    title: "304 Not Modified Status Code",
    explanation:
      "Informs the client that the cached copy remains fresh and valid. The server transmits no message body, saving huge amounts of bandwidth and round-trip time.",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/settings -H 'If-None-Match: \"w/33a-xY7\"'",
      purpose: "Send conditional validation request checking ETag freshness",
      output: "HTTP/1.1 304 Not Modified\\r\\nETag: \"w/33a-xY7\"",
    },
  },
  "401 Unauthorized": {
    term: "401 Unauthorized",
    category: "HTTP Authentication (RFC 9110)",
    title: "401 Unauthorized (Unauthenticated)",
    explanation:
      "Indicates that the request lacks valid authentication credentials for the target resource. The server must send a WWW-Authenticate header indicating the challenge scheme.",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/admin/metrics",
      purpose: "Observe 401 response when Authorization header is omitted",
      output: "HTTP/1.1 401 Unauthorized\\r\\nWWW-Authenticate: Bearer realm=\"Admin API\"",
    },
  },
  "403 Forbidden": {
    term: "403 Forbidden",
    category: "HTTP Authorization (RFC 9110)",
    title: "403 Forbidden (Insufficient Permissions)",
    explanation:
      "The server understood the client's identity (authentication succeeded), but refuses authorization. Unlike 401, re-authenticating with the same identity will not grant access.",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/admin/metrics -H 'Authorization: Bearer viewer_token'",
      purpose: "Trigger 403 authorization guard rejection",
      output: "HTTP/1.1 403 Forbidden",
    },
  },
  "404 Not Found": {
    term: "404 Not Found",
    category: "HTTP Status Codes (RFC 9110)",
    title: "404 Not Found Status Code",
    explanation:
      "The server cannot find the requested resource. The path is either invalid, deleted, or masked by the server to conceal the existence of an endpoint.",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/nonexistent-route",
      purpose: "Inspect 404 response for unmapped routes",
    },
  },
  "500 Internal Server Error": {
    term: "500 Internal Server Error",
    category: "HTTP Server Errors (RFC 9110)",
    title: "500 Internal Server Error",
    explanation:
      "The server encountered an unexpected condition or unhandled exception in backend code that prevented it from fulfilling the request.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "journalctl -u express-app.service -n 50 --no-pager",
      purpose: "Inspect unhandled backend exception stack traces",
    },
  },
  "502 Bad Gateway": {
    term: "502 Bad Gateway",
    category: "HTTP Gateway Errors (RFC 9110)",
    title: "502 Bad Gateway",
    explanation:
      "The server, while acting as a gateway or reverse proxy (e.g. Nginx), received an invalid response or unexpected TCP RST from the upstream backend application server.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "tail -n 20 /var/log/nginx/error.log | grep upstream",
      purpose: "Diagnose upstream connection reset or crash causing 502",
      output: "[error] connect() failed (111: Connection refused) while connecting to upstream",
    },
  },
  "504 Gateway Timeout": {
    term: "504 Gateway Timeout",
    category: "HTTP Gateway Errors (RFC 9110)",
    title: "504 Gateway Timeout",
    explanation:
      "The reverse proxy did not receive a timely response from an upstream server (e.g. Node.js or database) before the proxy_read_timeout threshold expired.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "grep 'upstream timed out' /var/log/nginx/error.log",
      purpose: "Confirm proxy_read_timeout expiration in Nginx error log",
      output: "[error] upstream timed out (110: Connection timed out) while reading response header",
    },
  },
  "TTFB": {
    term: "Time to First Byte (TTFB)",
    category: "HTTP Performance Metrics",
    title: "Time to First Byte (TTFB)",
    explanation:
      "The duration from when the client sent the HTTP request until the very first byte of the response headers arrives. Measures network latency + server-side processing + database queries.",
    commandExample: {
      platform: "Universal",
      command: "curl -w 'TTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\n' -s -o /dev/null https://api.example.com/api/users/42",
      purpose: "Measure exact TTFB duration via curl timing flags",
      output: "TTFB: 0.082s\\nTotal: 0.095s",
    },
  },
  "ETag": {
    term: "ETag Header",
    category: "HTTP Caching (RFC 9111)",
    title: "Entity Tag (ETag)",
    explanation:
      "An HTTP response header providing an opaque hash or version token for a specific version of a resource. Used in conditional requests to validate cached representations.",
    commandExample: {
      platform: "Universal",
      command: "curl -sI https://api.example.com/api/settings | grep -i etag",
      purpose: "Inspect ETag validator hash emitted by server",
      output: "ETag: \"w/33a-xY7\"",
    },
  },
  "If-None-Match": {
    term: "If-None-Match Header",
    category: "HTTP Conditional Requests (RFC 9110)",
    title: "If-None-Match Conditional Header",
    explanation:
      "A request header sent by a client containing one or more ETags previously received. If the server's current resource matches, it sends 304 Not Modified with no body.",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/settings -H 'If-None-Match: \"w/33a-xY7\"'",
      purpose: "Perform conditional validation request",
    },
  },
  "Keep-Alive": {
    term: "Connection Keep-Alive",
    category: "HTTP Connection Management (RFC 7230)",
    title: "Keep-Alive & Connection Reuse",
    explanation:
      "Maintains the underlying TCP socket open across multiple HTTP requests. Bypasses repetitive DNS lookups, TCP 3-way handshakes, and TLS key exchanges, slashing latency.",
    commandExample: {
      platform: "Universal",
      command: "curl -v https://api.example.com/api/users/42 https://api.example.com/api/users/42/posts",
      purpose: "Verify curl reuses the same connection handle for sequential requests",
      output: "* Re-using existing connection! (#0) with host api.example.com",
    },
  },
  "Content-Length": {
    term: "Content-Length Header",
    category: "HTTP Framing (RFC 9110)",
    title: "Content-Length Header",
    explanation:
      "Indicates the decimal size of the message body in octets (bytes). Critical for HTTP/1.1 persistent connections to determine where one message ends and the next begins.",
    commandExample: {
      platform: "Universal",
      command: "curl -sI https://api.example.com/api/users/42 | grep -i content-length",
      purpose: "Check advertised octet length of payload",
      output: "Content-Length: 68",
    },
  },
  "Content-Type": {
    term: "Content-Type Header",
    category: "HTTP Representation (RFC 9110)",
    title: "Content-Type & Media Types",
    explanation:
      "Indicates the MIME media type of the resource (e.g. application/json, text/html) and optional character encoding (charset=utf-8) so clients know how to parse the byte stream.",
    commandExample: {
      platform: "Universal",
      command: "curl -sI https://api.example.com/api/users/42 | grep -i content-type",
      purpose: "Inspect response MIME classification",
      output: "Content-Type: application/json; charset=utf-8",
    },
  },
  "Location": {
    term: "Location Header",
    category: "HTTP Redirection & Creation (RFC 9110)",
    title: "Location Header",
    explanation:
      "Used in 201 Created responses to identify the URI of the newly created resource, and in 3xx redirection responses to provide the target redirection URL.",
    commandExample: {
      platform: "Universal",
      command: "curl -i -X POST https://api.example.com/api/users -d '...' | grep -i location",
      purpose: "Extract target URL of newly spawned entity",
      output: "Location: /api/users/43",
    },
  },
  "CORS": {
    term: "CORS Mechanism",
    category: "Browser Security (W3C CORS)",
    title: "Cross-Origin Resource Sharing (CORS)",
    explanation:
      "A browser security mechanism that uses HTTP headers to determine whether web applications running in one origin are granted permission to access resources from a different origin.",
    commandExample: {
      platform: "Universal",
      command: "curl -i https://api.example.com/api/users/42 -H 'Origin: https://frontend.dev'",
      purpose: "Inspect CORS permission headers returned by server",
      output: "Access-Control-Allow-Origin: https://frontend.dev",
    },
  },
  "Access-Control-Allow-Origin": {
    term: "Access-Control-Allow-Origin",
    category: "Browser Security (W3C CORS)",
    title: "Access-Control-Allow-Origin Header",
    explanation:
      "Emitted by the server to tell the browser which origins are allowed to read the response. If missing or mismatched with request Origin, the browser hides response data from JavaScript.",
    commandExample: {
      platform: "Universal",
      command: "curl -sI https://api.example.com/api/users/42 -H 'Origin: https://frontend.dev' | grep -i access-control",
      purpose: "Verify server permits requesting origin",
    },
  },
  "Preflight": {
    term: "Preflight OPTIONS",
    category: "Browser Security (W3C CORS)",
    title: "CORS Preflight Request",
    explanation:
      "An automated HTTP OPTIONS request sent by the browser before the actual request when methods other than GET/POST/HEAD or custom headers (like Authorization) are used.",
    commandExample: {
      platform: "Universal",
      command: "curl -i -X OPTIONS https://api.example.com/api/users/42 -H 'Origin: https://frontend.dev' -H 'Access-Control-Request-Headers: Authorization'",
      purpose: "Manually issue CORS preflight check",
    },
  },
  "fetch()": {
    term: "Fetch API 2-Phase Lifecycle",
    category: "JavaScript Web API",
    title: "Fetch API 2-Phase Lifecycle",
    explanation:
      "The window.fetch() promise resolves in Phase 1 as soon as HTTP response headers arrive. Reading the response body via res.json() or res.text() is Phase 2, which streams bytes asynchronously.",
    commandExample: {
      platform: "Universal",
      command: "node -e 'fetch(\"https://api.example.com\").then(res => console.log(\"Phase 1 headers:\", res.status))'",
      purpose: "Observe initial header arrival resolution",
    },
  },
  "res.json()": {
    term: "Response.json() Streaming",
    category: "JavaScript Web API",
    title: "Response.json() Body Streaming",
    explanation:
      "Takes a Response stream, reads it to completion, and returns a promise that resolves with the result of parsing the body text as JSON.",
    commandExample: {
      platform: "Universal",
      command: "node -e 'fetch(\"https://api.example.com/api/users/42\").then(r => r.json()).then(console.log)'",
      purpose: "Stream and deserialize body payload into JavaScript object",
    },
  },
  "CRLF": {
    term: "CRLF Delimiter (\\r\\n)",
    category: "HTTP Framing (RFC 7230)",
    title: "CRLF Delimiter & Header Termination",
    explanation:
      "HTTP/1.1 protocol messages use Carriage Return (0x0D) followed by Line Feed (0x0A) — written \\r\\n — to terminate lines. An empty line consisting of double CRLF (\\r\\n\\r\\n) marks the end of headers.",
    commandExample: {
      platform: "Universal",
      command: "printf 'GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n' | nc example.com 80",
      purpose: "Send raw ASCII HTTP request with authentic CRLF delimiters",
    },
  },
  "proxy_pass": {
    term: "Nginx proxy_pass",
    category: "Reverse Proxy Architecture",
    title: "Nginx proxy_pass Directive",
    explanation:
      "Configures the protocol and address of the upstream proxied server (e.g. proxy_pass http://127.0.0.1:3000). Nginx forwards client requests to the internal application daemon.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "nginx -T | grep proxy_pass",
      purpose: "Inspect active reverse proxy routing rules in Nginx config",
      output: "proxy_pass http://127.0.0.1:3000;",
    },
  },
  "proxy_read_timeout": {
    term: "proxy_read_timeout",
    category: "Reverse Proxy Architecture",
    title: "Nginx proxy_read_timeout",
    explanation:
      "Defines a timeout for reading a response from the proxied server. If the upstream server fails to transmit anything within this timeframe, Nginx issues 504 Gateway Timeout.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "nginx -T | grep proxy_read_timeout",
      purpose: "Check upstream read timeout boundaries",
      output: "proxy_read_timeout 60s;",
    },
  },
  "TCP RST": {
    term: "TCP Reset (RST)",
    category: "TCP Transport Control",
    title: "TCP Reset (RST Flag)",
    explanation:
      "An immediate abort signal sent when a connection attempt targets an unbound port or an upstream process crashes unexpectedly. Causes Nginx to return 502 Bad Gateway.",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn -c 1 'tcp[tcpflags] & tcp-rst != 0'",
      purpose: "Capture TCP RST abort packet on network interface",
    },
  },
  "Bearer Token": {
    term: "Bearer Token Authorization",
    category: "HTTP Authentication (RFC 6750)",
    title: "Authorization: Bearer Token",
    explanation:
      "The standard HTTP header format for passing cryptographic tokens (e.g. JWT) in API requests. If missing or expired, API gateways reject the request with 401 Unauthorized.",
    commandExample: {
      platform: "Universal",
      command: "curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' https://api.example.com/api/users/42",
      purpose: "Transmit bearer token in Authorization header",
    },
  },
  "Cache-Control": {
    term: "Cache-Control Header",
    category: "HTTP Caching (RFC 9111)",
    title: "Cache-Control Directive",
    explanation:
      "Controls caching behavior in browsers and shared intermediate caches. Common directives include max-age, no-cache, no-store, and must-revalidate.",
    commandExample: {
      platform: "Universal",
      command: "curl -sI https://api.example.com/api/settings | grep -i cache-control",
      purpose: "Inspect server caching directives",
      output: "Cache-Control: max-age=0, must-revalidate",
    },
  },
  "express.json()": {
    term: "express.json() Middleware",
    category: "Backend Frameworks",
    title: "express.json() Body Parser",
    explanation:
      "Express built-in middleware that listens to incoming request stream data chunks, buffers them until matching Content-Length, and parses JSON into JavaScript object req.body.",
    commandExample: {
      platform: "Universal",
      command: "node -e 'const express = require(\"express\"); const app = express(); app.use(express.json());'",
      purpose: "Mount standard JSON stream parser middleware in Express",
    },
  },
  "Waterfall": {
    term: "HTTP Waterfall Timing",
    category: "Browser Telemetry",
    title: "HTTP Network Waterfall",
    explanation:
      "A graphical timeline decomposing the complete request-response lifecycle into distinct phases: Stalled/Queued, DNS Lookup, TCP Connect, TLS Handshake, Request Sent, TTFB, and Content Download.",
    commandExample: {
      platform: "Universal",
      command: "curl -w '@curl-format.txt' -o /dev/null -s https://api.example.com/api/users/42",
      purpose: "Export comprehensive timing waterfall breakdown",
    },
  },
  "Idempotency": {
    term: "HTTP Idempotency",
    category: "HTTP Semantics (RFC 9110)",
    title: "Idempotent HTTP Methods",
    explanation:
      "An HTTP method is idempotent if the intended effect on the server of multiple identical requests is the same as for a single request (e.g. GET, PUT, DELETE are idempotent; POST is not).",
    commandExample: {
      platform: "Universal",
      command: "curl -X PUT https://api.example.com/api/users/42 -d '{\"name\":\"Alice\"}'",
      purpose: "Execute idempotent PUT update on resource",
    },
  },
};

export const HTTP_TERM_PATTERNS = [
  "GET /api/users/42/posts",
  "GET /api/users/42",
  "GET /api/settings",
  "GET /api/admin/metrics",
  "POST /api/users",
  "OPTIONS /api/users/42",
  "200 OK",
  "201 Created",
  "304 Not Modified",
  "401 Unauthorized",
  "403 Forbidden",
  "404 Not Found",
  "500 Internal Server Error",
  "502 Bad Gateway",
  "504 Gateway Timeout",
  "Time to First Byte",
  "TTFB",
  "If-None-Match",
  "ETag",
  "Keep-Alive",
  "Content-Length",
  "Content-Type",
  "Location",
  "Access-Control-Allow-Origin",
  "Preflight",
  "CORS",
  "fetch()",
  "res.json()",
  "Response.json()",
  "CRLF",
  "proxy_pass",
  "proxy_read_timeout",
  "TCP RST",
  "Bearer Token",
  "Cache-Control",
  "express.json()",
  "Waterfall",
  "Idempotency",
  "OPTIONS",
  "POST",
  "GET",
];
