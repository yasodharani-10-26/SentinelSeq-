import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Layers,
  Sparkles,
  TrendingUp,
  Activity,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Network,
} from 'lucide-react';
import { ForecastPrediction, SequenceStep } from '../types';
import { STAGE_CONFIG } from '../services/temporalModel';

interface ProgressionTimelineProps {
  history: SequenceStep[];
  activeStepIndex: number;
  onSelectStepIndex: (index: number) => void;
  forecast: ForecastPrediction;
  onViewPathMap?: () => void;
}

type SparklineMetric = 'connectionRate' | 'synRatio' | 'packetCount' | 'flowDuration';

interface SparklineProps {
  values: number[];
  globalMin: number;
  globalMax: number;
  color: string;
  id: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
  values,
  globalMin,
  globalMax,
  color,
  id,
  width = 68,
  height = 20,
}) => {
  const safeValues = values.length === 1 ? [values[0], values[0]] : values;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const range = globalMax - globalMin || 1;

  const points = safeValues.map((val, i) => {
    const x = padding + (i / Math.max(safeValues.length - 1, 1)) * w;
    const norm = Math.max(0, Math.min(1, (val - globalMin) / range));
    const y = height - padding - norm * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylinePoints = points.join(' ');
  const lastPoint = points[points.length - 1].split(',');
  const lastX = parseFloat(lastPoint[0]);
  const lastY = parseFloat(lastPoint[1]);

  const areaPoints = `${padding},${height} ${polylinePoints} ${lastX},${height}`;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible block shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Shaded Area */}
      <polygon points={areaPoints} fill={`url(#grad-${id})`} />
      {/* Trend Polyline */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrival endpoint dot representing the metric at this stage */}
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
      <circle
        cx={lastX}
        cy={lastY}
        r="4.5"
        fill="none"
        stroke={color}
        strokeWidth="1"
        className="opacity-70 animate-ping"
      />
    </svg>
  );
};

