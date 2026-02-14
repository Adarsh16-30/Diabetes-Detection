import torch
import torch.nn as nn
import networkx as nx

class MedicalOntology:
    """Hard-coded medical rules (The Symbolic Layer)."""
    @staticmethod
    def apply_constraints(predictions, input_state):
        """
        predictions: {'kidney': val, 'heart': val, ...}
        input_state: {'glucose_drift': val, ...}
        """
        constrained_preds = predictions.copy()
        
        # Rule 1: Nephropathy strongly increases CVD risk (Kidney-Heart Axis)
        if predictions.get('kidney', 0) > 0.7:
            constrained_preds['heart'] = max(constrained_preds.get('heart', 0), 0.6)
            print("Symbolic Logic Triggered: High Kidney Risk -> Elevated Heart Risk")

        # Rule 2: Retinopathy is unlikely without preceding Glucose drift
        if input_state.get('glucose_drift', 0) < 0.2 and predictions.get('retina', 0) > 0.8:
            constrained_preds['retina'] = 0.4
            print("Symbolic Logic Triggered: Suppressed Retinopathy Spike (Low Glucose Drift)")

        return constrained_preds

class CausalOrganGraph(nn.Module):
    def __init__(self):
        super(CausalOrganGraph, self).__init__()
        # Organs: Glucose (Source), Kidney, Retina, Heart, Nerve
        self.organs = ['glucose', 'kidney', 'retina', 'heart', 'nerve']
        
        # Learnable Causal Weights (Adjacency Matrix equivalent)
        # Input: 5 organs. Output: 5 organs (next state probability)
        self.propagation_net = nn.Sequential(
            nn.Linear(5, 16),
            nn.ReLU(),
            nn.Linear(16, 5),
            nn.Sigmoid()
        )

    def forward(self, current_drifts):
        # current_drifts is list/tensor of drift intensities [0.0 - 1.0] for each organ
        pred_tensor = self.propagation_net(current_drifts)
        
        # Convert to dict for symbolic processing
        pred_dict = {organ: pred_tensor[i].item() for i, organ in enumerate(self.organs)}
        
        # Apply Symbolic Interactions
        # Map input tensor to dict for logic checking
        input_dict = {f"{organ}_drift": current_drifts[i].item() for i, organ in enumerate(self.organs)}
        
        final_preds = MedicalOntology.apply_constraints(pred_dict, input_dict)
        return final_preds

if __name__ == "__main__":
    model = CausalOrganGraph()
    # Simulating High Glucose Drift (Index 0), Low others
    input_drifts = torch.tensor([0.9, 0.1, 0.1, 0.1, 0.1])
    
    print("Raw Input:", input_drifts)
    output = model(input_drifts)
    print("Predicted Complication Risks:", output)
    
    # Test Rule 1: Force high kidney drift
    input_drifts_2 = torch.tensor([0.5, 0.8, 0.1, 0.1, 0.1])
    print("\nTesting Kidney->Heart Rule:")
    output_2 = model(input_drifts_2)
    print("Output:", output_2)
