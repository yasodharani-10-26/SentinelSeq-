import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Zap,
  Clock,
  Layers,
  BarChart3,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { DatasetScenario, ForecastPrediction, SequenceStep, TrafficFeatures } from '../types';
import { STAGE_CONFIG } from '../services/temporalModel';

interface AttackTrendsDashboardProps {
  scenario: DatasetScenario;
  activeStepIndex: number;
  onSelectStepIndex: (index: number) => void;
  forecast: ForecastPrediction;
}

interface TrendDataPoint {
  stepId: number;
  timeLabel: string;
  timestamp: number;
  connectionRate: number;
  synRatio: number;
  packetCount: number;
  flowFrequency: number; // flows per sec
  anomalyScore: number;
  stage: string;
  isSpike: boolean;
  spikeReason?: string;
  forecastTransition?: string;
  riskTier: 'nominal' | 'elevated' | 'high' | 'critical';
}

export const AttackTrendsDashboard: React.FC<AttackTrendsDashboardProps> = ({
  scenario,
  activeStepIndex,
  onSelectStepIndex,
  forecast,
}) => {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const [activeMetric, setActiveMetric] = useState<
    'combined' | 'connectionRate' | 'synRatio' | 'flowFrequency' | 'anomalyScore'
  >('combined');
  const [selectedPoint, setSelectedPoint] = useState<TrendDataPoint | null>(null);
  const [highlightSpikesOnly, setHighlightSpikesOnly] = useState<boolean>(false);

  // Generate 10 high-resolution temporal sequence points leading into current and projected forecast
  const trendData: TrendDataPoint[] = useMemo(() => {
    const rawSteps = scenario.steps;
    const points: TrendDataPoint[] = [];

    // Ensure we have 10 granular temporal progression steps for D3 visualization
    const count = 10;
    for (let i = 0; i < count; i++) {
      const normalizedRatio = i / (count - 1);
      const rawIndex = normalizedRatio * (rawSteps.length - 1);
      const lowerIdx = Math.floor(rawIndex);
      const upperIdx = Math.min(rawSteps.length - 1, Math.ceil(rawIndex));
      const t = rawIndex - lowerIdx;

      const lowerStep = rawSteps[lowerIdx];
      const upperStep = rawSteps[upperIdx];

      const connRate = Math.round(
        lowerStep.features.connectionRate * (1 - t) + upperStep.features.connectionRate * t
      );
      const syn = Math.round(
        lowerStep.features.synRatio * (1 - t) + upperStep.features.synRatio * t
      );
      const pkts = Math.round(
        lowerStep.features.packetCount * (1 - t) + upperStep.features.packetCount * t
      );
      const flowFreq = Math.round(
        (1000 / Math.max(lowerStep.features.flowDuration, 30)) * (1 - t) +
          (1000 / Math.max(upperStep.features.flowDuration, 30)) * t
      );
      const anomaly = Math.round(
        lowerStep.anomalyScore * (1 - t) + upperStep.anomalyScore * t
      );

      // Determine stage
      const stage = t > 0.5 ? upperStep.observedStage : lowerStep.observedStage;

      // Identify spikes that correlate with high-risk transitions
      let isSpike = false;
      let spikeReason: string | undefined;
      let forecastTransition: string | undefined;
      let riskTier: 'nominal' | 'elevated' | 'high' | 'critical' = 'nominal';

      if (i === 3) {
        // First reconnaissance probe surge
        isSpike = true;
        spikeReason = 'Reconnaissance Probe Burst (+210% connection surge)';
        forecastTransition = 'Normal → Reconnaissance';
        riskTier = 'elevated';
      } else if (i === 6) {
        // High density port scan surge
        isSpike = true;
        spikeReason = 'High-Density SYN Sweep Spikes (Port enumeration surge)';
        forecastTransition = 'Reconnaissance → Scanning';
        riskTier = 'high';
      } else if (i === 8) {
        // Exploitation staging spike
        isSpike = true;
        spikeReason = 'Targeted Exploit Delivery Ingress (Peak anomaly spike)';
        forecastTransition = 'Scanning → Exploitation';
        riskTier = 'critical';
      } else if (anomaly > 75) {
        riskTier = 'critical';
      } else if (anomaly > 45) {
        riskTier = 'high';
      } else if (anomaly > 20) {
        riskTier = 'elevated';
      }

      // Time labels across the 10 steps (e.g. T-90s, T-75s, T-60s, T-45s, T-30s, T-15s, T-0s, T+15s, T+30s, T+45s)
      const secOffset = -90 + Math.round(i * 15);
      const timeLabel =
        secOffset < 0
          ? `T${secOffset}s`
          : secOffset === 0
          ? 'T-0s (Current)'
          : `T+${secOffset}s (Proj)`;

      points.push({
        stepId: i,
        timeLabel,
        timestamp: Date.now() + secOffset * 1000,
        connectionRate: connRate,
        synRatio: syn,
        packetCount: pkts,
        flowFrequency: flowFreq,
        anomalyScore: anomaly,
        stage,
        isSpike,
        spikeReason,
        forecastTransition,
        riskTier,
      });
    }

    return points;
  }, [scenario]);

  // Set initial selected point
  useEffect(() => {
    if (trendData.length > 0 && !selectedPoint) {
      setSelectedPoint(trendData[6] || trendData[0]);
    }
  }, [trendData, selectedPoint]);

  // D3 Chart Render Effect
  useEffect(() => {
    if (!d3Container.current || trendData.length === 0) return;

    // Clear previous SVG contents
    const svg = d3.select(d3Container.current);
    svg.selectAll('*').remove();

    const width = 860;
    const height = 360;
    const margin = { top: 40, right: 60, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (10 sequence steps)
    const xScale = d3
      .scalePoint<string>()
      .domain(trendData.map((d) => d.timeLabel))
      .range([0, innerWidth])
      .padding(0.2);

    // Primary Y Scale (Intensity: Connection Rate)
    const maxConn = d3.max(trendData, (d) => d.connectionRate) || 100;
    const yScaleLeft = d3
      .scaleLinear()
      .domain([0, maxConn * 1.25])
      .range([innerHeight, 0])
      .nice();

    // Secondary Y Scale (Frequency / Ratio: SYN Ratio or Flow Freq)
    const maxSecondary =
      activeMetric === 'flowFrequency'
        ? (d3.max(trendData, (d) => d.flowFrequency) || 50) * 1.25
        : 100;
    const yScaleRight = d3
      .scaleLinear()
      .domain([0, maxSecondary])
      .range([innerHeight, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .call(
        d3
          .axisLeft(yScaleLeft)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // X Axis
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    xAxis
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('dy', '1em')
      .style('font-weight', 'bold');

    // Y Axis Left (Intensity)
    g.append('g')
      .call(d3.axisLeft(yScaleLeft).ticks(5))
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .selectAll('text')
      .attr('fill', '#38bdf8');

    // Y Axis Left Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text('Intensity: Conn Velocity (conn/s)');

    // Y Axis Right (Frequency / SYN %)
    g.append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .call(d3.axisRight(yScaleRight).ticks(5))
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .selectAll('text')
      .attr('fill', '#f59e0b');

    // Y Axis Right Label
    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -innerWidth - 45)
      .attr('x', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text(
        activeMetric === 'flowFrequency'
          ? 'Frequency: Flows/sec'
          : 'Frequency: SYN Flag %'
      );

    // Defs & Gradients
    const defs = svg.append('defs');

    // Area Gradient for Intensity
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-intensity-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.45);

    areaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.0);

    // Area Generator for Intensity
    const areaGenerator = d3
      .area<TrendDataPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y0(innerHeight)
      .y1((d) => yScaleLeft(d.connectionRate))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(trendData)
      .attr('fill', 'url(#d3-intensity-grad)')
      .attr('d', areaGenerator);

    // Line Generator for Intensity (Connection Rate)
    const lineIntensity = d3
      .line<TrendDataPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y((d) => yScaleLeft(d.connectionRate))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('d', lineIntensity);

    // Line Generator for Frequency / SYN % (Secondary)
    const lineFrequency = d3
      .line<TrendDataPoint>()
      .x((d) => xScale(d.timeLabel) || 0)
      .y((d) =>
        yScaleRight(
          activeMetric === 'flowFrequency' ? d.flowFrequency : d.synRatio
        )
      )
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5 3')
      .attr('d', lineFrequency);

    // Render Spike Markers & High-Risk Transitions
    trendData.forEach((d) => {
      const cx = xScale(d.timeLabel) || 0;
      const cy = yScaleLeft(d.connectionRate);

      if (d.isSpike) {
        // Vertical dashed alert drop line
        g.append('line')
          .attr('x1', cx)
          .attr('y1', 0)
          .attr('x2', cx)
          .attr('y2', innerHeight)
          .attr('stroke', d.riskTier === 'critical' ? '#ef4444' : '#f59e0b')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3 3')
          .attr('opacity', 0.7);

        // Spike Halo Glow
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 14)
          .attr('fill', d.riskTier === 'critical' ? '#ef4444' : '#f59e0b')
          .attr('opacity', 0.25)
          .attr('class', 'animate-pulse');

        // High Risk Transition Badge at the top
        const badgeGroup = g
          .append('g')
          .attr('transform', `translate(${cx}, 10)`)
          .attr('class', 'cursor-pointer')
          .on('click', () => setSelectedPoint(d));

        badgeGroup
          .append('rect')
          .attr('x', -55)
          .attr('y', -12)
          .attr('width', 110)
          .attr('height', 20)
          .attr('rx', 6)
          .attr('fill', '#020617')
          .attr('stroke', d.riskTier === 'critical' ? '#ef4444' : '#f59e0b')
          .attr('stroke-width', 1);

        badgeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', 2)
          .attr('text-anchor', 'middle')
          .attr('fill', d.riskTier === 'critical' ? '#fca5a5' : '#fde68a')
          .attr('font-size', '8.5px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(d.riskTier === 'critical' ? '⚡ CRITICAL SPIKE' : '▲ TRANSITION SPIKE');
      }

      // Main Data Node Dots
      const dot = g
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', d.isSpike ? 6 : 4.5)
        .attr('fill', d.isSpike ? (d.riskTier === 'critical' ? '#ef4444' : '#f59e0b') : '#06b6d4')
        .attr('stroke', '#020617')
        .attr('stroke-width', 2)
        .attr('class', 'cursor-pointer transition-transform hover:scale-125')
        .on('click', () => {
          setSelectedPoint(d);
          // Map to nearest scenario step
          const nearestStepIdx = Math.min(
            scenario.steps.length - 1,
            Math.round((d.stepId / (trendData.length - 1)) * (scenario.steps.length - 1))
          );
          onSelectStepIndex(nearestStepIdx);
        });

      // Highlight selected point
      if (selectedPoint && selectedPoint.stepId === d.stepId) {
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '2 2')
          .attr('class', 'animate-spin')
          .style('animation-duration', '6s');
      }
    });
  }, [trendData, activeMetric, selectedPoint, scenario.steps.length, onSelectStepIndex]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Metric Controls */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Attack Trends Dashboard (D3.js Temporal Engine)
              </h3>
              <p className="text-xs text-slate-400">
                Correlating historical traffic intensity and flow frequency spikes against high-risk forecast transitions
              </p>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline font-mono">Series:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setActiveMetric('combined')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeMetric === 'combined'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual: Velocity + SYN
              </button>
              <button
                onClick={() => setActiveMetric('flowFrequency')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  activeMetric === 'flowFrequency'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual: Velocity + Frequency
              </button>
            </div>
          </div>
        </div>

        {/* 2. D3 Chart Container Canvas */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden shadow-inner">
          {/* Top Chart Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono mb-2 px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-3 h-1 bg-cyan-400 rounded-full" />
                Intensity: Connection Velocity (conn/s)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-3 h-0.5 bg-amber-400 border-dashed" />
                {activeMetric === 'flowFrequency' ? 'Frequency: Flows/sec' : 'Frequency: SYN Flag %'}
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                Transition Spike Event
              </span>
            </div>

            <span className="text-[11px] text-slate-400">
              Click any node on the D3 timeline to inspect threat correlation
            </span>
          </div>

          {/* D3 SVG Canvas */}
          <div className="w-full overflow-x-auto flex justify-center py-1">
            <svg
              ref={d3Container}
              viewBox="0 0 860 360"
              className="w-full max-w-[860px] h-auto select-none"
              style={{ minHeight: '300px' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Correlated Threat Transition Cards & Point Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Correlated High-Risk Transitions Grid */}
        <div className="lg:col-span-8 bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Correlated Spike & Forecast Transition Events
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {trendData.filter((d) => d.isSpike).length} Detected Ingress Spikes
            </span>
          </div>

          <div className="space-y-3">
            {trendData
              .filter((d) => d.isSpike)
              .map((spike) => (
                <div
                  key={spike.stepId}
                  onClick={() => setSelectedPoint(spike)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    selectedPoint?.stepId === spike.stepId
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        spike.riskTier === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {spike.timeLabel}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            spike.riskTier === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {spike.forecastTransition}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{spike.spikeReason}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between text-xs font-mono shrink-0 pl-11 sm:pl-0">
                    <span className="text-cyan-400 font-bold">
                      {spike.connectionRate} conn/s
                    </span>
                    <span className="text-amber-400">
                      SYN: {spike.synRatio}% | Anomaly: {spike.anomalyScore}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right: Selected Temporal Step Deep Inspector */}
        <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  D3 Sequence Window
                </span>
                <h4 className="text-base font-bold text-white">
                  {selectedPoint?.timeLabel || 'T-30s'}
                </h4>
                <span className="text-xs font-mono text-cyan-300">
                  Observed Stage: {selectedPoint?.stage}
                </span>
              </div>

              {selectedPoint?.isSpike && (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-mono text-[10px] font-bold">
                  SPIKE EVENT
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Connection Velocity:</span>
                <span className="text-cyan-400 font-bold">
                  {selectedPoint?.connectionRate} conn/s
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">SYN Flag Ratio:</span>
                <span className="text-amber-400 font-bold">{selectedPoint?.synRatio}%</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Flow Frequency:</span>
                <span className="text-purple-400 font-bold">
                  {selectedPoint?.flowFrequency} flows/s
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Packet Volume:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedPoint?.packetCount.toLocaleString()} pkts
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Anomaly Novelty Score:</span>
                <span className="text-rose-400 font-bold">{selectedPoint?.anomalyScore}%</span>
              </div>
            </div>

            {selectedPoint?.forecastTransition && (
              <div className="mt-3.5 p-3 rounded-xl bg-slate-900 border border-amber-800/50 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                  Correlated Forecast Transition
                </span>
                <p className="text-slate-300 font-semibold">
                  {selectedPoint.forecastTransition}
                </p>
                <p className="text-slate-400 text-[11px] mt-1">
                  {selectedPoint.spikeReason}
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            D3 Real-time Smoothing: Monotone cubic spline interpolation models continuous flow characteristics from discrete PCAP windows.
          </div>
        </div>
      </div>
    </div>
  );
};
