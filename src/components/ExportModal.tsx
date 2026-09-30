import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  FileSpreadsheet,
  FileText,
  Share2,
  Database,
  Cpu,
  Clock,
  Shield,
} from 'lucide-react';
import {
  DatasetScenario,
  FlowRecord,
  ForecastPrediction,
  MitigationPlaybook,
  SequenceStep,
  TrafficFeatures,
} from '../types';
import {
  buildExportPayload,
  downloadFile,
  generateFlowsCsv,
  generateTelemetryCsv,
} from '../utils/exportUtils';
import { SAMPLE_FLOW_RECORDS } from '../data/benchmarkDatasets';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: DatasetScenario;
  history: SequenceStep[];
  currentFeatures: TrafficFeatures;
  forecast: ForecastPrediction;
  playbooks: MitigationPlaybook[];
  onNotify: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scenario,
  history,
  currentFeatures,
  forecast,
  playbooks,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'telemetry_csv' | 'flows_csv'>('json');
  const [copied, setCopied] = useState<boolean>(false);

  // Memoize generated exports
  const jsonString = useMemo(() => {
    const payload = buildExportPayload(scenario, history, currentFeatures, forecast, playbooks);
    return JSON.stringify(payload, null, 2);
  }, [scenario, history, currentFeatures, forecast, playbooks]);

  const telemetryCsvString = useMemo(() => {
    return generateTelemetryCsv(scenario, history, forecast);
  }, [scenario, history, forecast]);

  const flowsCsvString = useMemo(() => {
    return generateFlowsCsv(SAMPLE_FLOW_RECORDS);
  }, []);

  if (!isOpen) return null;

  const timestampStr = new Date().toISOString().slice(0, 10);
  const scenarioSlug = scenario.id;

  const currentContent =
    activeTab === 'json'
      ? jsonString
      : activeTab === 'telemetry_csv'
      ? telemetryCsvString
      : flowsCsvString;

  const currentFilename =
    activeTab === 'json'
      ? `sentinelseq-threat-dossier-${scenarioSlug}-${timestampStr}.json`
      : activeTab === 'telemetry_csv'
      ? `sentinelseq-sequence-telemetry-${scenarioSlug}-${timestampStr}.csv`
      : `sentinelseq-flow-records-${scenarioSlug}-${timestampStr}.csv`;

  const currentMimeType = activeTab === 'json' ? 'application/json' : 'text/csv';

  const handleDownload = () => {
    downloadFile(currentContent, currentFilename, currentMimeType);
    onNotify(`✓ Downloaded ${currentFilename} for SOC external analysis.`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify('✓ Telemetry data copied to clipboard.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Download className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Export Telemetry & Threat Forecast
              </h2>
              <p className="text-xs text-slate-400">
                Generate structured datasets for SIEM, Splunk, Python/Pandas, or external SOC teams
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector & Metadata Strip */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'json'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Full Dossier (JSON)
            </button>

            <button
              onClick={() => setActiveTab('telemetry_csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'telemetry_csv'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Sequence Telemetry (CSV)
            </button>

            <button
              onClick={() => setActiveTab('flows_csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'flows_csv'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Flow Records (CSV)
            </button>
          </div>

          {/* Quick Context Summary */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {activeTab === 'json' ? 'JSON' : 'CSV'} (
              {(new Blob([currentContent]).size / 1024).toFixed(1)} KB)
            </span>
            <span>•</span>
            <span className="text-slate-300">
              {forecast.currentBehavior} → {forecast.predictedNextStage} ({forecast.confidence}%)
            </span>
          </div>
        </div>

        {/* Content Preview Box */}
        <div className="flex-1 p-5 md:p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 truncate max-w-md">
              File: <strong className="text-cyan-300">{currentFilename}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed shadow-inner">
            <pre className="whitespace-pre">{currentContent}</pre>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Exported data includes temporal kill chain stages, attribution weights, and MITRE mappings.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-950/40"
            >
              <Download className="w-4 h-4" />
              Download {activeTab === 'json' ? 'JSON Dossier' : 'CSV File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
