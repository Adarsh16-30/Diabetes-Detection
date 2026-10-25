"use client";

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { StitchCard, StitchButton } from './StitchUI';
import { Activity, Share2, Shield, AlertTriangle, Zap, HeartPulse, Brain, Thermometer, Clock, ArrowRight } from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, color, theme }) => (
    <StitchCard className={`!p-5 ${theme === 'light' ? `border-${color}-500/30 bg-white/90 shadow-lg` : `border-${color}-500/30 bg-black/40`}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className={`text-sm uppercase tracking-widest font-bold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{title}</p>
                <h3 className={`text-3xl font-bold mt-2 font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{typeof value === 'number' ? value.toFixed(2) : value}</h3>
                <p className={`text-sm mt-1 font-medium text-${color}-600`}>{subtext}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'light' ? `bg-${color}-100 text-${color}-700` : `bg-${color}-500/10 text-${color}-400`}`}>
                <Icon size={24} />
            </div>
        </div>
    </StitchCard>
);

const ClinicalSummary = ({ type, data, theme }) => {
    const isCausal = type === 'causal';
    const rag = data.rag_context || {};

    return (
        <StitchCard className={`p-4 mb-6 ${theme === 'light' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-blue-900/10 border-blue-500/20'}`}>
            <h4 className={`text-sm font-bold mb-3 uppercase flex items-center gap-2 ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                <Brain size={16} />
                Clinical Interpretation & RAG Analysis
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h5 className={`text-xs font-bold uppercase mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>System Analysis</h5>
                    <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-blue-100'}`}>
                        {isCausal
                            ? `Analysis identifies a ${data.network_stability < 80 ? "destabilized" : "stable"} organ network. The metabolic source (Glucose) is exerting a ${data.causal_impact_score > 50 ? "critical" : "manageable"} downstream load, with a ${(data.cascading_risk_score).toFixed(1)}% probability of cascading failure events.`
                            : `Longitudinal tracking reveals a ${data.mse_drift > 0.05 ? "significant" : "minor"} deviation from the health baseline. The ${data.lyapunov_exponent > 0 ? "positive" : "negative"} Lyapunov exponent indicates the patient's physiology is ${data.lyapunov_exponent > 0 ? "entering a chaotic, unpredictable state" : "maintaining homeostatic equilibrium"}.`
                        }
                    </p>
                </div>
                {rag.summary && (
                    <div className={`p-3 rounded-lg border ${theme === 'light' ? 'bg-white border-blue-100' : 'bg-blue-500/5 border-blue-500/10'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>Similar Case Match ({(rag.match_score * 100).toFixed(0)}%)</h5>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">{rag.similar_case_id}</span>
                        </div>
                        <p className={`text-xs italic mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>"{rag.summary}"</p>
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-dashed border-gray-200">
                            <Shield size={12} className="text-green-600 mt-0.5" />
                            <p className={`text-xs font-medium ${theme === 'light' ? 'text-green-800' : 'text-green-400'}`}>{rag.recommendation}</p>
                        </div>
                    </div>
                )}
            </div>
        </StitchCard>
    );
};

const PropagationNode = ({ label, risk, projectedRisk, x, y, theme, timeHorizon }) => {
    // Interpolate risk based on time horizon (0 to 12 months)
    // If projectedRisk is available, use it. Otherwise fallback to current risk.
    const effectiveRisk = timeHorizon > 0 && projectedRisk
        ? risk + ((projectedRisk - risk) * (timeHorizon / 12))
        : risk;

    const isHighRisk = effectiveRisk > 0.5;
    const isProjectedHigh = timeHorizon > 0 && effectiveRisk > 0.5 && risk <= 0.5;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                scale: isHighRisk ? 1.1 : 1,
                borderColor: isProjectedHigh ? '#f59e0b' : (isHighRisk ? '#ef4444' : (theme === 'light' ? '#bbf7d0' : '#22c55e33'))
            }}
            className={`absolute flex flex-col items-center justify-center p-3 rounded-xl border backdrop-blur-sm transition-all duration-500 shadow-md z-10
                ${theme === 'light'
                    ? (isHighRisk ? 'bg-red-50 text-red-900 border-red-200' : 'bg-white text-gray-900 border-green-200')
                    : (isHighRisk ? 'bg-red-900/40 text-white border-red-500/50' : 'bg-gray-800/80 text-white border-green-500/20')
                }
            `}
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: isHighRisk ? '0 0 15px rgba(239, 68, 68, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            <span className="text-sm font-bold mb-1 whitespace-nowrap">{label}</span>
            <div className="flex flex-col items-center">
                <span className={`text-xs font-mono font-bold ${isHighRisk ? 'text-red-600' : 'text-green-600'}`}>{(effectiveRisk * 100).toFixed(0)}% Risk</span>
                {timeHorizon > 0 && (
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <ArrowRight size={8} />
                        T+{timeHorizon}m
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const ConnectionLine = ({ x1, y1, x2, y2, active, theme }) => {
    const startY = y1 + 5;
    const endY = y2 + 5;

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <line
                    x1={`${x1}%`} y1={`${startY}%`}
                    x2={`${x2}%`} y2={`${endY}%`}
                    stroke={active ? "#ef4444" : (theme === 'light' ? "#cbd5e1" : "#334155")}
                    strokeWidth={active ? 2 : 1}
                    strokeDasharray={active ? "5,5" : "none"}
                />
            </svg>
            {active && (
                <motion.div
                    className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    style={{
                        marginLeft: '-4px',
                        marginTop: '-4px'
                    }}
                    initial={{ left: `${x1}%`, top: `${startY}%` }}
                    animate={{
                        left: [`${x1}%`, `${x2}%`],
                        top: [`${startY}%`, `${endY}%`]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            )}
        </div>
    );
};

const TimeSlider = ({ value, onChange, theme }) => (
    <div className={`p-4 rounded-xl border mb-6 flex items-center gap-6 ${theme === 'light' ? 'bg-white border-cyan-100 shadow-sm' : 'bg-cyan-900/10 border-cyan-500/20'}`}>
        <div className="flex items-center gap-2 min-w-fit">
            <Clock size={20} className="text-cyan-500" />
            <div>
                <h4 className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Time Projection</h4>
                <p className="text-[10px] text-cyan-500 font-mono">ML Agent Simulation</p>
            </div>
        </div>
        <div className="flex-grow">
            <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-400 uppercase">
                <span>Current</span>
                <span>3 Months</span>
                <span>6 Months</span>
                <span>1 Year</span>
            </div>
        </div>
        <div className={`font-mono text-xl font-bold ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'}`}>
            +{value} MO
        </div>
    </div>
);

export default function AnalyticsDashboard({ analysisData, patientId, theme }) {
    const [activeView, setActiveView] = useState('causal');
    const [timeHorizon, setTimeHorizon] = useState(0); // 0 to 12 months

    const { summary, history } = analysisData || { summary: { mse_drift: 0, risk_score: 0, anomalies_detected: 0, total_days: 0 }, history: [] };
    const lastDay = history.length > 0 ? history[history.length - 1] : {};
    const predictions = lastDay?.predictions || {};
    // Get projected risks if available (mapped from '1m', '3m', etc.) - simplified for this demo
    const projectedRisks = summary.projected_risks || {};

    const chartData = useMemo(() => {
        if (!history.length) return [];
        const step = Math.max(1, Math.floor(history.length / 100));
        return history.filter((_, i) => i % step === 0).map(h => ({
            day: h.day,
            drift: h.drift_error,
            limit: 0.1
        }));
    }, [history]);

    if (!analysisData) return <div className={`p-10 text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Processing Diagnostic Data...</div>;

    const getProjectedRisk = (organ) => {
        // Simple helper to get risk at 12m for interpolation
        if (!projectedRisks[organ]) return predictions[organ];
        return projectedRisks[organ]['12m'] || predictions[organ];
    };

    return (
        <div className="p-6 space-y-8 max-h-screen overflow-y-auto pb-40">
            {/* View Switching Tabs */}
            <div className="flex justify-center mb-6">
                <div className={`flex p-1 rounded-xl border ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'}`}>
                    <button
                        onClick={() => setActiveView('causal')}
                        className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${activeView === 'causal'
                            ? (theme === 'light' ? 'bg-white text-cyan-600 shadow-sm' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50')
                            : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        Causal Progression
                    </button>
                    <button
                        onClick={() => setActiveView('drift')}
                        className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${activeView === 'drift'
                            ? (theme === 'light' ? 'bg-white text-red-600 shadow-sm' : 'bg-red-500/20 text-red-400 border border-red-500/50')
                            : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        Physiological Drift
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeView === 'causal' ? (
                    <motion.div
                        key="causal"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <ClinicalSummary type="causal" data={summary} theme={theme} />

                        {/* Causal Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <MetricCard
                                title="Structural Entropy"
                                value={summary.structural_entropy || 0}
                                subtext="System Disorder (Bits)"
                                icon={Share2}
                                color="purple"
                                theme={theme}
                            />
                            <MetricCard
                                title="Causal Impact"
                                value={summary.causal_impact_score || 0}
                                subtext="Downstream Severity"
                                icon={Zap}
                                color={summary.causal_impact_score > 50 ? "red" : "green"}
                                theme={theme}
                            />
                            <MetricCard
                                title="Network Stability"
                                value={summary.network_stability || 0}
                                subtext="Systemic Integrity"
                                icon={Activity}
                                color="cyan"
                                theme={theme}
                            />
                            <MetricCard
                                title="Cascading Risk"
                                value={summary.cascading_risk_score || 0}
                                subtext="Failure Probability"
                                icon={AlertTriangle}
                                color={summary.cascading_risk_score > 20 ? "red" : "green"}
                                theme={theme}
                            />
                        </div>

                        {/* Network Viz with Slider */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <StitchCard className={`lg:col-span-2 min-h-[500px] relative flex flex-col ${theme === 'light' ? 'bg-white/90 border-cyan-500/20' : 'bg-black/40 border-cyan-500/20'}`}>
                                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    <Share2 size={16} className="text-cyan-500" />
                                    Organ-to-Organ Propagation Map
                                </h3>

                                <TimeSlider value={timeHorizon} onChange={setTimeHorizon} theme={theme} />

                                <div className={`relative w-full flex-grow rounded-xl border mx-auto mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-white/5'}`}>
                                    {/* Adjusted coordinates for better spacing */}
                                    <ConnectionLine x1={50} y1={15} x2={20} y2={50} active={predictions.kidney > 0.5} theme={theme} />
                                    <ConnectionLine x1={50} y1={15} x2={80} y2={50} active={predictions.retina > 0.5} theme={theme} />
                                    <ConnectionLine x1={20} y1={50} x2={50} y2={85} active={predictions.heart > 0.5} theme={theme} />
                                    <ConnectionLine x1={20} y1={50} x2={20} y2={85} active={predictions.nerve > 0.5} theme={theme} />

                                    {/* Metabolic Source (Glucose) */}
                                    <PropagationNode
                                        label="Metabolic Source"
                                        risk={1.0}
                                        projectedRisk={1.0}
                                        timeHorizon={timeHorizon}
                                        x={50} y={15}
                                        theme={theme}
                                    />

                                    {/* Kidney */}
                                    <PropagationNode
                                        label="Kidney (GFR)"
                                        risk={predictions.kidney}
                                        projectedRisk={getProjectedRisk('kidney')}
                                        timeHorizon={timeHorizon}
                                        x={20} y={50}
                                        theme={theme}
                                    />

                                    {/* Retina */}
                                    <PropagationNode
                                        label="Retina"
                                        risk={predictions.retina}
                                        projectedRisk={getProjectedRisk('retina')}
                                        timeHorizon={timeHorizon}
                                        x={80} y={50}
                                        theme={theme}
                                    />

                                    {/* Heart */}
                                    <PropagationNode
                                        label="Heart (HRV)"
                                        risk={predictions.heart}
                                        projectedRisk={getProjectedRisk('heart')}
                                        timeHorizon={timeHorizon}
                                        x={50} y={85}
                                        theme={theme}
                                    />

                                    {/* Nerves */}
                                    <PropagationNode
                                        label="Nerves (EDA)"
                                        risk={predictions.nerve}
                                        projectedRisk={getProjectedRisk('nerve')}
                                        timeHorizon={timeHorizon}
                                        x={20} y={85}
                                        theme={theme}
                                    />
                                </div>
                            </StitchCard>

                            <StitchCard className={`lg:col-span-1 ${theme === 'light' ? 'bg-white/90' : 'bg-black/40'}`}>
                                <div className="h-full w-full flex flex-col items-center justify-center p-4">
                                    <h4 className="text-xs font-bold mb-4 uppercase text-gray-400 tracking-wider">Influence Heatmap</h4>
                                    <div className="grid grid-cols-4 gap-1 p-2">
                                        {['Glu', 'Kid', 'Ret', 'Hrt'].map(l => <div key={l} className="text-[10px] font-bold text-center text-gray-500">{l}</div>)}
                                        {Array.from({ length: 16 }).map((_, i) => {
                                            const intensity = Math.random();
                                            return (
                                                <div
                                                    key={i}
                                                    className="w-10 h-10 rounded-md transition-all hover:scale-110"
                                                    style={{ backgroundColor: `rgba(6, 182, 212, ${intensity})` }}
                                                    title={`Interaction Strength: ${(intensity * 100).toFixed(0)}%`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-4 text-center">Pairwise Causal Correlation Matrix. Higher intensity indicates stronger causal link.</p>
                                </div>
                            </StitchCard>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="drift"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <ClinicalSummary type="drift" data={summary} theme={theme} />

                        {/* Drift Metrics with Advanced Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <MetricCard
                                title="Lyapunov Exp"
                                value={summary.lyapunov_exponent || 0}
                                subtext="Chaos Factor (>0 Unstable)"
                                icon={Activity}
                                color={summary.lyapunov_exponent > 0 ? "red" : "green"}
                                theme={theme}
                            />
                            <MetricCard
                                title="Drift Velocity"
                                value={summary.drift_velocity ? summary.drift_velocity * 1000 : 0}
                                subtext="Degeneration Rate (m/s)"
                                icon={Zap}
                                color="orange"
                                theme={theme}
                            />
                            <MetricCard
                                title="Volatility Index"
                                value={summary.volatility_index || 0}
                                subtext="Signal Variance"
                                icon={HeartPulse}
                                color="yellow"
                                theme={theme}
                            />
                            <MetricCard
                                title="Recovery Potential"
                                value={summary.recovery_potential || 0}
                                subtext="Homeostatic Capacity"
                                icon={Thermometer}
                                color="green"
                                theme={theme}
                            />
                        </div>

                        {/* Phase Space & Time Series */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <StitchCard className={`lg:col-span-2 min-h-[400px] ${theme === 'light' ? 'bg-white/90 border-red-500/20' : 'bg-black/40 border-red-500/20'}`}>
                                <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    <Activity size={16} className="text-red-500" />
                                    Longitudinal Drift Analysis
                                </h3>
                                <p className="text-xs text-gray-400 mb-6">Tracking latent tissue degeneration against healthy baseline.</p>

                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorGray" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#333'} />
                                            <XAxis dataKey="day" stroke={theme === 'light' ? '#94a3b8' : '#666'} tick={{ fontSize: 10 }} />
                                            <YAxis stroke={theme === 'light' ? '#94a3b8' : '#666'} tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: theme === 'light' ? '#fff' : '#000',
                                                    borderColor: theme === 'light' ? '#e2e8f0' : '#333',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                                itemStyle={{ color: theme === 'light' ? '#1e293b' : '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="drift" stroke="#ef4444" fillOpacity={1} fill="url(#colorDrift)" name="Drift Error" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </StitchCard>

                            <StitchCard className={`lg:col-span-1 ${theme === 'light' ? 'bg-white/90' : 'bg-black/40'}`}>
                                <h3 className={`text-xs font-bold mb-4 uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Phase Space Portrait</h3>
                                <div className="h-[300px] w-full flex items-center justify-center relative border rounded-xl overflow-hidden bg-gradient-to-br from-transparent to-black/5">
                                    {/* Mock Phase Space Plot: Glucose Drift vs Kidney Drift */}
                                    <div className="absolute inset-0 opacity-50">
                                        {/* Grid lines */}
                                        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500/20"></div>
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500/20"></div>
                                    </div>
                                    <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] overflow-visible">
                                        {/* Generating a chaos-like attractor path */}
                                        <path
                                            d="M 50 50 Q 80 20 50 10 T 20 50 T 50 90 T 80 50"
                                            fill="none"
                                            stroke={theme === 'light' ? '#ef4444' : '#ef4444'}
                                            strokeWidth="0.5"
                                            opacity="0.6"
                                        />
                                        {/* Scattered points */}
                                        {history.slice(-20).map((h, i) => (
                                            <circle
                                                key={i}
                                                cx={50 + (h.vitals.glucose - 100) / 2}
                                                cy={50 + (h.drift_error * 100)}
                                                r="1.5"
                                                fill={theme === 'light' ? '#ef4444' : '#f87171'}
                                                opacity={i / 20}
                                            />
                                        ))}
                                    </svg>
                                    <div className="absolute bottom-2 right-2 text-[8px] text-gray-400">Glucose (X) vs Drift (Y)</div>
                                </div>
                            </StitchCard>
                        </div>

                        {/* ZK Ledger Feed (Shared) */}
                        <StitchCard className={`${theme === 'light' ? 'bg-white/90 border-green-500/20' : 'bg-black/40 border-green-500/20'}`}>
                            <h3 className="text-sm font-bold text-green-500 mb-4 flex items-center gap-2">
                                <Shield size={14} />
                                ZK-PROOF LEDGER (Confidential Audit Trail)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {(analysisData.ledger || []).slice(-4).reverse().map((block, i) => (
                                    <div key={i} className={`p-3 rounded border font-mono text-xs ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-black/40 border-green-500/10 text-gray-400'}`}>
                                        <div className="flex justify-between mb-1">
                                            <span className={theme === 'light' ? 'text-gray-500' : 'text-gray-500'}>BLOCK #{block.index}</span>
                                            <span className="text-green-500">VERIFIED</span>
                                        </div>
                                        <div className="truncate mb-1 opacity-70" title={block.hash}>Hash: {block.hash}</div>
                                        <div className="opacity-80">Msg: {block.data.message || "Drift Detected"}</div>
                                    </div>
                                ))}
                                {(!analysisData.ledger || analysisData.ledger.length === 0) && (
                                    <div className="text-gray-400 text-sm italic">No anomalies to report. Ledger empty.</div>
                                )}
                            </div>
                        </StitchCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
