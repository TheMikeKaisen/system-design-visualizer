/**
 * DNS Simulation Domain Types & RFC Models.
 * Follows RFC 1035 (Domain Names Implementation & Specification)
 * and RFC 2308 (DNS NCACHE - Negative Caching).
 */

export type DnsCacheTier = "browser" | "os" | "resolver";
export type DnsRecordType = "A" | "AAAA" | "CNAME" | "NS" | "SOA";

export interface DnsCacheEntry {
  id: string;
  tier: DnsCacheTier;
  domain: string;
  recordType: DnsRecordType;
  value: string;
  ttlRemaining: number;
  initialTtl: number;
  status: "VALID" | "EXPIRED" | "NEGATIVE";
}

export interface DnsHeaderFlags {
  qr: "0 (Query)" | "1 (Response)";
  opcode: "QUERY (0)";
  aa: boolean; // Authoritative Answer
  tc: boolean; // Truncation
  rd: boolean; // Recursion Desired
  ra: boolean; // Recursion Available
  rcode: "NOERROR (0)" | "NXDOMAIN (3)" | "SERVFAIL (2)";
}

export interface DnsQuestion {
  name: string;
  type: DnsRecordType;
  qclass: "IN (0x0001)";
}

export interface DnsResourceRecord {
  name: string;
  type: DnsRecordType;
  rclass: "IN (0x0001)";
  ttl: number;
  data: string;
}

export interface DnsMessage {
  transactionId: string;
  flags: DnsHeaderFlags;
  qdCount: number;
  anCount: number;
  nsCount: number;
  arCount: number;
  question: DnsQuestion;
  answers: DnsResourceRecord[];
  authorities: DnsResourceRecord[];
  additionals: DnsResourceRecord[]; // Glue records
}

export interface DnsWirePacket {
  id: string;
  fromNode: "client-browser" | "client-os" | "resolver" | "root-server" | "tld-server" | "auth-server";
  toNode: "client-browser" | "client-os" | "resolver" | "root-server" | "tld-server" | "auth-server";
  type: "QUERY" | "RESPONSE" | "REFERRAL" | "ERROR";
  label: string;
  protocol: "UDP 53" | "DoH 443";
  message: DnsMessage;
}

export interface DnsStepData {
  client: {
    url: string;
    browserCacheStatus: "MISS" | "HIT" | "CACHED" | "IDLE";
    osCacheStatus: "MISS" | "HIT" | "CACHED" | "IDLE";
    resolvedIp: string | null;
  };
  resolver: {
    ip: string;
    status:
      | "IDLE"
      | "CHECKING_CACHE"
      | "QUERYING_ROOT"
      | "QUERYING_TLD"
      | "QUERYING_AUTHORITATIVE"
      | "CACHING_ANSWER"
      | "RESOLVED"
      | "NXDOMAIN_CACHED";
    cacheStatus: "MISS" | "HIT" | "REFERRAL_HIT" | "NEGATIVE_CACHED";
    activeTargetServer?: "root" | "tld" | "auth" | null;
  };
  hierarchy: {
    root: {
      name: string;
      ip: string;
      status: "idle" | "processing" | "referral";
    };
    tld: {
      name: string;
      ip: string;
      status: "idle" | "processing" | "referral";
    };
    auth: {
      name: string;
      ip: string;
      status: "idle" | "processing" | "authoritative" | "nxdomain";
    };
  };
  activeDnsPacket: DnsWirePacket | null;
  caches: DnsCacheEntry[];
}
