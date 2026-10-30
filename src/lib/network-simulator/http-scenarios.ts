/**
 * HTTP Simulation Scenarios — Comprehensive RFC 7230 / 9110 / 9111 Deterministic Datasets.
 * Strictly adheres to Simulation Rule #1 (Data-driven state isolation)
 * and Network Decisions (Zero duplication, responsive fidelity).
 */

import type { NetworkHost, SocketEntry } from "./engine";
import type { HttpSimulationScenario } from "./http-engine";

// ─────────────────────────────────────────────────────────────
// Shared Host & Socket Fixtures
// ─────────────────────────────────────────────────────────────

const CLIENT_HOST: NetworkHost = {
  id: "client-host",
  name: "Client Browser (Workstation)",
  role: "client",
  ip: "192.168.1.10",
  ipVersion: "IPv4",
  interfaceName: "en0",
  macAddress: "52:54:00:12:34:56",
  applications: [
    {
      id: "browser-app",
      name: "Chrome / WebApp",
      pid: 5410,
      port: 52410,
      status: "connected",
    },
  ],
};

const NGINX_EDGE_HOST: NetworkHost = {
  id: "nginx-host",
  name: "Edge Reverse Proxy (Nginx)",
  role: "server",
  ip: "198.51.100.1",
  ipVersion: "IPv4",
  interfaceName: "eth0",
  macAddress: "52:54:00:88:99:aa",
  applications: [
    {
      id: "nginx-proxy",
      name: "nginx / 1.25.4",
      pid: 1042,
      port: 443,
      status: "listening",
    },
  ],
};

const BACKEND_APP_HOST: NetworkHost = {
  id: "backend-app-host",
  name: "Upstream App Server (Node/Express)",
  role: "server",
  ip: "127.0.0.1",
  ipVersion: "IPv4",
  interfaceName: "lo0",
  macAddress: "00:00:00:00:00:00",
  applications: [
    {
      id: "express-app",
      name: "node index.js",
      pid: 2048,
      port: 3000,
      status: "listening",
    },
    {
      id: "postgres-db",
      name: "postgres:16",
      pid: 3012,
      port: 5432,
      status: "listening",
    },
  ],
};

const DEFAULT_HOSTS: NetworkHost[] = [CLIENT_HOST, NGINX_EDGE_HOST, BACKEND_APP_HOST];

const BASE_SOCKETS: SocketEntry[] = [
  {
    id: "sock-client-tls",
    hostId: "client-host",
    protocol: "TCP",
    localIp: "192.168.1.10",
    localPort: 52410,
    remoteIp: "198.51.100.1",
    remotePort: 443,
    state: "ESTABLISHED",
    sendBufferBytes: 0,
    recvBufferBytes: 0,
    isListening: false,
    processName: "chrome",
  },
  {
    id: "sock-nginx-listen-443",
    hostId: "nginx-host",
    protocol: "TCP",
    localIp: "0.0.0.0",
    localPort: 443,
    remoteIp: "0.0.0.0",
    remotePort: 0,
    state: "LISTEN",
    sendBufferBytes: 0,
    recvBufferBytes: 0,
    isListening: true,
    processName: "nginx: master",
  },
  {
    id: "sock-nginx-upstream-3000",
    hostId: "nginx-host",
    protocol: "TCP",
    localIp: "127.0.0.1",
    localPort: 48922,
    remoteIp: "127.0.0.1",
    remotePort: 3000,
    state: "ESTABLISHED",
    sendBufferBytes: 0,
    recvBufferBytes: 0,
    isListening: false,
    processName: "nginx: worker",
  },
  {
    id: "sock-express-listen-3000",
    hostId: "backend-app-host",
    protocol: "TCP",
    localIp: "127.0.0.1",
    localPort: 3000,
    remoteIp: "0.0.0.0",
    remotePort: 0,
    state: "LISTEN",
    sendBufferBytes: 0,
    recvBufferBytes: 0,
    isListening: true,
    processName: "node (express)",
  },
];

