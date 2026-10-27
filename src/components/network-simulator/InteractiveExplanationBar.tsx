"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { NetworkStepNote } from "@/lib/network-simulator/engine";
import { Terminal, BookOpen, Info, X } from "lucide-react";

export interface ConceptDefinition {
  term: string;
  category: string;
  title: string;
  explanation: string;
  commandExample?: {
    platform: "Linux / POSIX" | "macOS" | "macOS / Linux" | "Windows" | "Universal";
    command: string;
    purpose: string;
    output?: string;
  };
}

// Built-in glossary of core network systems concepts
const BUILTIN_GLOSSARY: Record<string, ConceptDefinition> = {
  "0.0.0.0": {
    term: "0.0.0.0",
    category: "IPv4 Addressing (INADDR_ANY)",
    title: "The 0.0.0.0 Wildcard Address",
    explanation:
      "A special IPv4 wildcard address meaning 'all IPv4 addresses on the local machine'. Binding to 0.0.0.0 allows the socket to receive packets arriving across any interface (Ethernet, Wi-Fi, loopback 127.0.0.1).",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tulpn | grep :80",
      purpose: "Verify process listening on all interfaces via 0.0.0.0:80",
      output: "tcp  LISTEN  0  128  0.0.0.0:80  0.0.0.0:*  users:((\"nginx\",pid=1024))",
    },
  },
  "listen": {
    term: "LISTEN state",
    category: "TCP State Machine",
    title: "Passive LISTEN State",
    explanation:
      "A server socket in LISTEN state has executed socket(), bind(), and listen() syscalls. It passively waits for remote clients to initiate connection requests by sending TCP SYN packets.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -t state listening",
      purpose: "List all active TCP listening sockets and queue backlogs",
    },
  },
  "passive open": {
    term: "Passive Open",
    category: "POSIX Socket API",
    title: "Passive Open",
    explanation:
      "Unlike a client that actively initiates contact (Active Open), a server performs a Passive Open: it registers its IP and port with the OS kernel and enters an idle state ready to accept incoming connections.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -tulpn | grep :80",
      purpose: "Inspect sockets registered in passive open state",
    },
  },
  "ephemeral port": {
    term: "Ephemeral Port",
    category: "Transport Demultiplexing",
    title: "Dynamic Ephemeral Port",
    explanation:
      "Client applications do not need pre-assigned port numbers. When connecting out, the OS dynamically selects a temporary, unused source port from a private range (typically 49152–65535 or 32768–60999).",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.ip_local_port_range",
      purpose: "Query kernel dynamic source port allocation boundaries",
      output: "net.ipv4.ip_local_port_range = 32768 60999",
    },
  },
  "isn": {
    term: "Initial Sequence Number (ISN)",
    category: "TCP Synchronization",
    title: "Initial Sequence Number (ISN)",
    explanation:
      "A starting 32-bit byte offset chosen during the handshake. Operating systems randomize the ISN to avoid sequence collisions from old delayed packets and to protect against sequence-number spoofing.",
  },
  "syn": {
    term: "TCP SYN Flag",
    category: "TCP Protocol Control",
    title: "SYN (Synchronize Sequence Numbers)",
    explanation:
      "The first control flag exchanged in the 3-Way Handshake. It informs the remote endpoint: 'I wish to open a connection and synchronize byte sequence numbers starting at my ISN.'",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn -c 1 'tcp[tcpflags] & tcp-syn != 0'",
      purpose: "Capture outbound TCP SYN packet on local interface",
    },
  },
  "syn_sent": {
    term: "SYN_SENT",
    category: "TCP State Machine",
    title: "SYN_SENT State",
    explanation:
      "The client socket has transmitted a SYN packet and is awaiting a SYN-ACK acknowledgment from the server. If no response arrives before a timeout, the kernel retransmits SYN.",
  },
  "syn-ack": {
    term: "SYN-ACK Pair",
    category: "TCP 3-Way Handshake",
    title: "SYN-ACK Response",
    explanation:
      "The server simultaneously acknowledges the client's byte counter (Ack = Client ISN + 1) and advertises its own initial sequence number (Seq = Server ISN).",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn -c 1 'tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack)'",
      purpose: "Filter packet trace for SYN-ACK replies",
    },
  },
  "syn_received": {
    term: "SYN_RECEIVED",
    category: "TCP State Machine",
    title: "SYN_RECEIVED State",
    explanation:
      "The server has received the client SYN, replied with SYN-ACK, and is now waiting for the client's final ACK. While in this state, the half-open socket is tracked in the SYN backlog table.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -t4 state syn-recv",
      purpose: "List half-open connections pending final handshake ACK",
    },
  },
  "tcb": {
    term: "Transmission Control Block (TCB)",
    category: "Kernel Data Structure",
    title: "Transmission Control Block (TCB)",
    explanation:
      "A kernel memory struct that stores all operational telemetry for a TCP socket: the 4-tuple endpoints, send/receive buffer pointers, sequence counters, sliding window size, and retransmission timers.",
  },
  "syn backlog": {
    term: "SYN Backlog Queue",
    category: "Kernel Architecture",
    title: "SYN Backlog Queue",
    explanation:
      "A kernel queue holding connections that have completed step 1 (SYN received) but not step 3 (final ACK). If this queue fills during a SYN flood, the kernel may drop SYNs or issue SYN cookies.",
  },
  "ack": {
    term: "ACK (Acknowledgment)",
    category: "TCP Protocol Control",
    title: "ACK (Acknowledgment Flag)",
    explanation:
      "Confirms receipt of data bytes up to the indicated acknowledgment number. In the final step of the handshake, the client ACK completes connection setup.",
  },
  "established": {
    term: "ESTABLISHED",
    category: "TCP State Machine",
    title: "ESTABLISHED State",
    explanation:
      "The 3-Way Handshake is finished. Both endpoints have synchronized sequence numbers, allocated socket buffers, and can now stream application data bidirectionally.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -t state established",
      purpose: "Display all active connected TCP socket pairs",
    },
  },
  "4-tuple": {
    term: "The 4-Tuple",
    category: "Transport Demultiplexing",
    title: "The Socket 4-Tuple Demux Key",
    explanation:
      "The four values that uniquely identify every TCP connection on the planet: (Source IP, Source Port, Destination IP, Destination Port). As long as any single value differs, a server can handle thousands of clients on port 80 or 443.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ss -t state established '( sport = :80 )'",
      purpose: "Inspect established TCP connections routed by 4-tuple",
      output: "tcp  ESTAB  0  0  203.0.113.20:80  192.168.1.10:51524",
    },
  },
  "send buffer": {
    term: "Socket Send Buffer",
    category: "Operating System Kernel",
    title: "Kernel Socket Send Buffer",
    explanation:
      "When an application calls send() or write(), data is copied into the kernel's send buffer. The TCP stack sends it across the wire and only removes bytes from this buffer once the remote peer sends an ACK.",
  },
  "psh": {
    term: "PSH (Push) Flag",
    category: "TCP Protocol Control",
    title: "The PSH (Push) Flag",
    explanation:
      "Instructs the receiving operating system to push incoming bytes directly to the application layer without waiting for the buffer to fill or waiting for timer expiration.",
    commandExample: {
      platform: "Universal",
      command: "tcpdump -nn -vv -i eth0 'tcp[tcpflags] & (tcp-push) != 0'",
      purpose: "Filter packet capture for TCP segments with PSH flag set",
    },
  },
  "eaddrinuse": {
    term: "EADDRINUSE (Errno 98)",
    category: "POSIX Error Code",
    title: "EADDRINUSE: Address Already in Use",
    explanation:
      "The operating system rejects a bind() syscall because another process is already bound to that exact IP and port. To prevent ambiguous packet delivery, POSIX enforces endpoint uniqueness by default.",
    commandExample: {
      platform: "macOS / Linux",
      command: "lsof -i :8080",
      purpose: "Diagnose which process (PID) is occupying the desired port",
      output: "node  8412 dev  18u  IPv4  0x1234  0t0  TCP *:8080 (LISTEN)",
    },
  },
  "so_reuseport": {
    term: "SO_REUSEPORT",
    category: "Advanced Socket Option",
    title: "SO_REUSEPORT Socket Option",
    explanation:
      "A modern Linux/BSD socket option that allows multiple processes or threads to bind to the exact same IP and port. The kernel automatically balances incoming connections across the sockets using a 4-tuple hash.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "sysctl net.ipv4.tcp_tw_reuse",
      purpose: "Query kernel configuration for socket address reuse",
    },
  },
  "full-duplex": {
    term: "Full-Duplex",
    category: "Socket Architecture",
    title: "Full-Duplex Communication",
    explanation:
      "Both client and server have independent send and receive buffers. They can simultaneously send and receive data over the same connection without waiting for each other to stop transmitting.",
    commandExample: {
      platform: "macOS / Linux",
      command: "lsof -iTCP -sTCP:ESTABLISHED",
      purpose: "Inspect active bidirectional socket file descriptors",
    },
  },
  "ttl": {
    term: "TTL (Time to Live)",
    category: "IP Protocol Header",
    title: "IP Header Time-To-Live (TTL)",
    explanation:
      "An 8-bit counter in the IPv4 header (default 64 or 128). Each router that forwards the packet decrements TTL by 1. If TTL hits 0, the router drops the packet and replies with ICMP Time Exceeded, preventing endless loops.",
    commandExample: {
      platform: "Universal",
      command: "traceroute -n 203.0.113.20",
      purpose: "Trace router hops and inspect TTL decrement across the path",
    },
  },
  "mac": {
    term: "MAC Address",
    category: "Layer 2 Data Link",
    title: "Media Access Control (MAC) Address",
    explanation:
      "A 48-bit physical hardware address (e.g. 00:1A:2B:3C:4D:5E) burned into the Network Interface Card. Used exclusively for hop-by-hop delivery across a local LAN segment; routers swap MAC addresses at each hop.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ip neigh show",
      purpose: "Query kernel ARP table mapping IP addresses to physical MACs",
      output: "203.0.113.20 dev eth0 lladdr 52:54:00:12:34:56 REACHABLE",
    },
  },
};

