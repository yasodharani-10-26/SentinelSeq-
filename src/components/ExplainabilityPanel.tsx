import React from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Eye,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ForecastPrediction, SequenceStep } from '../types';

interface ExplainabilityPanelProps {
  forecast: ForecastPrediction;
  history: SequenceStep[];
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  forecast,
  history,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Important Indicators Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Explainability & Key Traffic Indicators (Attribution Weights)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            SHAP-derived feature contribution relative to learned benchmark baseline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecast.keyIndicators.map((ind) => (
            <div
              key={ind.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ind.status === 'critical'
                            ? 'bg-rose-500'
                            : ind.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {ind.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ind.description}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      ind.changePercent > 0
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {ind.direction === 'up' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {ind.changePercent > 0 ? `+${ind.changePercent}%` : `${ind.changePercent}%`}
                  </span>
                </div>

                {/* Values comparison */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 my-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Baseline Reference:</span>
                    <span className="text-slate-300 font-semibold">{ind.baselineValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Observation:</span>
                    <span className="text-cyan-300 font-bold">{ind.currentValue}</span>
                  </div>
                </div>
              </div>

              {/* Attribution Importance Bar */}
              <div className="mt-2 pt-2 border-t border-slate-900">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Model Attribution Weight:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {ind.importanceScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-amber-400"
                    style={{ width: `${ind.importanceScore}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Temporal Attention & Multi-step Network Oscilloscope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Temporal Sequence Attention */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Temporal Attention Across Time Steps
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Attention Heads: 8</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Unlike static intrusion detectors that inspect packets in isolation, the Temporal AI computes self-attention across previous time slices to detect the buildup of an attack sequence:
          </p>

          <div className="space-y-3">
            {forecast.attentionWeights.map((att, i) => (
              <div
                key={att.step}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-slate-200">
                    Step {i + 1}: {att.step}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {(att.weight * 100).toFixed(0)}% Attention
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${att.weight * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {att.keyFactor}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Trajectory Oscilloscope (SVG Smooth Mini-Charts) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Network Feature Telemetry Oscilloscope
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Time Delta Δt</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Multi-variant parameter evolution across the observed and projected sequence:
            </p>

            <div className="space-y-4">
              {/* Connection Rate Trend */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Connection Rate (conn/sec)</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {history[history.length - 1]?.features.connectionRate || 0} conn/s
                  </span>
                </div>
                {/* Visual sparkline bars */}
                <div className="flex items-end gap-1.5 h-12 pt-2">
                  {history.map((h, idx) => {
                    const maxRate = 450;
                    const heightPct = Math.min(100, Math.max(10, (h.features.connectionRate / maxRate) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t transition-all duration-300 bg-cyan-500/80 group-hover:bg-cyan-400"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] font-mono text-slate-400">{h.timeLabel.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SYN Packet Ratio Trend */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">TCP SYN Flag Ratio (%)</span>
                  <span className="font-mono font-bold text-amber-400">
                    {history[history.length - 1]?.features.synRatio || 0}%
                  </span>
                </div>
                {/* Visual sparkline bars */}
                <div className="flex items-end gap-1.5 h-12 pt-2">
                  {history.map((h, idx) => {
                    const heightPct = h.features.synRatio;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t transition-all duration-300 bg-amber-500/80 group-hover:bg-amber-400"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] font-mono text-slate-400">{h.timeLabel.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Temporal model computes joint probability <span className="font-mono text-cyan-300">P(Exploitation | SYN_surge, Port_entropy, Conn_velocity)</span>.
          </div>
        </div>
      </div>
    </div>
  );
};
