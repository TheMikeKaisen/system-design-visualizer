"use client";

import React, { useEffect, useState } from "react";
import { useNetworkSimulationStore } from "@/store/useNetworkSimulationStore";
import {
  ALL_DNS_SCENARIOS,
  SCENARIO_DNS_COLD_CACHE,
  type DnsScenarioStep,
} from "@/lib/network-simulator/dns-scenarios";
import { NetworkEpisodeShell } from "@/components/network-simulator/NetworkEpisodeShell";
import { DnsTopologyCanvas } from "@/components/network-simulator/DnsTopologyCanvas";
import { DnsTelemetryPanel } from "@/components/network-simulator/DnsTelemetryPanel";
import type { DnsWirePacket } from "@/lib/network-simulator/dns-engine";
import type { ConceptDefinition } from "@/components/network-simulator/InteractiveExplanationBar";

const DNS_GLOSSARY: Record<string, ConceptDefinition> = {
  "ns server": {
    term: "NS Server",
    category: "DNS Delegation & Referral",
    title: "NS Server (Name Server)",
    explanation:
      "An NS referral is a response from a DNS server that tells the resolver which name servers are responsible for the next part of the domain name hierarchy.\n\nNS stands for Name Server.\n\nInstead of giving you the final IP address, the DNS server points you toward another DNS server that is more knowledgeable about the domain you're looking for.",
    commandExample: {
      platform: "Universal",
      command: "dig @198.41.0.4 amazon.com",
      purpose: "Query root server to observe the NS referral in the Authority section",
    },
  },
  "ns referral": {
    term: "NS Referral",
    category: "DNS Delegation & Referral",
    title: "NS Server Referral",
    explanation:
      "An NS referral is a response from a DNS server that tells the resolver which name servers are responsible for the next part of the domain name hierarchy.\n\nNS stands for Name Server.\n\nInstead of giving you the final IP address, the DNS server points you toward another DNS server that is more knowledgeable about the domain you're looking for.",
    commandExample: {
      platform: "Universal",
      command: "dig +trace amazon.com",
      purpose: "Inspect each NS referral down the delegation hierarchy",
    },
  },
  "name server": {
    term: "Name Server (NS)",
    category: "DNS Delegation & Referral",
    title: "NS Server (Name Server)",
    explanation:
      "An NS referral is a response from a DNS server that tells the resolver which name servers are responsible for the next part of the domain name hierarchy.\n\nNS stands for Name Server.\n\nInstead of giving you the final IP address, the DNS server points you toward another DNS server that is more knowledgeable about the domain you're looking for.",
  },
  "glue record": {
    term: "Glue Record",
    category: "RFC 1035 Additional Section",
    title: "Glue Record",
    explanation:
      "An A or AAAA record provided in the Additional section of a referral response containing the IP address of a delegated nameserver. Glue records prevent cyclic dependency loops when a nameserver's domain resides within the delegated zone itself.",
    commandExample: {
      platform: "Universal",
      command: "dig +norecurse @198.41.0.4 amazon.com",
      purpose: "Inspect root server referral response and observe the Additional Section glue IPs",
    },
  },
  "root nameserver": {
    term: "Root Nameserver",
    category: "DNS Root Zone (.)",
    title: "Root Nameserver (.)",
    explanation:
      "The authoritative nameservers for the root zone of the Domain Name System. There are 13 logical root server addresses (A through M), operated by 12 independent organizations and distributed globally across hundreds of physical locations using Anycast.",
    commandExample: {
      platform: "Universal",
      command: "dig . NS",
      purpose: "List the 13 root nameservers coordinating the top of the DNS hierarchy",
    },
  },
  "root server": {
    term: "Root Nameserver",
    category: "DNS Root Zone (.)",
    title: "Root Nameserver (.)",
    explanation:
      "The authoritative nameservers for the root zone of the Domain Name System. They refer queries for unknown domains to the appropriate Top-Level Domain (TLD) nameservers.",
    commandExample: {
      platform: "Universal",
      command: "dig +trace amazon.com",
      purpose: "Trace recursive referrals beginning from root nameservers",
    },
  },
  "tld server": {
    term: "TLD Nameserver",
    category: "Top-Level Domain Registry",
    title: "TLD Nameserver (.com / .net / .org)",
    explanation:
      "Nameservers responsible for Top-Level Domains. For .com, Verisign operates the registry servers (gtld-servers.net), providing delegations and glue records pointing to authoritative nameservers chosen by domain registrants.",
  },
  "authoritative server": {
    term: "Authoritative Nameserver",
    category: "DNS Zone Authority",
    title: "Authoritative Nameserver",
    explanation:
      "The definitive source of truth holding the official DNS zone file configured by the domain owner. Answers from authoritative servers have the AA (Authoritative Answer) flag bit asserted.",
  },
  "cname": {
    term: "CNAME Record",
    category: "DNS Resource Record",
    title: "Canonical Name (CNAME) Record",
    explanation:
      "A DNS record mapping an alias domain (e.g. www.amazon.com) to its canonical domain name (e.g. d123.cloudfront.net). Resolving a CNAME triggers an iterative alias chain until a final A or AAAA record is obtained.",
    commandExample: {
      platform: "Universal",
      command: "dig www.amazon.com CNAME",
      purpose: "Query canonical name alias chain pointing to CDN edge infrastructure",
    },
  },
  "nxdomain": {
    term: "NXDOMAIN (RCODE=3)",
    category: "RFC 2308 Negative Response",
    title: "Non-Existent Domain (NXDOMAIN)",
    explanation:
      "Response code 3 indicating the requested domain name does not exist. RFC 2308 mandates negative response caching by recursive resolvers for the duration specified in the zone's SOA Minimum TTL to prevent root server overload.",
    commandExample: {
      platform: "Universal",
      command: "dig this-domain-definitely-does-not-exist-1234.com",
      purpose: "Observe status: NXDOMAIN in the DNS reply header flags",
    },
  },
  "stub resolver": {
    term: "OS Stub Resolver",
    category: "POSIX / System Resolver",
    title: "OS Stub Resolver",
    explanation:
      "The lightweight client DNS library embedded in operating systems (glibc getaddrinfo or systemd-resolved). Stub resolvers do not perform iterative hierarchy traversal; they dispatch recursive queries (RD=1) to an upstream recursive resolver.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "resolvectl status",
      purpose: "Inspect active DNS links, servers, and DNSSEC validation status",
    },
  },
};

