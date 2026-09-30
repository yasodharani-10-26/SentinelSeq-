import { MitigationPlaybook } from '../types';

export const DEFAULT_PLAYBOOKS: MitigationPlaybook[] = [
  {
    id: 'pb-syn-drop',
    title: 'Adaptive SYN Flood & Scan Drop Rule',
    targetVector: 'Ingress TCP SYN Rate Limiting',
    description: 'Proactively throttles incoming half-open SYN packets from the external threat actor IP while maintaining standard TCP handshake thresholds for legitimate clients.',
    type: 'firewall',
    status: 'recommended',
    impactAssessment: 'Blocks further port enumeration with zero disruption to established active sessions.',
    cliSnippet: `# Proactive Defense Rule against Scanning -> Exploitation\niptables -A INPUT -s 172.16.0.1 -p tcp --syn -m limit --limit 20/s --limit-burst 40 -j ACCEPT\niptables -A INPUT -s 172.16.0.1 -p tcp --syn -j DROP\n# Record drop metric for SOC telemetry\niptables -A INPUT -s 172.16.0.1 -j LOG --log-prefix "[SENTINEL_SEQ_DROP]: "`,
  },
  {
    id: 'pb-honeypot-divert',
    title: 'Deceptive Honeypot Redirection (Shadow Decoy)',
    targetVector: 'Sensitive Ports 8080 / 445 / 3389',
    description: 'Diverts incoming probe traffic targeting vulnerable port 8080 into an instrumented Cowrie / Dionaea high-interaction honeypot sandbox to safely capture the impending exploit payload.',
    type: 'honeypot',
    status: 'recommended',
    impactAssessment: 'Isolates production services while logging full exploit payload shellcode for reverse engineering.',
    cliSnippet: `# Reroute probe packets to isolated analysis sandbox at 192.168.99.10\niptables -t nat -A PREROUTING -s 172.16.0.1 -p tcp --dport 8080 -j DNAT --to-destination 192.168.99.10:8080\n# Tag flow in SIEM\nlogger -p security.alert "SENTINEL_SEQ: Diverted attacker 172.16.0.1 to Honeypot Sandbox"`,
  },
  {
    id: 'pb-pcap-freeze',
    title: 'Ring Buffer PCAP Capture & Memory Snapshot',
    targetVector: 'Forensic Evidence Preservation',
    description: 'Triggers automated full-packet capture on interface eth0 around the current sequence window before exploit payload execution to ensure chain-of-custody evidence.',
    type: 'pcap_dump',
    status: 'recommended',
    impactAssessment: 'Passive capture with negligible CPU load (<1.5%). High forensic value.',
    cliSnippet: `tcpdump -i eth0 -w /var/log/sentinel/forensics_$(date +%s).pcap host 172.16.0.1 -G 120 -W 3 -C 50`,
  },
  {
    id: 'pb-subnet-isolation',
    title: 'Micro-segmentation & Host Isolation',
    targetVector: 'Target Subnet 192.168.10.50/32',
    description: 'Applies restrictive east-west ingress firewall ACLs restricting the target host from accepting connections outside of authenticated administrative jump boxes.',
    type: 'quarantine',
    status: 'recommended',
    impactAssessment: 'High containment. Temporarily restricts external access to web server port 8080 until vulnerability is patched.',
    cliSnippet: `# Block lateral traversal from target\niptables -A FORWARD -s 192.168.10.50 -d 192.168.10.0/24 -j DROP\n# Restrict ingress to management jump host only\niptables -A INPUT -p tcp --dport 22 -s 192.168.1.10 -j ACCEPT\niptables -A INPUT -p tcp --dport 22 -j DROP`,
  },
];
