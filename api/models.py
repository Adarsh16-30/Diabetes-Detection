from pydantic import BaseModel
from typing import Dict, Any, Optional

class DriftAlert(BaseModel):
    patient_id: str
    organ: str
    severity: float
    timestamp: float

class ZKProofSchema(BaseModel):
    prover_id: str
    commitment: str
    challenge: str
    response: str
    salt_hash: str
    timestamp: float

class ExplanationRequest(BaseModel):
    patient_id: str
    organ_drifts: Dict[str, float]