// ─────────────────────────────────────────────────────────────
// Scenario 1: Canonical GET /api/users/42 (200 OK)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_CANONICAL_GET: HttpSimulationScenario = {
  id: "http-canonical-get",
  title: "1. Canonical GET /api/users/42 (200 OK)",
  description:
    "End-to-end cold start request: DNS resolution, TCP handshake, TLS 1.3 tunnel, HTTP serialization, Nginx reverse proxying, Express middleware execution, database query, and the JavaScript 2-phase fetch lifecycle.",
  badge: "HTTP GET & 2-Phase Fetch",
  steps: [
    {
      id: "step-1-1",
      stepIndex: 0,
      title: "Client Action: fetch('/api/users/42') Initiated",
      badge: "Client Initiation",
      explanation:
        "The React <UserProfile /> component mounts and triggers window.fetch('/api/users/42'). Because this is a cold start, the browser has no open socket to api.example.com and must resolve DNS.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "initiating",
          phaseDescription: "Initiating fetch: DNS query dispatched for api.example.com",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "None (Handshaking)",
          },
        },
        wire: {
          connectionReuse: false,
          inFlightPacket: {
            id: "pkt-dns-query",
            direction: "client-to-server",
            type: "DNS",
            label: "DNS Query: api.example.com -> A?",
            protocol: "DNS",
            summary: "Standard recursive DNS query to resolve edge IP 198.51.100.1",
            isEncrypted: false,
            progressPct: 30,
          },
        },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "authBearer()", role: "auth", status: "pending" },
            { name: "express.json()", role: "body_parser", status: "pending" },
            { name: "getUserHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "User-Agent": "Mozilla/5.0 Chrome/122.0.0.0",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
          },
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 0,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 14,
        },
      },
    },
    {
      id: "step-1-2",
      stepIndex: 1,
      title: "Transport Setup: TCP Handshake & TLS 1.3 Key Exchange",
      badge: "Connection Handshake",
      explanation:
        "The browser completes the TCP 3-way handshake (SYN, SYN-ACK, ACK) and TLS 1.3 handshake (ClientHello, ServerHello with Diffie-Hellman ephemeral key exchange) over port 443.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "wire",
        stepCategory: "network",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "sending_headers",
          phaseDescription: "TLS 1.3 established (AES-256-GCM). Socket is now encrypted and ready.",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "TLS 1.3 (TLS_AES_256_GCM_SHA384)",
          },
        },
        wire: {
          connectionReuse: false,
          inFlightPacket: {
            id: "pkt-tls-handshake",
            direction: "client-to-server",
            type: "TLS_HANDSHAKE",
            label: "TLS 1.3 Handshake Finished (Cipher: AES_256_GCM)",
            protocol: "TLS 1.3",
            summary: "1-RTT TLS 1.3 Handshake completed. Symmetric session keys installed.",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "receiving", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "authBearer()", role: "auth", status: "pending" },
            { name: "express.json()", role: "body_parser", status: "pending" },
            { name: "getUserHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "User-Agent": "Mozilla/5.0 Chrome/122.0.0.0",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
          },
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 22,
          tlsMs: 31,
          requestSentMs: 0,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 67,
        },
      },
    },
    {
      id: "step-1-3",
      stepIndex: 2,
      title: "Wire Transmission: HTTP/1.1 Request Serialized with CRLF",
      badge: "Request In-Flight",
      explanation:
        "The browser formats the HTTP/1.1 GET request with CRLF (\\r\\n) line endings and header termination (\\r\\n\\r\\n). The encrypted record travels across the wire to the edge Nginx reverse proxy.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "wire",
        stepCategory: "network",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "waiting_ttfb",
          phaseDescription: "Request sent. Client is now waiting for Time to First Byte (TTFB).",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: false,
          inFlightPacket: {
            id: "pkt-http-get",
            direction: "client-to-server",
            type: "HTTP_REQ",
            label: "GET /api/users/42 HTTP/1.1 [Host: api.example.com]",
            protocol: "HTTP/1.1",
            summary: "Encrypted HTTP/1.1 GET request traversing TLS tunnel",
            isEncrypted: true,
            progressPct: 65,
          },
        },
        backend: {
          edgeNginx: { status: "receiving", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "authBearer()", role: "auth", status: "pending" },
            { name: "express.json()", role: "body_parser", status: "pending" },
            { name: "getUserHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "User-Agent": "Mozilla/5.0 Chrome/122.0.0.0",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
          },
          rawAscii:
            "GET /api/users/42 HTTP/1.1\\r\\nHost: api.example.com\\r\\nUser-Agent: Mozilla/5.0 Chrome/122.0.0.0\\r\\nAccept: application/json\\r\\nAccept-Encoding: gzip, deflate, br\\r\\nConnection: keep-alive\\r\\n\\r\\n",
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 22,
          tlsMs: 31,
          requestSentMs: 2,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 69,
        },
      },
    },
    {
      id: "step-1-4",
      stepIndex: 3,
      title: "Edge Proxy: Nginx Terminates SSL & Executes proxy_pass",
      badge: "Nginx Gateway",
      explanation:
        "Nginx on port 443 terminates TLS, inspects location /api/, and executes proxy_pass http://127.0.0.1:3000 to forward the request to the upstream Node.js process.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "proxy",
        stepCategory: "proxy",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "waiting_ttfb",
          phaseDescription: "Waiting for server response headers...",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: false,
          inFlightPacket: {
            id: "pkt-nginx-upstream",
            direction: "proxy-to-app",
            type: "HTTP_REQ",
            label: "proxy_pass -> http://127.0.0.1:3000/api/users/42",
            protocol: "HTTP/1.1",
            summary: "Nginx upstream forward via internal loopback socket",
            isEncrypted: false,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: {
            status: "proxying_upstream",
            upstreamTarget: "127.0.0.1:3000",
            proxyConfig: "location /api/ { proxy_pass http://127.0.0.1:3000; proxy_set_header X-Real-IP $remote_addr; }",
            port: 443,
          },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "executing", logMessage: "Origin check: allowed" },
            { name: "authBearer()", role: "auth", status: "pending" },
            { name: "express.json()", role: "body_parser", status: "pending" },
            { name: "getUserHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "User-Agent": "Mozilla/5.0 Chrome/122.0.0.0",
            "Accept": "application/json",
            "Connection": "keep-alive",
            "X-Real-IP": "192.168.1.10",
            "X-Forwarded-For": "192.168.1.10",
          },
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 22,
          tlsMs: 31,
          requestSentMs: 2,
          ttfbMs: 6,
          contentDownloadMs: 0,
          totalMs: 75,
        },
      },
    },
    {
      id: "step-1-5",
      stepIndex: 4,
      title: "Backend: Express Middleware Stack & DB Query Execution",
      badge: "App Server Execution",
      explanation:
        "Express passes the request through cors() and authBearer(). Route matches /api/users/:id. The controller queries PostgreSQL: SELECT * FROM users WHERE id = 42; which returns 1 row in 12ms.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "database",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "waiting_ttfb",
          phaseDescription: "PostgreSQL query executing on backend...",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: false,
        },
        backend: {
          edgeNginx: { status: "proxying_upstream", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed", durationMs: 1, logMessage: "Access-Control-Allow-Origin: *" },
            { name: "authBearer()", role: "auth", status: "passed", durationMs: 2, logMessage: "Session token validated" },
            { name: "express.json()", role: "body_parser", status: "passed", durationMs: 0, logMessage: "GET has no body; skipped" },
            { name: "getUserHandler()", role: "handler", status: "executing", logMessage: "Invoked db.query()" },
          ],
          databaseQuery: {
            query: "SELECT id, name, email, role FROM users WHERE id = 42 LIMIT 1;",
            status: "hit",
            durationMs: 12,
            resultPreview: '{"id":42,"name":"Alice Cooper","email":"alice@example.com","role":"admin"}',
          },
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Accept": "application/json",
          },
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 22,
          tlsMs: 31,
          requestSentMs: 2,
          ttfbMs: 21,
          contentDownloadMs: 0,
          totalMs: 90,
        },
      },
    },
    {
      id: "step-1-6",
      stepIndex: 5,
      title: "Response Framing: Headers Dispatched & TTFB Completes",
      badge: "TTFB Complete",
      explanation:
        "Express serializes JSON and sends 200 OK headers. Nginx forwards headers over the TLS tunnel. The browser receives the initial headers: Time to First Byte (TTFB) ends at 94ms!",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "wire",
        stepCategory: "network",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "headers_received",
          phaseDescription: "Phase 1 Complete: res headers arrived! res.ok === true, res.status === 200.",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 3,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-http-resp-headers",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 200 OK [Content-Type: application/json; Content-Length: 75]",
            protocol: "HTTP/1.1",
            summary: "Response status line and headers arriving at client (TTFB)",
            isEncrypted: true,
            progressPct: 80,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "authBearer()", role: "auth", status: "passed" },
            { name: "express.json()", role: "body_parser", status: "passed" },
            { name: "getUserHandler()", role: "handler", status: "passed", durationMs: 15 },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 200,
          statusText: "OK",
          httpVersion: "HTTP/1.1",
          headers: {
            "Date": "Wed, 29 Oct 2026 19:20:00 GMT",
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "75",
            "Connection": "keep-alive",
            "Keep-Alive": "timeout=60",
            "ETag": 'W/"4b-qO9g91"',
            "Server": "nginx/1.25.4",
          },
          rawAscii:
            "HTTP/1.1 200 OK\\r\\nDate: Wed, 29 Oct 2026 19:20:00 GMT\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 75\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=60\\r\\nETag: W/\"4b-qO9g91\"\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n",
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 22,
          tlsMs: 31,
          requestSentMs: 2,
          ttfbMs: 25,
          contentDownloadMs: 0,
          totalMs: 94,
        },
      },
    },
    {
      id: "step-1-7",
      stepIndex: 6,
      title: "fetch() Phase 2: res.json() Streams Body & React Renders",
      badge: "Payload Streaming & UI Paint",
      explanation:
        "The client calls await res.json(). The browser streams the 75-byte JSON body from the network socket, deserializes the object, and React updates state: <UserProfile /> renders with Alice's details!",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "body_parsed",
          phaseDescription: "Phase 2 Complete: res.json() stream parsed. React rendered UserProfile successfully.",
          reactState: {
            componentName: "UserProfile",
            codeSnippet: `// 1. Component triggers fetch
const res = await fetch('https://api.example.com/api/users/42');
// res.headers arrive first (Phase 1)
const user = await res.json(); // Body streamed (Phase 2)
setUser(user);`,
            highlightedLine: 5,
            componentState: "success",
            dataPreview: '{"id":42,"name":"Alice Cooper","email":"alice@example.com","role":"admin"}',
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3 (Keep-Alive Pool)",
          },
          browserCache: {
            etag: 'W/"4b-qO9g91"',
            hasCachedEntry: true,
            cacheControl: "max-age=0, must-revalidate",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-http-resp-body",
            direction: "server-to-client",
            type: "HTTP_RESP_BODY",
            label: 'Body: {"id":42,"name":"Alice Cooper","role":"admin"}',
            protocol: "HTTP/1.1",
            summary: "TCP segment carrying application JSON payload stream",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "authBearer()", role: "auth", status: "passed" },
            { name: "express.json()", role: "body_parser", status: "passed" },
            { name: "getUserHandler()", role: "handler", status: "passed" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 200,
          statusText: "OK",
          httpVersion: "HTTP/1.1",
          headers: {
            "Date": "Wed, 29 Oct 2026 19:20:00 GMT",
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "75",
            "Connection": "keep-alive",
            "Keep-Alive": "timeout=60",
            "ETag": 'W/"4b-qO9g91"',
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify(
            { id: 42, name: "Alice Cooper", email: "alice@example.com", role: "admin" },
            null,
            2
          ),
          rawAscii:
            'HTTP/1.1 200 OK\\r\\nDate: Wed, 29 Oct 2026 19:20:00 GMT\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 75\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=60\\r\\nETag: W/"4b-qO9g91"\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n{"id":42,"name":"Alice Cooper","email":"alice@example.com","role":"admin"}',
        },
        waterfall: {
          dnsMs: 14,
          tcpMs: 22,
          tlsMs: 31,
          requestSentMs: 2,
          ttfbMs: 25,
          contentDownloadMs: 4,
          totalMs: 98,
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Scenario 2: Connection Reuse & Keep-Alive (GET /api/users/42/posts)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_CONNECTION_REUSE: HttpSimulationScenario = {
  id: "http-connection-reuse",
  title: "2. Connection Reuse & Keep-Alive (GET /api/users/42/posts)",
  description:
    "Observe how HTTP Keep-Alive reuses an open persistent TCP/TLS socket pool, bypassing 3 network round-trips (DNS, TCP 3-way handshake, TLS 1.3 key exchange) to complete requests in under 20ms.",
  badge: "HTTP Keep-Alive",
  steps: [
    {
      id: "step-2-1",
      stepIndex: 0,
      title: "Client Action: Secondary Fetch Initiated",
      badge: "Socket Pool Check",
      explanation:
        "The user navigates to the posts tab, triggering fetch('/api/users/42/posts'). The browser checks its internal HTTP connection pool for host api.example.com.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users/42/posts",
          fetchPhase: "initiating",
          phaseDescription: "Socket pool inspected: found idle keep-alive socket :52410 <-> :443",
          reactState: {
            componentName: "UserPosts",
            codeSnippet: `// Secondary request immediately reuses socket!
const res = await fetch('/api/users/42/posts');
const posts = await res.json();
setPosts(posts);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3 (Warm Reused)",
          },
        },
        wire: {
          connectionReuse: true,
        },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "authBearer()", role: "auth", status: "pending" },
            { name: "getPostsHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42/posts",
          path: "/api/users/42/posts",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Accept": "application/json",
            "Connection": "keep-alive",
          },
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 0,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 0,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-2-2",
      stepIndex: 1,
      title: "Zero Handshake Overhead: 3 RTTs (DNS, TCP, TLS) Bypassed",
      badge: "0ms Handshake Bypass",
      explanation:
        "Because the Keep-Alive socket is already established and authenticated, DNS lookup (14ms), TCP connect (22ms), and TLS 1.3 key exchange (31ms) are completely bypassed! 67ms of latency saved!",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "wire",
        stepCategory: "network",
        client: {
          url: "https://api.example.com/api/users/42/posts",
          fetchPhase: "sending_headers",
          phaseDescription: "Reusing persistent TLS socket. Transmitting HTTP GET immediately.",
          reactState: {
            componentName: "UserPosts",
            codeSnippet: `// Secondary request immediately reuses socket!
const res = await fetch('/api/users/42/posts');
const posts = await res.json();
setPosts(posts);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-keepalive-req",
            direction: "client-to-server",
            type: "HTTP_REQ",
            label: "GET /api/users/42/posts HTTP/1.1 (Reused Connection)",
            protocol: "HTTP/1.1",
            summary: "Reused TLS socket transmits request instantaneously with 0 handshake delay",
            isEncrypted: true,
            progressPct: 50,
          },
        },
        backend: {
          edgeNginx: { status: "receiving", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "authBearer()", role: "auth", status: "pending" },
            { name: "getPostsHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42/posts",
          path: "/api/users/42/posts",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Accept": "application/json",
            "Connection": "keep-alive",
          },
          rawAscii:
            "GET /api/users/42/posts HTTP/1.1\\r\\nHost: api.example.com\\r\\nAccept: application/json\\r\\nConnection: keep-alive\\r\\n\\r\\n",
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 2,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-2-3",
      stepIndex: 2,
      title: "Backend Execution: Upstream App Query",
      badge: "Upstream Execution",
      explanation:
        "Nginx forwards request to Node.js upstream pool. Express validates the user token and queries posts table: SELECT * FROM posts WHERE user_id = 42 ORDER BY created_at DESC LIMIT 5; (8ms execution).",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "database",
        client: {
          url: "https://api.example.com/api/users/42/posts",
          fetchPhase: "waiting_ttfb",
          reactState: {
            componentName: "UserPosts",
            codeSnippet: `// Secondary request immediately reuses socket!
const res = await fetch('/api/users/42/posts');
const posts = await res.json();
setPosts(posts);`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: { connectionReuse: true },
        backend: {
          edgeNginx: { status: "proxying_upstream", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed", durationMs: 0 },
            { name: "authBearer()", role: "auth", status: "passed", durationMs: 1 },
            { name: "getPostsHandler()", role: "handler", status: "executing" },
          ],
          databaseQuery: {
            query: "SELECT id, title, likes FROM posts WHERE user_id = 42;",
            status: "hit",
            durationMs: 8,
            resultPreview: '[{"id":101,"title":"Understanding HTTP/1.1 Keep-Alive","likes":240}]',
          },
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42/posts",
          path: "/api/users/42/posts",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 12,
          contentDownloadMs: 0,
          totalMs: 14,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-2-4",
      stepIndex: 3,
      title: "Lightning Response: Total Time 18ms & Socket Stays Warm",
      badge: "Keep-Alive Active",
      explanation:
        "The server returns 200 OK with Connection: keep-alive and Keep-Alive: timeout=60. Total duration is only 18ms (compared to 98ms cold start). The socket remains parked in the pool for subsequent calls.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users/42/posts",
          fetchPhase: "body_parsed",
          phaseDescription: "Request finished in 18ms total! Socket kept open in pool.",
          reactState: {
            componentName: "UserPosts",
            codeSnippet: `// Secondary request immediately reuses socket!
const res = await fetch('/api/users/42/posts');
const posts = await res.json();
setPosts(posts);`,
            highlightedLine: 4,
            componentState: "success",
            dataPreview: '[{"id":101,"title":"Understanding HTTP/1.1 Keep-Alive","likes":240}]',
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3 (Keep-Alive Idle)",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-keepalive-resp",
            direction: "server-to-client",
            type: "HTTP_RESP_BODY",
            label: "HTTP/1.1 200 OK (Keep-Alive Active)",
            protocol: "HTTP/1.1",
            summary: "Response arrived in 18ms total duration",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "authBearer()", role: "auth", status: "passed" },
            { name: "getPostsHandler()", role: "handler", status: "passed" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users/42/posts",
          path: "/api/users/42/posts",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 200,
          statusText: "OK",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "72",
            "Connection": "keep-alive",
            "Keep-Alive": "timeout=60, max=100",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify(
            [{ id: 101, title: "Understanding HTTP/1.1 Keep-Alive", likes: 240 }],
            null,
            2
          ),
          rawAscii:
            'HTTP/1.1 200 OK\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 72\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=60, max=100\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n[{"id":101,"title":"Understanding HTTP/1.1 Keep-Alive","likes":240}]',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 13,
          contentDownloadMs: 3,
          totalMs: 18,
          isReusedConnection: true,
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Scenario 3: Resource Creation (POST /api/users, 201 Created)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_RESOURCE_CREATION: HttpSimulationScenario = {
  id: "http-resource-creation",
  title: "3. Resource Creation (POST /api/users, 201 Created)",
  description:
    "Follow a POST request submitting a JSON payload in the request body. See how Content-Length guides express.json() stream buffering, SQL INSERT, and the Location header response.",
  badge: "HTTP POST & 201 Created",
  steps: [
    {
      id: "step-3-1",
      stepIndex: 0,
      title: "Client Action: Form Submit & Body Serialization",
      badge: "Client POST Initiation",
      explanation:
        "The client submits a user creation form: fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(...) }). The browser calculates Content-Length: 43 bytes.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users",
          fetchPhase: "sending_headers",
          phaseDescription: "Payload serialized into JSON (43 bytes). Sending POST request.",
          reactState: {
            componentName: "CreateUserForm",
            codeSnippet: `const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Charlie', role: 'editor' }),
});
const newUser = await res.json();
navigate(res.headers.get('Location'));`,
            highlightedLine: 1,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: { connectionReuse: true },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "express.json()", role: "body_parser", status: "pending" },
            { name: "createUserHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "POST",
          url: "https://api.example.com/api/users",
          path: "/api/users",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Content-Type": "application/json",
            "Content-Length": "43",
            "Connection": "keep-alive",
          },
          body: '{"name":"Charlie Puth","role":"editor"}',
          rawAscii:
            'POST /api/users HTTP/1.1\\r\\nHost: api.example.com\\r\\nContent-Type: application/json\\r\\nContent-Length: 43\\r\\nConnection: keep-alive\\r\\n\\r\\n{"name":"Charlie Puth","role":"editor"}',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 3,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 3,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-3-2",
      stepIndex: 1,
      title: "Backend: express.json() Stream Buffering & Parsing",
      badge: "Stream Body Parsing",
      explanation:
        "Express receives incoming network data chunks. express.json() accumulates incoming bytes until matching Content-Length (43 bytes), verifies valid JSON, and assigns req.body.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "middleware",
        client: {
          url: "https://api.example.com/api/users",
          fetchPhase: "waiting_ttfb",
          reactState: {
            componentName: "CreateUserForm",
            codeSnippet: `const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Charlie', role: 'editor' }),
});
const newUser = await res.json();
navigate(res.headers.get('Location'));`,
            highlightedLine: 5,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: { connectionReuse: true },
        backend: {
          edgeNginx: { status: "proxying_upstream", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed", durationMs: 0 },
            {
              name: "express.json()",
              role: "body_parser",
              status: "passed",
              durationMs: 2,
              logMessage: "Buffered 43 bytes; parsed req.body successfully",
            },
            { name: "createUserHandler()", role: "handler", status: "executing" },
          ],
        },
        request: {
          method: "POST",
          url: "https://api.example.com/api/users",
          path: "/api/users",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Content-Type": "application/json",
            "Content-Length": "43",
          },
          body: '{"name":"Charlie Puth","role":"editor"}',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 3,
          ttfbMs: 8,
          contentDownloadMs: 0,
          totalMs: 11,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-3-3",
      stepIndex: 2,
      title: "Database Insert & 201 Created with Location Header",
      badge: "201 Created & Location",
      explanation:
        "The controller executes SQL: INSERT INTO users (name, role) VALUES ('Charlie Puth', 'editor') RETURNING id; creating ID 43. The server responds with 201 Created and Location: /api/users/43.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "database",
        client: {
          url: "https://api.example.com/api/users",
          fetchPhase: "headers_received",
          reactState: {
            componentName: "CreateUserForm",
            codeSnippet: `const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Charlie', role: 'editor' }),
});
const newUser = await res.json();
navigate(res.headers.get('Location'));`,
            highlightedLine: 7,
            componentState: "success",
            dataPreview: '{"id":43,"name":"Charlie Puth","role":"editor"}',
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-201-created",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 201 Created [Location: /api/users/43]",
            protocol: "HTTP/1.1",
            summary: "Resource successfully created at URI /api/users/43",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "express.json()", role: "body_parser", status: "passed" },
            { name: "createUserHandler()", role: "handler", status: "passed", durationMs: 14 },
          ],
          databaseQuery: {
            query: "INSERT INTO users (name, role) VALUES ('Charlie Puth', 'editor') RETURNING id;",
            status: "hit",
            durationMs: 11,
            resultPreview: '{"id":43}',
          },
        },
        request: {
          method: "POST",
          url: "https://api.example.com/api/users",
          path: "/api/users",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com", "Content-Length": "43" },
          body: '{"name":"Charlie Puth","role":"editor"}',
        },
        response: {
          statusCode: 201,
          statusText: "Created",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "47",
            "Location": "/api/users/43",
            "Connection": "keep-alive",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify({ id: 43, name: "Charlie Puth", role: "editor" }, null, 2),
          rawAscii:
            'HTTP/1.1 201 Created\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 47\\r\\nLocation: /api/users/43\\r\\nConnection: keep-alive\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n{"id":43,"name":"Charlie Puth","role":"editor"}',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 3,
          ttfbMs: 19,
          contentDownloadMs: 2,
          totalMs: 24,
          isReusedConnection: true,
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Scenario 4: Auth & Routing (401 Unauthorized vs 403 Forbidden vs 404 Not Found)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_AUTH_ROUTING: HttpSimulationScenario = {
  id: "http-auth-routing",
  title: "4. Auth & Routing (401 Unauthorized vs 403 Forbidden vs 404 Not Found)",
  description:
    "Demystify the critical architectural difference between 401 (unauthenticated), 403 (unauthorized/forbidden), and 404 (route/entity not found). Proves that window.fetch() does NOT reject on 4xx responses.",
  badge: "HTTP 4xx Error Matrix",
  steps: [
    {
      id: "step-4-1",
      stepIndex: 0,
      title: "Case 1: 401 Unauthorized (Missing Credentials)",
      badge: "401 Unauthenticated",
      explanation:
        "Client issues GET /api/admin/metrics with no Authorization header. Express authMiddleware checks req.headers.authorization: undefined! The pipeline aborts immediately with 401 Unauthorized.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "middleware",
        client: {
          url: "https://api.example.com/api/admin/metrics",
          fetchPhase: "headers_received",
          phaseDescription: "Proof: fetch() does NOT reject! res.ok is false, res.status is 401.",
          reactState: {
            componentName: "AdminMetrics",
            codeSnippet: `const res = await fetch('/api/admin/metrics');
// fetch() RESOLVES! It does NOT throw on 401/403/404!
if (!res.ok) {
  if (res.status === 401) redirectToLogin();
  if (res.status === 403) showForbiddenNotice();
}`,
            highlightedLine: 4,
            componentState: "error",
            errorPreview: "401 Unauthorized: Bearer realm='Admin API'",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-401-unauth",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: 'HTTP/1.1 401 Unauthorized [WWW-Authenticate: Bearer realm="Admin"]',
            protocol: "HTTP/1.1",
            summary: "Missing authorization token rejected by authentication guard",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            {
              name: "authMiddleware()",
              role: "auth",
              status: "rejected",
              logMessage: "No Bearer token present in Authorization header",
            },
            { name: "adminMetricsHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/admin/metrics",
          path: "/api/admin/metrics",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Accept": "application/json",
          },
        },
        response: {
          statusCode: 401,
          statusText: "Unauthorized",
          httpVersion: "HTTP/1.1",
          headers: {
            "WWW-Authenticate": 'Bearer realm="Admin API", error="invalid_token"',
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "45",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify({ error: "Missing authentication token" }, null, 2),
          rawAscii:
            'HTTP/1.1 401 Unauthorized\\r\\nWWW-Authenticate: Bearer realm="Admin API", error="invalid_token"\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 45\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n{"error":"Missing authentication token"}',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 1,
          ttfbMs: 6,
          contentDownloadMs: 1,
          totalMs: 8,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-4-2",
      stepIndex: 1,
      title: "Case 2: 403 Forbidden (Authenticated, But Insufficient Permissions)",
      badge: "403 Forbidden",
      explanation:
        "Client sends Authorization: Bearer token_bob. Identity is confirmed (user Bob), but role is 'viewer'. The requireAdminRole() guard rejects Bob: 403 Forbidden. Re-authenticating won't help.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "middleware",
        client: {
          url: "https://api.example.com/api/admin/metrics",
          fetchPhase: "headers_received",
          phaseDescription: "Authenticated as user Bob, but forbidden from admin route.",
          reactState: {
            componentName: "AdminMetrics",
            codeSnippet: `const res = await fetch('/api/admin/metrics');
// fetch() RESOLVES! It does NOT throw on 401/403/404!
if (!res.ok) {
  if (res.status === 401) redirectToLogin();
  if (res.status === 403) showForbiddenNotice();
}`,
            highlightedLine: 5,
            componentState: "error",
            errorPreview: "403 Forbidden: Requires role 'admin', user has role 'viewer'",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-403-forbidden",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 403 Forbidden [Role: admin required]",
            protocol: "HTTP/1.1",
            summary: "Identity validated, but insufficient role permissions",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            {
              name: "authMiddleware()",
              role: "auth",
              status: "passed",
              logMessage: "Decoded JWT: user=bob, role=viewer",
            },
            {
              name: "requireAdminRole()",
              role: "auth",
              status: "rejected",
              logMessage: "Permission check failed: role viewer != admin",
            },
            { name: "adminMetricsHandler()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/admin/metrics",
          path: "/api/admin/metrics",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Authorization": "Bearer bob_viewer_token",
          },
        },
        response: {
          statusCode: 403,
          statusText: "Forbidden",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "48",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify({ error: "Insufficient permissions for Admin API" }, null, 2),
          rawAscii:
            'HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 48\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n{"error":"Insufficient permissions for Admin API"}',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 1,
          ttfbMs: 7,
          contentDownloadMs: 1,
          totalMs: 9,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-4-3",
      stepIndex: 2,
      title: "Case 3: 404 Not Found (Unmatched Route or Entity)",
      badge: "404 Not Found",
      explanation:
        "Client requests GET /api/legacy-v1/users. All middlewares pass, but the Express router traverses the entire route table without finding a match. The default 404 handler executes.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "middleware",
        client: {
          url: "https://api.example.com/api/legacy-v1/users",
          fetchPhase: "headers_received",
          phaseDescription: "Route does not exist in backend router table.",
          reactState: {
            componentName: "AdminMetrics",
            codeSnippet: `const res = await fetch('/api/legacy-v1/users');
if (!res.ok) {
  if (res.status === 404) showNotFoundPage();
}`,
            highlightedLine: 3,
            componentState: "error",
            errorPreview: "404 Not Found: Cannot GET /api/legacy-v1/users",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: { connectionReuse: true },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "express.Router()", role: "router", status: "rejected", logMessage: "No match for path /api/legacy-v1/users" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/legacy-v1/users",
          path: "/api/legacy-v1/users",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 404,
          statusText: "Not Found",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "43",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify({ error: "Route /api/legacy-v1/users not found" }, null, 2),
          rawAscii:
            'HTTP/1.1 404 Not Found\\r\\nContent-Type: application/json; charset=utf-8\\r\\nContent-Length: 43\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n{"error":"Route /api/legacy-v1/users not found"}',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 1,
          ttfbMs: 5,
          contentDownloadMs: 1,
          totalMs: 7,
          isReusedConnection: true,
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Scenario 5: Conditional GET & Caching (ETag, If-None-Match, 304 Not Modified)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_CONDITIONAL_CACHING: HttpSimulationScenario = {
  id: "http-conditional-caching",
  title: "5. Conditional GET & Caching (ETag, If-None-Match, 304 Not Modified)",
  description:
    "Explore HTTP 304 revalidation. See how browsers cache JSON responses keyed by ETag and send If-None-Match conditional headers, allowing the server to transmit 0 body bytes and conserve mobile bandwidth.",
  badge: "HTTP 304 & ETag Revalidation",
  steps: [
    {
      id: "step-5-1",
      stepIndex: 0,
      title: "Initial Request: Server Returns 200 OK with ETag",
      badge: "Initial Cache Seed",
      explanation:
        "The client requests GET /api/settings. The server responds with 200 OK, Cache-Control: max-age=0, must-revalidate, and ETag: 'w/33a-xY7'. The browser stores payload in its disk cache.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "cache",
        client: {
          url: "https://api.example.com/api/settings",
          fetchPhase: "body_parsed",
          phaseDescription: "Response body stored in browser disk cache with ETag key 'w/33a-xY7'",
          reactState: {
            componentName: "AppSettings",
            codeSnippet: `// 1st request seeds browser cache
const res = await fetch('/api/settings');
const settings = await res.json();
// Browser stores ETag: "w/33a-xY7" in disk cache`,
            highlightedLine: 2,
            componentState: "success",
            dataPreview: '{"theme":"dark","notifications":true,"locale":"en"}',
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
          browserCache: {
            etag: 'W/"33a-xY7"',
            hasCachedEntry: true,
            cacheControl: "max-age=0, must-revalidate",
          },
        },
        wire: { connectionReuse: true },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "settingsHandler()", role: "handler", status: "passed" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/settings",
          path: "/api/settings",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 200,
          statusText: "OK",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "52",
            "ETag": 'W/"33a-xY7"',
            "Cache-Control": "max-age=0, must-revalidate",
          },
          body: JSON.stringify({ theme: "dark", notifications: true, locale: "en" }, null, 2),
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 14,
          contentDownloadMs: 4,
          totalMs: 20,
          cacheStatus: "miss",
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-5-2",
      stepIndex: 1,
      title: "Page Refresh: Browser Injects If-None-Match Header",
      badge: "Conditional GET",
      explanation:
        "The user refreshes the page. The browser finds an existing cached copy with ETag 'w/33a-xY7'. It automatically appends If-None-Match: 'w/33a-xY7' to the GET request.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "wire",
        stepCategory: "network",
        client: {
          url: "https://api.example.com/api/settings",
          fetchPhase: "sending_headers",
          phaseDescription: "Conditional request: checking if server ETag has changed",
          reactState: {
            componentName: "AppSettings",
            codeSnippet: `// 2nd request sends conditional header
const res = await fetch('/api/settings');
// Browser automatically injects If-None-Match!`,
            highlightedLine: 2,
            componentState: "loading",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
          browserCache: {
            etag: 'W/"33a-xY7"',
            hasCachedEntry: true,
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-conditional-get",
            direction: "client-to-server",
            type: "HTTP_REQ",
            label: 'GET /api/settings [If-None-Match: "w/33a-xY7"]',
            protocol: "HTTP/1.1",
            summary: "Conditional request carrying cached ETag token",
            isEncrypted: true,
            progressPct: 50,
          },
        },
        backend: {
          edgeNginx: { status: "receiving", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "pending" },
            { name: "etagValidator()", role: "handler", status: "pending" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/settings",
          path: "/api/settings",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "If-None-Match": 'W/"33a-xY7"',
            "Accept": "application/json",
          },
          rawAscii:
            'GET /api/settings HTTP/1.1\\r\\nHost: api.example.com\\r\\nIf-None-Match: W/"33a-xY7"\\r\\nAccept: application/json\\r\\n\\r\\n',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 2,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-5-3",
      stepIndex: 2,
      title: "Server ETag Match: 304 Not Modified (Zero Body Bytes!)",
      badge: "304 Zero Body Bytes",
      explanation:
        "The server hashes the current settings entity. The hash matches 'w/33a-xY7'! The server transmits HTTP/1.1 304 Not Modified with NO message body. The browser reads data directly from local disk!",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "cache",
        client: {
          url: "https://api.example.com/api/settings",
          fetchPhase: "body_parsed",
          phaseDescription: "304 received: 0 body bytes over network. Rehydrated from local disk cache!",
          reactState: {
            componentName: "AppSettings",
            codeSnippet: `// 2nd request: server returns 304 Not Modified
const res = await fetch('/api/settings');
// res.status === 200 in browser fetch API!
// Body is served transparently from disk cache!
const settings = await res.json();`,
            highlightedLine: 5,
            componentState: "success",
            dataPreview: '{"theme":"dark","notifications":true,"locale":"en"}',
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
          browserCache: {
            etag: 'W/"33a-xY7"',
            hasCachedEntry: true,
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-304-not-modified",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: 'HTTP/1.1 304 Not Modified [0 Body Bytes Transferred]',
            protocol: "HTTP/1.1",
            summary: "Revalidation response with zero application payload bytes",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            {
              name: "etagValidator()",
              role: "handler",
              status: "passed",
              durationMs: 3,
              logMessage: "Hash match: W/33a-xY7 === W/33a-xY7; status set to 304",
            },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/settings",
          path: "/api/settings",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "If-None-Match": 'W/"33a-xY7"',
          },
        },
        response: {
          statusCode: 304,
          statusText: "Not Modified",
          httpVersion: "HTTP/1.1",
          headers: {
            "Date": "Wed, 29 Oct 2026 19:25:00 GMT",
            "ETag": 'W/"33a-xY7"',
            "Cache-Control": "max-age=0, must-revalidate",
            "Server": "nginx/1.25.4",
          },
          rawAscii:
            'HTTP/1.1 304 Not Modified\\r\\nDate: Wed, 29 Oct 2026 19:25:00 GMT\\r\\nETag: W/"33a-xY7"\\r\\nCache-Control: max-age=0, must-revalidate\\r\\nServer: nginx/1.25.4\\r\\n\\r\\n',
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 6,
          contentDownloadMs: 0,
          totalMs: 8,
          cacheStatus: "revalidated_304",
          isReusedConnection: true,
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Scenario 6: Gateway & Upstream Failures (502 Bad Gateway vs 504 Gateway Timeout)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_GATEWAY_FAILURES: HttpSimulationScenario = {
  id: "http-gateway-failures",
  title: "6. Gateway & Upstream Failures (502 Bad Gateway vs 504 Gateway Timeout)",
  description:
    "Diagnose reverse proxy errors: see how an upstream process crash or TCP RST triggers a 502 Bad Gateway from Nginx, whereas an unresponsive database query triggers a 504 Gateway Timeout when proxy_read_timeout expires.",
  badge: "Nginx 502 vs 504",
  steps: [
    {
      id: "step-6-1",
      stepIndex: 0,
      title: "502 Bad Gateway: Upstream Node.js Process Crashes",
      badge: "502 Bad Gateway (TCP RST)",
      explanation:
        "Client sends GET /api/reports/heavy. Nginx attempts to forward via proxy_pass http://127.0.0.1:3000, but Node.js has crashed (OOM killed). The kernel immediately resets the socket with a TCP RST. Nginx detects upstream failure and issues 502 Bad Gateway.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "proxy",
        stepCategory: "proxy",
        client: {
          url: "https://api.example.com/api/reports/heavy",
          fetchPhase: "headers_received",
          phaseDescription: "502 Bad Gateway: Upstream server connection failed.",
          reactState: {
            componentName: "ReportDashboard",
            codeSnippet: `const res = await fetch('/api/reports/heavy');
if (!res.ok) {
  // res.status === 502
  throw new Error('502 Bad Gateway: Reverse proxy upstream failure');
}`,
            highlightedLine: 4,
            componentState: "error",
            errorPreview: "502 Bad Gateway: Nginx upstream TCP RST on port 3000",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-502-bad-gateway",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 502 Bad Gateway (Nginx Upstream Crash)",
            protocol: "HTTP/1.1",
            summary: "Reverse proxy received TCP RST from crashed Node.js upstream",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: {
            status: "upstream_error",
            upstreamTarget: "127.0.0.1:3000",
            port: 443,
            proxyConfig: "[error] 1042#0: *12 connect() failed (111: Connection refused) while connecting to upstream",
          },
          middlewarePipeline: [
            { name: "nginx_upstream", role: "router", status: "rejected", logMessage: "TCP connect(127.0.0.1:3000) -> ECONNREFUSED" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/reports/heavy",
          path: "/api/reports/heavy",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 502,
          statusText: "Bad Gateway",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "text/html",
            "Content-Length": "157",
            "Server": "nginx/1.25.4",
            "Connection": "keep-alive",
          },
          body: "<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx/1.25.4</center></body></html>",
          rawAscii:
            "HTTP/1.1 502 Bad Gateway\\r\\nContent-Type: text/html\\r\\nContent-Length: 157\\r\\nServer: nginx/1.25.4\\r\\nConnection: keep-alive\\r\\n\\r\\n<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx/1.25.4</center></body></html>",
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 8,
          contentDownloadMs: 2,
          totalMs: 12,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-6-2",
      stepIndex: 1,
      title: "504 Gateway Timeout: Upstream DB Lock Exceeds proxy_read_timeout",
      badge: "504 Gateway Timeout",
      explanation:
        "Node.js is running, but executes an unindexed query on a locked database table. Nginx waits for response headers... 60 seconds pass! Nginx proxy_read_timeout expires, terminates the upstream, and returns 504 Gateway Timeout.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "proxy",
        stepCategory: "proxy",
        client: {
          url: "https://api.example.com/api/reports/heavy",
          fetchPhase: "headers_received",
          phaseDescription: "504 Gateway Timeout: Nginx proxy_read_timeout 60s expired.",
          reactState: {
            componentName: "ReportDashboard",
            codeSnippet: `const res = await fetch('/api/reports/heavy');
if (!res.ok) {
  // res.status === 504
  throw new Error('504 Gateway Timeout: Upstream took too long to respond');
}`,
            highlightedLine: 4,
            componentState: "error",
            errorPreview: "504 Gateway Timeout: proxy_read_timeout 60s exceeded",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-504-timeout",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 504 Gateway Timeout (Nginx proxy_read_timeout)",
            protocol: "HTTP/1.1",
            summary: "Reverse proxy timed out waiting for upstream server to respond",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: {
            status: "upstream_timeout",
            upstreamTarget: "127.0.0.1:3000",
            port: 443,
            proxyConfig: "[error] upstream timed out (110: Connection timed out) while reading response header from upstream",
          },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "reportGenerator()", role: "handler", status: "executing", logMessage: "Query blocked waiting for lock on table 'financial_records'" },
          ],
          databaseQuery: {
            query: "SELECT * FROM financial_records FOR UPDATE;",
            status: "timeout",
            durationMs: 60000,
          },
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/reports/heavy",
          path: "/api/reports/heavy",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 504,
          statusText: "Gateway Timeout",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "text/html",
            "Content-Length": "167",
            "Server": "nginx/1.25.4",
            "Connection": "keep-alive",
          },
          body: "<html><head><title>504 Gateway Timeout</title></head><body><center><h1>504 Gateway Timeout</h1></center><hr><center>nginx/1.25.4</center></body></html>",
          rawAscii:
            "HTTP/1.1 504 Gateway Timeout\\r\\nContent-Type: text/html\\r\\nContent-Length: 167\\r\\nServer: nginx/1.25.4\\r\\nConnection: keep-alive\\r\\n\\r\\n<html><head><title>504 Gateway Timeout</title></head><body><center><h1>504 Gateway Timeout</h1></center><hr><center>nginx/1.25.4</center></body></html>",
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 60000,
          contentDownloadMs: 2,
          totalMs: 60004,
          isReusedConnection: true,
        },
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Scenario 7: Failure Boundaries Triad (Transport Error vs Server 500 vs CORS Block vs Preflight OPTIONS Failure)
// ─────────────────────────────────────────────────────────────

export const SCENARIO_HTTP_FAILURE_BOUNDARIES: HttpSimulationScenario = {
  id: "http-failure-boundaries",
  title: "7. Failure Boundaries (Transport Error vs Server 500 vs CORS Block vs Preflight OPTIONS)",
  description:
    "Understand the 4 critical failure boundaries: why DNS/TCP failure or CORS rejects the JavaScript fetch() promise with TypeError, while an internal server error (500) successfully resolves the promise with res.ok === false.",
  badge: "HTTP Error Taxonomy",
  steps: [
    {
      id: "step-7-1",
      stepIndex: 0,
      title: "Boundary 1: Transport Failure (DNS/TCP Drop) -> Promise REJECTS",
      badge: "Promise Rejection (TypeError)",
      explanation:
        "The client tries to fetch a dead domain. DNS resolution fails (NXDOMAIN) or TCP connection is refused. Because no HTTP response arrived, fetch() rejects with TypeError: Failed to fetch. No HTTP status code exists!",
      hosts: DEFAULT_HOSTS,
      activeSockets: [],
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "network",
        client: {
          url: "https://dead-domain.example/api/users",
          fetchPhase: "error",
          phaseDescription: "Transport error: fetch() promise rejects with TypeError!",
          reactState: {
            componentName: "DataWidget",
            codeSnippet: `try {
  const res = await fetch('https://dead-domain.example/api/users');
} catch (err) {
  // Triggers here! err is TypeError: Failed to fetch
  console.error("Network or Transport failure", err);
}`,
            highlightedLine: 4,
            componentState: "error",
            errorPreview: "TypeError: Failed to fetch (net::ERR_NAME_NOT_RESOLVED)",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: false,
            tlsVersion: "None",
          },
        },
        wire: {
          connectionReuse: false,
          inFlightPacket: {
            id: "pkt-dns-fail",
            direction: "client-to-server",
            type: "DNS",
            label: "DNS NXDOMAIN: dead-domain.example",
            protocol: "DNS",
            summary: "DNS query failed with non-existent domain",
            isEncrypted: false,
            progressPct: 20,
          },
        },
        backend: {
          edgeNginx: { status: "idle", port: 443 },
          middlewarePipeline: [],
        },
        request: {
          method: "GET",
          url: "https://dead-domain.example/api/users",
          path: "/api/users",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "dead-domain.example" },
        },
        waterfall: {
          dnsMs: 40,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 0,
          ttfbMs: 0,
          contentDownloadMs: 0,
          totalMs: 40,
        },
      },
    },
    {
      id: "step-7-2",
      stepIndex: 1,
      title: "Boundary 2: Server 500 (Unhandled Crash) -> Promise RESOLVES!",
      badge: "500 Internal Error (res.ok: false)",
      explanation:
        "Node.js throws: Cannot read property 'map' of undefined. The Express error handler generates HTTP 500 Internal Server Error. Crucially: fetch() does NOT reject! It resolves with res.ok === false, res.status === 500.",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "backend",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users",
          fetchPhase: "headers_received",
          phaseDescription: "fetch() promise resolved! Must manually check if (!res.ok).",
          reactState: {
            componentName: "DataWidget",
            codeSnippet: `const res = await fetch('https://api.example.com/api/users');
// fetch() does NOT throw on 500!
if (!res.ok) {
  throw new Error(\`HTTP \${res.status}: Server failure\`);
}`,
            highlightedLine: 3,
            componentState: "error",
            errorPreview: "HTTP 500: Internal Server Error (TypeError in route controller)",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-500-error",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 500 Internal Server Error",
            protocol: "HTTP/1.1",
            summary: "Valid HTTP response indicating backend code exception",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "passed" },
            { name: "usersController()", role: "handler", status: "rejected", logMessage: "Unhandled TypeError: Cannot read property 'map' of undefined" },
            { name: "errorHandler()", role: "error_handler", status: "passed", logMessage: "Emitted 500 response" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users",
          path: "/api/users",
          httpVersion: "HTTP/1.1",
          headers: { "Host": "api.example.com" },
        },
        response: {
          statusCode: 500,
          statusText: "Internal Server Error",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "38",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify({ error: "Internal Server Error" }, null, 2),
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 16,
          contentDownloadMs: 2,
          totalMs: 20,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-7-3",
      stepIndex: 2,
      title: "Boundary 3: Simple CORS Block -> Browser Hides Response",
      badge: "CORS Browser Sandbox",
      explanation:
        "WebApp at https://frontend.dev fetches https://api.example.com. The backend processes the request and returns 200 OK, but omits Access-Control-Allow-Origin: https://frontend.dev. The browser sandboxes the response and throws TypeError in JavaScript!",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "client",
        stepCategory: "client_runtime",
        client: {
          url: "https://api.example.com/api/users",
          fetchPhase: "error",
          phaseDescription: "CORS violation: Server sent 200 OK, but browser refused to let JS read it!",
          reactState: {
            componentName: "DataWidget",
            codeSnippet: `// Server sent 200 OK, but lacked Access-Control-Allow-Origin!
try {
  const res = await fetch('https://api.example.com/api/users');
} catch (err) {
  // Browser sandboxes response and throws TypeError!
  console.error("CORS Policy Violation", err);
}`,
            highlightedLine: 5,
            componentState: "error",
            errorPreview: "Access to fetch at 'https://api.example.com' from origin 'https://frontend.dev' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-cors-blocked",
            direction: "server-to-client",
            type: "HTTP_RESP_HEADERS",
            label: "HTTP/1.1 200 OK [Missing Access-Control-Allow-Origin]",
            protocol: "HTTP/1.1",
            summary: "Wire carried 200 OK, but browser CORS sandbox intercepts and blocks it",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "cors()", role: "cors", status: "rejected", logMessage: "Origin https://frontend.dev not in allowed list" },
            { name: "usersController()", role: "handler", status: "passed" },
          ],
        },
        request: {
          method: "GET",
          url: "https://api.example.com/api/users",
          path: "/api/users",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Origin": "https://frontend.dev",
          },
        },
        response: {
          statusCode: 200,
          statusText: "OK",
          httpVersion: "HTTP/1.1",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": "24",
            "Server": "nginx/1.25.4",
          },
          body: JSON.stringify({ secret: "data" }),
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 10,
          contentDownloadMs: 2,
          totalMs: 14,
          isReusedConnection: true,
        },
      },
    },
    {
      id: "step-7-4",
      stepIndex: 3,
      title: "Boundary 4: Preflight OPTIONS Failure -> Request Never Sent",
      badge: "Preflight OPTIONS Rejection",
      explanation:
        "Client sends PUT with custom header X-Trace-Id. The browser halts the PUT and sends an automatic OPTIONS preflight check. The backend rejects the preflight (405 Method Not Allowed); the actual PUT request is NEVER dispatched!",
      hosts: DEFAULT_HOSTS,
      activeSockets: BASE_SOCKETS,
      activePacket: null,
      httpData: {
        activeRegion: "wire",
        stepCategory: "network",
        client: {
          url: "https://api.example.com/api/users/42",
          fetchPhase: "error",
          phaseDescription: "Preflight OPTIONS failed with 405. The actual PUT request was cancelled.",
          reactState: {
            componentName: "DataWidget",
            codeSnippet: `// Complex request (PUT + Custom Header) triggers Preflight OPTIONS!
await fetch('https://api.example.com/api/users/42', {
  method: 'PUT',
  headers: { 'X-Trace-Id': 'uuid-1234' },
});
// If OPTIONS fails, the PUT is NEVER transmitted!`,
            highlightedLine: 5,
            componentState: "error",
            errorPreview: "Response to preflight request doesn't pass access control check: It does not have HTTP ok status (405).",
          },
          activeSocket: {
            localPort: 52410,
            remotePort: 443,
            reused: true,
            tlsVersion: "TLS 1.3",
          },
        },
        wire: {
          connectionReuse: true,
          inFlightPacket: {
            id: "pkt-options-preflight",
            direction: "client-to-server",
            type: "OPTIONS_PREFLIGHT",
            label: "OPTIONS /api/users/42 [Access-Control-Request-Method: PUT]",
            protocol: "HTTP/1.1",
            summary: "Browser preflight check rejected by upstream server",
            isEncrypted: true,
            progressPct: 100,
          },
        },
        backend: {
          edgeNginx: { status: "responding", port: 443 },
          middlewarePipeline: [
            { name: "optionsPreflightHandler()", role: "cors", status: "rejected", logMessage: "405 Method Not Allowed for OPTIONS" },
          ],
        },
        request: {
          method: "OPTIONS",
          url: "https://api.example.com/api/users/42",
          path: "/api/users/42",
          httpVersion: "HTTP/1.1",
          headers: {
            "Host": "api.example.com",
            "Origin": "https://frontend.dev",
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "X-Trace-Id",
          },
        },
        response: {
          statusCode: 405,
          statusText: "Method Not Allowed",
          httpVersion: "HTTP/1.1",
          headers: {
            "Allow": "GET, POST, HEAD",
            "Content-Length": "0",
            "Server": "nginx/1.25.4",
          },
        },
        waterfall: {
          dnsMs: 0,
          tcpMs: 0,
          tlsMs: 0,
          requestSentMs: 2,
          ttfbMs: 8,
          contentDownloadMs: 0,
          totalMs: 10,
          isReusedConnection: true,
        },
      },
    },
  ],
};

export const ALL_HTTP_SCENARIOS: HttpSimulationScenario[] = [
  SCENARIO_HTTP_CANONICAL_GET,
  SCENARIO_HTTP_CONNECTION_REUSE,
  SCENARIO_HTTP_RESOURCE_CREATION,
  SCENARIO_HTTP_AUTH_ROUTING,
  SCENARIO_HTTP_CONDITIONAL_CACHING,
  SCENARIO_HTTP_GATEWAY_FAILURES,
  SCENARIO_HTTP_FAILURE_BOUNDARIES,
];
