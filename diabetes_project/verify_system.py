import os
import json
from diabetes_project.blockchain.ledger import BlockchainLedger
from diabetes_project.data.loader import RealWorldDataLoader

def verify():
    print("Starting System Verification...")
    
    # 1. Verify Data
    # 1. Verify Data
    if os.path.exists("diabetes_project/data/samples/patient_data.csv"):
        print("Pima Dataset found.")
    else:
        print("Pima Dataset MISSING!")
        
    loader = RealWorldDataLoader("P001", "diabetes_project/data/samples/patient_data.csv")
    data = loader.load_data()
    if data is not None and not data.empty:
        print(f"Data Loaded. Shape: {data.shape}")
        if 'glucose' in data.columns and 'gfr' in data.columns:
            print("Data Schema Mapping verification passed.")
        else:
            print("Data Schema Mapping FAILED.")
    else:
        print("Data Load FAILED.")

    # 2. Verify Blockchain Persistence
    print("\nTesting Blockchain Persistence...")
    ledger = BlockchainLedger()
    initial_len = len(ledger.chain)
    print(f"Initial Chain Length: {initial_len}")
    
    print("Mining a test block...")
    ledger.add_block({"event": "Test Block", "val": 123})
    
    # Reload
    ledger2 = BlockchainLedger()
    if len(ledger2.chain) == initial_len + 1:
        print("Blockchain Persistence Verified.")
    else:
        print(f"Persistence FAILED. Expected {initial_len + 1}, got {len(ledger2.chain)}")

if __name__ == "__main__":
    verify()
