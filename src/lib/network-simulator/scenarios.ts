import type { NetworkSimulationScenario, NetworkHost, SocketEntry } from "./engine";

/* ══════════════════════════════════════════════════════════════════
   1. Scenario: Canonical HTTP Request & TCP 3-Way Handshake
   ══════════════════════════════════════════════════════════════════ */

const clientHost1: NetworkHost = {
  id: "client-1",
  name: "Client Machine",
  role: "client",
  ip: "192.168.1.10",
  ipVersion: "IPv4",
  interfaceName: "eth0",
  macAddress: "00:1A:2B:3C:4D:5E",
  applications: [
    {
      id: "browser-app",
      name: "Web Browser",
      pid: 4082,
      port: 51524,
      status: "idle",
    },
  ],
};

const serverHost1: NetworkHost = {
  id: "server-1",
  name: "Web Server",
  role: "server",
  ip: "203.0.113.20",
  ipVersion: "IPv4",
  interfaceName: "eth0",
  macAddress: "52:54:00:12:34:56",
  applications: [
    {
      id: "http-server-app",
      name: "Nginx HTTP Service",
      pid: 1024,
      port: 80,
      status: "listening",
    },
  ],
};

const serverListeningSocket: SocketEntry = {
  id: "server-1-listen-80",
  hostId: "server-1",
  protocol: "TCP",
  localIp: "0.0.0.0",
  localPort: 80,
  remoteIp: "*",
  remotePort: 0,
  state: "LISTEN",
  sendBufferBytes: 0,
  recvBufferBytes: 0,
  isListening: true,
  processName: "Nginx HTTP (PID 1024)",
};

