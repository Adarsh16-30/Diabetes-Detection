import hashlib
import json
import time
import random

class ZKProver:
    """
    Simulates a Zero-Knowledge Prover.
    Generates a proof that 'I trained the model on valid data' without revealing the data.
    """
    def __init__(self, patient_id):
        self.patient_id = patient_id

    def generate_proof(self, model_weights, data_sample_hash):
        """
        Creates a ZK-SNARK (simulated).
        Steps:
        1. Commitment: Hash(weights + salt)
        2. Challenge: Hash(block_header + commitment)
        3. Response: Mixing the challenge with a secret key.
        """
        salt = str(random.getrandbits(256))
        weight_hash = hashlib.sha256(json.dumps(str(model_weights)).encode()).hexdigest()
        
        # 1. Commitment
        commitment = hashlib.sha256((weight_hash + salt).encode()).hexdigest()
        
        # 2. Challenge (Simulated from 'Verifiers')
        challenge = hashlib.sha256((commitment + str(time.time())).encode()).hexdigest()
        
        # 3. Response (The "Proof")
        # In real ZK, this is a complex polynomial argument.
        # Here, we simulate it by hashing the challenge with a private 'training key'.
        training_key = "secret_training_key_123"
        response = hashlib.sha256((challenge + training_key).encode()).hexdigest()
        
        proof = {
            "prover_id": self.patient_id,
            "commitment": commitment,
            "challenge": challenge,
            "response": response,
            "salt_hash": hashlib.sha256(salt.encode()).hexdigest(), # Public part of salt
            "timestamp": time.time()
        }
        return proof

class ZKVerifier:
    """
    Simulates a Zero-Knowledge Verifier on the Blockchain.
    """
    @staticmethod
    def verify_proof(proof):
        """
        Verifies the validity of the ZK-Proof.
        """
        # 1. Check timestamp freshness (prevent replay attacks)
        if time.time() - proof['timestamp'] > 60:
            return False, "Proof Expired"
            
        # 2. Verify Response Consistency (Simulation)
        # We re-compute the expected response hash
        training_key = "secret_training_key_123" # Shared logic in simulation
        expected_response = hashlib.sha256((proof['challenge'] + training_key).encode()).hexdigest()
        
        if proof['response'] == expected_response:
            return True, "ZK-Proof Validated"
        else:
            return False, "Invalid ZK-Proof"

if __name__ == "__main__":
    prover = ZKProver("P001")
    proof = prover.generate_proof({"w1": 0.5}, "data_hash_123")
    print("Generated Proof:", json.dumps(proof, indent=2))
    
    valid, msg = ZKVerifier.verify_proof(proof)
    print(f"Verification: {valid} - {msg}")
