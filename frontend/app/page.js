"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    CircleHelp,
    FileText,
    HeartPulse,
    LayoutDashboard,
    ListFilter,
    LockKeyhole,
    Menu,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Upload,
    Users,
    X,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const API_URL = "http://localhost:8000";

const palette = {
    cyan: "#0f766e",
    blue: "#2563eb",
    amber: "#b45309",
    red: "#b91c1c",
    slate: "#64748b",
};

function formatNumber(value, digits = 1) {
    return Number(value || 0).toFixed(digits);
}

function formatPercent(value) {
    return `${formatNumber(value, 0)}%`;
}

function riskTone(value) {
    if (value >= 0.65) return "critical";
    if (value >= 0.35) return "watch";
    return "stable";
}

function MetricCard({ label, value, detail, trend, icon: Icon, tone = "blue" }) {
    const toneClasses = {
        blue: "metric-blue",
        green: "metric-green",
        amber: "metric-amber",
        red: "metric-red",
    };
    return (
        <article className={`metric-card ${toneClasses[tone]}`}>
            <div className="metric-card-top">
                <span className="metric-label">{label}</span>
                <span className="metric-icon"><Icon size={17} strokeWidth={1.8} /></span>
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-detail">
                {trend !== undefined && (
                    <span className={trend >= 0 ? "trend-up" : "trend-down"}>
                        {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {Math.abs(trend).toFixed(1)}%
                    </span>
                )}
                <span>{detail}</span>
            </div>
        </article>
    );
}

function SectionHeader({ eyebrow, title, detail, action }) {
    return (
        <div className="section-header">
            <div>
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                <h2>{title}</h2>
                {detail && <p>{detail}</p>}
            </div>
            {action}
        </div>
    );
}

function EmptyState({ title, detail }) {
    return (
        <div className="empty-state">
            <Activity size={22} />
            <strong>{title}</strong>
            <span>{detail}</span>
        </div>
    );
}

function PatientAnalysisPage({ data, summary, history, projections, organData, patientId }) {
    const metrics = [
        ["Glucose", "glucose", "mg/dL"],
        ["Kidney GFR", "gfr", "mL/min"],
        ["Retina thickness", "retina", "µm"],
        ["Heart HRV", "hrv", "ms"],
        ["SpO2", "spo2", "%"],
        ["Skin temperature", "skin_temp", "°C"],
    ];
    const baseline = metrics.map(([label, key, unit]) => {
        const values = history.map((item) => Number(item.vitals?.[key] || 0)).filter((value) => Number.isFinite(value));
        const midpoint = Math.max(1, Math.floor(values.length / 2));
        const firstHalf = values.slice(0, midpoint);
        const latest = values[values.length - 1] || 0;
        const average = firstHalf.reduce((sum, value) => sum + value, 0) / (firstHalf.length || 1);
        return { label, unit, latest, average, delta: latest - average, min: Math.min(...values), max: Math.max(...values) };
    });
    const anomalyRows = history.filter((item) => item.is_anomaly).slice(-20).reverse();

    return (
        <div className="detail-page" id="analysis">
            <div className="detail-heading">
                <div><div className="eyebrow">Patient analysis</div><h2>Detailed record review</h2><p>Every signal is compared with this patient&apos;s learned baseline and modeled risk trajectory.</p></div>
                <div className="detail-id">Record <strong>{patientId}</strong></div>
            </div>
            <div className="analysis-stat-grid">
                <div><span>Observations</span><strong>{summary.total_days || history.length}</strong><small>records analyzed</small></div>
                <div><span>Anomalies</span><strong>{summary.anomalies_detected || 0}</strong><small>drift events detected</small></div>
                <div><span>Volatility index</span><strong>{formatNumber(summary.volatility_index, 4)}</strong><small>signal variability</small></div>
                <div><span>Lyapunov estimate</span><strong>{formatNumber(summary.lyapunov_exponent, 4)}</strong><small>system stability signal</small></div>
                <div><span>Causal impact</span><strong>{formatNumber(summary.causal_impact_score, 1)}</strong><small>downstream severity</small></div>
                <div><span>Structural entropy</span><strong>{formatNumber(summary.structural_entropy, 2)}</strong><small>risk distribution</small></div>
            </div>
            <div className="detail-grid">
                <section className="panel panel-wide">
                    <SectionHeader eyebrow="Baseline comparison" title="Patient-specific signal assessment" detail="Latest observation compared with the first half of the record." />
                    <div className="analysis-table">
                        <div className="analysis-table-head"><span>Signal</span><span>Latest</span><span>Baseline</span><span>Change</span><span>Observed range</span></div>
                        {baseline.map((item) => (
                            <div className="analysis-table-row" key={item.label}>
                                <strong>{item.label}</strong>
                                <span>{formatNumber(item.latest)} {item.unit}</span>
                                <span>{formatNumber(item.average)} {item.unit}</span>
                                <span className={item.delta > 0 ? "delta-up" : "delta-down"}>{item.delta >= 0 ? "+" : ""}{formatNumber(item.delta)} {item.unit}</span>
                                <span>{formatNumber(item.min)}–{formatNumber(item.max)} {item.unit}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="panel">
                    <SectionHeader eyebrow="Projection" title="Organ-system outlook" detail="Current averages and modeled 12-month values." />
                    <div className="projection-list">
                        {organData.map((item) => {
                            const projection = Number(projections[item.organ.toLowerCase()]?.["12m"] || item.projected || 0);
                            return <div className="projection-row" key={item.organ}><div><strong>{item.organ}</strong><span>Current {formatPercent(item.current * 100)}</span></div><div className="projection-bar"><i style={{ width: `${Math.min(100, projection * 100)}%` }} /></div><b>{formatPercent(projection * 100)}</b></div>;
                        })}
                    </div>
                </section>
                <section className="panel panel-wide">
                    <SectionHeader eyebrow="Anomaly review" title="Detected observations" detail="The most recent observations that exceeded the learned drift threshold." />
                    {anomalyRows.length ? <div className="analysis-table anomaly-table">
                        <div className="analysis-table-head"><span>Day</span><span>Drift error</span><span>Glucose</span><span>Kidney GFR</span><span>Audit identifier</span></div>
                        {anomalyRows.map((item) => <div className="analysis-table-row" key={`${item.day}-${item.block_hash}`}><strong>Day {item.day}</strong><span className="delta-up">{formatNumber(item.drift_error, 5)}</span><span>{formatNumber(item.vitals?.glucose)} mg/dL</span><span>{formatNumber(item.vitals?.gfr)} mL/min</span><code>{item.block_hash ? item.block_hash.slice(0, 14) : "Not recorded"}</code></div>)}
                    </div> : <EmptyState title="No anomalous observations" detail="The current record has no observations above the learned threshold." />}
                </section>
            </div>
        </div>
    );
}

function EvidenceReviewPage({ data, summary, history, patientId }) {
    const ledger = data?.ledger || [];
    const recentEvents = history.filter((item) => item.is_anomaly).slice(-15).reverse();
    return (
        <div className="detail-page" id="evidence">
            <div className="detail-heading">
                <div><div className="eyebrow">Evidence review</div><h2>Model evidence and audit trail</h2><p>Review the context used by the analysis and the integrity records generated for patient {patientId}.</p></div>
                <div className="evidence-integrity"><CheckCircle2 size={16} /> Analysis complete</div>
            </div>
            <div className="analysis-stat-grid evidence-stats">
                <div><span>Similar case</span><strong>{summary.rag_context?.similar_case_id || "None"}</strong><small>retrieved profile</small></div>
                <div><span>Match score</span><strong>{formatPercent(Number(summary.rag_context?.match_score || 0) * 100)}</strong><small>context similarity</small></div>
                <div><span>Ledger records</span><strong>{ledger.length}</strong><small>persisted blocks</small></div>
                <div><span>Drift events</span><strong>{recentEvents.length}</strong><small>events in review window</small></div>
            </div>
            <div className="detail-grid">
                <section className="panel panel-wide">
                    <SectionHeader eyebrow="Retrieved context" title="Similar case and recommendation" detail="Context retrieved from the prototype signal and literature stores." />
                    <div className="evidence-detail-grid">
                        <div className="evidence-detail-card"><span className="evidence-label">Similar patient profile</span><h3>{summary.rag_context?.similar_case_id || "No profile retrieved"}</h3><p>{summary.rag_context?.summary || "No similar profile was returned for this record."}</p></div>
                        <div className="evidence-detail-card"><span className="evidence-label">Reference recommendation</span><h3>Literature context</h3><p>{summary.rag_context?.recommendation || "No recommendation was generated."}</p></div>
                    </div>
                </section>
                <section className="panel">
                    <SectionHeader eyebrow="Integrity" title="Audit chain" />
                    <div className="integrity-card"><CheckCircle2 size={20} /><div><strong>Analysis evidence generated</strong><span>Each detected event has a deterministic audit identifier.</span></div></div>
                    <div className="ledger-summary"><span>Blocks available</span><strong>{ledger.length}</strong></div>
                    <div className="ledger-summary"><span>Newest block</span><code>{ledger.length ? String(ledger[ledger.length - 1].hash).slice(0, 16) : "No blocks"}</code></div>
                </section>
                <section className="panel panel-wide">
                    <SectionHeader eyebrow="Event evidence" title="Anomaly evidence timeline" detail="Signal values and audit identifiers associated with detected events." />
                    {recentEvents.length ? <div className="analysis-table">
                        <div className="analysis-table-head"><span>Day</span><span>Drift error</span><span>Risk state</span><span>Evidence hash</span><span>Signals</span></div>
                        {recentEvents.map((item) => <div className="analysis-table-row" key={`${item.day}-${item.block_hash}`}><strong>Day {item.day}</strong><span>{formatNumber(item.drift_error, 5)}</span><span className="risk-label critical">Review required</span><code>{item.block_hash ? item.block_hash.slice(0, 20) : "Unavailable"}</code><span>G {formatNumber(item.vitals?.glucose)} · GFR {formatNumber(item.vitals?.gfr)}</span></div>)}
                    </div> : <EmptyState title="No event evidence" detail="Detected anomaly evidence will appear here after analysis." />}
                </section>
            </div>
        </div>
    );
}

function AnalysisDashboard({ data, patientId, onRefresh, loading, activeView }) {
    const summary = data?.summary || {};
    const history = data?.history || [];
    const projections = summary.projected_risks || {};
    const latest = history[history.length - 1] || {};
    const latestVitals = latest.vitals || {};
    const [range, setRange] = useState("all");

    const chartData = useMemo(() => {
        const source = range === "90" ? history.slice(-90) : history;
        return source.map((item, index) => ({
            day: item.day || index + 1,
            glucose: Number(item.vitals?.glucose || 0),
            gfr: Number(item.vitals?.gfr || 0),
            hrv: Number(item.vitals?.hrv || 0),
            retina: Number(item.vitals?.retina_thickness || 0),
            drift: Number(item.drift_error || 0),
        }));
    }, [history, range]);

    const organData = ["kidney", "retina", "heart", "nerve"].map((organ) => ({
        organ: organ[0].toUpperCase() + organ.slice(1),
        current: Number(
            history.length
                ? history.reduce((sum, item) => sum + Number(item.predictions?.[organ] || 0), 0) / history.length
                : 0
        ),
        projected: Number(projections[organ]?.["12m"] || 0),
    }));

    const radarData = organData.map((item) => ({ subject: item.organ, risk: item.current * 100 }));
    const alerts = history.filter((item) => item.is_anomaly).length;
    const status = Number(summary.risk_score || 0) >= 30 ? "Needs review" : "Monitoring";
    const riskScore = Number(summary.risk_score || 0);

    if (activeView === "analysis") {
        return <div className="dashboard-shell"><PatientAnalysisPage data={data} summary={summary} history={history} projections={projections} organData={organData} patientId={patientId} /></div>;
    }
    if (activeView === "evidence") {
        return <div className="dashboard-shell"><EvidenceReviewPage data={data} summary={summary} history={history} patientId={patientId} /></div>;
    }

    return (
        <div className="dashboard-shell" id="overview">
            <header className="page-heading">
                <div>
                    <div className="breadcrumb">Patients <ChevronRight size={14} /> {patientId}</div>
                    <h1>Patient overview</h1>
                    <p>Longitudinal metabolic monitoring and organ-system risk analysis.</p>
                </div>
                <div className="heading-actions">
                    <span className={`status-badge ${status === "Monitoring" ? "status-stable" : "status-watch"}`}>
                        <span className="status-dot" /> {status}
                    </span>
                    <button className="button button-secondary" onClick={onRefresh} disabled={loading}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh analysis
                    </button>
                </div>
            </header>

            <section className="metric-grid">
                <MetricCard label="Composite risk" value={formatPercent(riskScore)} detail={`${alerts} anomalous observations`} trend={summary.drift_velocity * 100} icon={ShieldCheck} tone={riskScore >= 30 ? "red" : "blue"} />
                <MetricCard label="Drift error" value={formatNumber(summary.mse_drift, 4)} detail="Mean reconstruction error" icon={Activity} tone="amber" />
                <MetricCard label="Network stability" value={formatPercent(summary.network_stability)} detail="Causal system integrity" icon={BarChart3} tone="green" />
                <MetricCard label="Recovery potential" value={formatPercent(summary.recovery_potential)} detail="Projected resilience" icon={HeartPulse} tone="blue" />
            </section>

            <div className="dashboard-grid">
                <section className="panel panel-wide">
                    <SectionHeader
                        eyebrow="Physiological signals"
                        title="Longitudinal trends"
                        detail={`${history.length} observations in the current patient record`}
                        action={
                            <div className="segmented-control">
                                <button className={range === "90" ? "selected" : ""} onClick={() => setRange("90")}>90 days</button>
                                <button className={range === "all" ? "selected" : ""} onClick={() => setRange("all")}>Full record</button>
                            </div>
                        }
                    />
                    <div className="chart-legend">
                        <span><i className="legend-dot glucose" /> Glucose</span>
                        <span><i className="legend-dot gfr" /> Kidney GFR</span>
                        <span><i className="legend-dot hrv" /> Heart HRV</span>
                    </div>
                    <div className="chart-large">
                        {chartData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                                    <Tooltip contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                                    <Line type="monotone" dataKey="glucose" stroke="#2563eb" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="gfr" stroke="#0f766e" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="hrv" stroke="#b45309" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <EmptyState title="No longitudinal data" detail="Upload a patient record to populate the trend view." />}
                    </div>
                </section>

                <section className="panel">
                    <SectionHeader eyebrow="Latest observation" title="Current vitals" />
                    <div className="vitals-list">
                        {[
                            ["Glucose", latestVitals.glucose, "mg/dL"],
                            ["Kidney GFR", latestVitals.gfr, "mL/min"],
                            ["Heart HRV", latestVitals.hrv, "ms"],
                            ["SpO2", latestVitals.spo2, "%"],
                            ["Activity", latestVitals.activity, "steps"],
                        ].map(([label, value, unit]) => (
                            <div className="vital-row" key={label}>
                                <span>{label}</span>
                                <strong>{formatNumber(value, 1)} <small>{unit}</small></strong>
                            </div>
                        ))}
                    </div>
                    <div className="observation-note">
                        <CheckCircle2 size={16} />
                        <span>Latest record processed successfully</span>
                    </div>
                </section>

                <section className="panel">
                    <SectionHeader eyebrow="Organ systems" title="Risk profile" detail="Current average vs. 12-month projection" />
                    <div className="chart-medium">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={organData} layout="vertical" margin={{ left: 5, right: 8 }}>
                                <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                                <YAxis type="category" dataKey="organ" width={52} tickLine={false} axisLine={false} tick={{ fill: "#334155", fontSize: 11 }} />
                                <Tooltip formatter={(value) => formatPercent(value)} />
                                <Bar dataKey="current" name="Current" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={9} />
                                <Bar dataKey="projected" name="12 month" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={9} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="panel panel-wide" id="analysis">
                    <SectionHeader eyebrow="Causal analysis" title="Systemic risk map" detail="Relative propagation risk across modeled organ systems" />
                    <div className="split-visual">
                        <div className="chart-radar">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} outerRadius="72%">
                                    <PolarGrid stroke="#dbe4ee" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 11 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar dataKey="risk" stroke="#0f766e" fill="#0f766e" fillOpacity={0.18} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="organ-table">
                            <div className="table-head"><span>System</span><span>Current</span><span>12 month</span><span>State</span></div>
                            {organData.map((item) => (
                                <div className="table-row" key={item.organ}>
                                    <span>{item.organ}</span>
                                    <strong>{formatPercent(item.current * 100)}</strong>
                                    <span>{formatPercent(item.projected * 100)}</span>
                                    <span className={`risk-label ${riskTone(item.current)}`}>{riskTone(item.current)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="panel panel-wide">
                    <SectionHeader eyebrow="Model evidence" title="Drift and anomaly history" detail="Reconstruction error from the personalized autoencoder baseline" />
                    <div className="chart-medium">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="driftFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#b45309" stopOpacity={0.26} />
                                        <stop offset="100%" stopColor="#b45309" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="drift" stroke="#b45309" fill="url(#driftFill)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="panel" id="evidence">
                    <SectionHeader eyebrow="Retrieved evidence" title="Clinical context" />
                    <div className="evidence-card">
                        <div className="evidence-label">Similar patient profile</div>
                        <strong>{summary.rag_context?.similar_case_id || "No match"}</strong>
                        <p>{summary.rag_context?.summary || "Additional records are required for a contextual match."}</p>
                    </div>
                    <div className="evidence-card">
                        <div className="evidence-label">Reference recommendation</div>
                        <p>{summary.rag_context?.recommendation || "Collect additional observations before generating context."}</p>
                    </div>
                </section>
            </div>

            <footer className="dashboard-footer">
                <span><LockKeyhole size={13} /> Prototype analysis. Not for clinical diagnosis.</span>
                <span>Analysis generated for patient {patientId}</span>
            </footer>
        </div>
    );
}

export default function Home() {
    const [patientId, setPatientId] = useState("");
    const [inputId, setInputId] = useState("P001");
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [mobileNav, setMobileNav] = useState(false);
    const [activeView, setActiveView] = useState("overview");

    const runAnalysis = async (id) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/analyze/${encodeURIComponent(id)}`, { method: "POST" });
            if (!response.ok) throw new Error("The analysis service returned an error.");
            setAnalysisData(await response.json());
        } catch (requestError) {
            setError(`${requestError.message} Confirm that the FastAPI service is running on port 8000.`);
        } finally {
            setLoading(false);
        }
    };

    const openPatient = () => {
        const normalized = inputId.trim().toUpperCase();
        if (!normalized) return;
        setPatientId(normalized);
        runAnalysis(normalized);
    };

    const navigateTo = (section) => (event) => {
        event.preventDefault();
        setActiveView(section);
        setMobileNav(false);
    };

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        const normalized = inputId.trim().toUpperCase();
        if (!file || !normalized) return;
        setUploading(true);
        setError("");
        try {
            const body = new FormData();
            body.append("file", file);
            const response = await fetch(`${API_URL}/api/upload_data/${encodeURIComponent(normalized)}`, { method: "POST", body });
            const result = await response.json();
            if (!response.ok || result.status === "error") throw new Error(result.message || "Upload failed.");
            setPatientId(normalized);
            await runAnalysis(normalized);
        } catch (uploadError) {
            setError(uploadError.message);
        } finally {
            setUploading(false);
        }
    };

    if (!patientId) {
        return (
            <main className="access-page">
                <div className="access-grid" />
                <section className="access-card">
                    <div className="brand-lockup">
                        <div className="brand-mark">D</div>
                        <div><strong>Diabetes Detection</strong><span>Clinical intelligence workspace</span></div>
                    </div>
                    <div className="access-content">
                        <div className="eyebrow">Secure patient access</div>
                        <h1>Review a patient record</h1>
                        <p>Open the longitudinal analysis workspace to review metabolic signals, organ-system risk, and model evidence.</p>
                        <label className="field-label" htmlFor="patient-id">Patient ID</label>
                        <div className="input-with-icon"><Search size={17} /><input id="patient-id" value={inputId} onChange={(event) => setInputId(event.target.value)} onKeyDown={(event) => event.key === "Enter" && openPatient()} placeholder="Enter patient ID" /></div>
                        <button className="button button-primary button-full" onClick={openPatient} disabled={loading}>{loading ? "Loading record..." : "Open patient workspace"} <ChevronRight size={16} /></button>
                        <div className="access-divider"><span>or</span></div>
                        <label className="upload-drop">
                            <Upload size={18} />
                            <span><strong>{uploading ? "Uploading record..." : "Upload a CSV record"}</strong><small>Supported format: CSV</small></span>
                            <input type="file" accept=".csv" onChange={handleUpload} disabled={uploading} />
                        </label>
                        {error && <div className="error-banner"><AlertCircle size={16} />{error}</div>}
                    </div>
                    <div className="access-footer"><ShieldCheck size={14} /> Local prototype environment</div>
                </section>
            </main>
        );
    }

    return (
        <div className="app-frame">
            <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
                <div className="sidebar-brand"><div className="brand-mark small">D</div><div><strong>Diabetes<br />Detection</strong><span>Clinical workspace</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
                <div className="sidebar-section-label">Workspace</div>
                <nav className="sidebar-nav">
                    <a className={activeView === "overview" ? "active" : ""} href="#overview" onClick={navigateTo("overview")}><LayoutDashboard size={17} />Overview</a>
                    <a className={activeView === "analysis" ? "active" : ""} href="#analysis" onClick={navigateTo("analysis")}><BarChart3 size={17} />Patient analysis</a>
                    <a className={activeView === "evidence" ? "active" : ""} href="#evidence" onClick={navigateTo("evidence")}><FileText size={17} />Evidence review</a>
                </nav>
                <div className="sidebar-section-label">Patient</div>
                <div className="patient-switcher"><div className="patient-avatar">P</div><div><strong>{patientId}</strong><span>Active record</span></div><ChevronRight size={15} /></div>
                <div className="sidebar-bottom">
                    <div className="service-status"><span className="service-indicator" />Analysis service online</div>
                    <button className="sidebar-help"><CircleHelp size={16} />Documentation</button>
                    <button className="sidebar-help" onClick={() => { setPatientId(""); setAnalysisData(null); }}><Users size={16} />Switch patient</button>
                </div>
            </aside>
            <main className="main-frame">
                <header className="topbar">
                    <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
                    <div className="topbar-search"><Search size={16} /><input placeholder="Search workspace" /></div>
                    <div className="topbar-actions"><span className="environment-tag">Prototype environment</span><button className="icon-button"><SlidersHorizontal size={17} /></button><div className="user-avatar">AD</div></div>
                </header>
                {error && <div className="global-error"><AlertCircle size={16} /> {error}</div>}
                {analysisData ? <AnalysisDashboard data={analysisData} patientId={patientId} onRefresh={() => runAnalysis(patientId)} loading={loading} activeView={activeView} /> : <div className="loading-state"><RefreshCw className="spin" /><span>Loading patient analysis...</span></div>}
            </main>
        </div>
    );
}
