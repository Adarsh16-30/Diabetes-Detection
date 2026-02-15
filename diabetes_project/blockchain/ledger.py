import json
import time
import hashlib
import os
from diabetes_project.blockchain.zk_proof import ZKVerifier

CHAIN_FILE = "diabetes_project/blockchain/chain.json"
DIFFICULTY = 4

class HealthBlock:
    def __init__(self, index, data, previous_hash, nonce=0, hash=None, timestamp=None):
        self.index = index
        self.timestamp = timestamp if timestamp else time.time()
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = hash if hash else self.compute_hash()

    def compute_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self, difficulty):
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.compute_hash()
        print(f"Block Mined! Nonce: {self.nonce}, Hash: {self.hash}")

class BlockchainLedger:
    def __init__(self):
        self.chain = []
        if os.path.exists(CHAIN_FILE):
             self.load_chain()
        else:
            self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = HealthBlock(0, {"event": "Genesis Block"}, "0")
        genesis_block.mine_block(DIFFICULTY)
        self.chain.append(genesis_block)
        self.save_chain()

    def save_chain(self):
        chain_data = [block.__dict__ for block in self.chain]
        os.makedirs(os.path.dirname(CHAIN_FILE), exist_ok=True)
        with open(CHAIN_FILE, 'w') as f:
            json.dump(chain_data, f, indent=4)

    def load_chain(self):
        try:
            with open(CHAIN_FILE, 'r') as f:
                chain_data = json.load(f)
                self.chain = [HealthBlock(**data) for data in chain_data]
            print(f"Loaded {len(self.chain)} blocks from valid chain file.")
        except (json.JSONDecodeError, FileNotFoundError):
             print("Chain file corrupted or missing. Creating new chain.")
             self.create_genesis_block()


    class SmartContract:
        """
        Simulates chaincode execution for automated validation and escalation logic.
        """
        @staticmethod
        def execute(data):
            if data.get("event") == "Drift Alert":
                if data.get("error", 0) > 0.8:
                    print("Smart Contract Triggered: High Severity Drift Detected. Auto-Escalating.")
                    return {"contract_action": "ESCALATE_TO_SPECIALIST", "reason": "Severe Drift > 0.8"}
            return None

    def add_block(self, data, proof=None):
        """
        Adds a block to the chain.
        If data is a 'Model Update', it requires a valid ZK-Proof.
        """
        if data.get("event") == "Model Update":
            if not proof:
                print("Block Rejected: Model Update requires ZK-Proof.")
                return None
            
            valid, msg = ZKVerifier.verify_proof(proof)
            if not valid:
                print(f"Block Rejected: {msg}")
                return None
            
            data["zk_proof"] = proof
            print("ZK-Proof Verified. Committing Block...")

        contract_result = self.SmartContract.execute(data)
        if contract_result:
            data["smart_contract_execution"] = contract_result

        previous_block = self.chain[-1]
        new_block = HealthBlock(len(self.chain), data, previous_block.hash)
        
        print("Mining new block...")
        new_block.mine_block(DIFFICULTY)
        
        self.chain.append(new_block)
        self.save_chain()
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

