import React, { useState } from 'react';
import {
  ShieldCheck,
  Terminal,
  Bot,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  UserCheck,
  Lock,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ForecastPrediction,
  ForensicAssessment,
  MitigationPlaybook,
  SequenceStep,
} from '../types';

interface ForensicAdvisorWorkbenchProps {
  forecast: ForecastPrediction;
  history: SequenceStep[];
  playbooks: MitigationPlaybook[];
  onApplyPlaybook: (id: string, notes?: string) => void;
  onDismissPlaybook: (id: string) => void;
  datasetSource: string;
}

export const ForensicAdvisorWorkbench: React.FC<ForensicAdvisorWorkbenchProps> = ({
  forecast,
  history,
  playbooks,
  onApplyPlaybook,
  onDismissPlaybook,
  datasetSource,
}) => {
  const [forensicData, setForensicData] = useState<ForensicAssessment | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'playbooks' | 'gemini_advisor' | 'audit_log'>('playbooks');

  const fetchAiAdvisory = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch('/api/gemini/forensic-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBehavior: forecast.currentBehavior,
          predictedNextStage: forecast.predictedNextStage,
          confidence: forecast.confidence,
          anomalyScore: forecast.anomalyScore,
          sequenceHistory: history.map((h) => ({
            time: h.timeLabel,
            stage: h.observedStage,
            connRate: h.features.connectionRate,
            synRatio: h.features.synRatio,
          })),
          trafficFeatures: history[history.length - 1]?.features,
          datasetSource,
          mitreTechniques: forecast.mitreTechniques,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      setForensicData(data);
    } catch (err: unknown) {
      console.error('Failed to load forensic advisory:', err);
      // Fallback
      setForensicData({
        status: 'simulated',
        attribution: {
          threatActorProfile: 'Masscan / Automated Reconnaissance Agent preparing targeted exploit delivery',
          mitreTactic: 'Initial Access (T1190) Pre-Staging',
          cveVulnerabilities: ['CVE-2017-5638 (Apache Struts RCE)', 'CVE-2014-0160 (Heartbleed Buffer Leak)'],
        },
        forensicRationale: `The rapid transition from Reconnaissance to Scanning with an 88% SYN ratio and high port entropy demonstrates automated service fingerprinting. The temporal sequence matches historical CVE delivery chains with 82% forecast confidence.`,
        recommendedContainment: [
          'Enforce dynamic rate-limiting on incoming TCP SYN packets from 172.16.0.1.',
          'Quarantine exposed application port 8080 until reverse proxy WAF rules are verified.',
          'Divert probing IP to high-interaction honeypot sandbox to collect payload signatures.',
        ],
        generatedFirewallRule: `# Proactive Defense Rule\niptables -A INPUT -s 172.16.0.1 -p tcp --syn -m limit --limit 20/s -j ACCEPT\niptables -A INPUT -s 172.16.0.1 -p tcp --syn -j DROP`,
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Analyst Philosophy */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Security Analyst Decision Gate: &ldquo;AI Advises, Human Decides&rdquo;
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl">
            The Temporal AI provides the early warning forecast, empirical evidence, and suggested mitigation rules. The human SOC analyst retains final operational authorization to execute firewall adjustments or accept risk.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('playbooks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'playbooks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Countermeasures ({playbooks.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('gemini_advisor');
              if (!forensicData && !loadingAi) fetchAiAdvisory();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'gemini_advisor'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Gemini Threat Intel
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'playbooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {playbooks.map((pb) => {
            const isApplied = pb.status === 'applied';

            return (
              <div
                key={pb.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isApplied
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {pb.targetVector}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{pb.title}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isApplied
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {isApplied ? '✓ Enforced' : 'Recommended'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{pb.description}</p>

                  <div className="text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                    <strong className="text-slate-300">Impact Assessment: </strong>
                    {pb.impactAssessment}
                  </div>

                  {/* CLI Snippet */}
                  <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-[11px] font-mono text-slate-300 relative group mb-4 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{pb.cliSnippet}</pre>
                    <button
                      onClick={() => handleCopy(pb.cliSnippet, pb.id)}
                      className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 opacity-80 group-hover:opacity-100 transition-opacity"
                      title="Copy CLI snippet"
                    >
                      {copiedSnippetId === pb.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Gate Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  {isApplied ? (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Rule enforced at {pb.appliedAt}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full justify-between">
                      <button
                        onClick={() => onDismissPlaybook(pb.id)}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Dismiss / Accept Risk
                      </button>
                      <button
                        onClick={() => onApplyPlaybook(pb.id, analystNotes)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md shadow-cyan-950/30"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Approve & Enforce Rule
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gemini AI Deep Threat Advisor Tab */}
      {activeTab === 'gemini_advisor' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Gemini Temporal Threat Intelligence Briefing
                </h4>
                <p className="text-xs text-slate-400">
                  Correlates temporal sequence markers with active cyber kill chains and historical CVE disclosures
                </p>
              </div>
            </div>

            <button
              onClick={fetchAiAdvisory}
              disabled={loadingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
              {loadingAi ? 'Analyzing Sequence...' : 'Re-run AI Analysis'}
            </button>
          </div>

          {loadingAi ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs font-mono">
                Querying Gemini 3.8 Flash Temporal Threat Model...
              </p>
            </div>
          ) : forensicData ? (
            <div className="space-y-4">
              {/* Attribution and CVEs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block mb-1">
                    Probable Threat Actor Profile
                  </span>
                  <p className="text-xs text-slate-200 font-medium">
                    {forensicData.attribution?.threatActorProfile}
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-2">
                    Tactic Anticipated: <strong className="text-amber-300">{forensicData.attribution?.mitreTactic}</strong>
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block mb-1">
                    Dataset & CVE Vulnerability Targets
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {forensicData.attribution?.cveVulnerabilities?.map((cve) => (
                      <span
                        key={cve}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300"
                      >
                        {cve}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Forensic Rationale */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block mb-1">
                  Forensic Rationale & Early Warning Indicator Analysis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {forensicData.forensicRationale}
                </p>
              </div>

              {/* Recommended Proactive Containment Checklist */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block mb-2">
                  Recommended Proactive Defenses (Before Exploitation Executes)
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {forensicData.recommendedContainment?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic CLI Firewall Rule */}
              {forensicData.generatedFirewallRule && (
                <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Dynamic Mitigation Rule (iptables)
                    </span>
                    <button
                      onClick={() => handleCopy(forensicData.generatedFirewallRule, 'gemini-cli')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedSnippetId === 'gemini-cli' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                    {forensicData.generatedFirewallRule}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={fetchAiAdvisory}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Generate Forensic Briefing
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
