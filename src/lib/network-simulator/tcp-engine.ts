/**
 * TCP Simulation Domain Types, State Machine Models & Educational Glossary.
 * Follows RFC 793 (Transmission Control Protocol), RFC 1323/7323 (TCP Extensions for High Performance),
 * RFC 2018 (TCP Selective Acknowledgment Options), and RFC 4987 (TCP SYN Flooding Attacks and Common Defenses).
 */

import type { ConceptDefinition } from "@/components/network-simulator/InteractiveExplanationBar";

// ─────────────────────────────────────────────────────────────
// 1. Protocol Types & State Machine
// ─────────────────────────────────────────────────────────────

export type TcpSocketState =
  | "CLOSED"
  | "LISTEN"
  | "SYN_SENT"
  | "SYN_RCVD"
  | "ESTABLISHED"
  | "FIN_WAIT_1"
  | "FIN_WAIT_2"
  | "CLOSE_WAIT"
  | "CLOSING"
  | "LAST_ACK"
  | "TIME_WAIT";

export interface TcpFlags {
  cwr?: boolean; // Congestion Window Reduced (RFC 3168)
  ece?: boolean; // ECN-Echo (RFC 3168)
  urg?: boolean; // Urgent pointer field significant
  ack?: boolean; // Acknowledgment field significant
  psh?: boolean; // Push function (flush buffer to application)
  rst?: boolean; // Reset the connection immediately
  syn?: boolean; // Synchronize sequence numbers to initiate connection
  fin?: boolean; // No more data from sender; graceful teardown
}

export interface TcpOptions {
  mss?: number; // Maximum Segment Size (e.g. 1460, 1440, 1200)
  windowScale?: number; // Window scale factor shift count (e.g. 7 => x128)
  sackPermitted?: boolean; // Selective Acknowledgment permitted
  timestamps?: {
    tsVal: number; // Timestamp value
    tsEcho: number; // Timestamp echo reply
  };
  synCookie?: boolean; // Flag indicating SYN cookie encoding in ISN
}

export interface TcpSegment {
  id: string;
  direction: "client-to-server" | "server-to-client";
  srcPort: number;
  dstPort: number;
  seqNumber: number;
  ackNumber: number | null;
  flags: TcpFlags;
  windowSize: number;
  checksum?: string;
  urgentPointer?: number;
  dataOffset: number; // In 32-bit words (5 = 20 bytes standard, 8 = 32 bytes with options)
  payloadLength: number; // 0 for pure SYN/ACK/FIN, > 0 for data
  payloadPreview?: string; // Text preview of HTTP payload or data
  options?: TcpOptions;
  dropped?: boolean;
  dropReason?: string;
  explanationTitle?: string;
  explanationBody?: string;
}

export interface TcpBacklogTelemetry {
  synBacklog: {
    current: number;
    max: number;
    queue: Array<{
      id: string;
      clientIp: string;
      clientPort: number;
      isn: number;
      status: string;
    }>;
  };
  acceptQueue: {
    current: number;
    max: number;
    queue: Array<{
      id: string;
      clientIp: string;
      clientPort: number;
      establishedAt: string;
    }>;
  };
  synCookiesActive: boolean;
  synCookiesGenerated?: number;
  synCookiesValidated?: number;
}

export interface TcpSequenceArithmetic {
  clientISN: number;
  serverISN: number;
  clientNextSeq: number;
  serverNextSeq: number;
  lastAckSentByClient: number | null;
  lastAckSentByServer: number | null;
  formulaCallout?: string;
  explanation?: string;
}

export interface TcpChildSocket {
  id: string;
  localAddr: string;
  peerAddr: string;
  state: TcpSocketState;
  sendQueueBytes: number;
  recvQueueBytes: number;
  process: string;
}

