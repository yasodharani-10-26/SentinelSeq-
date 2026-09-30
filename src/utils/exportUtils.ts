import {
  DatasetScenario,
  FlowRecord,
  ForecastPrediction,
  MitigationPlaybook,
  SequenceStep,
  TrafficFeatures,
} from '../types';

export interface ExportDataPayload {
  exportTimestamp: string;
  generatedBy: string;
  scenario: {
    id: string;
    name: string;
    datasetSource: string;
    targetHost: string;
    attackerIp: string;
    protocolFocus: string;
    description: string;
  };
  forecast: {
    currentBehavior: string;
    predictedNextStage: string;
    confidence: number;
    anomalyScore: number;
    isAnomalousUnseen: boolean;
    estimatedTimeToImpact: string;
    horizonSeconds: number;
    temporalRationale: string;
    candidateProbabilities: {
      stage: string;
      probability: number;
      description: string;
    }[];
    mitreTechniques: {
      id: string;
      name: string;
      tactic: string;
      url: string;
    }[];
    attentionWeights: {
      step: string;
      weight: number;
      keyFactor: string;
    }[];
  };
  keyIndicators: {
    id: string;
    name: string;
    baselineValue: string;
    currentValue: string;
    changePercent: number;
    importanceScore: number;
    direction: string;
    status: string;
    description: string;
  }[];
  activeTelemetryFeatures: TrafficFeatures;
  sequenceHistory: {
    stepIndex: number;
    timeLabel: string;
    observedStage: string;
    confidence: number;
    anomalyScore: number;
    features: TrafficFeatures;
    logSnippet?: string;
  }[];
  mitigationPlaybooks: {
    id: string;
    title: string;
    targetVector: string;
    type: string;
    status: string;
    cliSnippet: string;
    appliedAt?: string;
  }[];
}

/**
 * Builds the comprehensive structured JSON payload for SOC export
 */
export function buildExportPayload(
  scenario: DatasetScenario,
  history: SequenceStep[],
  currentFeatures: TrafficFeatures,
  forecast: ForecastPrediction,
  playbooks: MitigationPlaybook[]
): ExportDataPayload {
  return {
    exportTimestamp: new Date().toISOString(),
    generatedBy: 'SentinelSeq AI Network Attack Forecasting Engine v2.4',
    scenario: {
      id: scenario.id,
      name: scenario.name,
      datasetSource: scenario.datasetSource,
      targetHost: scenario.targetHost,
      attackerIp: scenario.attackerIp,
      protocolFocus: scenario.protocolFocus,
      description: scenario.description,
    },
    forecast: {
      currentBehavior: forecast.currentBehavior,
      predictedNextStage: forecast.predictedNextStage,
      confidence: forecast.confidence,
      anomalyScore: forecast.anomalyScore,
      isAnomalousUnseen: forecast.isAnomalousUnseen,
      estimatedTimeToImpact: forecast.estimatedTimeToImpact,
      horizonSeconds: forecast.horizonSeconds,
      temporalRationale: forecast.temporalRationale,
      candidateProbabilities: forecast.candidateProbabilities.map((c) => ({
        stage: c.stage,
        probability: c.probability,
        description: c.description,
      })),
      mitreTechniques: forecast.mitreTechniques,
      attentionWeights: forecast.attentionWeights,
    },
    keyIndicators: forecast.keyIndicators.map((ind) => ({
      id: ind.id,
      name: ind.name,
      baselineValue: ind.baselineValue,
      currentValue: ind.currentValue,
      changePercent: ind.changePercent,
      importanceScore: ind.importanceScore,
      direction: ind.direction,
      status: ind.status,
      description: ind.description,
    })),
    activeTelemetryFeatures: currentFeatures,
    sequenceHistory: history.map((step) => ({
      stepIndex: step.stepIndex,
      timeLabel: step.timeLabel,
      observedStage: step.observedStage,
      confidence: step.confidence,
      anomalyScore: step.anomalyScore,
      features: step.features,
      logSnippet: step.logSnippet,
    })),
    mitigationPlaybooks: playbooks.map((pb) => ({
      id: pb.id,
      title: pb.title,
      targetVector: pb.targetVector,
      type: pb.type,
      status: pb.status,
      cliSnippet: pb.cliSnippet,
      appliedAt: pb.appliedAt,
    })),
  };
}

