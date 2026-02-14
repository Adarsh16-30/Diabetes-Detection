import numpy as np
import pandas as pd
import datetime

class PatientDataSimulator:
    def __init__(self, patient_id, days=365):
        self.patient_id = patient_id
        self.days = days
        self.start_date = datetime.date(2024, 1, 1)

    def generate_healthy_baseline(self):
        """Generates stable, healthy-ish vitals with normal noise."""
        dates = [self.start_date + datetime.timedelta(days=i) for i in range(self.days)]
        
        # Glucose (mg/dL) - fluctuating but controlled
        glucose = np.random.normal(loc=100, scale=15, size=self.days)
        
        # Kidney: GFR (mL/min/1.73m^2) - stable > 90
        gfr = np.random.normal(loc=95, scale=2, size=self.days)
        
        # Retina: Central Foveal Thickness (m) - stable ~250
        retina_thick = np.random.normal(loc=250, scale=5, size=self.days)
        
        # Heart: HRV (ms) - stable ~40-60
        hrv = np.random.normal(loc=50, scale=8, size=self.days)

        return pd.DataFrame({
            'date': dates,
            'glucose': glucose,
            'gfr': gfr,
            'retina_thickness': retina_thick,
            'hrv': hrv
        })

    def inject_drift(self, df, start_day=180, organ='kidney', intensity=0.1):
        """Injects a progressive degradation (drift) into a specific organ's metric."""
        length = len(df)
        if start_day >= length:
            return df
        
        # Drift ramps up linearly from start_day to end
        drift_factor = np.linspace(0, intensity * (length - start_day), num=(length - start_day))
        
        if organ == 'kidney':
            # GFR decreases
            df.loc[start_day:, 'gfr'] -= drift_factor * 20  # Significant drop
        elif organ == 'retina':
            # Thickness increases (edema)
            df.loc[start_day:, 'retina_thickness'] += drift_factor * 30
        elif organ == 'heart':
            # HRV decreases
            df.loc[start_day:, 'hrv'] -= drift_factor * 15
            
        return df

    def save_data(self, df, filepath):
        df.to_csv(filepath, index=False)
        print(f"Data saved to {filepath}")

if __name__ == "__main__":
    # Test generation
    sim = PatientDataSimulator(patient_id="P001")
    df = sim.generate_healthy_baseline()
    df = sim.inject_drift(df, start_day=200, organ='kidney', intensity=0.5)
    print(df.tail())
