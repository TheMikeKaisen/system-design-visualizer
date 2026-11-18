export type EC2ScenarioId =
  | "happy_path"
  | "sg_blocked"
  | "mismatched_key"
  | "ip_reboot";

export type PacketStage =
  | "client"
  | "internet"
  | "igw"
  | "sg"
  | "eni"
  | "dropped"
  | "connected";

export type ActiveFocusLayer =
  | "client"
  | "network"
  | "gateway"
  | "security_group"
  | "instance"
  | "crypto"
  | "handshake"
  | "tunnel";

export type TerminalLineType = "cmd" | "debug" | "stdout" | "stderr" | "prompt";

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  text: string;
}

export interface NetworkSimulationState {
  clientIp: string;
  targetPublicIp: string;
  targetPrivateIp: string;
  isElasticIp: boolean;
  packetStage: PacketStage;
  securityGroupPort22: "open" | "closed";
  status: "idle" | "in_transit" | "blocked" | "connected";
}

export interface CryptoSimulationState {
  clientKeyName: string;
  clientHasKey: boolean;
  clientKeyFingerprint: string;
  ec2AuthorizedKeys: string[];
  nonceChallenge: string | null;
  signedDigest: string | null;
  signatureVerified: boolean | null;
  sessionCipher: "none" | "negotiating" | "aes-256-gcm";
}

export interface EC2Step {
  id: string;
  stepNumber: number;
  title: string;
  explanation: string;
  conceptBadge?: string;
  callout?: {
    type: "info" | "warning" | "success" | "danger";
    title: string;
    content: string;
  };
  activeLayer: ActiveFocusLayer;
  network: NetworkSimulationState;
  crypto: CryptoSimulationState;
  terminalLines: TerminalLine[];
}

export interface EC2Scenario {
  id: EC2ScenarioId;
  name: string;
  tag: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: EC2Step[];
}
