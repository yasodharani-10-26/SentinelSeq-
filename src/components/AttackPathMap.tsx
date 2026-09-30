import React, { useState, useMemo } from 'react';
import {
  Network,
  Shield,
  AlertTriangle,
  Server,
  Database,
  Radio,
  Lock,
  Eye,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  Maximize2,
} from 'lucide-react';
import { AttackStage, ForecastPrediction, MitigationPlaybook, SequenceStep } from '../types';
import { STAGE_CONFIG } from '../services/temporalModel';

interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  role: 'attacker' | 'perimeter' | 'dmz' | 'target' | 'internal' | 'database' | 'honeypot';
  x: number;
  y: number;
  ports: number[];
  os: string;
  zone: 'External' | 'Perimeter' | 'DMZ' | 'Internal Core' | 'Decoy Sandbox';
  baseRisk: number; // 0 - 100
}

interface NetworkLink {
  source: string;
  target: string;
  label: string;
  ports: string;
  protocol: string;
}

interface AttackPathMapProps {
  forecast: ForecastPrediction;
  history: SequenceStep[];
  targetHost: string;
  attackerIp: string;
  datasetSource: string;
  playbooks?: MitigationPlaybook[];
  onApplyMitigation?: (title: string) => void;
}

export const AttackPathMap: React.FC<AttackPathMapProps> = ({
  forecast,
  history,
  targetHost,
  attackerIp,
  datasetSource,
  playbooks = [],
  onApplyMitigation,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-target-web');
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState<boolean>(false);
  const [showHoneypot, setShowHoneypot] = useState<boolean>(true);

  // Check if any proactive mitigation rules are actively applied
  const appliedPlaybooks = playbooks.filter((pb) => pb.status === 'applied');
  const isTargetProtected = appliedPlaybooks.length > 0;

  // Define structured network nodes
  const nodes: NetworkNode[] = useMemo(() => {
    return [
      {
        id: 'node-attacker',
        label: 'Adversary Ingress',
        ip: attackerIp || '172.16.0.1',
        role: 'attacker',
        x: 80,
        y: 220,
        ports: [49152, 49153, 49154],
        os: 'Kali Linux / Automated Scanner',
        zone: 'External',
        baseRisk: 95,
      },
      {
        id: 'node-perimeter',
        label: 'Perimeter Gateway / FW',
        ip: '192.168.10.1',
        role: 'perimeter',
        x: 230,
        y: 220,
        ports: [80, 443],
        os: 'PFSense / Suricata IDS',
        zone: 'Perimeter',
        baseRisk: 42,
      },
      {
        id: 'node-target-web',
        label: 'Target Web Application',
        ip: targetHost.split(' ')[0] || '192.168.10.50',
        role: 'target',
        x: 430,
        y: 130,
        ports: [80, 443, 8080],
        os: 'Ubuntu 20.04 (Apache / OpenSSL)',
        zone: 'DMZ',
        baseRisk: 88,
      },
      {
        id: 'node-honeypot',
        label: 'Honeypot Decoy (Shadow)',
        ip: '192.168.99.10',
        role: 'honeypot',
        x: 430,
        y: 330,
        ports: [8080, 22, 445],
        os: 'Cowrie / Dionaea Sandbox',
        zone: 'Decoy Sandbox',
        baseRisk: 15,
      },
      {
        id: 'node-auth-ad',
        label: 'Internal Kerberos / AD',
        ip: '192.168.10.14',
        role: 'internal',
        x: 650,
        y: 110,
        ports: [88, 389, 445],
        os: 'Windows Server 2022',
        zone: 'Internal Core',
        baseRisk: 65,
      },
      {
        id: 'node-db-vault',
        label: 'Enterprise DB Vault',
        ip: '192.168.10.60',
        role: 'database',
        x: 650,
        y: 270,
        ports: [3306, 5432],
        os: 'Debian (PostgreSQL / Financial DB)',
        zone: 'Internal Core',
        baseRisk: 72,
      },
      {
        id: 'node-devops-worker',
        label: 'CI/CD Worker Node',
        ip: '10.0.8.100',
        role: 'internal',
        x: 820,
        y: 190,
        ports: [8080, 9000],
        os: 'Ubuntu (Docker / Jenkins)',
        zone: 'Internal Core',
        baseRisk: 30,
      },
    ];
  }, [attackerIp, targetHost]);

  // Topology Links
  const links: NetworkLink[] = useMemo(() => {
    return [
      {
        source: 'node-attacker',
        target: 'node-perimeter',
        label: 'Reconnaissance Probe Stream',
        ports: 'SYN Sweep',
        protocol: 'TCP',
      },
      {
        source: 'node-perimeter',
        target: 'node-target-web',
        label: 'Ingress Port Scanning & Exploit Vector',
        ports: 'Ports 80, 443, 8080',
        protocol: 'TCP / HTTP',
      },
      {
        source: 'node-perimeter',
        target: 'node-honeypot',
        label: 'Deceptive Traffic Reroute',
        ports: 'Port 8080 (Decoy)',
        protocol: 'TCP / DNAT',
      },
      {
        source: 'node-target-web',
        target: 'node-auth-ad',
        label: 'Projected Lateral Movement',
        ports: 'Port 445 (SMB/RPC)',
        protocol: 'TCP / Kerberos',
      },
      {
        source: 'node-target-web',
        target: 'node-db-vault',
        label: 'Projected Data Exfiltration Vector',
        ports: 'Port 5432 (SQL)',
        protocol: 'TCP / TLS',
      },
      {
        source: 'node-auth-ad',
        target: 'node-devops-worker',
        label: 'Domain Admin Propagation',
        ports: 'Port 5985 (WinRM)',
        protocol: 'TCP / RPC',
      },
    ];
  }, []);

  // Compute dynamic risk scores based on forecast stage & confidence
  const dynamicNodeRisks = useMemo(() => {
    const riskMap: Record<
      string,
      {
        score: number;
        level: 'low' | 'medium' | 'high' | 'critical';
        threatStatus: string;
      }
    > = {};

    const currentStage = forecast.currentBehavior;
    const predictedStage = forecast.predictedNextStage;
    const conf = forecast.confidence;

    nodes.forEach((node) => {
      let score = node.baseRisk;

      if (node.role === 'attacker') {
        score = 98;
      } else if (node.role === 'target') {
        if (isTargetProtected) {
          score = 22; // Proactive mitigation active!
        } else if (['Scanning', 'Exploitation'].includes(currentStage) || predictedStage === 'Exploitation') {
          score = Math.min(99, Math.round(75 + (conf / 100) * 22));
        } else if (currentStage === 'Reconnaissance') {
          score = 64;
        } else if (currentStage === 'Normal') {
          score = 18;
        }
      } else if (node.role === 'perimeter') {
        score = isTargetProtected ? 32 : currentStage === 'Scanning' ? 76 : 38;
      } else if (node.role === 'internal' || node.role === 'database') {
        if (['Privilege_Escalation', 'Lateral_Movement'].includes(predictedStage)) {
          score = Math.min(95, Math.round(55 + (conf / 100) * 35));
        } else if (currentStage === 'Scanning') {
          score = 48; // Target is projected next, internal is still pre-attack
        } else {
          score = 22;
        }
      } else if (node.role === 'honeypot') {
        score = 12; // Controlled decoy
      }

      let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (score >= 80) level = 'critical';
      else if (score >= 60) level = 'high';
      else if (score >= 35) level = 'medium';

      let threatStatus = 'Baseline Monitored';
      if (node.role === 'attacker') threatStatus = 'Active Ingress Threat';
      else if (node.role === 'target' && ['Scanning', 'Exploitation'].includes(currentStage))
        threatStatus = 'Imminent Exploit Target';
      else if (['internal', 'database'].includes(node.role) && predictedStage === 'Lateral_Movement')
        threatStatus = 'Projected Lateral Target';
      else if (node.role === 'honeypot') threatStatus = 'Shadow Decoy Active';

      riskMap[node.id] = { score, level, threatStatus };
    });

    return riskMap;
  }, [nodes, forecast]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[2];
  const selectedNodeRisk = dynamicNodeRisks[selectedNode.id] || {
    score: 85,
    level: 'critical',
    threatStatus: 'Target Web Application',
  };

  // Helper to determine link threat status
  const getLinkStatus = (link: NetworkLink) => {
    const isAttackerToPerimeter =
      link.source === 'node-attacker' && link.target === 'node-perimeter';
    const isPerimeterToTarget =
      link.source === 'node-perimeter' && link.target === 'node-target-web';
    const isTargetToInternal =
      link.source === 'node-target-web' &&
      ['node-auth-ad', 'node-db-vault'].includes(link.target);
    const isPerimeterToHoneypot =
      link.source === 'node-perimeter' && link.target === 'node-honeypot';

    if (isPerimeterToTarget && isTargetProtected) {
      return {
        isActivePath: false,
        isForecastPath: false,
        strokeColor: '#10b981', // Green mitigated barrier
        glow: false,
      };
    }

    if (isAttackerToPerimeter || isPerimeterToTarget) {
      return {
        isActivePath: true,
        isForecastPath: false,
        strokeColor: '#ef4444', // Red active attack flow
        glow: true,
      };
    }

    if (isTargetToInternal) {
      return {
        isActivePath: false,
        isForecastPath: true,
        strokeColor: '#f59e0b', // Amber forecasted path
        glow: false,
      };
    }

    if (isPerimeterToHoneypot) {
      return {
        isActivePath: false,
        isForecastPath: false,
        strokeColor: '#06b6d4', // Cyan deceptive diversion
        glow: false,
      };
    }

    return {
      isActivePath: false,
      isForecastPath: false,
      strokeColor: '#334155', // Slate standard edge
      glow: false,
    };
  };

  const visibleNodes = showHoneypot ? nodes : nodes.filter((n) => n.role !== 'honeypot');

  return (
    <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              AttackPathMap™ — Predictive Network Trajectory Graph
            </h3>
            <p className="text-xs text-slate-400">
              Interactive topological vector graph plotting active compromise paths and forecasted lateral vectors
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowHoneypot(!showHoneypot)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
              showHoneypot
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showHoneypot ? '✓ Honeypot Decoys Visible' : '+ Show Honeypots'}
          </button>

          <button
            onClick={() => setHighlightCriticalOnly(!highlightCriticalOnly)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
              highlightCriticalOnly
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {highlightCriticalOnly ? 'Critical Path Filter: ON' : 'Filter: All Nodes'}
          </button>
        </div>
      </div>

      {/* Main Graph Area & Node Inspector Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SVG Network Canvas */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 relative overflow-hidden shadow-inner flex flex-col justify-between min-h-[380px]">
          {/* Legend Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-[11px] font-mono border-b border-slate-800/60 mb-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                Active Attack Path
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-0.5 bg-amber-400 border-dashed" />
                Forecasted Progression ({forecast.confidence}%)
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Deceptive Honeypot
              </span>
            </div>

            <span className="text-slate-400">Click any host node to inspect threat telemetry</span>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto flex justify-center items-center py-2">
            <svg
              viewBox="0 0 920 440"
              className="w-full max-w-[920px] h-auto select-none"
              style={{ minHeight: '340px' }}
            >
              <defs>
                {/* Arrowhead marker for active attack path */}
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>

                {/* Arrowhead marker for forecasted path */}
                <marker
                  id="arrow-forecast"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>

                {/* Arrowhead marker for honeypot route */}
                <marker
                  id="arrow-honeypot"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                </marker>

                {/* Radial Glow Gradient */}
                <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Subnet Boundary Zones (Background Panels) */}
              <g className="zones opacity-40">
                {/* External Zone */}
                <rect
                  x="20"
                  y="40"
                  width="130"
                  height="360"
                  rx="16"
                  fill="#1e1b4b"
                  stroke="#4338ca"
                  strokeDasharray="4 4"
                />
                <text x="35" y="65" fill="#818cf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  ZONE: WAN / UNTRUSTED
                </text>

                {/* DMZ Zone */}
                <rect
                  x="180"
                  y="40"
                  width="360"
                  height="360"
                  rx="16"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeDasharray="4 4"
                />
                <text x="200" y="65" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  ZONE: PERIMETER & DMZ (192.168.10.0/24)
                </text>

                {/* Internal Secure Core Zone */}
                <rect
                  x="570"
                  y="40"
                  width="330"
                  height="360"
                  rx="16"
                  fill="#030712"
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text x="590" y="65" fill="#64748b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  ZONE: INTERNAL TIER-1 SECURE CORE
                </text>
              </g>

              {/* Network Links / Trajectory Paths */}
              <g className="links">
                {links.map((link) => {
                  const sourceNode = nodes.find((n) => n.id === link.source);
                  const targetNode = nodes.find((n) => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;
                  if (!showHoneypot && (link.source === 'node-honeypot' || link.target === 'node-honeypot'))
                    return null;

                  const status = getLinkStatus(link);

                  if (
                    highlightCriticalOnly &&
                    !status.isActivePath &&
                    !status.isForecastPath
                  ) {
                    return null;
                  }

                  // Compute curved Bezier line
                  const dx = targetNode.x - sourceNode.x;
                  const dy = targetNode.y - sourceNode.y;
                  const cx1 = sourceNode.x + dx * 0.45;
                  const cy1 = sourceNode.y;
                  const cx2 = sourceNode.x + dx * 0.55;
                  const cy2 = targetNode.y;
                  const pathData = `M ${sourceNode.x} ${sourceNode.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetNode.x} ${targetNode.y}`;

                  const markerId = status.isActivePath
                    ? 'url(#arrow-active)'
                    : status.isForecastPath
                    ? 'url(#arrow-forecast)'
                    : link.target === 'node-honeypot'
                    ? 'url(#arrow-honeypot)'
                    : '';

                  return (
                    <g key={`${link.source}-${link.target}`} className="group">
                      {/* Glow path underlay for active attack vectors */}
                      {status.isActivePath && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="8"
                          strokeOpacity="0.25"
                          className="animate-pulse"
                        />
                      )}

                      {/* Main connecting path */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={status.strokeColor}
                        strokeWidth={status.isActivePath ? 3 : status.isForecastPath ? 2.5 : 1.5}
                        strokeDasharray={
                          status.isForecastPath
                            ? '6 4'
                            : status.isActivePath
                            ? '8 4'
                            : 'none'
                        }
                        markerEnd={markerId}
                        className={status.isActivePath ? 'animate-[dash_1s_linear_infinite]' : ''}
                      />

                      {/* Link Ports Tooltip label along curve */}
                      <text
                        x={(sourceNode.x + targetNode.x) / 2}
                        y={(sourceNode.y + targetNode.y) / 2 - 8}
                        fill={
                          status.isActivePath
                            ? '#fca5a5'
                            : status.isForecastPath
                            ? '#fde68a'
                            : '#64748b'
                        }
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        {link.ports}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Network Node Glyphs */}
              <g className="nodes">
                {visibleNodes.map((node) => {
                  const riskInfo = dynamicNodeRisks[node.id] || {
                    score: 50,
                    level: 'medium',
                    threatStatus: 'Normal',
                  };
                  const isSelected = selectedNodeId === node.id;
                  const isTarget = node.role === 'target';
                  const isAttacker = node.role === 'attacker';
                  const isHoneypot = node.role === 'honeypot';

                  // Color scheme based on risk & role
                  let strokeColor = '#3b82f6';
                  let fillColor = '#0f172a';
                  if (isAttacker) strokeColor = '#ec4899';
                  else if (isHoneypot) strokeColor = '#06b6d4';
                  else if (riskInfo.score >= 80) strokeColor = '#ef4444';
                  else if (riskInfo.score >= 60) strokeColor = '#f59e0b';
                  else strokeColor = '#10b981';

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Outer pulsing ring for high-risk target */}
                      {(isTarget || riskInfo.score >= 80) && (
                        <circle
                          r="32"
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="1.5"
                          className="opacity-40 animate-ping pointer-events-none"
                        />
                      )}

                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          r="28"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-spin pointer-events-none"
                          style={{ animationDuration: '8s' }}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r="22"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 3 : 2}
                        className="transition-all duration-300 group-hover:stroke-cyan-400 group-hover:scale-105"
                      />

                      {/* Center Device Icon representation */}
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={strokeColor}
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="pointer-events-none"
                      >
                        {isAttacker ? '⚡' : isHoneypot ? '🍯' : node.role === 'database' ? '🗄️' : '🖥️'}
                      </text>

                      {/* Risk Score Pill Badge */}
                      <g transform="translate(14, -14)">
                        <rect
                          x="-8"
                          y="-8"
                          width="24"
                          height="14"
                          rx="4"
                          fill="#020617"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          x="4"
                          y="2"
                          textAnchor="middle"
                          fill={strokeColor}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {riskInfo.score}
                        </text>
                      </g>

                      {/* Node Label Below */}
                      <text
                        x="0"
                        y="36"
                        textAnchor="middle"
                        fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        className="transition-colors"
                      >
                        {node.label}
                      </text>

                      {/* IP Sub-Label */}
                      <text
                        x="0"
                        y="48"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {node.ip}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Bottom Trajectory Status Bar */}
          <div className="px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-slate-300">
                Current Compromise Vector:{' '}
                <strong className="text-white">
                  {nodes[0].ip} → {nodes[1].ip} → {nodes[2].ip}
                </strong>
              </span>
            </div>

            <span className="text-[11px] font-mono text-amber-300">
              Projected Exploitation Target: <strong>{targetHost}</strong>
            </span>
          </div>
        </div>

        {/* Right Node Threat Inspector Card */}
        <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Node Telemetry Inspector
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedNode.label}</h4>
                <span className="text-xs font-mono text-cyan-300">{selectedNode.ip}</span>
              </div>

              {/* Risk Badge */}
              <div
                className={`px-2.5 py-1 rounded-xl text-center border font-mono ${
                  selectedNodeRisk.level === 'critical'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                    : selectedNodeRisk.level === 'high'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                }`}
              >
                <span className="text-[10px] block uppercase font-bold">Risk Score</span>
                <span className="text-base font-black">{selectedNodeRisk.score}/100</span>
              </div>
            </div>

            {/* Node Metadata Details */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400">Subnet Zone:</span>
                <span className="font-semibold text-slate-200">{selectedNode.zone}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400">Operating System:</span>
                <span className="font-mono text-slate-200">{selectedNode.os}</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400">Listening Ports:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {selectedNode.ports.join(', ')}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400">Threat Trajectory:</span>
                <span className="font-semibold text-rose-400">
                  {selectedNodeRisk.threatStatus}
                </span>
              </div>
            </div>

            {/* Attack Path Analysis for this host */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Temporal Path Rationale
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {selectedNode.role === 'target'
                  ? `The observed ${forecast.currentBehavior} sequence directly enumerates ports ${selectedNode.ports.join(
                      ', '
                    )}. Our Temporal AI models a ${forecast.confidence}% probability of incoming exploit payload delivery within ${forecast.estimatedTimeToImpact}.`
                  : selectedNode.role === 'attacker'
                  ? `External entry ingress source with sustained SYN packets (${history[history.length - 1]?.features.synRatio}%) executing automated scanning.`
                  : selectedNode.role === 'honeypot'
                  ? 'Configured shadow decoy simulating vulnerable Apache/SMB listeners to trap and isolate weaponized exploit shellcode.'
                  : `Internal secondary host at risk of lateral propagation should the target web tier be compromised.`}
              </p>
            </div>
          </div>

          {/* Quick Countermeasure Suggestion for this Node */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Node Containment Action
            </span>

            {selectedNode.role === 'target' ? (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-[11px] text-rose-200">
                <strong>Recommended:</strong> Apply dynamic SYN rate limiting and divert port 8080 probes into honeypot sandbox.
              </div>
            ) : selectedNode.role === 'attacker' ? (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-[11px] text-rose-200">
                <strong>Recommended:</strong> Issue immediate iptables drop rule on perimeter gateway for ingress IP.
              </div>
            ) : selectedNode.role === 'honeypot' ? (
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-[11px] text-cyan-200">
                <strong>Decoy Active:</strong> Capture active payload PCAP buffer for binary hashing.
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <strong>Precaution:</strong> Enforce host micro-segmentation ACLs between DMZ and Internal Core.
              </div>
            )}

            <button
              onClick={() => {
                if (onApplyMitigation) {
                  onApplyMitigation(`Proactive containment for ${selectedNode.label} (${selectedNode.ip})`);
                }
              }}
              className="w-full py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/30"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Deploy Node Protection Rule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