/**
 * Converts telemetry sequence and indicators into a CSV string
 */
export function generateTelemetryCsv(
  scenario: DatasetScenario,
  history: SequenceStep[],
  forecast: ForecastPrediction
): string {
  const lines: string[] = [];

  // Header metadata comments
  lines.push(`# SentinelSeq Telemetry & Attack Forecast Export`);
  lines.push(`# Scenario: ${scenario.name} [${scenario.datasetSource}]`);
  lines.push(`# Target Host: ${scenario.targetHost} | Attacker IP: ${scenario.attackerIp}`);
  lines.push(`# Current Stage: ${forecast.currentBehavior} | Forecasted Next: ${forecast.predictedNextStage} (Confidence: ${forecast.confidence}%)`);
  lines.push(`# Export Timestamp: ${new Date().toISOString()}`);
  lines.push('');

  // 1. Sequence Telemetry Table
  lines.push('# SECTION 1: TEMPORAL SEQUENCE TELEMETRY');
  const telemetryHeaders = [
    'StepIndex',
    'TimeLabel',
    'ObservedStage',
    'ConfidencePercent',
    'AnomalyScorePercent',
    'PacketCount',
    'ConnectionRate_conn_per_sec',
    'AvgPacketSizeBytes',
    'FlowDurationMs',
    'SynRatioPercent',
    'AckRatioPercent',
    'FinRatioPercent',
    'RstRatioPercent',
    'PortEntropyBits',
    'DstPorts',
    'Protocols',
    'SourceIp',
    'TargetSubnet',
    'BytesTransferred',
    'TcpWindowSize',
  ];
  lines.push(telemetryHeaders.join(','));

  history.forEach((step) => {
    const f = step.features;
    const row = [
      step.stepIndex,
      `"${step.timeLabel}"`,
      `"${step.observedStage}"`,
      step.confidence,
      step.anomalyScore,
      f.packetCount,
      f.connectionRate,
      f.avgPacketSize,
      f.flowDuration,
      f.synRatio,
      f.ackRatio,
      f.finRatio,
      f.rstRatio,
      f.portEntropy.toFixed(2),
      `"${f.dstPorts.join(';')}"`,
      `"${f.protocols.join(';')}"`,
      `"${f.sourceIp}"`,
      `"${f.targetSubnet}"`,
      f.bytesTransferred,
      f.tcpWindowSize,
    ];
    lines.push(row.join(','));
  });

  lines.push('');
  // 2. Key Indicators Table
  lines.push('# SECTION 2: KEY INDICATORS & ATTRIBUTION WEIGHTS');
  const indicatorHeaders = [
    'IndicatorId',
    'IndicatorName',
    'BaselineValue',
    'ObservedValue',
    'ChangePercent',
    'ImportanceScore',
    'Status',
    'Direction',
  ];
  lines.push(indicatorHeaders.join(','));

  forecast.keyIndicators.forEach((ind) => {
    const row = [
      `"${ind.id}"`,
      `"${ind.name}"`,
      `"${ind.baselineValue}"`,
      `"${ind.currentValue}"`,
      ind.changePercent,
      ind.importanceScore,
      `"${ind.status}"`,
      `"${ind.direction}"`,
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Converts flow records to CSV string
 */
export function generateFlowsCsv(flows: FlowRecord[]): string {
  const lines: string[] = [];
  lines.push('# SentinelSeq Live Network Flow Records Export');
  lines.push('# Export Timestamp: ' + new Date().toISOString());
  lines.push('');

  const headers = [
    'FlowId',
    'Timestamp',
    'SourceIp',
    'SourcePort',
    'DestinationIp',
    'DestinationPort',
    'Protocol',
    'TCPFlags',
    'PacketLengthBytes',
    'StageTag',
    'ThreatLevel',
  ];
  lines.push(headers.join(','));

  flows.forEach((flow) => {
    const row = [
      `"${flow.id}"`,
      `"${flow.timestamp}"`,
      `"${flow.srcIp}"`,
      flow.srcPort,
      `"${flow.dstIp}"`,
      flow.dstPort,
      `"${flow.protocol}"`,
      `"${flow.flags}"`,
      flow.packetLength,
      `"${flow.stageTag}"`,
      `"${flow.threatLevel}"`,
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Triggers a client-side file download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
