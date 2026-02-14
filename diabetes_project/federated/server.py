import torch
import numpy as np
from diabetes_project.models.drift_detector import DriftDetector

class FederatedServer:
    def __init__(self):
        self.global_model = DriftDetector(input_dim=4)
        self.clients = []

    def register_client(self, client):
        self.clients.append(client)
        print(f"Client {client.patient_id} registered with Server.")

    def aggregate_models(self, client_weights_list):
        """Performs FedAvg (Federated Averaging)."""
        if not client_weights_list:
            return None
        
        # Initialize with first client's weights
        avg_weights = client_weights_list[0]
        
        # Sum up weights
        for i in range(1, len(client_weights_list)):
            for key in avg_weights:
                avg_weights[key] += client_weights_list[i][key]
                
        # Average
        n_clients = len(client_weights_list)
        for key in avg_weights:
            avg_weights[key] = torch.div(avg_weights[key], n_clients)
            
        # Update global model
        self.global_model.update_weights(avg_weights)
        print("Global model updated via FedAvg.")
        return avg_weights

    def round(self):
        """Executes one round of FL training."""
        updates = []
        for client in self.clients:
            updates.append(client.get_model_update())
        
        new_global_weights = self.aggregate_models(updates)
        
        # Broadcast back to clients
        for client in self.clients:
            client.detector.update_weights(new_global_weights)
