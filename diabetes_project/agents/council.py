import torch
import numpy as np
import json
import time
from diabetes_project.data.patient_simulator import PatientDataSimulator
from diabetes_project.data.loader import RealWorldDataLoader
from diabetes_project.federated.client import FederatedClient
from diabetes_project.blockchain.ledger import BlockchainLedger
from diabetes_project.models.propagation_graph import CausalOrganGraph
from diabetes_project.rag.rag_engine import MultimodalRAG

class DiagnosticCouncil:
    def __init__(self, patient_id, use_real_data=True):
        print(f"Initializing Diagnostic Council for Patient {patient_id}...")
        
        # 1. Provide Data Access
        if use_real_data:
            print("[INFO] Mode: Real-World Data (Hybrid Injection)")
            self.loader = RealWorldDataLoader(patient_id, csv_path="diabetes_project/data/samples/patient_data.csv")
            self.data = self.loader.load_data()
            self.sim = self.loader.simulator 
        else:
            print("[INFO] Mode: Pure Simulation")
            self.sim = PatientDataSimulator(patient_id)
            # Inject realistic drift: Kidney failure starts at Day 150
            data = self.sim.generate_healthy_baseline()
            self.data = self.sim.inject_drift(data, start_day=150, organ='kidney', intensity=0.3)
            self.sim.data = self.data 
        
        # 2. Federated Client
        self.client = FederatedClient(patient_id, self.data)
        
        # 3. Blockchain Ledger
        self.ledger = BlockchainLedger()
        
        # 4. Causal AI Model
        self.graph_model = CausalOrganGraph()
        
        # 5. RAG Engine
        self.rag = MultimodalRAG()

    def run_simulation(self, days_to_run=200):
        print("\n--- Starting Monitoring Cycle ---")
        alerts_triggered = False
        
        for day in range(days_to_run):
            # 1. Monitor
            status = self.client.monitor(day)
            
            if status['alert']:
                print(f"\n[DAY {90+day}] DRIFT DETECTED: {status['msg']}")
                alerts_triggered = True
                
                # 2. Audit (Blockchain)
                block = self.ledger.add_block(status)
                print(f"[BLOCKCHAIN] Alert logged in Block #{block.index} | Hash: {block.hash[:8]}...")
                
                # 3. Predict (Causal Propagation)
                # Construct drift vector from current state
                # In real app, we'd compute drift per organ. Here we mock it based on the simulator logic
                # [Glucose, Kidney, Retina, Heart, Nerve]
                current_drifts = torch.tensor([0.1, 0.8, 0.2, 0.1, 0.1]) 
                
                predictions = self.graph_model(current_drifts)
                print(f"[CAUSAL GRAPH] Predicted Propagation Risks: {json.dumps(predictions, indent=2)}")
                
                # 4. Context (RAG)
                # Retrieve based on the Kidney drift vector
                context = self.rag.retrieve_context(current_drifts.numpy())
                print(f"[RAG] Found similar case: {context['similar_case']}")
                
                # Stop after first major alert for demo clarity
                break
                
        if not alerts_triggered:
            print("No significant drift detected in the simulation period.")

if __name__ == "__main__":
    council = DiagnosticCouncil("P001", use_real_data=True)
    council.run_simulation()
