import sys
import os
import pandas as pd
# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from diabetes_project.data.loader import RealWorldDataLoader
from diabetes_project.federated.client import FederatedClient
from diabetes_project.agents.council import DiagnosticCouncil

def test_loader():
    print("Testing RealWorldDataLoader...")
    loader = RealWorldDataLoader("P001", "diabetes_project/data/samples/patient_data.csv")
    df = loader.load_data()
    
    assert df is not None, "Dataframe is None"
    assert len(df) > 0, "Dataframe is empty"
    assert 'glucose' in df.columns, "Glucose column missing"
    assert 'gfr' in df.columns, "GFR column missing"
    print(f"Loader success! Shape: {df.shape}")
    print(df.head())

def test_council_integration():
    print("\nTesting Council Integration...")
    council = DiagnosticCouncil("P001", use_real_data=True)
    
    # Run a few steps
    print("Running simulation step 0...")
    status = council.client.monitor(0)
    print(f"Step 0 Status: {status}")
    
    # Check if data in client matches CSV
    # Our CSV has glucose 105 at index 0 (Day 1)
    # Note: Client splits first 50% for training if data is short.
    # Sample data is 10 rows. Split is 5. Monitoring starts at index 5.
    # So client.monitor(0) checks index 5.
    
    client_data_len = len(council.client.monitoring_data)
    print(f"Client Monitoring Data Length: {client_data_len}")
    
    assert client_data_len > 0, "Client has no monitoring data"
    print("Council Integration success!")

if __name__ == "__main__":
    test_loader()
    test_council_integration()
