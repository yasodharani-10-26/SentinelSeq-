import React, { useState } from 'react';
import {
  Network,
  Sliders,
  FileSpreadsheet,
  CheckCircle,
  Play,
  RotateCcw,
  Zap,
  Download,
} from 'lucide-react';
import { FlowRecord, TrafficFeatures } from '../types';
import { SAMPLE_FLOW_RECORDS } from '../data/benchmarkDatasets';

interface TelemetryInspectorProps {
  currentFeatures: TrafficFeatures;
  onUpdateFeatures: (features: Partial<TrafficFeatures>) => void;
  onResetFeatures: () => void;
  onOpenExport?: () => void;
}

export const TelemetryInspector: React.FC<TelemetryInspectorProps> = ({
  currentFeatures,
  onUpdateFeatures,
  onResetFeatures,
  onOpenExport,
}) => {
  const [flows, setFlows] = useState<FlowRecord[]>(SAMPLE_FLOW_RECORDS);
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'flows' | 'csv_importer'>('simulator');
  const [csvText, setCsvText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    try {
      // Parse simple CSV line
      const lines = csvText.trim().split('\n');
      if (lines.length > 1) {
        setImportStatus(`Successfully ingested ${lines.length - 1} flow telemetry records. Inferred sequence window loaded.`);
        // Adjust features based on parsed flow density
        onUpdateFeatures({
          packetCount: Math.round(lines.length * 120),
          connectionRate: Math.min(500, lines.length * 25),
          synRatio: 84,
          portEntropy: 3.9,
        });
      }
    } catch {
      setImportStatus('Failed to parse CSV flow format. Ensure comma-separated columns.');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-5">
      {/* Header and Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Network Telemetry & Real-Time Feature Workbench
          </h3>
        </div>

        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'simulator'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Parameter Tweaker
          </button>
          <button
            onClick={() => setActiveSubTab('flows')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'flows'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3 h-3" />
            Flow Records ({flows.length})
          </button>
          <button
            onClick={() => setActiveSubTab('csv_importer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'csv_importer'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3" />
            PCAP / CSV Importer
          </button>

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              title="Export Telemetry & Flow Records (CSV / JSON)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:bg-cyan-950/60 border border-cyan-800/60 transition-colors ml-1"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* 1. Parameter Tweaker Slider View */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-300">
              Adjust network telemetry parameters in real time to observe how the Temporal AI adapts its next-stage attack progression forecast:
            </p>
            <button
              onClick={onResetFeatures}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Scenario
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Rate Slider */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-200">
                  Connection Rate
                </span>
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {currentFeatures.connectionRate} conn/s
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={currentFeatures.connectionRate}
                onChange={(e) =>
                  onUpdateFeatures({ connectionRate: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Baseline: ~18 conn/s. High velocities (&gt;150 conn/s) signal automated scanning.
              </span>
            </div>

            {/* SYN Flag Ratio Slider */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-200">
                  TCP SYN Flag Ratio
                </span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {currentFeatures.synRatio}%
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="98"
                value={currentFeatures.synRatio}
                onChange={(e) => {
                  const syn = parseInt(e.target.value, 10);
                  onUpdateFeatures({
                    synRatio: syn,
                    ackRatio: Math.max(1, 100 - syn - 4),
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Baseline: 10-15%. Elevated (&gt;60%) indicates half-open SYN sweeps.
              </span>
            </div>

            {/* Port Variety / Shannon Entropy */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-200">
                  Destination Port Entropy
                </span>
                <span className="font-mono text-xs font-bold text-purple-400">
                  {currentFeatures.portEntropy.toFixed(2)} bits
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4.8"
                step="0.1"
                value={currentFeatures.portEntropy}
                onChange={(e) =>
                  onUpdateFeatures({ portEntropy: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Low entropy (&lt;1.0) = single service. High (&gt;3.5) = broad port enumeration.
              </span>
            </div>

            {/* Flow Duration Slider */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-200">
                  Flow Duration
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {currentFeatures.flowDuration} ms
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="5000"
                step="50"
                value={currentFeatures.flowDuration}
                onChange={(e) =>
                  onUpdateFeatures({ flowDuration: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Short burst flows (&lt;100ms) with no responses correspond to rapid scanner timeouts.
              </span>
            </div>

            {/* Network Noise & Packet Jitter Slider */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Network Noise & Packet Jitter (Uncertainty Simulation)
                </span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {currentFeatures.noiseLevel || 0}% Jitter
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={currentFeatures.noiseLevel || 0}
                onChange={(e) =>
                  onUpdateFeatures({ noiseLevel: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% (Clean Telemetry)</span>
                <span className="text-amber-400 font-semibold">&gt;55% Triggers Low Confidence Warning Banner (&lt;50%)</span>
                <span>95% (Extreme Jitter)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Flow Records Table */}
      {activeSubTab === 'flows' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Source IP:Port</th>
                <th className="p-2.5">Destination IP:Port</th>
                <th className="p-2.5">Protocol</th>
                <th className="p-2.5">TCP Flags</th>
                <th className="p-2.5">Length</th>
                <th className="p-2.5">Stage Tag</th>
                <th className="p-2.5">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 text-slate-400">{flow.timestamp}</td>
                  <td className="p-2.5 text-cyan-300 font-semibold">
                    {flow.srcIp}:{flow.srcPort}
                  </td>
                  <td className="p-2.5 text-slate-200">
                    {flow.dstIp}:{flow.dstPort}
                  </td>
                  <td className="p-2.5">{flow.protocol}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">
                      {flow.flags}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-400">{flow.packetLength} B</td>
                  <td className="p-2.5 text-slate-300">{flow.stageTag}</td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        flow.threatLevel === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : flow.threatLevel === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {flow.threatLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. PCAP / CSV Importer */}
      {activeSubTab === 'csv_importer' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Paste CIC-IDS2017 / UNSW-NB15 flow CSV extract to simulate custom enterprise capture:
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Timestamp,Source IP,Dest IP,Dest Port,Protocol,Flow Duration,Tot Fwd Pkts,SYN Flag Cnt\n2017-07-05 10:14:02,172.16.0.1,192.168.10.50,8080,6,45000,12,11\n2017-07-05 10:14:03,172.16.0.1,192.168.10.50,445,6,38000,8,7`}
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setCsvText(`Timestamp,Source IP,Dest IP,Dest Port,Protocol,Flow Duration,Tot Fwd Pkts,SYN Flag Cnt
2017-07-05 10:14:02,172.16.0.1,192.168.10.50,8080,6,45000,12,11
2017-07-05 10:14:03,172.16.0.1,192.168.10.50,445,6,38000,8,7
2017-07-05 10:14:04,172.16.0.1,192.168.10.50,3389,6,42000,15,14`);
              }}
              className="text-xs text-cyan-400 hover:underline"
            >
              Load Sample CIC-IDS2017 Scan CSV
            </button>

            <button
              onClick={handleImportCsv}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            >
              Ingest & Run Sequence Inference
            </button>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
