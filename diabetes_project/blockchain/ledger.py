import json
import time
import hashlib
from diabetes_project.blockchain.zk_proof import ZKVerifier

class HealthBlock:
    def __init__(self, index, data, previous_hash):
        self.index = index
        self.timestamp = time.time()
        self.data = data # Dictionary containing model update hash or alert details
        self.previous_hash = previous_hash
        self.hash = self.compute_hash()

    def compute_hash(self):
        block_string = json.dumps(self.__dict__, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

class BlockchainLedger:
    def __init__(self):
        self.chain = []
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = HealthBlock(0, {"event": "Genesis Block"}, "0")
        self.chain.append(genesis_block)

class SmartContract:
    """
    Simulates a 'Chaincode' that executes logic on-chain.
    Novelty: Automated, decentralized validation of drift alerts.
    """
    @staticmethod
    def execute(data):
        if data.get("event") == "Drift Alert":
            # Logic: If drift > 0.8, automatically trigger a 'SeverityEscalation' event
            if data.get("error", 0) > 0.8:
                print("⚡ SMART CONTRACT TRIGGERED: High Severity Drift Detected! Auto-Escalating...")
                return {"contract_action": "ESCALATE_TO_SPECIALIST", "reason": "Severe Drift > 0.8"}
        return None

    def add_block(self, data, proof=None):
        """
        Adds a block to the chain.
        If data is a 'Model Update', it REQUIRES a valid ZK-Proof.
        """
        if data.get("event") == "Model Update":
            if not proof:
                print("BLOCK REJECTED: Model Update requires ZK-Proof.")
                return None
            
            valid, msg = ZKVerifier.verify_proof(proof)
            if not valid:
                print(f"BLOCK REJECTED: {msg}")
                return None
            
            # Store proof in the block
            data["zk_proof"] = proof
            print("✅ ZK-Proof Verified. Committing Block...")

        # Execute Smart Contract Logic
        contract_result = SmartContract.execute(data)
        if contract_result:
            data["smart_contract_execution"] = contract_result

        previous_block = self.chain[-1]
        new_block = HealthBlock(len(self.chain), data, previous_block.hash)
        self.chain.append(new_block)
        return new_block

    def verify_chain(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]
            
            if current.hash != current.compute_hash():
                return False
            if current.previous_hash != previous.hash:
                return False
        return True

if __name__ == "__main__":
    ledger = BlockchainLedger()
    ledger.add_block({"event": "Drift Alert", "patient_id": "P001", "error": 0.5})
    ledger.add_block({"event": "Model Update", "round": 1, "update_hash": "a1b2c3d4"})
    
    print(f"Chain valid? {ledger.verify_chain()}")
    print([block.data for block in ledger.chain])
