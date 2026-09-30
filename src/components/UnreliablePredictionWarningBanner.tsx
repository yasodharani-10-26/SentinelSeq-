import React, { useState } from 'react';
import {
  AlertTriangle,
  Radio,
  Sliders,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  ShieldAlert,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { ForecastPrediction } from '../types';

interface UnreliablePredictionWarningBannerProps {
  forecast: ForecastPrediction;
  onFilterNoise: () => void;
  onInspectTelemetry: () => void;
}

export const UnreliablePredictionWarningBanner: React.FC<
  UnreliablePredictionWarningBannerProps
> = ({ forecast, onFilterNoise, onInspectTelemetry }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // The banner appears when confidence < 50%
  if (forecast.confidence >= 50 || isDismissed) {
    return null;
  }

  return (
    <aside
      role="alert"
      aria-label="Low Forecast Confidence Warning"
      className="bg-gradient-to-r from-amber-950 via-rose-950 to-amber-950 border-b-2 border-amber-500/80 text-amber-100 shadow-2xl relative z-30 transition-all duration-300"
    >
      {/* Background hazard subtle texture */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3.5 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Warning Core */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono shadow-sm">
                  Confidence Alert: {forecast.confidence}% (&lt; 50%)
                </span>
                <h2 className="text-sm font-bold text-amber-200 tracking-tight">
                  Warning: Forecast Prediction Might Be Unreliable Due to Noisy Network Data
                </h2>
              </div>

              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed max-w-4xl">
                The Temporal AI model detected severe background network noise, packet timing jitter, or contradictory TCP flag sequences. Because confidence dropped below the <strong>50% operational threshold</strong>, automated decisions should be suspended and treated as tentative until telemetry stabilizes.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={onFilterNoise}
              title="Clear telemetry noise and restore baseline sequence"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Filter Noise</span>
            </button>

            <button
              onClick={onInspectTelemetry}
              title="Open Telemetry Tweaker to inspect packet distributions"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 hover:bg-amber-900/60 border border-amber-700/70 text-amber-200 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspect Telemetry</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors"
              title={isExpanded ? 'Collapse diagnostics' : 'Expand diagnostics'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-200 hover:bg-amber-900/40 transition-colors"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Diagnostic Strip */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-800/40 flex items-center justify-between">
              <span className="text-amber-300/80">Model Confidence:</span>
              <span className="text-rose-400 font-bold text-xs">{forecast.confidence}% (Unreliable)</span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-800/40 flex items-center justify-between">
              <span className="text-amber-300/80">Simulated Noise Index:</span>
              <span className="text-amber-300 font-bold text-xs">
                {forecast.noiseLevel > 0 ? `${forecast.noiseLevel}% Jitter` : 'High Volatility'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-800/40 flex items-center justify-between">
              <span className="text-amber-300/80">SOC Recommendation:</span>
              <span className="text-cyan-300 font-semibold">Manual PCAP Review</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
