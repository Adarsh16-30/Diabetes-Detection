from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import torch
import pandas as pd
import io
from typing import List

# ... imports ...
from diabetes_project.agents.council import DiagnosticCouncil
from diabetes_project.api.models import ExplanationRequest
from diabetes_project.blockchain.zk_proof import ZKProver

app = FastAPI(title="Neuro-Causal Diabetic API")

# ... middleware ...
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... ConnectionManager ...
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Global Session Store
active_sessions = {}

@app.post("/api/upload_data/{patient_id}")
async def upload_data(patient_id: str, file: UploadFile = File(...)):
    print(f"Receiving data for {patient_id}")
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Ensure minimal required columns exist
        required_cols = ['gfr', 'retina_thickness', 'hrv', 'glucose', 'spo2', 'skin_temp', 'eda', 'activity'] 
        for col in required_cols:
            if col not in df.columns:
                 # Auto-fill missing cols with defaults if possible, or error
                 df[col] = 0.0 # simplified
        
        # Initialize session if not exists
        if patient_id not in active_sessions:
            active_sessions[patient_id] = {
                "council": DiagnosticCouncil(patient_id, use_real_data=True),
                "zk_prover": ZKProver(patient_id)
            }
        
        # Overwrite the simulation data with uploaded data
        active_sessions[patient_id]["council"].data = df
        print(f"Data updated for {patient_id}: {len(df)} rows")
        
        return {"status": "success", "rows": len(df), "message": "Simulation updated with custom data."}
    except Exception as e:
        print(f"Upload failed: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/analyze/{patient_id}")
