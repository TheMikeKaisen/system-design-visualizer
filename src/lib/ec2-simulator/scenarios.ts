import type { EC2Scenario } from "./types";
import type { ConceptDefinition } from "@/components/network-simulator/InteractiveExplanationBar";

export const EC2_SCENARIOS: EC2Scenario[] = [
  {
    id: "happy_path",
    name: "Standard SSH Handshake (Zero-Knowledge Proof)",
    tag: "Happy Path",
    description:
      "Witness how OpenSSH connects over public IPv4, passes the AWS Security Group, and verifies identity via challenge-response without ever sending the private key across the wire.",
    difficulty: "Beginner",
    steps: [
      {
        id: "hp-step-0",
        stepNumber: 1,
        title: "Client Initiates Connection",
        explanation:
          "Your local computer initiates an SSH connection to EC2's globally routable public ipv4 address on TCP port 22. Your local client loads your secret .pem file into memory.",
        conceptBadge: "Address & Origin",
        callout: {
          type: "info",
          title: "Public vs Private IPv4",
          content:
            "Your laptop uses the Public IP (13.234.45.10) to traverse the public internet. The Private IP (172.31.20.45) is only visible inside AWS.",
        },
        activeLayer: "client",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "client",
          securityGroupPort22: "open",
          status: "idle",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-hp-0-1",
            type: "cmd",
            text: "ssh -i my-ec2-key.pem -v ubuntu@13.234.45.10",
          },
          {
            id: "tl-hp-0-2",
            type: "debug",
            text: "OpenSSH_9.6p1, LibreSSL 3.3.6",
          },
          {
            id: "tl-hp-0-3",
            type: "debug",
            text: "Connecting to 13.234.45.10 [13.234.45.10] port 22.",
          },
        ],
      },
      {
        id: "hp-step-1",
        stepNumber: 2,
        title: "Internet Gateway & VPC Boundary",
        explanation:
          "The TCP SYN packet traverses internet routers and hits the AWS internet gateway. The IGW performs 1:1 NAT translation from the public ipv4 to the instance's private ipv4.",
        conceptBadge: "AWS Network Edge",
        callout: {
          type: "info",
          title: "Internet Gateway (IGW)",
          content:
            "The IGW acts as the bridge between the global internet and your VPC. Without an attached IGW and a 0.0.0.0/0 route, public traffic cannot enter the VPC.",
        },
        activeLayer: "gateway",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "igw",
          securityGroupPort22: "open",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-hp-1-1",
            type: "debug",
            text: "debug1: Connection established.",
          },
          {
            id: "tl-hp-1-2",
            type: "debug",
            text: "debug1: identity file my-ec2-key.pem type -1",
          },
          {
            id: "tl-hp-1-3",
            type: "debug",
            text: "debug1: Local version string SSH-2.0-OpenSSH_9.6",
          },
          {
            id: "tl-hp-1-4",
            type: "debug",
            text: "debug1: Remote protocol version 2.0, remote software version OpenSSH_8.9p1 Ubuntu",
          },
        ],
      },
      {
        id: "hp-step-2",
        stepNumber: 3,
        title: "Security Group Inspection",
        explanation:
          "Before the packet touches the Linux OS, AWS hypervisor filters traffic at the Elastic Network Interface (ENI). The security group checks: Inbound TCP 22? Allowed. Traffic passes through.",
        conceptBadge: "Stateful Firewall",
        callout: {
          type: "success",
          title: "Stateful Filtering",
          content:
            "Security Groups are stateful. When inbound traffic is permitted on Port 22, the response outbound traffic is automatically permitted regardless of outbound rules.",
        },
        activeLayer: "security_group",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "sg",
          securityGroupPort22: "open",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-hp-2-1",
            type: "debug",
            text: "debug1: kex: algorithm: curve25519-sha256",
          },
          {
            id: "tl-hp-2-2",
            type: "debug",
            text: "debug1: Host '13.234.45.10' is known and matches the ECDSA host key.",
          },
          {
            id: "tl-hp-2-3",
            type: "debug",
            text: "debug1: SSH2_MSG_KEXINIT sent and received.",
          },
        ],
      },
      {
        id: "hp-step-3",
        stepNumber: 4,
        title: "The Lock & Vault: Key Verification",
        explanation:
          "The client announces which public key it wishes to use. EC2 checks authorized_keys (injected at instance launch by cloud-init). It finds a matching entry!",
        conceptBadge: "Asymmetric Identity",
        callout: {
          type: "info",
          title: "Where are the keys?",
          content:
            "Public Key = Shareable Padlock on EC2 (`authorized_keys`). Private Key = Secret Brass Key inside your local `.pem` file. AWS never stores your downloaded `.pem`.",
        },
        activeLayer: "crypto",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "eni",
          securityGroupPort22: "open",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "negotiating",
        },
        terminalLines: [
          {
            id: "tl-hp-3-1",
            type: "debug",
            text: "debug1: Authentications that can continue: publickey",
          },
          {
            id: "tl-hp-3-2",
            type: "debug",
            text: "debug1: Offering public key: my-ec2-key.pem RSA SHA256:4aBc89D...91kP",
          },
          {
            id: "tl-hp-3-3",
            type: "debug",
            text: "debug1: Server accepts key. Beginning challenge-response proof.",
          },
        ],
      },
      {
        id: "hp-step-4",
        stepNumber: 5,
        title: "The Challenge-Response Handshake",
        explanation:
          "EC2 generates a random challenge-response nonce and transmits it. Your laptop signs the nonce using your private key. Only the resulting digital signature is returned. The secret key never leaves your laptop!",
        conceptBadge: "Zero-Knowledge Proof",
        callout: {
          type: "warning",
          title: "The Secret Never Moves",
          content:
            "Notice the critical guarantee: your private key never crosses the wire. Even if an attacker taps the cable, they only see the random challenge and the one-time signature.",
        },
        activeLayer: "handshake",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "eni",
          securityGroupPort22: "open",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: "0x7F4A9B2C81",
          signedDigest: "SIG_RSA_4aBc...91kP",
          signatureVerified: true,
          sessionCipher: "negotiating",
        },
        terminalLines: [
          {
            id: "tl-hp-4-1",
            type: "debug",
            text: "debug1: Server issued challenge nonce: 0x7F4A9B2C81",
          },
          {
            id: "tl-hp-4-2",
            type: "debug",
            text: "debug1: Signing challenge with private key in my-ec2-key.pem...",
          },
          {
            id: "tl-hp-4-3",
            type: "debug",
            text: "debug1: Signature verified against authorized_keys by sshd daemon.",
          },
          {
            id: "tl-hp-4-4",
            type: "debug",
            text: "debug1: Authentication succeeded (publickey).",
          },
        ],
      },
      {
        id: "hp-step-5",
        stepNumber: 6,
        title: "Symmetric Tunnel & Linux Shell",
        explanation:
          "Asymmetric authentication is complete. SSH switches to ultra-fast symmetric encryption (AES-256-GCM) for the interactive terminal session. You are logged into Ubuntu!",
        conceptBadge: "Interactive Shell",
        callout: {
          type: "success",
          title: "The Crypto Switch",
          content:
            "RSA / Asymmetric crypto is only used to establish identity. High-frequency typing and data streaming use hardware-accelerated symmetric ciphers.",
        },
        activeLayer: "tunnel",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "connected",
          securityGroupPort22: "open",
          status: "connected",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: "0x7F4A9B2C81",
          signedDigest: "SIG_RSA_4aBc...91kP",
          signatureVerified: true,
          sessionCipher: "aes-256-gcm",
        },
        terminalLines: [
          {
            id: "tl-hp-5-1",
            type: "stdout",
            text: "Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1017-aws x86_64)",
          },
          {
            id: "tl-hp-5-2",
            type: "stdout",
            text: " * Documentation:  https://help.ubuntu.com",
          },
          {
            id: "tl-hp-5-3",
            type: "stdout",
            text: "Last login: Wed Nov 18 20:41:09 2026 from 49.36.120.10",
          },
          {
            id: "tl-hp-5-4",
            type: "prompt",
            text: "ubuntu@ip-172-31-20-45:~$ _",
          },
        ],
      },
    ],
  },
  {
    id: "sg_blocked",
    name: "SSH Hang / Timeout (Port 22 Blocked in Security Group)",
    tag: "Firewall Drop",
    description:
      "The classic AWS engineer nightmare: You have the right IP and the right key, but SSH hangs indefinitely. Watch the security group silently drop the packet at the ENI.",
    difficulty: "Intermediate",
    steps: [
      {
        id: "sg-step-0",
        stepNumber: 1,
        title: "Client Initiates Connection",
        explanation:
          "Your client sends a TCP SYN packet toward 13.234.45.10 on port 22, expecting an immediate SYN-ACK acknowledgement.",
        conceptBadge: "Connection Request",
        activeLayer: "client",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "client",
          securityGroupPort22: "closed",
          status: "idle",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-sg-0-1",
            type: "cmd",
            text: "ssh -i my-ec2-key.pem ubuntu@13.234.45.10",
          },
          {
            id: "tl-sg-0-2",
            type: "debug",
            text: "Connecting to 13.234.45.10 [13.234.45.10] port 22...",
          },
        ],
      },
      {
        id: "sg-step-1",
        stepNumber: 2,
        title: "Packet Enters Internet Gateway",
        explanation:
          "The packet reaches AWS through the internet gateway without issue. Public routing is working normally.",
        conceptBadge: "VPC Perimeter",
        activeLayer: "gateway",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "igw",
          securityGroupPort22: "closed",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-sg-1-1",
            type: "debug",
            text: "Packet routed to VPC ENI (eni-0a49bc12891)...",
          },
        ],
      },
      {
        id: "sg-step-2",
        stepNumber: 3,
        title: "Silent Drop at the Security Group",
        explanation:
          "The instance's security group has no inbound rule for TCP 22. AWS silently discards the packet. No TCP RST is returned, leaving your client waiting.",
        conceptBadge: "Silent Firewall Drop",
        callout: {
          type: "danger",
          title: "Why does SSH hang?",
          content:
            "A firewall that sends 'Connection Refused' rejects the packet actively. A Security Group silently discards it, forcing the client to wait for a network timeout.",
        },
        activeLayer: "security_group",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "dropped",
          securityGroupPort22: "closed",
          status: "blocked",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-sg-2-1",
            type: "debug",
            text: "TCP SYN sent; waiting for SYN-ACK...",
          },
          {
            id: "tl-sg-2-2",
            type: "debug",
            text: "TCP SYN retransmission (attempt 1/3)...",
          },
          {
            id: "tl-sg-2-3",
            type: "debug",
            text: "TCP SYN retransmission (attempt 2/3)...",
          },
        ],
      },
      {
        id: "sg-step-3",
        stepNumber: 4,
        title: "Connection Timed Out",
        explanation:
          "After retransmitting SYN packets with no response from the dropped port, the client gives up and aborts with 'Connection timed out'.",
        conceptBadge: "Client Abort",
        callout: {
          type: "info",
          title: "The Fix",
          content:
            "Open AWS Console -> EC2 -> Security Groups -> Edit Inbound Rules -> Add 'SSH (Port 22)' from your IP (or 0.0.0.0/0).",
        },
        activeLayer: "client",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "dropped",
          securityGroupPort22: "closed",
          status: "blocked",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-sg-3-1",
            type: "stderr",
            text: "ssh: connect to host 13.234.45.10 port 22: Connection timed out",
          },
        ],
      },
    ],
  },
  {
    id: "mismatched_key",
    name: "Permission Denied (Mismatched or Missing .pem Key)",
    tag: "Authentication Failure",
    description:
      "The network and security group allow traffic, but the client presents an unknown key. Observe why possessing an EC2 IP address grants zero access without the matching private key.",
    difficulty: "Intermediate",
    steps: [
      {
        id: "mk-step-0",
        stepNumber: 1,
        title: "Connection Request with Untrusted Key",
        explanation:
          "The client connects to EC2, but uses a private key whose matching public key is NOT registered in EC2's authorized_keys.",
        conceptBadge: "Untrusted Key",
        activeLayer: "client",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "client",
          securityGroupPort22: "open",
          status: "idle",
        },
        crypto: {
          clientKeyName: "untrusted-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:99xYz...0000",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-mk-0-1",
            type: "cmd",
            text: "ssh -i untrusted-key.pem -v ubuntu@13.234.45.10",
          },
          {
            id: "tl-mk-0-2",
            type: "debug",
            text: "Connecting to 13.234.45.10 [13.234.45.10] port 22.",
          },
        ],
      },
      {
        id: "mk-step-1",
        stepNumber: 2,
        title: "Network & Handshake Initiation",
        explanation:
          "The network path is healthy. The security group allows port 22, and SSH protocol negotiation begins normally.",
        conceptBadge: "Protocol Handshake",
        activeLayer: "instance",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "eni",
          securityGroupPort22: "open",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "untrusted-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:99xYz...0000",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "negotiating",
        },
        terminalLines: [
          {
            id: "tl-mk-1-1",
            type: "debug",
            text: "debug1: Connection established.",
          },
          {
            id: "tl-mk-1-2",
            type: "debug",
            text: "debug1: Authentications that can continue: publickey",
          },
        ],
      },
      {
        id: "mk-step-2",
        stepNumber: 3,
        title: "Key Lookup in authorized_keys Fails",
        explanation:
          "Client offers public key SHA256:99xYz... EC2 scans authorized_keys. Only SHA256:4aBc89D... is permitted. Server refuses to issue challenge.",
        conceptBadge: "Zero Match",
        callout: {
          type: "danger",
          title: "Public Key Rejection",
          content:
            "Because the server doesn't recognize this public key, it immediately declines the key without even bothering to verify signatures.",
        },
        activeLayer: "crypto",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "eni",
          securityGroupPort22: "open",
          status: "in_transit",
        },
        crypto: {
          clientKeyName: "untrusted-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:99xYz...0000",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: false,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-mk-2-1",
            type: "debug",
            text: "debug1: Offering public key: untrusted-key.pem RSA SHA256:99xYz...0000",
          },
          {
            id: "tl-mk-2-2",
            type: "debug",
            text: "debug1: Server rejects key (not in authorized_keys).",
          },
        ],
      },
      {
        id: "mk-step-3",
        stepNumber: 4,
        title: "Permission Denied (publickey)",
        explanation:
          "Having exhausted all offered keys with zero matches, the SSH daemon severs the connection.",
        conceptBadge: "Access Denied",
        callout: {
          type: "info",
          title: "Why Passwords Aren't Used",
          content:
            "Default AWS Linux AMIs disable password authentication in `/etc/ssh/sshd_config` (`PasswordAuthentication no`) to eliminate brute force dictionary attacks.",
        },
        activeLayer: "client",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "dropped",
          securityGroupPort22: "open",
          status: "blocked",
        },
        crypto: {
          clientKeyName: "untrusted-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:99xYz...0000",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: false,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-mk-3-1",
            type: "stderr",
            text: "ubuntu@13.234.45.10: Permission denied (publickey).",
          },
        ],
      },
    ],
  },
  {
    id: "ip_reboot",
    name: "Instance Reboot & IP Volatility (Public vs Elastic IP)",
    tag: "IP Lifecycle",
    description:
      "Understand why auto-assigned AWS public ipv4 addresses are ephemeral. Stopping an instance releases the public IP back to AWS, while the private ipv4 stays fixed.",
    difficulty: "Intermediate",
    steps: [
      {
        id: "ip-step-0",
        stepNumber: 1,
        title: "Instance Running Normally",
        explanation:
          "The EC2 instance has an auto-assigned public ipv4 (13.234.45.10) and a private ipv4 (172.31.20.45). You can SSH into it successfully.",
        conceptBadge: "Active State",
        activeLayer: "network",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "13.234.45.10",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "connected",
          securityGroupPort22: "open",
          status: "connected",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: true,
          sessionCipher: "aes-256-gcm",
        },
        terminalLines: [
          {
            id: "tl-ip-0-1",
            type: "cmd",
            text: "curl ifconfig.me",
          },
          {
            id: "tl-ip-0-2",
            type: "stdout",
            text: "13.234.45.10",
          },
          {
            id: "tl-ip-0-3",
            type: "prompt",
            text: "ubuntu@ip-172-31-20-45:~$ _",
          },
        ],
      },
      {
        id: "ip-step-1",
        stepNumber: 2,
        title: "Instance Stopped (IP Released)",
        explanation:
          "You stop the instance. AWS releases 13.234.45.10 back to its regional pool so other customers can use it. The instance now has NO public IP address!",
        conceptBadge: "Pool Return",
        callout: {
          type: "warning",
          title: "Public IP is Ephemeral",
          content:
            "Standard public IPs are borrowed. When an instance is stopped, AWS frees the address. However, the Private IP (172.31.20.45) stays reserved on your ENI.",
        },
        activeLayer: "instance",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "None (Released)",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "dropped",
          securityGroupPort22: "open",
          status: "blocked",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-ip-1-1",
            type: "debug",
            text: "AWS EC2: StopInstances API call issued.",
          },
          {
            id: "tl-ip-1-2",
            type: "debug",
            text: "Instance state: stopping -> stopped.",
          },
          {
            id: "tl-ip-1-3",
            type: "debug",
            text: "Public IPv4 address disassociated and returned to pool.",
          },
        ],
      },
      {
        id: "ip-step-2",
        stepNumber: 3,
        title: "Instance Started (Brand New Public IP)",
        explanation:
          "You start the instance again. AWS pulls a fresh, different public ipv4 (52.66.12.88) from the regional pool. The private ipv4 remains 172.31.20.45.",
        conceptBadge: "IP Shift",
        callout: {
          type: "danger",
          title: "MobaXterm / Bookmarks Break!",
          content:
            "If you try to SSH to the old IP (13.234.45.10), it will fail or connect to another stranger's machine! You must update your SSH command to 52.66.12.88.",
        },
        activeLayer: "network",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "52.66.12.88",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: false,
          packetStage: "client",
          securityGroupPort22: "open",
          status: "idle",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: null,
          sessionCipher: "none",
        },
        terminalLines: [
          {
            id: "tl-ip-2-1",
            type: "debug",
            text: "AWS EC2: StartInstances API call issued.",
          },
          {
            id: "tl-ip-2-2",
            type: "debug",
            text: "New Public IPv4 assigned: 52.66.12.88",
          },
          {
            id: "tl-ip-2-3",
            type: "debug",
            text: "Private IPv4 retained: 172.31.20.45",
          },
        ],
      },
      {
        id: "ip-step-3",
        stepNumber: 4,
        title: "The Solution: Elastic IP (EIP)",
        explanation:
          "To keep a static public ipv4 that survives stop/start cycles, allocate an AWS elastic ip. It remains permanently tied to your AWS account until released.",
        conceptBadge: "Static Elastic IP",
        callout: {
          type: "success",
          title: "Elastic IP Stability",
          content:
            "Elastic IPs give you a persistent public IP address. Perfect for DNS A-records or whitelisted developer access.",
        },
        activeLayer: "gateway",
        network: {
          clientIp: "49.36.120.10",
          targetPublicIp: "3.109.80.200 (Elastic IP)",
          targetPrivateIp: "172.31.20.45",
          isElasticIp: true,
          packetStage: "connected",
          securityGroupPort22: "open",
          status: "connected",
        },
        crypto: {
          clientKeyName: "my-ec2-key.pem",
          clientHasKey: true,
          clientKeyFingerprint: "SHA256:4aBc89D...91kP",
          ec2AuthorizedKeys: ["ssh-rsa AAAAB3NzaC1yc2E... SHA256:4aBc89D...91kP"],
          nonceChallenge: null,
          signedDigest: null,
          signatureVerified: true,
          sessionCipher: "aes-256-gcm",
        },
        terminalLines: [
          {
            id: "tl-ip-3-1",
            type: "cmd",
            text: "ssh -i my-ec2-key.pem ubuntu@3.109.80.200",
          },
          {
            id: "tl-ip-3-2",
            type: "stdout",
            text: "Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1017-aws x86_64)",
          },
          {
            id: "tl-ip-3-3",
            type: "prompt",
            text: "ubuntu@ip-172-31-20-45:~$ _",
          },
        ],
      },
    ],
  },
];

