import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

class DriftAutoencoder(nn.Module):
    def __init__(self, input_dim=4, hidden_dim=8):
        super(DriftAutoencoder, self).__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU()
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(hidden_dim // 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

class DriftDetector:
    def __init__(self, input_dim=4):
        self.model = DriftAutoencoder(input_dim=input_dim)
        self.criterion = nn.MSELoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.threshold = None

    def train(self, data_tensor, epochs=50):
        self.model.train()
        for epoch in range(epochs):
            self.optimizer.zero_grad()
            outputs = self.model(data_tensor)
            loss = self.criterion(outputs, data_tensor)
            loss.backward()
            self.optimizer.step()
        
        # Set threshold based on reconstruction error of the training (baseline) data
        with torch.no_grad():
            reconstructions = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructions) ** 2, dim=1)
            self.threshold = torch.mean(errors) + 2 * torch.std(errors) # 2 sigma rule
            print(f"Model trained. Drift threshold set to: {self.threshold.item():.4f}")

    def detect(self, new_data_tensor):
        self.model.eval()
        with torch.no_grad():
            reconstruction = self.model(new_data_tensor)
            error = torch.mean((new_data_tensor - reconstruction) ** 2)
            
        is_drift = error > self.threshold
        return is_drift.item(), error.item()

    def get_weights(self):
        return self.model.state_dict()

    def update_weights(self, global_weights):
        self.model.load_state_dict(global_weights)