async def analyze_patient(patient_id: str):
    print(f"Starting Full Analysis for {patient_id}")
    
    # Initialize/Get Session
    if patient_id not in active_sessions:
         active_sessions[patient_id] = {
            "council": DiagnosticCouncil(patient_id, use_real_data=True),
            "zk_prover": ZKProver(patient_id)
        }
    
    session = active_sessions[patient_id]
    council = session["council"]
    zk_prover = session["zk_prover"]
    
    # Run Audit on ALL Data
    history = []
    total_drift_error = 0
    anomalies = 0
    
    # Reset ledger for clean analysis? Or keep appending?
    # For now, let's analyze the current dataset state
    data_len = len(council.data)
    
    for day in range(data_len):
        # 1. Get Data Logic
        row = council.data.iloc[day]
        row_values = [
            float(row.get('glucose', 100)),
            float(row.get('gfr', 90)),
            float(row.get('retina_thickness', 250)),
            float(row.get('hrv', 50))
        ]
        
        # New Sensors
        spo2 = float(row.get('spo2', 98))
        skin_temp = float(row.get('skin_temp', 33.5))
        eda = float(row.get('eda', 5.0))
        activity = float(row.get('activity', 5000))

        # 2. Monitor (Drift Detection - Patent 2)
        # Use explicit row values to ensure alignment
        is_drift, drift_error = council.client.detect_drift(row_values)
        if is_drift: anomalies += 1
        
        # 3. Propagation (Causal Graph - Patent 1)
        glucose_norm = 1.0 - (row_values[0] / 200.0)
        
        current_drifts = torch.tensor([
            glucose_norm, 
            1.0 if is_drift else 0.1, 
            0.2, 0.1, 0.1
        ])
        predictions = council.graph_model(current_drifts)
        
        # 4. Ledger 
        zk_proof = None
        block_hash = "0"
        if is_drift:
             status_payload = {"day": day, "error": drift_error, "msg": "Drift Detected"}
             zk_proof = zk_prover.generate_proof({"gfr_decay": 0.5}, f"hash_{day}_{patient_id}")
             block = council.ledger.add_block(status_payload, proof=zk_proof)
             block_hash = block.hash
        
        # Collect Data Point
        history.append({
            "day": day,
            "vitals": {
                "glucose": row_values[0],
                "gfr": row_values[1],
                "retina": row_values[2],
                "hrv": row_values[3],
                "spo2": spo2,
                "skin_temp": skin_temp,
                "eda": eda,
                "activity": activity
            },
            "drift_error": drift_error,
            "predictions": predictions,
            "is_anomaly": is_drift,
            "block_hash": block_hash
        })
        
        total_drift_error += drift_error

    # Calculate Aggregate Metrics
    mse = total_drift_error / data_len if data_len > 0 else 0
    risk_score = (anomalies / data_len) * 100 if data_len > 0 else 0
    
    # Advanced Metrics Calculation (New Request)
    
    # 1. Structural Entropy (Causal): Measure of system disorder
    # H = -sum(p * log(p)) where p is normalized risk probability of each organ
    import numpy as np
    
    # Get average risk per organ across history
    avg_risks = {
        'kidney': np.mean([h['predictions']['kidney'] for h in history]) if history else 0,
        'retina': np.mean([h['predictions']['retina'] for h in history]) if history else 0,
        'heart': np.mean([h['predictions']['heart'] for h in history]) if history else 0,
        'nerve': np.mean([h['predictions']['nerve'] for h in history]) if history else 0
    }
    total_risk_mass = sum(avg_risks.values())
    if total_risk_mass > 0:
        probs = [r / total_risk_mass for r in avg_risks.values()]
        structural_entropy = -sum([p * np.log2(p) if p > 0 else 0 for p in probs])
    else:
        structural_entropy = 0
        
    # 2. Causal Impact Score: Downstream effect of Glucose
    # Simplified as weighted sum of correlation between Glucose and other organs' drift
    causal_impact_score = (avg_risks['kidney'] * 0.4 + avg_risks['retina'] * 0.3 + avg_risks['heart'] * 0.2 + avg_risks['nerve'] * 0.1) * 100

    # 3. Network Stability (Causal): Inverse of average propagation risk
    avg_prop_risk = sum([sum(h['predictions'].values())/5 for h in history]) / data_len if data_len else 0
    network_stability = max(0, 100 * (1 - avg_prop_risk))
    
    # 4. Cascading Risk (Causal): High if multiple organs drift simultaneously
    cascading_events = len([h for h in history if sum(1 for v in h['predictions'].values() if v > 0.5) >= 2])
    cascading_risk_score = (cascading_events / data_len) * 100 if data_len else 0

    # 5. Lyapunov Exponent (Drift): Measure of chaotic divergence
    # Simplified estimation: slope of log(drift_error) over time
    drift_errors = [h['drift_error'] for h in history]
    if len(drift_errors) > 10:
        log_drifts = np.log(np.array(drift_errors) + 1e-6) # Avoid log(0)
        time_steps = np.arange(len(drift_errors))
        # Linear fit to get slope (lambda)
        lyapunov_exponent = np.polyfit(time_steps, log_drifts, 1)[0] * 100 # Scale for display
    else:
        lyapunov_exponent = 0

    # 6. Drift Velocity (Drift): Rate of change of error
    drift_velocity = (drift_errors[-1] - drift_errors[0]) / len(drift_errors) if len(drift_errors) > 1 else 0

    # 7. Volatility Index (Drift): Standard deviation
    volatility_index = np.std(drift_errors) if drift_errors else 0
    
    # 8. Recovery Potential (Drift)
    recovery_potential = max(0, 100 - risk_score - (volatility_index * 100))

    return {
        "summary": {
            "patient_id": patient_id,
            "total_days": data_len,
            "mse_drift": mse,
            "risk_score": risk_score, # 0-100
            "anomalies_detected": anomalies,
            
            # New Advanced Metrics
            "structural_entropy": structural_entropy,
            "causal_impact_score": causal_impact_score,
            "network_stability": network_stability,
            "cascading_risk_score": cascading_risk_score,
            
            "lyapunov_exponent": lyapunov_exponent,
            "drift_velocity": drift_velocity,
            "volatility_index": volatility_index,
            "recovery_potential": recovery_potential
        },
        "history": history, # Full time-series for graphs
        "ledger": [b.__dict__ for b in council.ledger.chain]
    }

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, patient_id: str = "P001"):
    # ... existing stream logic can remain for "Live View" if desired, 
    # but specific request was for "Analysis Report". 
    # We will leave it as is for now or simplify.
    await manager.connect(websocket)
    try:
         while True:
            await asyncio.sleep(1) # Keep alive, but maybe we don't need to stream data if dashboard is static
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/explain")
async def explain_condition(request: ExplanationRequest):
    # ... existing code ...
    drift_vec = [
        request.organ_drifts.get("glucose", 0),
        request.organ_drifts.get("kidney", 0),
        request.organ_drifts.get("retina", 0),
        request.organ_drifts.get("heart", 0),
        request.organ_drifts.get("nerve", 0)
    ]
    # Check if council exists for patient (from request? model might need update, defaulting to global legacy for now if not found)
    # Ideally we pass patient_id in request. For now let's grab from active_sessions if possible or create temp
    
    # We will assume request has patient_id, or we default to P001. 
    # Current ExplanationRequest model might not have patient_id. 
    # Let's check api/models.py if we need to update it.
    
    # Using P001 as fallback for RAG context
    
    # ... logic ...
    
    # Ensure council is available
    target_council = active_sessions.get(request.patient_id, {}).get("council")
    if not target_council:
         target_council = DiagnosticCouncil("Generic", use_real_data=True)

    context = target_council.rag.retrieve_context(torch.tensor(drift_vec).numpy())
    return {
        "explanation": f"High drift detected. {context['relevant_paper']['content']}",
        "similar_case": context['similar_case'],
        "source": context['relevant_paper']
    }

@app.get("/ledger/chain")
async def get_chain():
     # This is legacy/debug. We should probably accept patient_id
     return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
