export type AttackStage =
  | 'Normal'
  | 'Reconnaissance'
  | 'Scanning'
  | 'Exploitation'
  | 'Privilege_Escalation'
  | 'Lateral_Movement'
  | 'Exfiltration'
  | 'System_Degradation';

export interface TrafficFeatures {
  timestamp: number;
  timeLabel: string;
  packetCount: number;
  connectionRate: number; // conn/sec
  avgPacketSize: number; // bytes
  flowDuration: number; // ms
  synRatio: number; // percentage (0-100)
  ackRatio: number; // percentage (0-100)
  finRatio: number; // percentage (0-100)
  rstRatio: number; // percentage (0-100)
  portEntropy: number; // 0.0 - 5.0 (Shannon entropy)
  dstPorts: number[];
  protocols: string[];
  sourceIp: string;
  targetSubnet: string;
  bytesTransferred: number;
  tcpWindowSize: number;
  noiseLevel?: number; // 0-100% representing network jitter / packet corruption
}

export interface SequenceStep {
  stepIndex: number;
  timeLabel: string;
  observedStage: AttackStage;
  features: TrafficFeatures;
  confidence: number;
  anomalyScore: number; // percentage 0-100 indicating out-of-distribution deviation
  logSnippet?: string;
}

export interface KeyIndicator {
  id: string;
  name: string;
  baselineValue: string;
  currentValue: string;
  changePercent: number;
  importanceScore: number; // 0 - 100
  direction: 'up' | 'down' | 'unusual';
  description: string;
  status: 'critical' | 'warning' | 'normal';
}

export interface StageProbability {
  stage: AttackStage;
  probability: number; // 0 - 100
  color: string;
  description: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  url: string;
}

export interface ForecastPrediction {
  currentBehavior: AttackStage;
  predictedNextStage: AttackStage;
  confidence: number; // e.g. 82%
  horizonSeconds: number; // estimated seconds until stage materializes
  estimatedTimeToImpact: string; // e.g. "~45 - 90 seconds"
  anomalyScore: number; // e.g. 18%
  isAnomalousUnseen: boolean;
  candidateProbabilities: StageProbability[];
  keyIndicators: KeyIndicator[];
  mitreTechniques: MitreTechnique[];
  temporalRationale: string;
  attentionWeights: {
    step: string;
    weight: number; // 0 - 1.0
    keyFactor: string;
  }[];
  isLowConfidenceUnreliable: boolean; // True when confidence < 50%
  noiseLevel: number; // 0-100%
  unreliableReason?: string;
}

export interface MitigationPlaybook {
  id: string;
  title: string;
  targetVector: string;
  description: string;
  type: 'firewall' | 'rate_limit' | 'honeypot' | 'quarantine' | 'pcap_dump';
  status: 'recommended' | 'applied' | 'dismissed';
  cliSnippet: string;
  impactAssessment: string;
  appliedAt?: string;
  appliedBy?: string;
}

export interface ForensicAssessment {
  status: 'loading' | 'live_ai' | 'simulated' | 'error';
  attribution: {
    threatActorProfile: string;
    mitreTactic: string;
    cveVulnerabilities: string[];
  };
  forensicRationale: string;
  recommendedContainment: string[];
  generatedFirewallRule: string;
  error?: string;
}

export interface DatasetScenario {
  id: string;
  name: string;
  datasetSource: 'CIC-IDS2017' | 'UNSW-NB15' | 'Synthetic / Custom';
  description: string;
  targetHost: string;
  attackerIp: string;
  protocolFocus: string;
  steps: SequenceStep[];
}

export interface FlowRecord {
  id: string;
  timestamp: string;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  protocol: string;
  flags: string;
  packetLength: number;
  stageTag: AttackStage;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}