export interface TcpStepData {
  client: {
    ip: string;
    port: number;
    state: TcpSocketState;
    activeSyscall: string; // e.g. "socket()", "connect()", "write()", "close()", "poll()"
    sendBuffer: { bytes: number; max: number; preview?: string };
    recvBuffer: { bytes: number; max: number; preview?: string };
    rtoTimer?: {
      running: boolean;
      currentMs: number;
      timeoutMs: number;
      retransmissions: number;
    };
    congestionWindow?: number; // cwnd in MSS
    ssthresh?: number;
  };
  server: {
    ip: string;
    port: number;
    listenState: TcpSocketState;
    activeSyscall: string; // e.g. "listen()", "accept()", "epoll_wait()", "read()", "close()"
    backlog: TcpBacklogTelemetry;
    childSockets: TcpChildSocket[];
  };
  wire: {
    activeSegment: TcpSegment | null;
    inFlightDirection?: "client-to-server" | "server-to-client" | null;
    progress?: number; // 0.0 to 1.0 along the wire
    dropped?: boolean;
    latencyMs?: number;
  };
  sequenceArithmetic: TcpSequenceArithmetic;
  fsmTransition?: {
    endpoint: "client" | "server" | "both";
    from: TcpSocketState;
    to: TcpSocketState;
    trigger: string;
  };
}

// ─────────────────────────────────────────────────────────────
// 2. Comprehensive Educational Glossary
// ─────────────────────────────────────────────────────────────