const DNS_TERM_PATTERNS = [
  "NS server",
  "NS Server",
  "NS referral",
  "NS Referral",
  "Name Server",
  "name server",
  "name servers",
  "Authority NS",
  "Glue Record",
  "Glue records",
  "Root server",
  "Root nameservers",
  "Root (.) Server",
  "TLD Server",
  ".com TLD Server",
  "Authoritative server",
  "ns1.amazon.com",
  "CNAME",
  "NXDOMAIN",
  "Stub Resolver",
  "RD=1",
  "RD=0",
  "AA=1",
  "TTL=300s",
  "TTL",
  "UDP port 53",
  "UDP 53",
  "1.1.1.1",
  "203.0.113.10",
  "192.5.6.30",
  "205.251.192.1",
];

export default function DnsResolutionEpisodePage() {
  const { setScenario } = useNetworkSimulationStore();
  const [selectedPacketOverride, setSelectedPacketOverride] = useState<DnsWirePacket | null>(null);

  useEffect(() => {
    setScenario(SCENARIO_DNS_COLD_CACHE);
  }, [setScenario]);

  return (
    <NetworkEpisodeShell
      episodeNumber={2}
      title="DNS Resolution & Hierarchical Caching — How the Internet Finds IP Addresses"
      scenarios={ALL_DNS_SCENARIOS}
      accentColor="teal"
      customGlossary={DNS_GLOSSARY}
      customTermPatterns={DNS_TERM_PATTERNS}
      canvasSlot={(step) => {
        const dnsStep = step as DnsScenarioStep | null;
        if (!dnsStep?.dnsData) return null;
        return (
          <DnsTopologyCanvas
            dnsData={dnsStep.dnsData}
            onSelectPacket={(pkt) => setSelectedPacketOverride(pkt)}
          />
        );
      }}
      telemetrySlot={(step) => {
        const dnsStep = step as DnsScenarioStep | null;
        if (!dnsStep?.dnsData) return null;
        return (
          <DnsTelemetryPanel
            dnsData={dnsStep.dnsData}
            activePacketOverride={selectedPacketOverride}
          />
        );
      }}
    />
  );
}