export const SCENARIO_HANDSHAKE: NetworkSimulationScenario = {
  id: "tcp-handshake",
  title: "Canonical HTTP Request & TCP 3-Way Handshake",
  description:
    "Follow the TCP three-way handshake and an HTTP GET request as packets move between a client browser and a web server.",
  badge: "Core Handshake",
  steps: [
    {
      id: "step-0-idle",
      stepIndex: 0,
      title: "Server Bound in LISTEN State",
      badge: "Engine Init",
      explanation:
        "The web server process (PID 1024) has bound to 0.0.0.0:80 and is waiting in passive LISTEN state. The client browser has not initiated any connection yet.",
      detailedNotes: [
        {
          title: "Passive Open",
          body: "A server calls socket(), bind(), and listen() to declare its willingness to accept incoming network connections on TCP port 80.",
          commandExample: {
            platform: "Linux / POSIX",
            command: "ss -tulpn | grep :80",
            purpose: "Inspect sockets in LISTEN state on local ports",
            output: "tcp  LISTEN  0  128  0.0.0.0:80  0.0.0.0:*  users:((\"nginx\",pid=1024,fd=6))",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [serverListeningSocket],
      activePacket: null,
      highlightedElement: { type: "socket", id: "server-1-listen-80" },
    },
    {
      id: "step-1-syn-sent",
      stepIndex: 1,
      title: "Client Dispatches TCP [SYN]",
      badge: "Handshake 1/3",
      explanation:
        "Browser requests http://203.0.113.20. The OS allocates dynamic ephemeral port 51524, generates an Initial Sequence Number (ISN=1000), and sends a SYN packet across the wire. Client enters SYN_SENT.",
      detailedNotes: [
        {
          title: "Ephemeral Ports",
          body: "Client applications do not need fixed port numbers. The OS dynamically selects an unused port from the private/ephemeral range (typically 49152–65535 or 32768–60999).",
          commandExample: {
            platform: "Linux / POSIX",
            command: "sysctl net.ipv4.ip_local_port_range",
            purpose: "Query OS kernel dynamic ephemeral source port allocation range",
            output: "net.ipv4.ip_local_port_range = 32768 60999",
          },
        },
      ],
      hosts: [
        {
          ...clientHost1,
          applications: [{ ...clientHost1.applications[0], status: "connecting" }],
        },
        serverHost1,
      ],
      activeSockets: [
        serverListeningSocket,
        {
          id: "client-1-syn-51524",
          hostId: "client-1",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 80,
          state: "SYN_SENT",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Web Browser (PID 4082)",
        },
      ],
      activePacket: {
        id: "pkt-syn",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "[SYN] Seq=1000",
        flags: { syn: true },
        headerData: {
          ethernet: {
            srcMac: "00:1A:2B:3C:4D:5E",
            dstMac: "52:54:00:12:34:56",
            etherType: "0x0800 (IPv4)",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.10",
            dstIp: "203.0.113.20",
            ttl: 64,
            protocolNum: 6, // TCP
          },
          transport: {
            srcPort: 51524,
            dstPort: 80,
            flagsStr: "SYN",
            seqNumber: 1000,
            windowSize: 64240,
          },
          payload: {
            appProtocol: "TCP Signaling",
            rawData: "<No application payload in initial SYN>",
            sizeBytes: 0,
          },
        },
      },
    },
    {
      id: "step-2-syn-ack",
      stepIndex: 2,
      title: "Server Receives SYN & Replies [SYN, ACK]",
      badge: "Handshake 2/3",
      explanation:
        "The server NIC passes the packet to the TCP stack, which matches listening port 80. The server creates a Transmission Control Block (TCB), enters SYN_RECEIVED, and sends SYN-ACK (Seq=5000, Ack=1001).",
      detailedNotes: [
        {
          title: "Acknowledgment Number",
          body: "Ack=1001 means 'I have received your byte 1000, and I expect byte 1001 next.' Simultaneously, the server generates its own Initial Sequence Number (ISN=5000).",
          commandExample: {
            platform: "Universal",
            command: "tcpdump -nn -c 1 'tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack)'",
            purpose: "Capture SYN-ACK reply packet during 3-way handshake",
            output: "203.0.113.20.80 > 192.168.1.10.51524: Flags [S.], seq 5000, ack 1001, win 65535",
          },
        },
        {
          title: "SYN Backlog Queue",
          body: "While awaiting the client's final ACK, the Linux kernel holds this half-open connection in its SYN backlog queue.",
          commandExample: {
            platform: "Linux / POSIX",
            command: "ss -t4 state syn-recv",
            purpose: "List half-open connections awaiting client handshake completion",
          },
        },
      ],
      hosts: [
        {
          ...clientHost1,
          applications: [{ ...clientHost1.applications[0], status: "connecting" }],
        },
        {
          ...serverHost1,
          applications: [{ ...serverHost1.applications[0], status: "connecting" }],
        },
      ],
      activeSockets: [
        serverListeningSocket,
        {
          id: "client-1-syn-51524",
          hostId: "client-1",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 80,
          state: "SYN_SENT",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Web Browser (PID 4082)",
        },
        {
          id: "server-1-synrcvd-80",
          hostId: "server-1",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 80,
          remoteIp: "192.168.1.10",
          remotePort: 51524,
          state: "SYN_RECEIVED",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Nginx HTTP (PID 1024)",
        },
      ],
      activePacket: {
        id: "pkt-syn-ack",
        sourceHostId: "server-1",
        targetHostId: "client-1",
        direction: "server-to-client",
        protocol: "TCP",
        label: "[SYN-ACK] Seq=5000 Ack=1001",
        flags: { syn: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "52:54:00:12:34:56",
            dstMac: "00:1A:2B:3C:4D:5E",
            etherType: "0x0800 (IPv4)",
          },
          ip: {
            version: "IPv4",
            srcIp: "203.0.113.20",
            dstIp: "192.168.1.10",
            ttl: 64,
            protocolNum: 6,
          },
          transport: {
            srcPort: 80,
            dstPort: 51524,
            flagsStr: "SYN, ACK",
            seqNumber: 5000,
            ackNumber: 1001,
            windowSize: 65535,
          },
          payload: {
            appProtocol: "TCP Signaling",
            rawData: "<No application payload in SYN-ACK>",
            sizeBytes: 0,
          },
        },
      },
      highlightedElement: { type: "packet", id: "pkt-syn-ack" },
    },
    {
      id: "step-3-ack-established",
      stepIndex: 3,
      title: "Client Sends [ACK] & Connection Established",
      badge: "Handshake 3/3",
      explanation:
        "Client receives the server's SYN-ACK, dispatches final ACK (Ack=5001), and transitions its socket to ESTABLISHED. When the server receives this ACK, both endpoints have established a full-duplex socket pair.",
      detailedNotes: [
        {
          title: "The 4-Tuple",
          body: "The connection is now anchored by (192.168.1.10, 51524, 203.0.113.20, 80). Packets with this exact 4-tuple route directly to this socket pair.",
          commandExample: {
            platform: "Linux / POSIX",
            command: "ss -t state established '( sport = :80 )'",
            purpose: "Inspect established TCP connections routed by 4-tuple",
            output: "tcp  ESTAB  0  0  203.0.113.20:80  192.168.1.10:51524",
          },
        },
      ],
      hosts: [
        {
          ...clientHost1,
          applications: [{ ...clientHost1.applications[0], status: "connected" }],
        },
        {
          ...serverHost1,
          applications: [{ ...serverHost1.applications[0], status: "connected" }],
        },
      ],
      activeSockets: [
        serverListeningSocket,
        {
          id: "client-1-est-51524",
          hostId: "client-1",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 80,
          state: "ESTABLISHED",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Web Browser (PID 4082)",
        },
        {
          id: "server-1-est-80",
          hostId: "server-1",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 80,
          remoteIp: "192.168.1.10",
          remotePort: 51524,
          state: "ESTABLISHED",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Nginx Worker (PID 1025)",
        },
      ],
      activePacket: {
        id: "pkt-ack",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "[ACK] Ack=5001",
        flags: { ack: true },
        headerData: {
          ethernet: {
            srcMac: "00:1A:2B:3C:4D:5E",
            dstMac: "52:54:00:12:34:56",
            etherType: "0x0800 (IPv4)",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.10",
            dstIp: "203.0.113.20",
            ttl: 64,
            protocolNum: 6,
          },
          transport: {
            srcPort: 51524,
            dstPort: 80,
            flagsStr: "ACK",
            seqNumber: 1001,
            ackNumber: 5001,
            windowSize: 64240,
          },
          payload: {
            appProtocol: "TCP Handshake Complete",
            rawData: "<Handshake completed; zero byte overhead>",
            sizeBytes: 0,
          },
        },
      },
    },
    {
      id: "step-4-http-request",
      stepIndex: 4,
      title: "Client Writes HTTP GET into Socket Send Buffer",
      badge: "Application Data",
      explanation:
        "The browser writes 'GET / HTTP/1.1' into its socket send buffer. The TCP layer encapsulates this application payload into a TCP segment with flags [PSH, ACK] and ships it across the network.",
      detailedNotes: [
        {
          title: "The PSH Flag",
          body: "The PUSH (PSH) flag informs the receiving TCP stack to forward this segment directly to the application layer without waiting for a full receive buffer.",
          commandExample: {
            platform: "Universal",
            command: "tcpdump -nn -vv -i eth0 'tcp[tcpflags] & (tcp-push) != 0'",
            purpose: "Filter packet capture for TCP segments with PSH flag set",
            output: "192.168.1.10.51524 > 203.0.113.20.80: Flags [P.], seq 1001:1079, ack 5001",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [
        serverListeningSocket,
        {
          id: "client-1-est-51524",
          hostId: "client-1",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 80,
          state: "ESTABLISHED",
          sendBufferBytes: 78,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Web Browser (PID 4082)",
        },
        {
          id: "server-1-est-80",
          hostId: "server-1",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 80,
          remoteIp: "192.168.1.10",
          remotePort: 51524,
          state: "ESTABLISHED",
          sendBufferBytes: 0,
          recvBufferBytes: 78,
          isListening: false,
          processName: "Nginx Worker (PID 1025)",
        },
      ],
      activePacket: {
        id: "pkt-http-get",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "GET / HTTP/1.1 (78B)",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "00:1A:2B:3C:4D:5E",
            dstMac: "52:54:00:12:34:56",
            etherType: "0x0800 (IPv4)",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.10",
            dstIp: "203.0.113.20",
            ttl: 64,
            protocolNum: 6,
          },
          transport: {
            srcPort: 51524,
            dstPort: 80,
            flagsStr: "PSH, ACK",
            seqNumber: 1001,
            ackNumber: 5001,
            windowSize: 64240,
          },
          payload: {
            appProtocol: "HTTP/1.1",
            rawData: "GET / HTTP/1.1\\r\\nHost: example.com\\r\\nUser-Agent: Browser\\r\\n\\r\\n",
            sizeBytes: 78,
          },
        },
      },
      highlightedElement: { type: "packet", id: "pkt-http-get" },
    },
    {
      id: "step-5-http-response",
      stepIndex: 5,
      title: "Server Replies with HTTP 200 OK HTML",
      badge: "Server Response",
      explanation:
        "Nginx processes the request, locates index.html, and writes the response into the socket buffer. The packet travels back to the browser on port 51524 carrying 'HTTP/1.1 200 OK'.",
      detailedNotes: [
        {
          title: "Full Duplex Stream",
          body: "TCP sockets are bidirectional streams. Client and server can read and write independently over the same established socket pair.",
          commandExample: {
            platform: "macOS / Linux",
            command: "lsof -iTCP -sTCP:ESTABLISHED",
            purpose: "Display open file descriptors for active full-duplex sockets",
            output: "nginx  1025 nginx  7u  IPv4 0x5a12  0t0  TCP 203.0.113.20:80->192.168.1.10:51524 (ESTABLISHED)",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [
        serverListeningSocket,
        {
          id: "client-1-est-51524",
          hostId: "client-1",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 80,
          state: "ESTABLISHED",
          sendBufferBytes: 78,
          recvBufferBytes: 1420,
          isListening: false,
          processName: "Web Browser (PID 4082)",
        },
        {
          id: "server-1-est-80",
          hostId: "server-1",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 80,
          remoteIp: "192.168.1.10",
          remotePort: 51524,
          state: "ESTABLISHED",
          sendBufferBytes: 1420,
          recvBufferBytes: 78,
          isListening: false,
          processName: "Nginx Worker (PID 1025)",
        },
      ],
      activePacket: {
        id: "pkt-http-resp",
        sourceHostId: "server-1",
        targetHostId: "client-1",
        direction: "server-to-client",
        protocol: "TCP",
        label: "HTTP/1.1 200 OK (1.4KB)",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "52:54:00:12:34:56",
            dstMac: "00:1A:2B:3C:4D:5E",
            etherType: "0x0800 (IPv4)",
          },
          ip: {
            version: "IPv4",
            srcIp: "203.0.113.20",
            dstIp: "192.168.1.10",
            ttl: 64,
            protocolNum: 6,
          },
          transport: {
            srcPort: 80,
            dstPort: 51524,
            flagsStr: "PSH, ACK",
            seqNumber: 5001,
            ackNumber: 1079,
            windowSize: 65535,
          },
          payload: {
            appProtocol: "HTTP/1.1 Response",
            rawData: "HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\nContent-Length: 1350\\r\\n\\r\\n<!DOCTYPE html><html><body><h1>Welcome</h1></body></html>",
            sizeBytes: 1420,
          },
        },
      },
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   2. Scenario: Multi-Client Concurrency & 4-Tuple Demux
   ══════════════════════════════════════════════════════════════════ */

const multiClientHostA: NetworkHost = {
  id: "client-a",
  name: "Client Host A",
  role: "client",
  ip: "192.168.1.10",
  ipVersion: "IPv4",
  interfaceName: "eth0",
  macAddress: "00:1A:2B:3C:4D:11",
  applications: [
    {
      id: "browser-a",
      name: "Client A (Browser)",
      pid: 3010,
      port: 51524,
      status: "connected",
    },
  ],
};

const multiClientHostB: NetworkHost = {
  id: "client-b",
  name: "Client Host B",
  role: "client",
  ip: "192.168.1.11",
  ipVersion: "IPv4",
  interfaceName: "eth0",
  macAddress: "00:1A:2B:3C:4D:22",
  applications: [
    {
      id: "browser-b",
      name: "Client B (Browser)",
      pid: 3020,
      port: 51524, // Notice both clients chose the same ephemeral port!
      status: "connected",
    },
  ],
};

const multiServerHost: NetworkHost = {
  id: "server-multi",
  name: "Web Server (HTTPS)",
  role: "server",
  ip: "203.0.113.20",
  ipVersion: "IPv4",
  interfaceName: "eth0",
  macAddress: "52:54:00:99:88:77",
  applications: [
    {
      id: "nginx-https",
      name: "Nginx Worker Pool",
      pid: 2000,
      port: 443,
      status: "listening",
    },
  ],
};

export const SCENARIO_MULTI_CLIENT: NetworkSimulationScenario = {
  id: "multi-client-demux",
  title: "Multi-Client Concurrency & 4-Tuple Socket Demux",
  description:
    "Discover how a single server port (443) services multiple clients simultaneously. Notice both clients can even pick the exact same ephemeral port (51524) because their IP addresses differ.",
  badge: "Socket Demultiplexing",
  steps: [
    {
      id: "mc-step-0",
      stepIndex: 0,
      title: "One Server Port, Two Concurrent Clients",
      badge: "Listening Setup",
      explanation:
        "The server listens on 0.0.0.0:443. Both Client A (192.168.1.10) and Client B (192.168.1.11) want to connect. Both happen to allocate ephemeral port 51524 locally.",
      detailedNotes: [
        {
          title: "Port Independence across Hosts",
          body: "Ephemeral ports are allocated locally by each machine's kernel. Two different computers can freely use port 51524 at the same time.",
          commandExample: {
            platform: "Universal",
            command: "ss -ant | grep :443",
            purpose: "Verify server port 443 in LISTEN state prior to client connections",
            output: "LISTEN  0  128  0.0.0.0:443  0.0.0.0:*",
          },
        },
      ],
      hosts: [multiClientHostA, multiClientHostB, multiServerHost],
      activeSockets: [
        {
          id: "server-listen-443",
          hostId: "server-multi",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 443,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Nginx HTTPS (PID 2000)",
        },
      ],
      activePacket: null,
      highlightedElement: { type: "socket", id: "server-listen-443" },
    },
    {
      id: "mc-step-1",
      stepIndex: 1,
      title: "Client A Connects to Port 443",
      badge: "Socket A Established",
      explanation:
        "Client A completes its handshake with Server port 443. The server kernel spawns Socket Connection A with 4-tuple: (192.168.1.10:51524 ↔ 203.0.113.20:443). The listening socket on :443 remains open for new callers.",
      detailedNotes: [
        {
          title: "Listening vs Connected Sockets",
          body: "The listening socket never exchanges application data; its sole job is to accept handshakes and hand off established sockets to worker threads.",
          commandExample: {
            platform: "Linux / POSIX",
            command: "ss -ant '( sport = :443 )'",
            purpose: "Observe parent listener and child connection socket simultaneously",
            output: "LISTEN  0  128  0.0.0.0:443  0.0.0.0:*\nESTAB   0  0    203.0.113.20:443  192.168.1.10:51524",
          },
        },
      ],
      hosts: [multiClientHostA, multiClientHostB, multiServerHost],
      activeSockets: [
        {
          id: "server-listen-443",
          hostId: "server-multi",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 443,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Nginx Listener (PID 2000)",
        },
        {
          id: "server-conn-a",
          hostId: "server-multi",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 443,
          remoteIp: "192.168.1.10",
          remotePort: 51524,
          state: "ESTABLISHED",
          sendBufferBytes: 0,
          recvBufferBytes: 512,
          isListening: false,
          processName: "Worker Thread 1",
        },
        {
          id: "client-a-socket",
          hostId: "client-a",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 443,
          state: "ESTABLISHED",
          sendBufferBytes: 512,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Browser A",
        },
      ],
      activePacket: {
        id: "pkt-a-data",
        sourceHostId: "client-a",
        targetHostId: "server-multi",
        direction: "client-to-server",
        protocol: "TCP",
        label: "Client A Packet [443]",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "00:1A:2B:3C:4D:11",
            dstMac: "52:54:00:99:88:77",
            etherType: "0x0800",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.10",
            dstIp: "203.0.113.20",
            ttl: 58,
            protocolNum: 6,
          },
          transport: {
            srcPort: 51524,
            dstPort: 443,
            flagsStr: "PSH, ACK",
            windowSize: 64240,
          },
          payload: {
            appProtocol: "TLS Record",
            rawData: "[Encrypted Application Data from Client A]",
            sizeBytes: 512,
            isEncrypted: true,
          },
        },
      },
      highlightedElement: { type: "host", id: "client-a" },
    },
    {
      id: "mc-step-2",
      stepIndex: 2,
      title: "Client B Connects on the Same Server Port 443",
      badge: "Socket B Established",
      explanation:
        "Client B (192.168.1.11:51524) connects to the same server port 443. The server kernel inspects the 4-tuple: because Source IP differs, this is a completely distinct socket (Connection B)!",
      detailedNotes: [
        {
          title: "The 4-Tuple Disambiguation Rule",
          body: "A TCP connection is unique if ANY one of the four elements (Src IP, Src Port, Dst IP, Dst Port) differs.",
          commandExample: {
            platform: "Universal",
            command: "netstat -nat | grep 443",
            purpose: "Confirm multiple concurrent connections sharing server port 443 with distinct client IPs",
            output: "tcp  0  0 203.0.113.20:443  192.168.1.10:51524  ESTABLISHED\ntcp  0  0 203.0.113.20:443  192.168.1.11:51524  ESTABLISHED",
          },
        },
      ],
      hosts: [multiClientHostA, multiClientHostB, multiServerHost],
      activeSockets: [
        {
          id: "server-listen-443",
          hostId: "server-multi",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 443,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Nginx Listener (PID 2000)",
        },
        {
          id: "server-conn-a",
          hostId: "server-multi",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 443,
          remoteIp: "192.168.1.10",
          remotePort: 51524,
          state: "ESTABLISHED",
          sendBufferBytes: 256,
          recvBufferBytes: 512,
          isListening: false,
          processName: "Worker Thread 1",
        },
        {
          id: "server-conn-b",
          hostId: "server-multi",
          protocol: "TCP",
          localIp: "203.0.113.20",
          localPort: 443,
          remoteIp: "192.168.1.11",
          remotePort: 51524,
          state: "ESTABLISHED",
          sendBufferBytes: 0,
          recvBufferBytes: 1024,
          isListening: false,
          processName: "Worker Thread 2",
        },
        {
          id: "client-a-socket",
          hostId: "client-a",
          protocol: "TCP",
          localIp: "192.168.1.10",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 443,
          state: "ESTABLISHED",
          sendBufferBytes: 512,
          recvBufferBytes: 256,
          isListening: false,
          processName: "Browser A",
        },
        {
          id: "client-b-socket",
          hostId: "client-b",
          protocol: "TCP",
          localIp: "192.168.1.11",
          localPort: 51524,
          remoteIp: "203.0.113.20",
          remotePort: 443,
          state: "ESTABLISHED",
          sendBufferBytes: 1024,
          recvBufferBytes: 0,
          isListening: false,
          processName: "Browser B",
        },
      ],
      activePacket: {
        id: "pkt-b-data",
        sourceHostId: "client-b",
        targetHostId: "server-multi",
        direction: "client-to-server",
        protocol: "TCP",
        label: "Client B Packet [443]",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "00:1A:2B:3C:4D:22",
            dstMac: "52:54:00:99:88:77",
            etherType: "0x0800",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.11",
            dstIp: "203.0.113.20",
            ttl: 60,
            protocolNum: 6,
          },
          transport: {
            srcPort: 51524,
            dstPort: 443,
            flagsStr: "PSH, ACK",
            windowSize: 65535,
          },
          payload: {
            appProtocol: "TLS Record",
            rawData: "[Encrypted Application Data from Client B]",
            sizeBytes: 1024,
            isEncrypted: true,
          },
        },
      },
      highlightedElement: { type: "host", id: "client-b" },
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   3. Scenario: Port Collision (EADDRINUSE) & Interface Binding
   ══════════════════════════════════════════════════════════════════ */

export const SCENARIO_PORT_CONFLICT: NetworkSimulationScenario = {
  id: "port-conflict",
  title: "Port Collision (EADDRINUSE) & Interface Binding",
  description:
    "See what happens when two applications attempt to bind to the same IP and TCP port without special socket options.",
  badge: "Address Collision",
  steps: [
    {
      id: "pc-step-0",
      stepIndex: 0,
      title: "Process 1 Binds to Port 8080 Successfully",
      badge: "Bind Success",
      explanation:
        "Node.js Backend Server (PID 8412) executes bind() and listen() on 0.0.0.0:8080. The OS kernel registers this endpoint in its TCP port table.",
      detailedNotes: [
        {
          title: "The 0.0.0.0 Wildcard",
          body: "Binding to 0.0.0.0 means 'listen for incoming connections on all network interfaces on this machine' (e.g. Ethernet, Wi-Fi, and localhost).",
          commandExample: {
            platform: "Linux / POSIX",
            command: "ss -tulpn | grep :8080",
            purpose: "Query which PID is bound to local port 8080",
            output: "tcp  LISTEN  0  511  0.0.0.0:8080  0.0.0.0:*  users:((\"node\",pid=8412,fd=18))",
          },
        },
      ],
      hosts: [
        {
          id: "dev-server",
          name: "Developer Machine",
          role: "server",
          ip: "127.0.0.1",
          ipVersion: "IPv4",
          interfaceName: "lo0",
          macAddress: "00:00:00:00:00:00",
          applications: [
            {
              id: "node-app",
              name: "Node.js API",
              pid: 8412,
              port: 8080,
              status: "listening",
            },
          ],
        },
      ],
      activeSockets: [
        {
          id: "sock-node-8080",
          hostId: "dev-server",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 8080,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Node.js API (PID 8412)",
        },
      ],
      activePacket: null,
      highlightedElement: { type: "port", id: "8080" },
    },
    {
      id: "pc-step-1",
      stepIndex: 1,
      title: "Process 2 Attempts to Bind to 8080: Kernel Collision",
      badge: "Error: EADDRINUSE",
      explanation:
        "A second process, Python Flask (PID 9520), tries to bind to 0.0.0.0:8080. The OS kernel inspects its port allocation table, detects an existing listener, and rejects the syscall with error code EADDRINUSE (Address already in use).",
      detailedNotes: [
        {
          title: "Why Collisions Occur",
          body: "By default, the operating system requires each listening socket on a transport protocol to possess an unambiguous endpoint (IP + Port).",
          commandExample: {
            platform: "macOS / Linux",
            command: "lsof -i :8080",
            purpose: "Diagnose EADDRINUSE conflict by finding the occupying process",
            output: "COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nnode    8412 dev    18u  IPv4 0x1234      0t0  TCP *:http-alt (LISTEN)",
          },
        },
        {
          title: "Advanced Exception: SO_REUSEPORT",
          body: "Modern kernels allow multiple processes to bind to the same port only when all sockets set the SO_REUSEPORT socket option for kernel-level load balancing.",
          commandExample: {
            platform: "Linux / POSIX",
            command: "sysctl net.ipv4.tcp_tw_reuse",
            purpose: "Query kernel socket reuse capabilities",
          },
        },
      ],
      hosts: [
        {
          id: "dev-server",
          name: "Developer Machine",
          role: "server",
          ip: "127.0.0.1",
          ipVersion: "IPv4",
          interfaceName: "lo0",
          macAddress: "00:00:00:00:00:00",
          applications: [
            {
              id: "node-app",
              name: "Node.js API",
              pid: 8412,
              port: 8080,
              status: "listening",
            },
            {
              id: "flask-app",
              name: "Python Flask",
              pid: 9520,
              port: 8080,
              status: "conflict",
            },
          ],
        },
      ],
      activeSockets: [
        {
          id: "sock-node-8080",
          hostId: "dev-server",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 8080,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Node.js API (PID 8412)",
        },
      ],
      activePacket: null,
      highlightedElement: { type: "port", id: "8080" },
    },
    {
      id: "pc-step-2",
      stepIndex: 2,
      title: "Resolution: Process 2 Rebinds to Port 8081",
      badge: "Conflict Resolved",
      explanation:
        "The developer modifies Python Flask's configuration to port 8081. The kernel finds 0.0.0.0:8081 available; both services now run harmoniously on independent ports.",
      detailedNotes: [
        {
          title: "Port Spacing",
          body: "Microservices and dev servers commonly increment port numbers (8080, 8081, 3000, 3001) to coexist on the same host interface.",
          commandExample: {
            platform: "Universal",
            command: "curl -I http://127.0.0.1:8080 && curl -I http://127.0.0.1:8081",
            purpose: "Verify both microservices respond independently on isolated ports",
          },
        },
      ],
      hosts: [
        {
          id: "dev-server",
          name: "Developer Machine",
          role: "server",
          ip: "127.0.0.1",
          ipVersion: "IPv4",
          interfaceName: "lo0",
          macAddress: "00:00:00:00:00:00",
          applications: [
            {
              id: "node-app",
              name: "Node.js API",
              pid: 8412,
              port: 8080,
              status: "listening",
            },
            {
              id: "flask-app",
              name: "Python Flask",
              pid: 9520,
              port: 8081,
              status: "listening",
            },
          ],
        },
      ],
      activeSockets: [
        {
          id: "sock-node-8080",
          hostId: "dev-server",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 8080,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Node.js API (PID 8412)",
        },
        {
          id: "sock-flask-8081",
          hostId: "dev-server",
          protocol: "TCP",
          localIp: "0.0.0.0",
          localPort: 8081,
          remoteIp: "*",
          remotePort: 0,
          state: "LISTEN",
          sendBufferBytes: 0,
          recvBufferBytes: 0,
          isListening: true,
          processName: "Python Flask (PID 9520)",
        },
      ],
      activePacket: null,
      highlightedElement: { type: "port", id: "8081" },
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   4. Scenario: Wire Packet Encapsulation & Protocol Headers
   ══════════════════════════════════════════════════════════════════ */

export const SCENARIO_WIRE_DISSECTION: NetworkSimulationScenario = {
  id: "wire-dissection",
  title: "Deep Wire Packet Encapsulation & Protocol Headers",
  description:
    "Dissect the nested onion layers of a network packet: Ethernet Frame $\\rightarrow$ IP Packet $\\rightarrow$ TCP Segment $\\rightarrow$ HTTP Payload.",
  badge: "Wire Inspector",
  steps: [
    {
      id: "wd-step-0",
      stepIndex: 0,
      title: "Layer 7 Application Data Generation",
      badge: "Layer 7 (HTTP)",
      explanation:
        "The application generates raw HTTP text: 'GET /index.html HTTP/1.1'. At this stage, it has no concept of IP addresses, ports, or MAC addresses.",
      detailedNotes: [
        {
          title: "Application Abstraction",
          body: "Applications write raw strings or byte buffers into standard POSIX socket APIs; the operating system kernel handles all lower-layer encapsulation.",
          commandExample: {
            platform: "Universal",
            command: "curl -v http://203.0.113.20/index.html",
            purpose: "Dispatch raw HTTP application request over user space socket",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [serverListeningSocket],
      activePacket: {
        id: "pkt-wd",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "Layer 7 Payload Only",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "-- Pending L2 --",
            dstMac: "-- Pending L2 --",
            etherType: "--",
          },
          ip: {
            version: "-- Pending L3 --",
            srcIp: "--",
            dstIp: "--",
            ttl: 0,
            protocolNum: 0,
          },
          transport: {
            srcPort: 0,
            dstPort: 0,
            flagsStr: "-- Pending L4 --",
            windowSize: 0,
          },
          payload: {
            appProtocol: "HTTP/1.1",
            rawData: "GET /index.html HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n",
            sizeBytes: 42,
          },
        },
      },
      highlightedElement: { type: "packet", id: "pkt-wd" },
    },
    {
      id: "wd-step-1",
      stepIndex: 1,
      title: "Layer 4 Transport Encapsulation (TCP Header Added)",
      badge: "Layer 4 (TCP)",
      explanation:
        "The OS transport layer wraps the HTTP data with a 20-byte TCP header specifying Source Port (51524), Destination Port (80), Sequence numbers, and TCP control flags.",
      detailedNotes: [
        {
          title: "Demultiplexing Key",
          body: "The destination port (80) tells the receiving operating system which socket buffer should receive this data.",
          commandExample: {
            platform: "Universal",
            command: "tcpdump -nn -X -s 0 'tcp port 80'",
            purpose: "Inspect encapsulated TCP headers alongside packet hex and ASCII payload",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [serverListeningSocket],
      activePacket: {
        id: "pkt-wd",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "TCP + HTTP Payload",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "-- Pending L2 --",
            dstMac: "-- Pending L2 --",
            etherType: "--",
          },
          ip: {
            version: "-- Pending L3 --",
            srcIp: "--",
            dstIp: "--",
            ttl: 0,
            protocolNum: 0,
          },
          transport: {
            srcPort: 51524,
            dstPort: 80,
            flagsStr: "PSH, ACK",
            seqNumber: 1001,
            ackNumber: 5001,
            windowSize: 64240,
          },
          payload: {
            appProtocol: "HTTP/1.1",
            rawData: "GET /index.html HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n",
            sizeBytes: 42,
          },
        },
      },
      highlightedElement: { type: "packet", id: "pkt-wd" },
    },
    {
      id: "wd-step-2",
      stepIndex: 2,
      title: "Layer 3 Network Encapsulation (IP Header Added)",
      badge: "Layer 3 (IP)",
      explanation:
        "The IP layer adds another 20-byte header containing Source IP (192.168.1.10), Destination IP (203.0.113.20), TTL (64), and Protocol field (6 = TCP).",
      detailedNotes: [
        {
          title: "End-to-End Routing",
          body: "Routers along the Internet examine Destination IP to forward the packet toward the destination host.",
          commandExample: {
            platform: "Universal",
            command: "traceroute -n 203.0.113.20",
            purpose: "Trace router hops and inspect TTL decrement across internetwork path",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [serverListeningSocket],
      activePacket: {
        id: "pkt-wd",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "IP + TCP + HTTP",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "-- Pending L2 --",
            dstMac: "-- Pending L2 --",
            etherType: "--",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.10",
            dstIp: "203.0.113.20",
            ttl: 64,
            protocolNum: 6,
          },
          transport: {
            srcPort: 51524,
            dstPort: 80,
            flagsStr: "PSH, ACK",
            seqNumber: 1001,
            ackNumber: 5001,
            windowSize: 64240,
          },
          payload: {
            appProtocol: "HTTP/1.1",
            rawData: "GET /index.html HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n",
            sizeBytes: 42,
          },
        },
      },
      highlightedElement: { type: "packet", id: "pkt-wd" },
    },
    {
      id: "wd-step-3",
      stepIndex: 3,
      title: "Layer 2 Data Link Framing (Ethernet Header & FCS)",
      badge: "Layer 2 (Wire Frame)",
      explanation:
        "The Network Interface Card adds the Ethernet header with physical Source MAC (00:1A:2B:3C:4D:5E) and Destination MAC (Gateway/Server 52:54:00:12:34:56). The complete frame is transmitted as electrical/optical signals.",
      detailedNotes: [
        {
          title: "Hop-by-Hop vs End-to-End",
          body: "MAC addresses change at every router hop; IP addresses remain constant from source to destination.",
          commandExample: {
            platform: "Linux / POSIX",
            command: "ip neigh show",
            purpose: "Query kernel ARP cache mapping IP addresses to physical MAC hardware addresses",
            output: "203.0.113.20 dev eth0 lladdr 52:54:00:12:34:56 REACHABLE",
          },
        },
      ],
      hosts: [clientHost1, serverHost1],
      activeSockets: [serverListeningSocket],
      activePacket: {
        id: "pkt-wd",
        sourceHostId: "client-1",
        targetHostId: "server-1",
        direction: "client-to-server",
        protocol: "TCP",
        label: "Full Ethernet Frame on Wire",
        flags: { psh: true, ack: true },
        headerData: {
          ethernet: {
            srcMac: "00:1A:2B:3C:4D:5E",
            dstMac: "52:54:00:12:34:56",
            etherType: "0x0800 (IPv4)",
          },
          ip: {
            version: "IPv4",
            srcIp: "192.168.1.10",
            dstIp: "203.0.113.20",
            ttl: 64,
            protocolNum: 6,
          },
          transport: {
            srcPort: 51524,
            dstPort: 80,
            flagsStr: "PSH, ACK",
            seqNumber: 1001,
            ackNumber: 5001,
            windowSize: 64240,
          },
          payload: {
            appProtocol: "HTTP/1.1 (Payload inside Frame)",
            rawData: "GET /index.html HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n",
            sizeBytes: 42,
          },
        },
      },
      highlightedElement: { type: "packet", id: "pkt-wd" },
    },
  ],
};

export const ALL_NETWORK_SCENARIOS: NetworkSimulationScenario[] = [
  SCENARIO_HANDSHAKE,
  SCENARIO_MULTI_CLIENT,
  SCENARIO_PORT_CONFLICT,
  SCENARIO_WIRE_DISSECTION,
];