export const TCP_GLOSSARY: Record<string, ConceptDefinition> = {
  syn: {
    term: "SYN Flag",
    category: "RFC 793 Control Bits",
    title: "SYN (Synchronize Sequence Numbers)",
    explanation:
      "The initial control bit transmitted to establish a TCP connection. It tells the remote host: 'I want to initiate communication with you, and my byte stream starts at this Initial Sequence Number (ISN).'\n\nAnalogy: Like dialing someone's phone number and waiting for them to say hello before you begin speaking. Crucially, a SYN segment consumes exactly 1 phantom byte of sequence space even though it carries 0 bytes of payload.",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn -c 1 'tcp[tcpflags] & tcp-syn != 0'",
      purpose: "Capture outbound TCP SYN packets matching the synchronize flag bit",
    },
  },
  "syn-ack": {
    term: "SYN-ACK",
    category: "RFC 793 Handshake",
    title: "SYN-ACK (Synchronize & Acknowledge)",
    explanation:
      "The second segment of the 3-Way Handshake. The server performs two jobs at once: it acknowledges the client's SYN (by setting ACK=1 with Ack=ClientISN+1) and offers its own independent byte sequence starting at its own ServerISN (by setting SYN=1).\n\nAnalogy: Like replying 'Hello, I hear you! Let us agree on my starting counter too.' Both sides must independently synchronize their sequence spaces because TCP is full-duplex.",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn 'tcp[tcpflags] == (tcp-syn|tcp-ack)'",
      purpose: "Filter packet traces specifically for handshake SYN-ACK responses",
    },
  },
  ack: {
    term: "ACK Flag",
    category: "RFC 793 Control Bits",
    title: "ACK (Acknowledgment Field Significant)",
    explanation:
      "The ACK control flag signifies that the 32-bit Acknowledgment Number header field is valid and active. In TCP, the Acknowledgment number specifies the NEXT byte number the receiver expects to see.\n\nKey Rule: Once a TCP connection is established, virtually every single packet transmitted in either direction has the ACK bit set to 1. A pure ACK (carrying no payload and no SYN/FIN flags) consumes 0 sequence numbers.",
    commandExample: {
      platform: "Universal",
      command: "ss -tan state established",
      purpose: "List active sockets where ACK exchanges have negotiated full connection",
    },
  },
  isn: {
    term: "Initial Sequence Number (ISN)",
    category: "TCP Synchronization",
    title: "Initial Sequence Number (ISN)",
    explanation:
      "A randomized 32-bit starting number chosen by each host for its outbound byte stream during the handshake. Sequence numbers never start at 0 in production; operating systems generate cryptographically secure pseudorandom numbers based on clock ticks and secrets.\n\nWhy Randomize? If ISNs were predictable (like starting at 0 or 1), a remote attacker could inject spoofed packets into active sessions (Kevin Mitnick attack), or delayed duplicate packets from a previous connection could corrupt a new reincarnation of the same 4-tuple.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "tcpdump -nn -S -c 2 'tcp[tcpflags] & tcp-syn != 0'",
      purpose: "View raw, absolute 32-bit ISNs instead of relative zero-based sequence numbers (-S)",
    },
  },
  mss: {
    term: "Maximum Segment Size (MSS)",
    category: "TCP Options (Kind 2)",
    title: "Maximum Segment Size (MSS)",
    explanation:
      "The largest payload of raw TCP data (excluding IP and TCP header overhead) that a host is prepared to receive in a single segment. Advertised only during the SYN exchange.\n\nCalculation: Standard Ethernet MTU is 1500 bytes. Subtracting 20 bytes of IPv4 header and 20 bytes of TCP header yields a typical MSS of 1460 bytes (1500 - 40 = 1460 bytes). For IPv6 (40-byte header), typical MSS is 1440 bytes.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ip route show | grep advmss",
      purpose: "Display kernel advertised MSS defaults across network routes",
    },
  },
  "receive window": {
    term: "Receive Window (rwnd)",
    category: "TCP Flow Control",
    title: "Receive Window (rwnd / Flow Control)",
    explanation:
      "A 16-bit field in every TCP header where the receiver advertises how many bytes of unread data it can currently accept into its kernel buffer. Flow control prevents a fast sender from overwhelming a slow receiver.\n\nAnalogy: Like holding up a sign saying 'My mailbox has room for 12,000 more letters.' If the application is slow to read and the buffer fills, rwnd shrinks to 0 (Zero Window), forcing the sender to halt transmission.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -t -i",
      purpose: "Inspect detailed internal socket metrics including rwnd, cwnd, and rtt",
    },
  },
  "window scale": {
    term: "Window Scale (WS)",
    category: "TCP Options (RFC 7323)",
    title: "Window Scale Factor (RFC 7323)",
    explanation:
      "The original RFC 793 TCP header allocated only 16 bits for the Receive Window, capping the maximum advertised buffer at 65,535 bytes (64 KB). On modern gigabit and high-latency fiber links, this causes severe throughput throttling (BDP bottleneck).\n\nSolution: The Window Scale option shifts the 16-bit value left by up to 14 bits (scaling factor up to 2^14 = 16,384), enabling window sizes up to 1 Gigabyte (65,535 × 16,384 = ~1.07 GB). Negotiated ONLY during SYN and SYN-ACK.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_window_scaling",
      purpose: "Verify whether TCP RFC 7323 window scaling is enabled in kernel",
      output: "net.ipv4.tcp_window_scaling = 1",
    },
  },
  sack: {
    term: "Selective Acknowledgment (SACK)",
    category: "TCP Options (RFC 2018)",
    title: "Selective Acknowledgment (SACK / RFC 2018)",
    explanation:
      "Without SACK, standard TCP uses Cumulative Acknowledgment: if segments 1, 2, 4, 5 arrive and 3 is lost, the receiver can only acknowledge up to 2. The sender must guess whether 4 and 5 arrived, frequently retransmitting all segments.\n\nWith SACK: The receiver includes SACK blocks in TCP options: 'I have up to 2, plus isolated blocks 4-5.' The sender retransmits ONLY the missing segment 3, dramatically improving throughput over lossy networks.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_sack",
      purpose: "Inspect selective acknowledgment support in the Linux kernel",
      output: "net.ipv4.tcp_sack = 1",
    },
  },
  time_wait: {
    term: "TIME_WAIT State",
    category: "TCP State Machine (Teardown)",
    title: "TIME_WAIT State (The 2*MSL Timer)",
    explanation:
      "The terminal state entered by whichever endpoint initiates active closure (calls close() first) after sending its final ACK. The socket remains parked in TIME_WAIT for 2 × Maximum Segment Lifetime (typically 60 seconds on Linux).\n\nTwo Vital Purposes:\n1. Reliability: If the sender's final ACK was dropped on the wire, the peer will retransmit its FIN. TIME_WAIT ensures the host can re-acknowledge it rather than rejecting it with an RST.\n2. Reincarnation Protection: It guarantees that all delayed, wandering duplicate packets from this connection expire in the Internet routers before the same IP:Port 4-tuple can be reused by a new connection.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tan state time-wait | wc -l",
      purpose: "Count sockets currently lingering in TIME_WAIT state",
    },
  },
  close_wait: {
    term: "CLOSE_WAIT State",
    category: "TCP State Machine (Teardown)",
    title: "CLOSE_WAIT State (Passive Teardown)",
    explanation:
      "The state entered by an endpoint that received a FIN from its peer and replied with ACK. In CLOSE_WAIT, the remote client has finished sending, but the local application has NOT yet called close().\n\nWarning: High numbers of sockets stuck in CLOSE_WAIT indicate an application bug! The kernel is faithfully waiting for the application programmer to execute close() on the file descriptor. If the app leaks or hangs, these sockets remain stuck indefinitely.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tan state close-wait",
      purpose: "Identify application file descriptor leaks lingering in CLOSE_WAIT",
    },
  },
  fin: {
    term: "FIN Flag",
    category: "RFC 793 Control Bits",
    title: "FIN (Finish / Graceful Teardown)",
    explanation:
      "The control flag indicating that the sender has finished transmitting its data stream and requests a graceful teardown. Unlike RST, a FIN allows the other side to finish transmitting whatever data it still has buffered.\n\nPhantom Byte: Like a SYN, a FIN consumes exactly 1 sequence number space so that the subsequent ACK can explicitly verify its receipt.",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn 'tcp[tcpflags] & tcp-fin != 0'",
      purpose: "Monitor graceful connection termination FIN packets on the wire",
    },
  },
  fin_wait_1: {
    term: "FIN_WAIT_1",
    category: "TCP State Machine",
    title: "FIN_WAIT_1 State",
    explanation:
      "The state entered when an application actively calls close() or shutdown(SHUT_WR), causing the TCP layer to transmit a FIN segment. The socket waits for an acknowledgment (ACK) of its FIN, or a simultaneous FIN from the peer.",
  },
  fin_wait_2: {
    term: "FIN_WAIT_2",
    category: "TCP State Machine",
    title: "FIN_WAIT_2 State",
    explanation:
      "The state where an endpoint has sent a FIN and received an ACK from the peer, but is now waiting for the peer's application to send its own FIN. The connection is in a half-closed state: local host cannot send data, but can still receive data until the remote peer closes.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_fin_timeout",
      purpose: "Query kernel timeout (seconds) to hold sockets in FIN_WAIT_2 before cleanup",
      output: "net.ipv4.tcp_fin_timeout = 60",
    },
  },
  rst: {
    term: "RST Flag",
    category: "RFC 793 Control Bits",
    title: "RST (Reset / Immediate Abort)",
    explanation:
      "The Emergency Abort signal of TCP. When RST is received, the connection is instantly destroyed: no handshake, no TIME_WAIT, no buffer flushing.\n\nCommon Causes:\n1. Port Closed: Connecting to a port where no process is listening returns an immediate RST (resulting in ECONNREFUSED).\n2. Crash/Reboot: A host receives a segment for an unknown connection it has no record of in kernel memory.\n3. Application Abort: An application sets SO_LINGER to 0 and closes, forcing an abrupt teardown.",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn 'tcp[tcpflags] & tcp-rst != 0'",
      purpose: "Capture aborted connections and connection refused reset packets",
    },
  },
  "syn backlog": {
    term: "SYN Backlog (Half-Open Queue)",
    category: "Kernel Socket Queues",
    title: "SYN Backlog (SYN_RCVD Queue)",
    explanation:
      "A kernel data structure that holds half-open connections: sockets that have received a SYN and replied with SYN-ACK, but have not yet received the final ACK from the client. Sockets here reside in the SYN_RCVD state.\n\nIf the SYN Backlog fills up (e.g. during a SYN Flood attack or extreme load), new incoming connection attempts will be silently dropped or rejected.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_max_syn_backlog",
      purpose: "Display max queue size for half-open SYN connection requests",
      output: "net.ipv4.tcp_max_syn_backlog = 512",
    },
  },
  "accept queue": {
    term: "Accept Queue (Established Backlog)",
    category: "Kernel Socket Queues",
    title: "Accept Queue (Completed Handshakes)",
    explanation:
      "The kernel queue holding fully established sockets that have completed the 3-Way Handshake (ESTABLISHED state) and are waiting for the server application to dequeue them via the accept() syscall.\n\nThe size of this queue is bounded by the backlog parameter passed to listen(fd, backlog) and the system limit net.core.somaxconn.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -lnt",
      purpose: "View Send-Q (Accept queue limit) and Recv-Q (pending connections waiting for accept)",
      output: "LISTEN  0  128  0.0.0.0:80  0.0.0.0:*",
    },
  },
  "syn cookie": {
    term: "SYN Cookies",
    category: "DDoS Defense (RFC 4987)",
    title: "Stateless SYN Cookies (RFC 4987)",
    explanation:
      "A brilliant cryptographic defense against SYN flood memory exhaustion attacks. When the SYN Backlog overflows, the server stops allocating memory in kernel RAM for half-open sockets.\n\nHow It Works: The server calculates the Server ISN as a cryptographic hash of (Client IP, Client Port, Server IP, Server Port, Time Counter, Secret Key). When the legitimate client sends its final ACK (Ack = Cookie + 1), the server subtracts 1, recomputes the cryptographic hash, and verifies it. If it matches, the socket is instantiated on-the-fly without ever having wasted RAM on the initial SYN!",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_syncookies",
      purpose: "Enable kernel stateless SYN cookie defense when backlog saturates",
      output: "net.ipv4.tcp_syncookies = 1",
    },
  },
  rto: {
    term: "Retransmission Timeout (RTO)",
    category: "TCP Reliability & Loss Recovery",
    title: "Retransmission Timeout (RTO & Exponential Backoff)",
    explanation:
      "When TCP transmits a packet, it starts an RTO timer. If no acknowledgment arrives before RTO expires, TCP assumes the packet was dropped in the network and retransmits it.\n\nExponential Backoff: When a retransmission times out repeatedly, TCP doubles the timeout interval (e.g. 1s -> 2s -> 4s -> 8s -> 16s). This prevents a burst of retransmissions from exacerbating congestive network collapse.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -ti | grep rto",
      purpose: "Inspect dynamic measured RTT and calculated RTO for active sockets",
    },
  },
  "2*msl": {
    term: "2*MSL",
    category: "RFC 793 Timers",
    title: "2*MSL (Maximum Segment Lifetime)",
    explanation:
      "MSL is the maximum time a packet can wander around the Internet before routers discard it (enforced by the IP TTL hop limit). RFC 793 defines MSL as 2 minutes, meaning 2*MSL is 4 minutes, though Linux uses 60 seconds (TCP_TIMEWAIT_LEN).\n\nWhy 2 times? One MSL allows the final ACK to travel to the server. The second MSL allows any retransmitted FIN to return if the ACK was lost.",
  },
  "half-closed socket": {
    term: "Half-Closed Socket",
    category: "POSIX Socket API",
    title: "Half-Closed Socket (shutdown vs close)",
    explanation:
      "TCP is full-duplex, consisting of two independent, unidirectional byte streams. An application can close its sending direction by calling shutdown(fd, SHUT_WR) while remaining open to receive data from the peer.\n\nReal-world use: Client sends a huge file via HTTP POST or FTP, calls shutdown(SHUT_WR) to transmit a FIN, and then waits to receive the server's HTTP 200 OK receipt response.",
    commandExample: {
      platform: "Universal",
      command: "nc -N 203.0.113.20 80",
      purpose: "Use netcat -N flag to send EOF/FIN after stdin closes, keeping recv pipe open",
    },
  },
  tcp_nodelay: {
    term: "TCP_NODELAY",
    category: "Socket Options & Latency",
    title: "TCP_NODELAY & Nagle's Algorithm",
    explanation:
      "Nagle's algorithm buffers tiny outgoing packets until either a full MSS is accumulated or previous data is acknowledged, preventing small-packet congestion (tinygrams).\n\nHowever, in interactive gaming, RPCs, or financial trading, waiting introduces unacceptable latency (40ms delayed-ACK stall). Setting the TCP_NODELAY socket option disables Nagle's algorithm, forcing segments onto the wire immediately.",
    commandExample: {
      platform: "Universal",
      command: "curl --tcp-nodelay -v https://example.com",
      purpose: "Instruct HTTP client to disable Nagle's algorithm on socket",
    },
  },
  "simultaneous open": {
    term: "Simultaneous Open",
    category: "RFC 793 Edge Cases",
    title: "Simultaneous Active Open (RFC 793)",
    explanation:
      "A rare protocol scenario where two endpoints actively call connect() towards each other at the exact same moment from predetermined ports. Both send SYN packets before receiving anything.\n\nWhen each endpoint receives a SYN in SYN_SENT state, it transitions to SYN_RCVD (rather than ESTABLISHED) and replies with SYN-ACK. Upon receiving each other's ACKs, both transition to ESTABLISHED. This mechanism forms the foundation of modern P2P NAT hole punching (WebRTC, STUN).",
  },
  cwr: {
    term: "CWR Flag",
    category: "RFC 3168 Congestion Control",
    title: "CWR (Congestion Window Reduced)",
    explanation:
      "Set by a sending host to notify the receiver that it has received an ECN-Echo (ECE) flag and has reduced its congestion window, confirming the network congestion signal was handled.",
  },
  ece: {
    term: "ECE Flag",
    category: "RFC 3168 Congestion Control",
    title: "ECE (ECN-Echo)",
    explanation:
      "Asserted by a receiver when an intermediate router marks an IP packet with Congestion Experienced (CE). It signals the sender to slow down without dropping the packet.",
  },
  urg: {
    term: "URG Flag",
    category: "RFC 793 Control Bits",
    title: "URG (Urgent Pointer Significant)",
    explanation:
      "Indicates that the 16-bit Urgent Pointer field contains an offset to out-of-band data that should be processed immediately by the receiver (e.g. Telnet Ctrl+C interrupt). Rarely used in modern HTTP.",
  },
  psh: {
    term: "PSH Flag",
    category: "RFC 793 Control Bits",
    title: "PSH (Push Buffer to Application)",
    explanation:
      "Informs the receiving TCP layer to push buffered incoming data directly up to the user-space application immediately, rather than waiting for additional bytes to fill the kernel receive buffer. Commonly set on HTTP request segments.",
  },
  econnrefused: {
    term: "ECONNREFUSED",
    category: "POSIX Error Codes",
    title: "ECONNREFUSED (Connection Refused)",
    explanation:
      "A standard OS error returned by connect() when the target host exists and is reachable, but is not actively running a server process listening on the requested destination port. The server kernel automatically replies with an RST, ACK segment.",
    commandExample: {
      platform: "Universal",
      command: "curl http://203.0.113.20:8080",
      purpose: "Trigger immediate curl (7) Failed to connect: Connection refused error",
      output: "curl: (7) Failed to connect to 203.0.113.20 port 8080: Connection refused",
    },
  },
  so_reuseport: {
    term: "SO_REUSEPORT",
    category: "Kernel Socket Options",
    title: "SO_REUSEPORT (Socket Port Reuse)",
    explanation:
      "A Linux socket option allowing multiple independent worker processes (e.g. Nginx worker threads) to bind to the exact same IP:port tuple without EADDRINUSE conflicts. The kernel automatically load-balances incoming connections across the worker sockets.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tulpn | grep :80",
      purpose: "Observe multiple Nginx worker PIDs listening on the same port 80",
    },
  },
  "ephemeral port": {
    term: "Ephemeral Port",
    category: "Transport Demultiplexing",
    title: "Ephemeral Source Port",
    explanation:
      "A short-lived, dynamically allocated port chosen automatically by the OS kernel for an outbound client connection from a designated range (typically 32768–60999 or 49152–65535). Sockets release the port once fully closed.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.ip_local_port_range",
      purpose: "Inspect dynamic ephemeral port allocation range in Linux",
      output: "net.ipv4.ip_local_port_range = 32768 60999",
    },
  },
  "listen state": {
    term: "LISTEN State",
    category: "TCP State Machine",
    title: "Passive LISTEN State",
    explanation:
      "A server socket that has executed bind() and listen() syscalls. It passively listens for remote clients to initiate connection requests by sending TCP SYN packets, managing half-open and completed connection backlogs.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -t state listening",
      purpose: "List all listening TCP sockets and backlog parameters",
    },
  },
  listen: {
    term: "LISTEN State",
    category: "TCP State Machine",
    title: "Passive LISTEN State",
    explanation:
      "A server socket that has executed bind() and listen() syscalls. It passively listens for remote clients to initiate connection requests by sending TCP SYN packets, managing half-open (SYN Backlog) and completed (Accept Queue) connection backlogs.\n\nAnalogy: Like an open storefront with a receptionist waiting at the front desk for customers to walk in.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -lnt 'sport = :80'",
      purpose: "List listening TCP sockets on port 80 with Send-Q and Recv-Q metrics",
    },
  },
  syn_sent: {
    term: "SYN_SENT State",
    category: "TCP State Machine",
    title: "SYN_SENT State (Active Open)",
    explanation:
      "The client socket has transmitted an initial SYN segment and started its Retransmission Timeout (RTO) timer. It is actively awaiting a SYN-ACK response from the server.\n\nIf the RTO timer expires before a SYN-ACK arrives, the client initiates exponential backoff (e.g. 1s -> 2s) and retransmits the SYN.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tan state syn-sent",
      purpose: "Inspect outbound sockets waiting for remote handshake response",
    },
  },
  syn_rcvd: {
    term: "SYN_RCVD State",
    category: "TCP State Machine",
    title: "SYN_RCVD State (Half-Open Queue)",
    explanation:
      "The server received a SYN segment, allocated a Transmission Control Block (TCB) in its SYN Backlog queue, and replied with a SYN-ACK segment. It is awaiting the client's final ACK.\n\nIf the final ACK never arrives (e.g., during a SYN Flood attack), the half-open socket times out and is purged.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tan state syn-recv",
      purpose: "Display half-open sockets waiting for final handshake ACK",
    },
  },
  established: {
    term: "ESTABLISHED State",
    category: "TCP State Machine",
    title: "ESTABLISHED State (Data Transfer)",
    explanation:
      "The 3-Way Handshake is finished! Both client and server sequence numbers are synchronized, flow control windows are negotiated, and full-duplex data streaming can proceed in both directions simultaneously.\n\nSockets here are ready for application read() and write() / send() and recv() syscalls.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -ti state established",
      purpose: "Inspect live TCP socket telemetry including RTT, cwnd, and retransmissions",
    },
  },
  closing: {
    term: "CLOSING State",
    category: "TCP State Machine",
    title: "CLOSING State (Simultaneous Close)",
    explanation:
      "A rare TCP state occurring when both endpoints call close() simultaneously. Each host sends a FIN, and each receives the peer's FIN before receiving an ACK for its own FIN.\n\nUpon receiving an ACK for its own FIN, each host transitions to TIME_WAIT.",
  },
  last_ack: {
    term: "LAST_ACK State",
    category: "TCP State Machine",
    title: "LAST_ACK State (Passive Close Teardown)",
    explanation:
      "The state of an endpoint that was passively closed. After lingering in CLOSE_WAIT while its application finished work, it finally called close(), sending its own FIN. It is now waiting for the final ACK from the active close initiator.\n\nOnce that final ACK arrives, the socket immediately transitions to CLOSED.",
  },
  closed: {
    term: "CLOSED State",
    category: "TCP State Machine",
    title: "CLOSED State (Dormant)",
    explanation:
      "The baseline fictitious state. No connection exists, no buffers are allocated in the kernel, and the port is not reserved. All connection state (TCB) has been deallocated.",
  },
  "4-tuple": {
    term: "The 4-Tuple",
    category: "Transport Demultiplexing",
    title: "Socket 4-Tuple Demux Key",
    explanation:
      "The unique cryptographic identity of a TCP session consisting of (Source IP, Source Port, Destination IP, Destination Port). Operating systems demultiplex incoming packets by hashing this 4-tuple to find the matching socket TCB in the kernel connection table.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tan '( sport = :80 and dport = :51000 )'",
      purpose: "Filter sockets matching specific 4-tuple endpoint combinations",
    },
  },
  checksum: {
    term: "TCP Checksum & Pseudo-Header",
    category: "RFC 793 Header Fields",
    title: "16-Bit Checksum & IPv4 Pseudo-Header",
    explanation:
      "A 16-bit one's complement sum verifying segment data integrity. RFC 793 mandates that the checksum is calculated not only over the TCP header and payload, but also over a 12-byte IPv4 Pseudo-Header (Source IP, Destination IP, Zero byte, Protocol 6, TCP Segment Length).\n\nPurpose: This ensures a packet misrouted by IP layer errors to the wrong destination machine or port is instantly rejected.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ethtool -k eth0 | grep tx-checksumming",
      purpose: "Check whether hardware NIC checksum offloading (Tx/Rx) is active",
    },
  },
  "data offset": {
    term: "Data Offset (Header Length)",
    category: "RFC 793 Header Fields",
    title: "Data Offset / TCP Header Length",
    explanation:
      "A 4-bit field specifying the size of the TCP header in 32-bit (4-byte) words. It indicates where the TCP header ends and where the application data (payload) begins.\n\nMinimum value is 5 (5 × 4 = 20 bytes, no options). Maximum value is 15 (15 × 4 = 60 bytes, accommodating up to 40 bytes of TCP options).",
  },
  timestamps: {
    term: "TCP Timestamps (TSopt)",
    category: "TCP Options (RFC 7323)",
    title: "TCP Timestamps Option (RFC 7323)",
    explanation:
      "A 10-byte TCP option containing two 32-bit timestamps: TSval (Timestamp Value sent by sender) and TSecr (Timestamp Echo Reply returned by receiver).\n\nTwo Crucial Roles:\n1. RTTM: Precise Round-Trip Time Measurement for every segment, even retransmissions.\n2. PAWS: Protection Against Wrapped Sequences, preventing delayed packets from an old sequence window wrap from corrupting gigabit transfers.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_timestamps",
      purpose: "Inspect RFC 7323 timestamp generation setting in kernel",
      output: "net.ipv4.tcp_timestamps = 1",
    },
  },
  "send buffer": {
    term: "Send Buffer (Send-Q)",
    category: "Operating System Kernel",
    title: "Kernel Socket Send Buffer",
    explanation:
      "When an application calls send() or write(), the data is copied from user-space into the kernel's send buffer. TCP transmits segments from this buffer and retains copies until the remote peer acknowledges them with an ACK segment.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -nt",
      purpose: "View active Send-Q byte volume waiting for wire transmission and ACK",
    },
  },
  "receive buffer": {
    term: "Receive Buffer (Recv-Q)",
    category: "Operating System Kernel",
    title: "Kernel Socket Receive Buffer",
    explanation:
      "Bytes arriving over the network are reassembled in order and stored in the kernel receive buffer until the user-space process calls read() or recv(). The available space in this buffer is advertised in the Receive Window (rwnd) field.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -nt",
      purpose: "Inspect Recv-Q byte count queued for application reading",
    },
  },
};

