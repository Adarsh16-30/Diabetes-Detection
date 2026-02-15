import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import time
import torch
from diabetes_project.agents.council import DiagnosticCouncil

st.set_page_config(layout="wide", page_title="Neuro-Causal Diabetic Twin")

st.title("🧬 Neuro-Causal Diabetic Digital Twin")
st.markdown("**Novel Architecture**: Federated Learning + Neuro-Symbolic AI + Causal RAG + Blockchain")

if 'council' not in st.session_state:
    st.session_state.council = DiagnosticCouncil("P001")
    st.session_state.day = 90 # Start monitoring phase

# Layout
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Real-Time Organ Vitals (Federated Node)")
    chart_placeholder = st.empty()
    
with col2:
    st.subheader("Causal Propagation Graph (Neuro-Symbolic)")
    graph_placeholder = st.empty()

st.subheader("Blockchain Audit Trail & RAG Insights")
log_placeholder = st.empty()

# Simulation Control
if st.button("Run Simulation Step-by-Step"):
    council = st.session_state.council
    
    # 1. Monitor
    result = council.client.monitor(st.session_state.day)
    
    # Update Chart
    df = council.sim.data.iloc[:st.session_state.day+1]
    fig = go.Figure()
    fig.add_trace(go.Scatter(y=df['gfr'], mode='lines', name='Kidney GFR'))
    fig.add_trace(go.Scatter(y=df['retina_thickness'], mode='lines', name='Retina Thickness'))
    fig.add_trace(go.Scatter(y=df['hrv'], mode='lines', name='Heart HRV'))
    # Add drift threshold line (approx)
    fig.add_hline(y=council.client.detector.threshold.item() if council.client.detector.threshold else 0, line_dash="dash", annotation_text="Drift Threshold")
    chart_placeholder.plotly_chart(fig, use_container_width=True)
    
    if result['alert']:
        # 2. Blockchain Audit
        block = council.ledger.add_block(result)
        st.error(f"🚨 ALERT Triggered at Day {st.session_state.day}: {result['msg']}")
        st.info(f"🔗 Block #{block.index} Verified. Hash: {block.hash}")

        # 3. Causal Prediction
        # Mock drift vector based on simulation state
        current_drifts = torch.tensor([0.1, 0.8, 0.2, 0.1, 0.1]) 
        predictions = council.graph_model(current_drifts)
        
        # Visualize Propagation
        # Simple Node-Link Diagram
        nodes = ['Glucose', 'Kidney', 'Retina', 'Heart', 'Nerve']
        # Highlight nodes with high risk
        colors = ['red' if predictions.get(n.lower(), 0) > 0.5 else 'green' for n in nodes]
        
        node_trace = go.Scatter(
            x=[0, 1, 1, 2, 2], y=[0, 1, -1, 1, -1],
            mode='markers+text',
            text=[f"{n}\n{predictions.get(n.lower(), 0):.2f}" for n in nodes],
            textposition="top center",
            marker=dict(size=40, color=colors)
        )
        edge_x = []
        edge_y = []
        # Draw mocked edges (Kidney->Heart, Glucose->Retina)
        # (0,0)->(1,1) Kidney
        edge_x += [0, 1, None]; edge_y += [0, 1, None]
        # (1,1)->(2,1) Heart
        edge_x += [1, 2, None]; edge_y += [1, 1, None]
        
        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=2, color='#888'),
            hoverinfo='none',
            mode='lines'
        )
        
        fig_graph = go.Figure(data=[edge_trace, node_trace])
        graph_placeholder.plotly_chart(fig_graph)
        
        # 4. RAG
        context = council.rag.retrieve_context(current_drifts.numpy())
        with st.expander("Causal RAG Explanation", expanded=True):
            st.markdown(f"**Similar Case Found:** Patient {context['similar_case']['patient_id']}")
            st.markdown(f"**Outcome:** {context['similar_case']['outcome']}")
            st.markdown("---")
            st.markdown(f"**Recommended Literature:** {context['relevant_paper']['title']}")
            st.caption(context['relevant_paper']['content'])
            
    else:
        st.success(f"Day {st.session_state.day}: Vitals Nominal. No Drift Detected.")
        
    st.session_state.day += 1
