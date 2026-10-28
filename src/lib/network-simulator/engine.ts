/**
 * Type definitions and models for the Computer Networks Simulator.
 * Strictly adheres to Simulation Rule #1 (Data-driven state isolation)
 * and Decision Record 001 (Defensive clamp bounds).
 */

export type SocketState =
  | "CLOSED"
  | "LISTEN"
  | "SYN_SENT"
  | "SYN_RECEIVED"
  | "ESTABLISHED"
  | "FIN_WAIT_1"
  | "FIN_WAIT_2"
  | "CLOSE_WAIT"
  | "CLOSING"
  | "LAST_ACK"
  | "TIME_WAIT";

export interface HostApplication {
  id: string;
  name: string;
  pid: number;
  port: number;
  status: "idle" | "listening" | "connecting" | "connected" | "conflict";
}

export interface NetworkHost {
  id: string;
  name: string;
  role: "client" | "server";
  ip: string;
  ipVersion: "IPv4" | "IPv6";
  interfaceName: string;
  macAddress: string;
  applications: HostApplication[];
}

export interface SocketEntry {
  id: string;
  hostId: string;
  protocol: "TCP" | "UDP";
  localIp: string;
  localPort: number;
  remoteIp: string;
  remotePort: number;
  state: SocketState;
  sendBufferBytes: number;
  recvBufferBytes: number;
  isListening: boolean;
  processName: string;
}

export interface PacketHeaderData {
  ethernet: {
    srcMac: string;
    dstMac: string;
    etherType: string;
  };
  ip: {
    version: string;
    srcIp: string;
    dstIp: string;
    ttl: number;
    protocolNum: number;
  };
  transport: {
    srcPort: number;
    dstPort: number;
    flagsStr: string;
    seqNumber?: number;
    ackNumber?: number;
    windowSize: number;
  };
  payload: {
    appProtocol: string;
    rawData: string;
    sizeBytes: number;
    isEncrypted?: boolean;
  };
}

export interface WirePacket {
  id: string;
  sourceHostId: string;
  targetHostId: string;
  direction: "client-to-server" | "server-to-client";
  protocol: "TCP" | "UDP";
  label: string;
  flags: {
    syn?: boolean;
    ack?: boolean;
    fin?: boolean;
    psh?: boolean;
    rst?: boolean;
  };
  headerData: PacketHeaderData;
}

export interface NetworkStepNote {
  title: string;
  body: string;
  commandExample?: {
    platform: "Linux / POSIX" | "macOS" | "macOS / Linux" | "Windows" | "Universal";
    command: string;
    purpose: string;
    output?: string;
  };
}

export interface NetworkScenarioStep {
  id: string;
  stepIndex: number;
  title: string;
  badge: string;
  explanation: string;
  detailedNotes?: NetworkStepNote[];
  hosts: NetworkHost[];
  activeSockets: SocketEntry[];
  activePacket: WirePacket | null;
  highlightedElement?: {
    type: "host" | "socket" | "packet" | "port";
    id: string;
  };
}

export interface NetworkSimulationScenario {
  id: string;
  title: string;
  description: string;
  badge: string;
  steps: NetworkScenarioStep[];
}
