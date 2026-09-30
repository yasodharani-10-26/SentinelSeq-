import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Download,
} from 'lucide-react';
import { ForecastPrediction, SequenceStep } from '../types';
import { STAGE_CONFIG } from '../services/temporalModel';

interface ForecastHeroBannerProps {
  forecast: ForecastPrediction;
  history: SequenceStep[];
  datasetSource: string;
  onOpenExport?: () => void;
}

export const ForecastHeroBanner: React.FC<ForecastHeroBannerProps> = ({
  forecast,
  history,
  datasetSource,
  onOpenExport,
}) => {
  const currentConfig = STAGE_CONFIG[forecast.currentBehavior] || STAGE_CONFIG.Normal;
  const predictedConfig = STAGE_CONFIG[forecast.predictedNextStage] || STAGE_CONFIG.Normal;

  const isThreatProgressing =
    forecast.predictedNextStage !== 'Normal' &&
    ['Exploitation', 'Privilege_Escalation', 'Lateral_Movement', 'Exfiltration', 'System_Degradation'].includes(
      forecast.predictedNextStage
    );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background cyber accent glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{
          background: isThreatProgressing ? '#ef4444' : '#10b981',
        }}
      />

      {/* Top Banner Tagline */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Temporal AI Inference Engine
          </span>
          <span className="text-xs text-slate-400">
            Sequence window [t-2, t-1, t0] analyzed over benchmark {datasetSource}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Early Warning Buffer:</span>
            <span className="font-semibold text-amber-300">{forecast.estimatedTimeToImpact}</span>
          </div>

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              title="Export Current Telemetry and Forecast Report (JSON/CSV)"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Export Dossier</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Forecast Core vs Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Sequence Progression Callout */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Current Behaviour */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 min-w-[200px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Current Behaviour
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: currentConfig.color }}
                />
                <span className="text-base font-bold text-white tracking-tight">
                  {currentConfig.label}
                </span>
              </div>
            </div>

            {/* Sequence Arrow */}
            <div className="flex items-center justify-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            </div>

            {/* Predicted Next Stage */}
            <div
              className={`rounded-xl p-3.5 border transition-all flex-1 min-w-[220px] ${
                isThreatProgressing
                  ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-950/30'
                  : 'bg-emerald-950/30 border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Predicted Next Stage
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900/90 text-amber-300 border border-amber-500/30">
                  EST. NEXT T+{forecast.horizonSeconds}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 animate-ping"
                  style={{ backgroundColor: predictedConfig.color }}
                />
                <span
                  className="text-lg font-black tracking-tight"
                  style={{ color: predictedConfig.color }}
                >
                  {predictedConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Temporal Rationale Text */}
          <div className="text-xs sm:text-sm text-slate-300 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="font-semibold text-slate-200">Temporal AI Rationale: </span>
            {forecast.temporalRationale}
          </div>

          {/* Top Important Indicators summary */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Key Indicators:
            </span>
            {forecast.keyIndicators.slice(0, 3).map((ind) => (
              <span
                key={ind.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-200"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    ind.status === 'critical'
                      ? 'bg-red-400'
                      : ind.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="font-medium">{ind.name}</span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {ind.changePercent > 0 ? `+${ind.changePercent}%` : `${ind.changePercent}%`}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Confidence & Anomaly Score Gauges */}
        <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-4">
          {/* Confidence Gauge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                Forecast Confidence
                {forecast.confidence < 50 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                    Unreliable
                  </span>
                )}
              </span>
              <span
                className={`text-xl font-black font-mono ${
                  forecast.confidence < 50 ? 'text-amber-400 animate-pulse' : 'text-white'
                }`}
              >
                {forecast.confidence}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  forecast.confidence < 50
                    ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400'
                }`}
                style={{ width: `${forecast.confidence}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span className={forecast.confidence < 50 ? 'text-amber-400 font-bold' : ''}>
                &lt;50% (Unreliable)
              </span>
              <span>Nominal (75%)</span>
              <span>High (90%+)</span>
            </div>
            {forecast.confidence < 50 && (
              <p className="text-[10px] text-amber-300/90 mt-1.5 font-sans bg-amber-950/40 p-1.5 rounded border border-amber-900/60">
                ⚠️ Noisy telemetry limits model certainty. Manual review advised.
              </p>
            )}
          </div>

          {/* Anomaly / Out-of-Distribution Gauge */}
          <div className="border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                Novelty / Anomaly Score
              </span>
              <span className="text-sm font-bold font-mono text-slate-300">
                {forecast.anomalyScore}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  forecast.anomalyScore > 75
                    ? 'bg-rose-500'
                    : forecast.anomalyScore > 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${forecast.anomalyScore}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {forecast.isAnomalousUnseen
                ? '⚠️ Unusual sequence deviating from standard baseline pattern (Zero-Day potential)'
                : 'Conforms to historical threat signature distribution'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
