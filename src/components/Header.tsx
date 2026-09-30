import React from 'react';
import {
  Shield,
  Activity,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Database,
  HelpCircle,
  Zap,
  Download,
  Radio,
} from 'lucide-react';
import { DatasetScenario } from '../types';

interface HeaderProps {
  scenarios: DatasetScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  currentStepIndex: number;
  totalSteps: number;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onOpenAbout: () => void;
  onInjectSurge: () => void;
  onInjectNoise: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  currentStepIndex,
  totalSteps,
  playbackSpeed,
  onSpeedChange,
  onOpenAbout,
  onInjectSurge,
  onInjectNoise,
  onOpenExport,
}) => {
  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Sentinel<span className="text-cyan-400">Seq</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                AI Attack Forecasting
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Temporal World Model: Online
              </span>
              <span>•</span>
              <span className="text-slate-300 font-mono">
                {currentScenario?.datasetSource || 'CIC-IDS2017'}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Database className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-slate-900 text-white">
                  [{sc.datasetSource}] {sc.name.split(':')[1]?.trim() || sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={onReset}
              title="Reset Sequence to T-90s"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause Simulation' : 'Auto-Play Sequence'}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> Play
                </>
              )}
            </button>
            <button
              onClick={onStepForward}
              disabled={currentStepIndex >= totalSteps - 1}
              title="Step Forward in Time"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Speed toggle */}
            <div className="border-l border-slate-800 pl-1 flex items-center">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSpeedChange(spd)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    playbackSpeed === spd
                      ? 'bg-slate-800 text-cyan-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <button
            onClick={onInjectNoise}
            title="Simulate severe network noise/packet jitter to test low-confidence warning (<50%)"
            className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-900/40 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Simulate Noise</span>
          </button>

          <button
            onClick={onInjectSurge}
            title="Inject Sudden High-Density Probe Surge"
            className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/40 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Surge Probe</span>
          </button>

          <button
            onClick={onOpenExport}
            title="Export Telemetry & Forecast Data (JSON / CSV)"
            className="flex items-center gap-1.5 bg-cyan-950/50 border border-cyan-800/70 text-cyan-300 hover:bg-cyan-900/40 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenAbout}
            title="About AI Network Attack Forecasting"
            className="p-2 text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
