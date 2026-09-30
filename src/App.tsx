/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Activity,
  Layers,
  TrendingUp,
  Cpu,
  UserCheck,
  Network,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Header } from './components/Header';
import { ForecastHeroBanner } from './components/ForecastHeroBanner';
import { ProgressionTimeline } from './components/ProgressionTimeline';
import { ExplainabilityPanel } from './components/ExplainabilityPanel';
import { ForensicAdvisorWorkbench } from './components/ForensicAdvisorWorkbench';
import { TelemetryInspector } from './components/TelemetryInspector';
import { AboutModal } from './components/AboutModal';
import { ExportModal } from './components/ExportModal';
import { UnreliablePredictionWarningBanner } from './components/UnreliablePredictionWarningBanner';
import { AttackPathMap } from './components/AttackPathMap';
import { AttackTrendsDashboard } from './components/AttackTrendsDashboard';
import { BENCHMARK_SCENARIOS } from './data/benchmarkDatasets';
import { DEFAULT_PLAYBOOKS } from './services/mitigationService';
import { computeTemporalForecast } from './services/temporalModel';
import { MitigationPlaybook, TrafficFeatures } from './types';

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('cic-ids-2017-portscan-exploit');
  // Default to step 2 (Scanning), which exhibits the exact prompt scenario: Normal -> Recon -> Scanning -> ?
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<
    'progression' | 'trends' | 'pathmap' | 'explainability' | 'workbench' | 'telemetry'
  >('progression');
  const [playbooks, setPlaybooks] = useState<MitigationPlaybook[]>(DEFAULT_PLAYBOOKS);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Custom feature overrides (from sliders or surge button)
  const [featureOverrides, setFeatureOverrides] = useState<Partial<TrafficFeatures> | null>(null);

  const scenario = useMemo(() => {
    return BENCHMARK_SCENARIOS.find((s) => s.id === selectedScenarioId) || BENCHMARK_SCENARIOS[0];
  }, [selectedScenarioId]);

  // Current history up to activeStepIndex
  const historySlice = useMemo(() => {
    return scenario.steps.slice(0, activeStepIndex + 1);
  }, [scenario, activeStepIndex]);

  // Effective current features
  const currentFeatures: TrafficFeatures = useMemo(() => {
    const base = scenario.steps[activeStepIndex]?.features || scenario.steps[0].features;
    if (!featureOverrides) return base;
    return {
      ...base,
      ...featureOverrides,
    };
  }, [scenario, activeStepIndex, featureOverrides]);

  // Compute Temporal AI sequence forecast
  const forecast = useMemo(() => {
    return computeTemporalForecast(historySlice, currentFeatures, scenario.datasetSource);
  }, [historySlice, currentFeatures, scenario.datasetSource]);

  // Playback timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(3500 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev >= scenario.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, scenario.steps.length]);

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setActiveStepIndex(2); // Start at scanning stage
    setFeatureOverrides(null);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (activeStepIndex < scenario.steps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
      setFeatureOverrides(null);
    }
  };

  const handleReset = () => {
    setActiveStepIndex(0);
    setFeatureOverrides(null);
    setIsPlaying(false);
  };

  const handleInjectSurge = () => {
    setFeatureOverrides({
      connectionRate: 340,
      synRatio: 92,
      portEntropy: 4.4,
      flowDuration: 35,
    });
    setNotification('⚠️ High-velocity SYN probe surge injected into network telemetry stream!');
    setTimeout(() => setNotification(null), 4500);
  };

  const handleInjectNoise = () => {
    setFeatureOverrides({
      noiseLevel: 75,
      synRatio: 44,
      ackRatio: 28,
      finRatio: 14,
      rstRatio: 14,
      flowDuration: 340,
    });
    setNotification('⚠️ Severe telemetry noise injected. Forecast confidence dropped below 50%!');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFilterNoise = () => {
    setFeatureOverrides((prev) => {
      if (!prev) return null;
      const { noiseLevel, ...rest } = prev;
      return Object.keys(rest).length > 0 ? rest : null;
    });
    setNotification('✓ Telemetry noise filtered. Forecast model confidence re-stabilized.');
    setTimeout(() => setNotification(null), 4500);
  };

  const handleApplyPlaybook = (id: string) => {
    setPlaybooks((prev) =>
      prev.map((pb) =>
        pb.id === id
          ? {
              ...pb,
              status: 'applied',
              appliedAt: new Date().toLocaleTimeString(),
              appliedBy: 'Analyst (SOC-Gate)',
            }
          : pb
      )
    );
    setNotification('✓ Defense rule verified & applied by SOC Analyst. Host protected.');
    setTimeout(() => setNotification(null), 4500);
  };

  const handleDismissPlaybook = (id: string) => {
    setPlaybooks((prev) =>
      prev.map((pb) => (pb.id === id ? { ...pb, status: 'dismissed' } : pb))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top App Header */}
      <Header
        scenarios={BENCHMARK_SCENARIOS}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStepForward={handleStepForward}
        onReset={handleReset}
        currentStepIndex={activeStepIndex}
        totalSteps={scenario.steps.length}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        onOpenAbout={() => setIsAboutOpen(true)}
        onInjectSurge={handleInjectSurge}
        onInjectNoise={handleInjectNoise}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Visual Warning Banner when forecast confidence < 50% */}
      <UnreliablePredictionWarningBanner
        forecast={forecast}
        onFilterNoise={handleFilterNoise}
        onInspectTelemetry={() => setActiveTab('telemetry')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Floating Notification Toast */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-xs font-medium">{notification}</span>
          </div>
        )}

        {/* 1. Core Forecast Hero Banner */}
        <ForecastHeroBanner
          forecast={forecast}
          history={historySlice}
          datasetSource={scenario.datasetSource}
          onOpenExport={() => setIsExportOpen(true)}
        />

        {/* 2. Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('progression')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'progression'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Attack Progression & Kill Chain
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'trends'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Attack Trends (D3)
            </button>

            <button
              onClick={() => setActiveTab('pathmap')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pathmap'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Network className="w-4 h-4 text-cyan-400" />
              Attack Path Map
            </button>

            <button
              onClick={() => setActiveTab('explainability')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'explainability'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Feature Explainability & Attention
            </button>

            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'workbench'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Analyst Decision Gate & Playbooks
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Network className="w-4 h-4" />
              Telemetry Tweaker & Flows
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Target: <strong className="text-slate-200">{scenario.targetHost}</strong></span>
            <span>•</span>
            <span>Source: <strong className="text-rose-300">{scenario.attackerIp}</strong></span>
          </div>
        </div>

        {/* 3. Tab Contents */}
        {activeTab === 'progression' && (
          <ProgressionTimeline
            history={scenario.steps}
            activeStepIndex={activeStepIndex}
            onSelectStepIndex={(idx) => {
              setActiveStepIndex(idx);
              setFeatureOverrides(null);
            }}
            forecast={forecast}
            onViewPathMap={() => setActiveTab('pathmap')}
          />
        )}

        {activeTab === 'trends' && (
          <AttackTrendsDashboard
            scenario={scenario}
            activeStepIndex={activeStepIndex}
            onSelectStepIndex={(idx) => {
              setActiveStepIndex(idx);
              setFeatureOverrides(null);
            }}
            forecast={forecast}
          />
        )}

        {activeTab === 'pathmap' && (
          <AttackPathMap
            forecast={forecast}
            history={historySlice}
            targetHost={scenario.targetHost}
            attackerIp={scenario.attackerIp}
            datasetSource={scenario.datasetSource}
            playbooks={playbooks}
            onApplyMitigation={(title) => {
              if (playbooks.length > 0) {
                handleApplyPlaybook(playbooks[0].id);
              } else {
                setNotification(`✓ Protective rule activated: ${title}`);
                setTimeout(() => setNotification(null), 4500);
              }
            }}
          />
        )}

        {activeTab === 'explainability' && (
          <ExplainabilityPanel
            forecast={forecast}
            history={historySlice}
          />
        )}

        {activeTab === 'workbench' && (
          <ForensicAdvisorWorkbench
            forecast={forecast}
            history={historySlice}
            playbooks={playbooks}
            onApplyPlaybook={handleApplyPlaybook}
            onDismissPlaybook={handleDismissPlaybook}
            datasetSource={scenario.datasetSource}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryInspector
            currentFeatures={currentFeatures}
            onUpdateFeatures={(feats) =>
              setFeatureOverrides((prev) => ({ ...(prev || {}), ...feats }))
            }
            onResetFeatures={() => setFeatureOverrides(null)}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SentinelSeq Temporal Attack Progression Forecasting Engine • Benchmarked on CIC-IDS2017 & UNSW-NB15
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Temporal Attention Window: Δt = 30s | State Memory: Active
          </span>
        </div>
      </footer>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Export Telemetry & Forecast Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        scenario={scenario}
        history={historySlice}
        currentFeatures={currentFeatures}
        forecast={forecast}
        playbooks={playbooks}
        onNotify={(msg) => {
          setNotification(msg);
          setTimeout(() => setNotification(null), 4500);
        }}
      />
    </div>
  );
}
