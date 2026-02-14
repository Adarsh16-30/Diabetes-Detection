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
        
        # Standard schema mapping
        self.column_mapping = {
            'Glucose': 'glucose',
            'GLU': 'glucose',
            'eGFR': 'gfr',
            'Creatinine': 'gfr', # Rough proxy if needed, ideally we'd convert
            'Retina_Thick': 'retina_thickness',
            'CST': 'retina_thickness',
            'HRV': 'hrv',
            'HeartRateVar': 'hrv'
        }
        
        self.required_columns = ['glucose', 'gfr', 'retina_thickness', 'hrv']

    def load_data(self):
        """Loads data from CSV or falls back to simulation."""
        if self.csv_path and os.path.exists(self.csv_path):
            print(f"Loading real-world data from {self.csv_path}...")
            df = pd.read_csv(self.csv_path)
            
            # Normalize columns
            df.rename(columns=self.column_mapping, inplace=True)
            
            # Hybrid Mode: Fill missing columns with simulation
            # We generate a baseline simulation of the same length
            sim_baseline = self.simulator.generate_healthy_baseline()
            
            # If CSV is shorter/longer, we might need to adjust logic. 
            # For now, let's assume we treat the CSV as the "truth" for the days it has.
            
            for col in self.required_columns:
                if col not in df.columns:
                    print(f"Warning: '{col}' missing in CSV. Imputing from simulation.")
                    # If CSV has 'day' or index, use it. If not, assume daily rows.
                    # We'll take the first N rows from simulator where N = len(df)
                    if len(df) <= len(sim_baseline):
                        df[col] = sim_baseline[col].iloc[:len(df)].values
                    else:
                        # Extrapolate or repeat simulation? 
                        # Simplest pattern: Repeat simulation to fill length
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