export const AWS_EC2_GLOSSARY: Record<string, ConceptDefinition> = {
  "public ipv4": {
    term: "Public IPv4",
    category: "Cloud Networking",
    title: "Public IPv4 Address",
    explanation:
      "A globally routable address accessible over the public internet via the Internet Gateway. Auto-assigned public IPs change across stop/start cycles unless using an Elastic IP.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "curl ifconfig.me",
      purpose: "Check current public IP address",
    },
  },
  "private ipv4": {
    term: "Private IPv4",
    category: "VPC Networking",
    title: "Private IPv4 Address",
    explanation:
      "An RFC 1918 internal IP address (e.g. 172.31.x.x) used solely for internal VPC communication. It persists across instance reboots and stop/start cycles.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "ip a show eth0",
      purpose: "Inspect local private IP assigned to network interface",
    },
  },
  "elastic ip": {
    term: "Elastic IP (EIP)",
    category: "AWS Cloud Infrastructure",
    title: "AWS Elastic IP Address",
    explanation:
      "A static, persistent public IPv4 address allocated to your AWS account that remains attached across stop/start cycles.",
    commandExample: {
      platform: "Universal",
      command: "aws ec2 allocate-address --domain vpc",
      purpose: "Allocate a new Elastic IP via AWS CLI",
    },
  },
  "internet gateway": {
    term: "Internet Gateway (IGW)",
    category: "VPC Perimeter",
    title: "AWS Internet Gateway",
    explanation:
      "A horizontally scaled, redundant VPC component that enables communication between instances in your VPC and the internet via 1:1 NAT translation.",
  },
  "security group": {
    term: "Security Group",
    category: "Stateful Firewall",
    title: "AWS Security Group",
    explanation:
      "A virtual stateful firewall that controls inbound and outbound traffic at the Elastic Network Interface (ENI) level before packets reach the OS.",
  },
  ".pem file": {
    term: ".pem File",
    category: "Asymmetric Cryptography",
    title: "Privacy-Enhanced Mail Container",
    explanation:
      "A Base64 text container with ASCII headers storing cryptographic keys (such as an RSA or Ed25519 private key). Never share this file.",
  },
  "authorized_keys": {
    term: "authorized_keys",
    category: "Linux SSH Daemon",
    title: "authorized_keys File",
    explanation:
      "A file located in ~/.ssh/authorized_keys storing public keys allowed to log into this user account. AWS cloud-init writes your public key here at launch.",
    commandExample: {
      platform: "Linux / POSIX",
      command: "cat ~/.ssh/authorized_keys",
      purpose: "View authorized public keys on EC2 instance",
    },
  },
  "challenge-response": {
    term: "Challenge-Response",
    category: "Zero-Knowledge Authentication",
    title: "Challenge-Response Protocol",
    explanation:
      "An authentication exchange where the server issues a random challenge (nonce), the client signs it with their private key, and the server verifies it with the public key. The private key is never sent.",
  },
  "asymmetric cryptography": {
    term: "Asymmetric Cryptography",
    category: "Public-Key Cryptography",
    title: "Asymmetric Key Pairs",
    explanation:
      "A cryptographic system using mathematically paired keys: a public key that can be shared openly to verify signatures, and a private key that remains secret to generate signatures.",
  },
  "symmetric encryption": {
    term: "Symmetric Encryption",
    category: "Session Ciphers",
    title: "Symmetric Cipher (AES-256)",
    explanation:
      "Encryption algorithms where both parties use a shared ephemeral session key. It is orders of magnitude faster than asymmetric cryptography and encrypts terminal keystrokes.",
  },
};

export const EC2_TERM_PATTERNS = Object.keys(AWS_EC2_GLOSSARY);
