from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import torch
from typing import List

from diabetes_project.agents.council import DiagnosticCouncil
from diabetes_project.api.models import ExplanationRequest
from diabetes_project.blockchain.zk_proof import ZKProver

app = FastAPI(title="Neuro-Causal Diabetic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

council = DiagnosticCouncil("P001", use_real_data=True)
zk_prover = ZKProver("P001")

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

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        day = 90
        while True:
            status = council.client.monitor(day)
            
            zk_proof = None
            if status['alert']:
                zk_proof = zk_prover.generate_proof({"gfr_decay": 0.5}, "data_hash_sample")
                council.ledger.add_block(status, proof=zk_proof)
            
            current_drifts = torch.tensor([0.1, 0.8, 0.2, 0.1, 0.1]) 
            predictions = council.graph_model(current_drifts)
            
            design_mode = "zen" 
            if status['alert']:
                design_mode = "crisis" 
            elif predictions.get('kidney', 0) > 0.5:
                 design_mode = "warning" 
            
            payload = {
                "day": day,
                "vitals": {
                    "gfr": float(council.sim.data.iloc[day]['gfr']),
                    "retina": float(council.sim.data.iloc[day]['retina_thickness']),
                    "hrv": float(council.sim.data.iloc[day]['hrv'])
                },
                "alert": status,
                "propagation": predictions,
                "latest_block_hash": council.ledger.chain[-1].hash if council.ledger.chain else "0",
                "zk_proof": zk_proof,
                "design_mode": design_mode 
            }
            
            await manager.broadcast(json.dumps(payload))
            day += 1
            if day >= 1000: day = 90 
            
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/explain")
async def explain_condition(request: ExplanationRequest):
    drift_vec = [
        request.organ_drifts.get("glucose", 0),
        request.organ_drifts.get("kidney", 0),
        request.organ_drifts.get("retina", 0),
        request.organ_drifts.get("heart", 0),
        request.organ_drifts.get("nerve", 0)
    ]
    context = council.rag.retrieve_context(torch.tensor(drift_vec).numpy())
    return {
        "explanation": f"High drift detected in Kidney. {context['relevant_paper']['content']}",
        "similar_case": context['similar_case'],
        "source": context['relevant_paper']
    }

@app.get("/ledger/chain")
async def get_chain():
    return [b.__dict__ for b in council.ledger.chain]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
