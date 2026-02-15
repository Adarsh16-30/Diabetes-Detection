import pandas as pd
import numpy as np
import os
from diabetes_project.data.patient_simulator import PatientDataSimulator

class RealWorldDataLoader:
    def __init__(self, patient_id, csv_path=None):
        self.patient_id = patient_id
        self.csv_path = csv_path
        self.simulator = PatientDataSimulator(patient_id)
        self.data = None
        
        # Pima Indians Diabetes Dataset Mapping
        # Columns: Pregnancies,Glucose,BloodPressure,SkinThickness,Insulin,BMI,DiabetesPedigreeFunction,Age,Outcome
        self.column_mapping = {
            'Glucose': 'glucose',
            'BMI': 'gfr', # Proxy: BMI as load on kidneys for demo visualization
            'Age': 'retina_thickness', # Proxy: Age correlated with retinal changes
            'BloodPressure': 'hrv', # Proxy: BP inverse to HRV (simplified)
            'SkinThickness': 'nerve', # Proxy: Skin thickness ~ peripheral nerve health
        }
        
        self.required_columns = ['glucose', 'gfr', 'retina_thickness', 'hrv', 'nerve']

    def load_data(self):
        """Loads data from CSV or falls back to simulation."""
        if self.csv_path and os.path.exists(self.csv_path):
            print(f"Loading real-world data from {self.csv_path}...")
            df = pd.read_csv(self.csv_path)
            
            # Normalize columns
            df.rename(columns=self.column_mapping, inplace=True)
            
            # Normalization / Scaling for the "Organ Holodeck" Visuals
            # The visualization expects values roughly:
            # Glucose: 70-180 (Normal range) -> Pima is raw, so okay.
            # GFR: 90 is healthy. Pima BMI is ~30. We multiply by 3 to simulate GFR-like scale.
            # Retina: 250 is healthy. Pima Age is ~30-50. We multiply by 5.
            # HRV: 50 is healthy. Pima BP is ~70. We keep as is or scale slightly.
            
            if 'gfr' in df.columns:
                df['gfr'] = df['gfr'] * 3 # Scale BMI 30 -> 90
            
            if 'retina_thickness' in df.columns:
                df['retina_thickness'] = df['retina_thickness'] * 5 + 100 # Scale Age 30 -> 250
                
            # Hybrid Mode: Fill missing columns with simulation
            # We generate a baseline simulation of the same length
            sim_baseline = self.simulator.generate_healthy_baseline()
            
            for col in self.required_columns:
                if col not in df.columns:
                    # print(f"Warning: '{col}' missing in CSV. Imputing from simulation.")
                    if len(df) <= len(sim_baseline):
                        df[col] = sim_baseline[col].iloc[:len(df)].values
                    else:
                        extras = len(df) - len(sim_baseline)
                        extended_sim = pd.concat([sim_baseline]*((len(df)//len(sim_baseline))+1))
                        df[col] = extended_sim[col].iloc[:len(df)].values
            
            # Ensure no NaNs from the merge
            df.fillna(method='ffill', inplace=True)
            df.fillna(method='bfill', inplace=True)
            
            self.data = df
        else:
            print("CSV not found or not provided. Falling back to full simulation.")
            self.data = self.simulator.generate_healthy_baseline()
            # Inject default drift for demo purposes if pure simulation
            self.data = self.simulator.inject_drift(self.data, start_day=150, organ='kidney', intensity=0.3)
            
        return self.data

if __name__ == "__main__":
    # Test
    loader = RealWorldDataLoader("P001", "diabetes_project/data/samples/patient_data.csv")
    df = loader.load_data()
    print(df.head())
