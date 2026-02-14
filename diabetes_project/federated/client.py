import torch
import numpy as np
import pandas as pd
from diabetes_project.models.drift_detector import DriftDetector

class FederatedClient:
    def __init__(self, patient_id, data_simulator):
        self.patient_id = patient_id
        self.simulator = data_simulator
        # NEW: Flexible Data Source (Pandas DataFrame)
        # Expects dataframe with columns ['glucose', 'gfr', 'retina_thickness', 'hrv']
        if isinstance(data_simulator, pd.DataFrame):
             self.data = data_simulator
        else:
             self.data = self.simulator.generate_healthy_baseline()
        
        self.detector = DriftDetector(input_dim=4)
        
        # Split: Training (first 90 days) vs Monitoring (Rest)
        # Ensure we have enough data
        if len(self.data) > 90:
            self.train_data = self.data.iloc[:90][['glucose', 'gfr', 'retina_thickness', 'hrv']].values
            self.monitoring_data = self.data.iloc[90:][['glucose', 'gfr', 'retina_thickness', 'hrv']].values
        else:
            # Fallback for short data: Train on first 50%, monitor rest
            split = int(len(self.data) * 0.5)
            self.train_data = self.data.iloc[:split][['glucose', 'gfr', 'retina_thickness', 'hrv']].values
            self.monitoring_data = self.data.iloc[split:][['glucose', 'gfr', 'retina_thickness', 'hrv']].values
        
        # Normalize data (simple min-max for prototype)
        self.min_val = self.train_data.min(axis=0)
        self.max_val = self.train_data.max(axis=0)
        
        self._train_local_model()

    def _normalize(self, data):
        return (data - self.min_val) / (self.max_val - self.min_val + 1e-6)

    def _train_local_model(self):
        print(f"Client {self.patient_id}: Training local Drift Detector...")
        norm_data = self._normalize(self.train_data)
        tensor_data = torch.FloatTensor(norm_data)
        self.detector.train(tensor_data)

    def monitor(self, current_day_index):
        """Checks for drift on a specific day."""
        # Loop functionality for demo purposes if we run out of data
        if len(self.monitoring_data) == 0:
             return {"alert": False, "msg": "No monitoring data available"}
             
        idx = current_day_index % len(self.monitoring_data)

        day_data = self.monitoring_data[idx]
        norm_data = self._normalize(day_data)
        tensor_data = torch.FloatTensor(norm_data).unsqueeze(0)
        
        drift, error = self.detector.detect(tensor_data)
        
        if drift:
            return {
                "alert": True,
                "patient_id": self.patient_id,
                "day": 90 + current_day_index, # Logical day, not index
                "error": error,
                "msg": f"Drift Detected! Error: {error:.4f}"
            }
        return {"alert": False, "error": error}

    def get_model_update(self):
        """Simulates sending gradients to the global server."""
        return self.detector.get_weights()

if __name__ == "__main__":
    from diabetes_project.data.patient_simulator import PatientDataSimulator
    
    sim = PatientDataSimulator("P001")
    # Inject drift starting day 150
    data = sim.generate_healthy_baseline()
    data = sim.inject_drift(data, start_day=150, organ='kidney', intensity=0.2)
    sim.data = data # Override
    
    client = FederatedClient("P001", sim)
    
    # Simulate monitoring
    for day in range(100): # Days 90 to 190
        res = client.monitor(day)
        if res['alert']:
            print(res)
            break