// Array of search patterns ordered by string length descending to prevent partial prefix clashes
export const TCP_TERM_PATTERNS: string[] = [
  "Simultaneous Active Open",
  "simultaneous open",
  "Stateless SYN Cookies",
  "stateless SYN cookies",
  "SYN Cookies",
  "SYN cookies",
  "SYN cookie",
  "Receive Window",
  "receive window",
  "Receive Buffer",
  "receive buffer",
  "Window Scale",
  "window scale",
  "Initial Sequence Number",
  "Initial Sequence Numbers",
  "initial sequence number",
  "Selective Acknowledgment",
  "selective acknowledgment",
  "Exponential Backoff",
  "exponential backoff",
  "ECONNREFUSED",
  "SO_REUSEPORT",
  "TCP_NODELAY",
  "TIME_WAIT",
  "CLOSE_WAIT",
  "FIN_WAIT_1",
  "FIN_WAIT_2",
  "LAST_ACK",
  "SYN_SENT",
  "SYN_RCVD",
  "ESTABLISHED",
  "SYN Backlog",
  "syn backlog",
  "Accept Queue",
  "accept queue",
  "Half-Closed Socket",
  "half-closed socket",
  "Send Buffer",
  "send buffer",
  "Data Offset",
  "data offset",
  "Timestamps",
  "timestamps",
  "Checksum",
  "checksum",
  "2*MSL",
  "SYN-ACK",
  "SYN",
  "ACK",
  "FIN",
  "RST",
  "PSH",
  "URG",
  "ECE",
  "CWR",
  "ISN",
  "MSS",
  "RTO",
  "LISTEN",
  "CLOSED",
  "CLOSING",
  "ephemeral port",
  "4-tuple",
  "4-Tuple",
];
