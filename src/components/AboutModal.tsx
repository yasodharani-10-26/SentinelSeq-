import React from 'react';
import {
  X,
  Shield,
  Clock,
  TrendingUp,
  Database,
  UserCheck,
  CheckCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              AI-Based Network Attack Forecasting
            </h2>
            <p className="text-xs text-cyan-400 font-mono">
              Temporal AI & Early Warning Cyber Kill-Chain Architecture
            </p>
          </div>
        </div>

        {/* Core Sentence Callout */}
        <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-4 mb-6 text-sm text-cyan-200 italic leading-relaxed">
          &ldquo;Our project uses AI to learn network behaviour over time and forecast the possible next stage of a cyberattack, giving security analysts an earlier and explainable warning so they can investigate and respond proactively.&rdquo;
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Problem vs Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                The Problem
              </span>
              <p>
                In traditional cybersecurity, intrusion detection systems only sound the alarm when malicious activity or payload execution is already in progress. However, cyber adversaries rarely strike in a single instantaneous step—they follow structured multi-stage kill chains.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Our Solution
              </span>
              <p>
                Instead of only detecting an attack after compromise, our AI models temporal sequences across time windows ($T_{-3}, T_{-2}, T_{-1}, T_0$). By learning sequence dynamics, it forecasts the next stage (e.g. <em>Scanning → Possible Exploitation</em>) before payload execution.
              </p>
            </div>
          </div>

          {/* How It Works Diagram */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-3">
              How It Works: End-to-End Pipeline
            </span>
            <div className="flex flex-wrap items-center justify-between gap-2 text-center font-mono text-[11px]">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Network Traffic</span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Feature Extraction</span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="bg-slate-900 border border-cyan-800/80 text-cyan-300 px-2 py-1 rounded">Temporal AI Model</span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="bg-slate-900 border border-amber-800/80 text-amber-300 px-2 py-1 rounded">Progression Forecast</span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="bg-slate-900 border border-emerald-800/80 text-emerald-300 px-2 py-1 rounded">SOC Workbench</span>
            </div>
          </div>

          {/* Datasets & Features */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
              Cybersecurity Datasets & Extracted Features
            </span>
            <p>
              Trained and verified on benchmark datasets including <strong className="text-white">CIC-IDS2017</strong> (Canadian Institute for Cybersecurity) and <strong className="text-white">UNSW-NB15</strong> (Cyber Range Lab of the Australian Centre for Cyber Security).
            </p>
            <p className="font-mono text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              Features studied: Packet Count • Connection Rate • Target Ports & Protocols • TCP Flags (SYN, ACK, FIN, RST) • Packet Size Variance • Flow Duration • Port Shannon Entropy.
            </p>
          </div>

          {/* Human-in-the-Loop Philosophy */}
          <div className="bg-indigo-950/30 border border-indigo-800/60 p-4 rounded-xl flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                Philosophy: AI Advises, Human Decides
              </span>
              <p className="text-slate-300">
                The AI does not unilaterally alter production firewall rules or disconnect servers. It provides the early forecast, empirical evidence (SHAP indicators), and suggested containment playbooks, ensuring the security analyst makes the final operational decision.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
          >
            Close & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
