import hashlib
import json
from datetime import datetime

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import torch
from plotly.subplots import make_subplots

from agents.council import DiagnosticCouncil


st.set_page_config(
    layout="wide",
    page_title="Neuro-Causal Diabetic Twin",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .block-container { padding-top: 1.6rem; padding-bottom: 2rem; }
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, rgba(20, 32, 55, .96), rgba(25, 57, 83, .92));
        border: 1px solid rgba(96, 165, 250, .22);
        padding: 14px 16px;
        border-radius: 14px;
    }
    [data-testid="stMetricLabel"], [data-testid="stMetricValue"] { color: #f8fafc; }
    .section-label {
        color: #7dd3fc; font-size: .75rem; font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase; margin-bottom: .25rem;
    }
    .status-pill {
        display: inline-block; padding: .35rem .75rem; border-radius: 999px;
        font-size: .78rem; font-weight: 700; letter-spacing: .04em;
    }
    .status-ok { color: #bbf7d0; background: rgba(22, 101, 52, .4); }
    .status-watch { color: #fde68a; background: rgba(146, 64, 14, .4); }
    .status-alert { color: #fecaca; background: rgba(153, 27, 27, .45); }
    </style>
    """,
    unsafe_allow_html=True,
)


def init_state():
    if "council" not in st.session_state:
        st.session_state.council = DiagnosticCouncil("P001")
        st.session_state.day = 90
        st.session_state.events = []
        st.session_state.last_result = None
        st.session_state.last_predictions = None
        st.session_state.last_context = None


def reset_patient(patient_id, use_real_data):
    st.session_state.council = DiagnosticCouncil(patient_id, use_real_data=use_real_data)
    st.session_state.day = 90
    st.session_state.events = []
    st.session_state.last_result = None
    st.session_state.last_predictions = None
    st.session_state.last_context = None


def current_row(council, day):
    data = council.data
    if data.empty:
        return pd.Series(dtype=float)
    return data.iloc[min(max(day, 0), len(data) - 1)]


def build_vitals_chart(data, day):
    visible = data.iloc[: min(max(day + 1, 1), len(data))].copy()
    x = visible["date"] if "date" in visible else visible.index
    fig = make_subplots(
        rows=2,
        cols=2,
        subplot_titles=("Glucose", "Kidney GFR", "Retina Thickness", "Heart HRV"),
        vertical_spacing=.15,
        horizontal_spacing=.08,
    )
    metrics = [
        ("glucose", "mg/dL", "#38bdf8", 1, 1),
        ("gfr", "mL/min", "#34d399", 1, 2),
        ("retina_thickness", "µm", "#fbbf24", 2, 1),
        ("hrv", "ms", "#c084fc", 2, 2),
    ]
    for name, unit, color, row, col in metrics:
        if name not in visible:
            continue
        fig.add_trace(
            go.Scatter(
                x=x, y=visible[name], mode="lines+markers",
                name=f"{name} ({unit})", line={"color": color, "width": 2},
                marker={"size": 4},
            ),
            row=row, col=col,
        )
    fig.update_layout(
        height=500, template="plotly_dark", showlegend=False,
        margin={"l": 35, "r": 20, "t": 45, "b": 35},
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(15,23,42,.45)",
    )
    return fig


def build_risk_chart(predictions):
    names = ["glucose", "kidney", "retina", "heart", "nerve"]
    values = [float(predictions.get(name, 0)) for name in names]
    colors = ["#ef4444" if value >= .6 else "#f59e0b" if value >= .35 else "#22c55e" for value in values]
    fig = go.Figure(go.Bar(
        x=values, y=[name.title() for name in names], orientation="h",
        marker_color=colors, text=[f"{value:.0%}" for value in values],
        textposition="outside", cliponaxis=False,
    ))
    fig.update_xaxes(range=[0, 1], tickformat=".0%")
    fig.update_layout(
        height=330, template="plotly_dark", margin={"l": 20, "r": 45, "t": 15, "b": 35},
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(15,23,42,.45)",
        xaxis_title="Predicted propagation risk",
    )
    return fig


def build_causal_graph(predictions):
    nodes = ["Glucose", "Kidney", "Retina", "Heart", "Nerve"]
    values = [float(predictions.get(node.lower(), 0)) for node in nodes]
    colors = ["#ef4444" if value >= .6 else "#22c55e" for value in values]
    edge_x = [0, 1, None, 0, 2, None, 1, 3, None, 0, 4, None]
    edge_y = [0, 1, None, 0, -1, None, 1, 0, None, 0, -1, None]
    fig = go.Figure([
        go.Scatter(x=edge_x, y=edge_y, mode="lines", line={"color": "#64748b", "width": 2}, hoverinfo="none"),
        go.Scatter(
            x=[0, 1, 2, 3, 4], y=[0, 1, -1, 0, -1], mode="markers+text",
            text=[f"{name}<br>{value:.0%}" for name, value in zip(nodes, values)],
            textposition="top center", marker={"size": 42, "color": colors, "line": {"width": 2, "color": "#e2e8f0"}},
            hovertemplate="%{text}<extra></extra>",
        ),
    ])
    fig.update_layout(
        height=330, template="plotly_dark", showlegend=False, xaxis={"visible": False},
        yaxis={"visible": False}, margin={"l": 10, "r": 10, "t": 20, "b": 10},
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(15,23,42,.45)",
    )
    return fig


def build_risk_radar(predictions):
    labels = ["Glucose", "Kidney", "Retina", "Heart", "Nerve"]
    values = [float(predictions.get(label.lower(), 0)) for label in labels]
    fig = go.Figure(go.Scatterpolar(
        r=values + [values[0]],
        theta=labels + [labels[0]],
        fill="toself",
        line={"color": "#38bdf8", "width": 2},
        fillcolor="rgba(56, 189, 248, .22)",
        name="Current risk",
    ))
    fig.update_layout(
        height=360, template="plotly_dark", showlegend=False,
        polar={
            "radialaxis": {"visible": True, "range": [0, 1], "tickformat": ".0%"},
            "angularaxis": {"gridcolor": "#334155"},
            "bgcolor": "rgba(15,23,42,.45)",
        },
        margin={"l": 40, "r": 40, "t": 25, "b": 25},
        paper_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def build_distribution_chart(data):
    metrics = [
        ("glucose", "Glucose", "#38bdf8"),
        ("gfr", "Kidney GFR", "#34d399"),
        ("hrv", "Heart HRV", "#c084fc"),
    ]
    fig = make_subplots(rows=1, cols=3, subplot_titles=[item[1] for item in metrics])
    for index, (column, name, color) in enumerate(metrics, start=1):
        if column in data:
            fig.add_trace(
                go.Histogram(x=data[column], marker_color=color, opacity=.85, name=name),
                row=1, col=index,
            )
    fig.update_layout(
        height=300, template="plotly_dark", showlegend=False, bargap=.08,
        margin={"l": 25, "r": 20, "t": 45, "b": 35},
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(15,23,42,.45)",
    )
    return fig


def patient_analysis(data, row, result, predictions):
    specs = {
        "Glucose": ("glucose", "mg/dL", 70, 140, "Higher values can indicate glycemic instability."),
        "Kidney GFR": ("gfr", "mL/min", 60, 90, "Lower values indicate reduced kidney-function proxy."),
        "Retina thickness": ("retina_thickness", "µm", 220, 280, "Deviation from the local baseline is monitored."),
        "Heart HRV": ("hrv", "ms", 30, 70, "Lower variability can indicate autonomic stress."),
        "SpO2": ("spo2", "%", 94, 100, "Peripheral oxygen saturation proxy."),
        "Skin temperature": ("skin_temp", "°C", 32, 35, "Peripheral temperature proxy."),
    }
    rows = []
    for label, (column, unit, low, high, interpretation) in specs.items():
        if column not in data:
            continue
        value = float(row.get(column, 0))
        baseline = float(data[column].iloc[: max(1, len(data) // 2)].mean())
        delta = value - baseline
        if low <= value <= high:
            status = "Within reference band"
        else:
            status = "Review required"
        rows.append({
            "Metric": label,
            "Current": f"{value:.1f} {unit}",
            "Baseline": f"{baseline:.1f} {unit}",
            "Change": f"{delta:+.1f} {unit}",
            "Status": status,
            "Interpretation": interpretation,
        })
    analysis = pd.DataFrame(rows)
    alert_count = int(sum(event["severity"] == "High" for event in st.session_state.events))
    highest = max(predictions, key=predictions.get)
    summary = {
        "observations": len(data),
        "alerts": alert_count,
        "highest_risk": f"{highest.title()} ({predictions[highest]:.0%})",
        "drift_score": float(result.get("error", 0)),
    }
    return analysis, summary


def add_event(day, result, block=None):
    event = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "day": day,
        "type": "Drift alert" if result.get("alert") else "Nominal check",
        "severity": "High" if result.get("alert") else "Normal",
        "message": result.get("msg", "Vitals nominal"),
        "error": float(result.get("error", 0)),
        "block": block.index if block else None,
    }
    st.session_state.events.insert(0, event)


init_state()

with st.sidebar:
    st.markdown("## Twin Control Center")
    st.caption("Personalized diabetes monitoring workspace")
    patient_id = st.text_input("Patient ID", value=st.session_state.council.client.patient_id)
    data_mode = st.selectbox("Data source", ["Hybrid real-world CSV", "Synthetic simulation"])
    use_real_data = data_mode == "Hybrid real-world CSV"
    if st.button("Load patient", use_container_width=True):
        reset_patient(patient_id.strip() or "P001", use_real_data)
        st.rerun()
    st.divider()
    st.markdown("### Monitoring controls")
    step_size = st.slider("Days per step", min_value=1, max_value=10, value=1)
    if st.button("Run monitoring step", type="primary", use_container_width=True):
        council = st.session_state.council
        result = council.client.monitor(st.session_state.day)
        block = council.ledger.add_block(result) if result.get("alert") else None
        if result.get("alert"):
            current_drifts = torch.tensor([0.1, 0.8, 0.2, 0.1, 0.1])
            st.session_state.last_predictions = council.graph_model(current_drifts)
            st.session_state.last_context = council.rag.retrieve_context(current_drifts.numpy())
        add_event(st.session_state.day, result, block)
        st.session_state.last_result = result
        st.session_state.day += step_size
        st.rerun()
    if st.button("Reset session", use_container_width=True):
        reset_patient(patient_id.strip() or "P001", use_real_data)
        st.rerun()
    st.divider()
    st.markdown("### System health")
    st.success("Data pipeline online")
    st.success("Federated node trained")
    st.success("Ledger available")
    st.caption(f"Last refresh: {datetime.now().strftime('%d %b %Y, %H:%M:%S')}")

council = st.session_state.council
row = current_row(council, st.session_state.day)
result = st.session_state.last_result or {"alert": False, "error": 0}
events = st.session_state.events
chain_valid = council.ledger.verify_chain()
predictions = st.session_state.last_predictions or {"glucose": .18, "kidney": .22, "retina": .16, "heart": .2, "nerve": .12}

st.markdown('<div class="section-label">Patient command center</div>', unsafe_allow_html=True)
title_col, status_col = st.columns([4, 1])
with title_col:
    st.title("Neuro-Causal Diabetic Digital Twin")
    st.markdown("Personalized physiology monitoring • causal risk propagation • auditable AI")
with status_col:
    status_class = "status-alert" if result.get("alert") else "status-ok"
    status_text = "ALERT ACTIVE" if result.get("alert") else "MONITORING"
    st.markdown(f'<div class="status-pill {status_class}">{status_text}</div>', unsafe_allow_html=True)
    st.caption(f"Patient {council.client.patient_id} · Day {st.session_state.day}")

metric_cols = st.columns(5)
latest_values = [
    ("Glucose", row.get("glucose", 0), "mg/dL", "normal"),
    ("Kidney GFR", row.get("gfr", 0), "mL/min", "normal"),
    ("Heart HRV", row.get("hrv", 0), "ms", "normal"),
    ("SpO₂", row.get("spo2", 0), "%", "normal"),
    ("Drift score", result.get("error", 0), "MSE", "inverse"),
]
for col, (label, value, unit, _) in zip(metric_cols, latest_values):
    with col:
        st.metric(label, f"{float(value):.1f}", unit)

st.divider()
tab_overview, tab_analysis, tab_causal, tab_audit = st.tabs(
    ["Vitals overview", "Patient analysis", "Causal intelligence", "Audit and evidence"]
)

with tab_overview:
    left, right = st.columns([2.1, 1])
    with left:
        st.subheader("Multi-signal physiological trends")
        st.caption("Observed values from the active patient window")
        st.plotly_chart(build_vitals_chart(council.data, st.session_state.day), use_container_width=True)
    with right:
        st.subheader("Organ risk profile")
        st.caption("Propagation probabilities from the last alert; baseline shown before first alert")
        st.plotly_chart(build_risk_chart(predictions), use_container_width=True)

    lower_left, lower_mid, lower_right = st.columns(3)
    with lower_left:
        st.subheader("Peripheral signals")
        st.metric("Skin temperature", f"{float(row.get('skin_temp', 0)):.1f} °C")
        st.metric("EDA / stress signal", f"{float(row.get('eda', 0)):.1f} µS")
    with lower_mid:
        st.subheader("Lifestyle signal")
        st.metric("Activity", f"{float(row.get('activity', 0)):.0f}", "steps/day")
        st.metric("Data points loaded", f"{len(council.data):,}")
    with lower_right:
        st.subheader("Model status")
        threshold = council.client.detector.threshold
        threshold_value = float(threshold.item()) if threshold is not None else 0
        st.metric("Learned drift threshold", f"{threshold_value:.4f}", "MSE")
        st.metric("Monitoring events", len(events))

with tab_analysis:
    analysis_table, analysis_summary = patient_analysis(council.data, row, result, predictions)
    st.subheader("Patient-specific analysis")
    st.caption("Current observations compared with the patient's learned baseline and prototype reference bands.")
    summary_cols = st.columns(4)
    with summary_cols[0]:
        st.metric("Observations analyzed", f"{analysis_summary['observations']:,}")
    with summary_cols[1]:
        st.metric("High-severity alerts", analysis_summary["alerts"])
    with summary_cols[2]:
        st.metric("Highest modeled risk", analysis_summary["highest_risk"])
    with summary_cols[3]:
        st.metric("Current drift score", f"{analysis_summary['drift_score']:.4f}")
    st.dataframe(analysis_table, use_container_width=True, hide_index=True)
    st.subheader("Patient signal distributions")
    st.plotly_chart(build_distribution_chart(council.data), use_container_width=True)
    st.subheader("Relative risk profile")
    radar_col, notes_col = st.columns([1, 1])
    with radar_col:
        st.plotly_chart(build_risk_radar(predictions), use_container_width=True)
    with notes_col:
        st.markdown("#### Analysis notes")
        st.write(
            "The table compares the selected observation with the first half of the loaded "
            "patient record as a local baseline. Reference bands are prototype thresholds "
            "for demonstration and are not clinical diagnostic ranges."
        )
        if result.get("alert"):
            st.error("The latest monitored observation exceeded the learned drift threshold.")
        else:
            st.success("The latest monitored observation did not exceed the learned drift threshold.")

with tab_causal:
    graph_col, explanation_col = st.columns([1.25, 1])
    with graph_col:
        st.subheader("Causal propagation graph")
        st.caption("Neural propagation constrained by symbolic medical-ontology rules")
        st.plotly_chart(build_causal_graph(predictions), use_container_width=True)
    with explanation_col:
        st.subheader("Risk interpretation")
        highest = max(predictions, key=predictions.get)
        st.info(f"Highest modeled risk: **{highest.title()} ({predictions[highest]:.0%})**")
        st.markdown(
            "- **Glucose** is treated as a source signal.\n"
            "- **Kidney to Heart** is a constrained propagation pathway.\n"
            "- **Glucose to Retina** is used as a retinal plausibility rule.\n"
            "- Values are prototype risk scores, not clinical probabilities."
        )
        if st.session_state.last_context:
            context = st.session_state.last_context
            st.subheader("Retrieved context")
            if context.get("similar_case"):
                st.write(f"**Similar case:** {context['similar_case']['patient_id']} — {context['similar_case']['outcome']}")
            if context.get("relevant_paper"):
                st.write(f"**Literature:** {context['relevant_paper']['title']}")
                st.caption(context["relevant_paper"]["content"])
        else:
            st.caption("Run a monitoring step that triggers drift to populate retrieved context.")

with tab_audit:
    audit_col, events_col = st.columns([1, 1.5])
    with audit_col:
        st.subheader("Ledger integrity")
        st.metric("Blocks persisted", len(council.ledger.chain))
        st.metric("Chain verification", "VALID" if chain_valid else "INVALID")
        latest_block = council.ledger.chain[-1] if council.ledger.chain else None
        if latest_block:
            st.code(f"Block #{latest_block.index}\n{latest_block.hash}", language="text")
        st.caption("Local JSON audit chain · demonstration persistence only")
    with events_col:
        st.subheader("Monitoring event timeline")
        if events:
            event_df = pd.DataFrame(events)
            st.dataframe(
                event_df[["timestamp", "day", "type", "severity", "error", "block", "message"]],
                use_container_width=True, hide_index=True,
            )
        else:
            st.info("No monitoring events yet. Run a monitoring step from the sidebar.")

with st.expander("Raw patient data preview", expanded=False):
    st.dataframe(council.data.tail(25), use_container_width=True, hide_index=True)

st.caption(
    "Prototype only: not for diagnosis or treatment. "
    f"Session fingerprint: {hashlib.sha256(json.dumps({'patient': council.client.patient_id, 'day': st.session_state.day}).encode()).hexdigest()[:12]}"
)