interface InteractiveExplanationBarProps {
  safeIndex: number;
  totalSteps: number;
  badge: string;
  title: string;
  explanation: string;
  detailedNotes?: NetworkStepNote[];
}

export function InteractiveExplanationBar({
  safeIndex,
  totalSteps,
  badge,
  title,
  explanation,
  detailedNotes,
}: InteractiveExplanationBarProps) {
  const [activeConcept, setActiveConcept] = useState<ConceptDefinition | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Clear pending timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Safe hover handlers with 140ms intent delay (only active when not pinned by tap/click)
  const handleTriggerEnter = useCallback((concept: ConceptDefinition) => {
    if (isPinned) return;
    // On touch devices (or screens without fine-pointer hover), ignore mouse synthetic hover events
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches
    ) {
      return;
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveConcept(concept);
    }, 140);
  }, [isPinned]);

  const handleTriggerLeave = useCallback(() => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveConcept(null);
    }, 180);
  }, [isPinned]);

  const handlePopoverEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handlePopoverLeave = useCallback(() => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveConcept(null);
    }, 140);
  }, [isPinned]);

  // Click/tap toggle: pins the dialogue open so mobile & touch users have full persistence
  const toggleConcept = useCallback((concept: ConceptDefinition) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveConcept((prev) => {
      if (prev?.title === concept.title && isPinned) {
        setIsPinned(false);
        return null;
      }
      setIsPinned(true);
      return concept;
    });
  }, [isPinned]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveConcept(null);
        setIsPinned(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on outside click/tap
  useEffect(() => {
    if (!activeConcept) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[aria-haspopup="dialog"]')) {
          return;
        }
        setActiveConcept(null);
        setIsPinned(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [activeConcept]);

  // Map step detailedNotes to custom concept definitions
  const stepConceptNotes: ConceptDefinition[] = React.useMemo(() => {
    if (!detailedNotes || detailedNotes.length === 0) return [];
    return detailedNotes.map((note) => {
      // Check if built-in definition has extra commands
      const lower = note.title.toLowerCase();
      const matchedKey = Object.keys(BUILTIN_GLOSSARY).find((k) => lower.includes(k));
      const builtin = matchedKey ? BUILTIN_GLOSSARY[matchedKey] : undefined;

      return {
        term: note.title,
        category: builtin?.category ?? "Kernel Telemetry",
        title: note.title,
        explanation: note.body,
        commandExample: note.commandExample ?? builtin?.commandExample,
      };
    });
  }, [detailedNotes]);

  // Function to highlight recognized technical terms inside the narrative sentence
  const renderHighlightedExplanation = () => {
    // Regex keywords to match in the text
    const termPatterns = [
      "0.0.0.0:80",
      "0.0.0.0:8080",
      "0.0.0.0:443",
      "0.0.0.0:8081",
      "0.0.0.0",
      "LISTEN state",
      "LISTEN",
      "ephemeral port 51524",
      "ephemeral port",
      "ISN=1000",
      "ISN=5000",
      "SYN_SENT",
      "SYN_RECEIVED",
      "SYN-ACK",
      "SYN packet",
      "final ACK",
      "ESTABLISHED",
      "4-tuple",
      "socket send buffer",
      "PSH, ACK",
      "PSH flag",
      "EADDRINUSE",
      "SO_REUSEPORT",
      "SO_REUSEADDR",
      "Transmission Control Block (TCB)",
      "full-duplex socket pair",
      "full-duplex",
      "TTL (64)",
      "TTL",
      "Ethernet header",
      "Ethernet frame",
      "Source MAC",
      "Destination MAC",
    ];

    // Build regex with word boundaries
    const escaped = termPatterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts = explanation.split(regex);

    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      const matchedKey = Object.keys(BUILTIN_GLOSSARY).find((k) => lower.includes(k));

      // Also check if matches any note in current step
      const noteMatch = stepConceptNotes.find(
        (n) => n.title.toLowerCase().includes(lower) || lower.includes(n.title.toLowerCase())
      );

      const concept = noteMatch ?? (matchedKey ? BUILTIN_GLOSSARY[matchedKey] : null);

      if (concept && part.trim().length > 1) {
        return (
          <button
            type="button"
            key={`${part}-${index}`}
            onMouseEnter={() => handleTriggerEnter(concept)}
            onMouseLeave={handleTriggerLeave}
            onClick={() => toggleConcept(concept)}
            aria-haspopup="dialog"
            aria-expanded={activeConcept?.title === concept.title}
            aria-label={`Inspect definition for ${part}`}
            className="inline text-teal-300 font-semibold underline decoration-teal-500/60 decoration-dashed underline-offset-[3px] hover:text-teal-200 hover:decoration-teal-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded-sm cursor-help transition-colors touch-manipulation"
          >
            {part}
          </button>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const getStepBadgeColor = (badgeText: string) => {
    if (badgeText.includes("Error") || badgeText.includes("Collision")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    if (badgeText.includes("Handshake") || badgeText.includes("Init")) {
      return "bg-teal-500/10 text-teal-400 border-teal-500/30";
    }
    if (badgeText.includes("Layer") || badgeText.includes("Wire")) {
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    }
    return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  };

  return (
    <aside
      aria-label="Step explanation"
      className="shrink-0 w-full z-30 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-border/60 shadow-sm relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col gap-1.5">
          {/* Top row: Pulse indicator dot, step count, badge, and title */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex h-2.5 w-2.5 relative shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
            </span>
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/80 shrink-0 select-none">
              Step {safeIndex + 1} of {totalSteps}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 select-none ${getStepBadgeColor(
                badge
              )}`}
            >
              {badge}
            </span>
            <div className="h-3.5 w-px bg-border/60 hidden sm:block shrink-0" aria-hidden="true" />
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 font-sans truncate">
              {title}
            </h3>
          </div>

          {/* Middle: Narrative paragraph with highlighted interactive terms */}
          <p className="text-xs sm:text-sm text-foreground/90 dark:text-zinc-200 leading-relaxed font-sans">
            {renderHighlightedExplanation()}
          </p>

          {/* Bottom row: Concept chips from step notes (click or hover to inspect) */}
          {stepConceptNotes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-sans">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-semibold mr-1 flex items-center gap-1 select-none">
                <Info className="w-3 h-3 text-teal-400" />
                Inspect Concepts:
              </span>
              {stepConceptNotes.map((concept) => (
                <button
                  type="button"
                  key={concept.title}
                  onMouseEnter={() => handleTriggerEnter(concept)}
                  onMouseLeave={handleTriggerLeave}
                  onClick={() => toggleConcept(concept)}
                  aria-haspopup="dialog"
                  aria-expanded={activeConcept?.title === concept.title}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-zinc-800/80 hover:bg-teal-500/20 text-zinc-300 hover:text-teal-300 border border-zinc-700/60 hover:border-teal-500/40 transition-colors cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
                >
                  <BookOpen className="w-3 h-3 text-teal-400" />
                  <span>{concept.title}</span>
                  <span className="text-[9px] text-teal-400 opacity-70">▾</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contextual Dialogue Backdrop (Mobile Tap to Dismiss) ── */}
      {activeConcept && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => {
            setActiveConcept(null);
            setIsPinned(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Contextual Dialogue / Hover Card Popover ── */}
      {activeConcept && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal={isPinned}
          aria-label={activeConcept.title}
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
          className="fixed sm:absolute left-3 right-3 sm:left-6 sm:right-auto top-20 sm:top-full mt-0 sm:mt-1.5 z-50 max-w-lg sm:w-auto max-h-[80vh] overflow-y-auto p-4 rounded-xl bg-[#090b10] border border-teal-500/40 text-zinc-200 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 font-sans custom-scrollbar"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 pb-2 mb-2 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-teal-300 text-xs sm:text-sm font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  {activeConcept.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                {activeConcept.category}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveConcept(null);
                setIsPinned(false);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 touch-manipulation"
              aria-label="Close dialogue"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explanation Body */}
          <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-3">
            {activeConcept.explanation}
          </p>

          {/* Contextual Terminal Command Example (if present) */}
          {activeConcept.commandExample && (
            <div className="bg-[#050608] rounded-lg p-2.5 border border-zinc-800/90 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-sans">
                <span>Purpose: {activeConcept.commandExample.purpose}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                  {activeConcept.commandExample.platform}
                </span>
              </div>
              <div className="text-emerald-400 flex items-center gap-1 select-all font-semibold py-0.5">
                <span className="text-zinc-600 select-none">$</span>
                <span>{activeConcept.commandExample.command}</span>
              </div>
              {activeConcept.commandExample.output && (
                <pre className="mt-1 text-[10px] text-zinc-400 whitespace-pre-wrap font-mono select-all bg-black/40 p-1.5 rounded border border-zinc-900">
                  {activeConcept.commandExample.output}
                </pre>
              )}
            </div>
          )}

          {/* Subtle footer helper */}
          <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
            <span>Hover away, tap outside, or Esc to close</span>
            <span className="font-mono text-teal-400/80">Interactive Kernel Concept</span>
          </div>
        </div>
      )}
    </aside>
  );
}