export const ProgressionTimeline: React.FC<ProgressionTimelineProps> = ({
  history,
  activeStepIndex,
  onSelectStepIndex,
  forecast,
  onViewPathMap,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<SparklineMetric>('connectionRate');

  // Compute global range across the full scenario history for true relative intensity
  const { globalMin, globalMax, metricUnit } = useMemo(() => {
    const vals = history.map((s) => s.features[selectedMetric]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    let unit = 'conn/s';
    if (selectedMetric === 'synRatio') {
      unit = '% SYN';
    } else if (selectedMetric === 'packetCount') {
      unit = 'pkts';
    } else if (selectedMetric === 'flowDuration') {
      unit = 'ms';
    }

    return {
      globalMin: min,
      globalMax: max === min ? min + 1 : max,
      metricUnit: unit,
    };
  }, [history, selectedMetric]);

  return (
    <div className="space-y-6">
      {/* 1. Kill Chain Sequence Steps with Sparklines */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Attack Progression Timeline & Sequence Memory
            </h3>
          </div>

          {/* Metric Selector for Sparklines */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Trend Metric:
            </span>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setSelectedMetric('connectionRate')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedMetric === 'connectionRate'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conn Velocity
              </button>
              <button
                onClick={() => setSelectedMetric('synRatio')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedMetric === 'synRatio'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SYN Flag %
              </button>
              <button
                onClick={() => setSelectedMetric('packetCount')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedMetric === 'packetCount'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Packet Volume
              </button>
              <button
                onClick={() => setSelectedMetric('flowDuration')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedMetric === 'flowDuration'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Duration
              </button>
            </div>

            {onViewPathMap && (
              <button
                onClick={onViewPathMap}
                title="Open topological SVG Attack Path Map"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/40 border border-cyan-800 text-cyan-300 transition-colors shadow-sm"
              >
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>View Attack Path Map</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Cards Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {history.map((step, idx) => {
            const config = STAGE_CONFIG[step.observedStage] || STAGE_CONFIG.Normal;
            const isCurrent = idx === activeStepIndex;
            const isPast = idx < activeStepIndex;
            const isFuture = idx > activeStepIndex;

            // Values leading into this stage
            const stepHistoryValues = history
              .slice(0, idx + 1)
              .map((s) => s.features[selectedMetric]);
            const currentValue = step.features[selectedMetric];
            const previousValue = idx > 0 ? history[idx - 1].features[selectedMetric] : currentValue;
            const deltaPercent =
              previousValue > 0
                ? Math.round(((currentValue - previousValue) / previousValue) * 100)
                : 0;

            // Intensity ratio relative to max
            const intensityRatio =
              (currentValue - globalMin) / Math.max(globalMax - globalMin, 1);
            const intensityTier =
              intensityRatio > 0.7
                ? 'High Intensity'
                : intensityRatio > 0.35
                ? 'Moderate'
                : 'Nominal';

            return (
              <button
                key={step.stepIndex}
                onClick={() => onSelectStepIndex(idx)}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-slate-800/90 border-cyan-500/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : isPast
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/30 border-dashed border-slate-800/60 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Step indicator header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {step.timeLabel}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
                        ACTIVE
                      </span>
                    ) : isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/40 px-1 rounded">
                        FORECAST
                      </span>
                    )}
                  </div>

                  {/* Stage Tag & Trendline Sparkline beside each stage */}
                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {config.label}
                      </span>
                    </div>

                    {/* Small Trend Line Indicator (Sparkline) */}
                    <div
                      title={`Traffic trend leading into ${config.label}: ${stepHistoryValues.join(
                        ' → '
                      )} ${metricUnit}`}
                      className="bg-slate-950/90 p-1 rounded-lg border border-slate-800 flex flex-col items-end shrink-0"
                    >
                      <Sparkline
                        values={stepHistoryValues}
                        globalMin={globalMin}
                        globalMax={globalMax}
                        color={config.color}
                        id={`spark-${step.stepIndex}`}
                        width={64}
                        height={18}
                      />
                      <div className="flex items-center gap-1 text-[9px] font-mono text-slate-300 mt-0.5">
                        <span className="font-bold">
                          {currentValue}
                          {selectedMetric === 'synRatio' ? '%' : ''}
                        </span>
                        {deltaPercent > 0 ? (
                          <span className="text-rose-400 flex items-center">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </span>
                        ) : deltaPercent < 0 ? (
                          <span className="text-emerald-400 flex items-center">
                            <ArrowDownRight className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <Minus className="w-2 h-2 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Traffic Intensity Badge */}
                  <div className="flex items-center justify-between text-[10px] mb-2 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <Flame
                        className={`w-3 h-3 ${
                          intensityTier === 'High Intensity'
                            ? 'text-rose-400 fill-rose-400/20 animate-pulse'
                            : intensityTier === 'Moderate'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      />
                      Intensity:
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        intensityTier === 'High Intensity'
                          ? 'text-rose-300'
                          : intensityTier === 'Moderate'
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {intensityTier}
                    </span>
                  </div>

                  {/* Quick telemetry feature summary */}
                  <div className="space-y-1 text-[11px] text-slate-400 font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800/60">
                    <div className="flex justify-between">
                      <span>Conn/s:</span>
                      <span className="text-slate-200 font-semibold">{step.features.connectionRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SYN Ratio:</span>
                      <span className="text-slate-200 font-semibold">{step.features.synRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flow Duration:</span>
                      <span className="text-slate-200 font-semibold">{step.features.flowDuration}ms</span>
                    </div>
                  </div>
                </div>

                {/* Bottom line status */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-900 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>Conf: {step.confidence}%</span>
                  <span>Anomaly: {step.anomalyScore}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Branching Probabilities Trajectory & MITRE ATT&CK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Branching Probabilities */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Predicted Progression Branching (Next Horizon)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Temporal Markov Distribution
            </span>
          </div>

          <div className="space-y-3.5">
            {forecast.candidateProbabilities.map((candidate) => {
              const config = STAGE_CONFIG[candidate.stage] || STAGE_CONFIG.Normal;
              return (
                <div key={candidate.stage} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs font-bold text-slate-100">
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {candidate.probability}%
                    </span>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${candidate.probability}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {candidate.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* MITRE ATT&CK Matrix Mapping */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  MITRE ATT&CK® Correlation
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">v14 Framework</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              The Temporal AI correlates observed packet timing and protocol structures to active adversary tactics and techniques:
            </p>

            <div className="space-y-2.5">
              {forecast.mitreTechniques.map((tech) => (
                <a
                  key={tech.id}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-700/60 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {tech.id}
                      </span>
                      <span className="text-xs text-slate-200 font-medium">
                        {tech.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Tactic: {tech.tactic}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Defense Advantage: Mitigating during <strong className="text-amber-300">Scanning</strong> prevents execution of <strong className="text-rose-300">T1190 (Exploitation)</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
