import numpy as np
import json

class MockVectorDB:
    """Simulates a Vector Database (like ChromaDB) for prototype."""
    def __init__(self):
        self.vectors = []
        self.metadata = []

    def add(self, vector, meta):
        self.vectors.append(vector)
        self.metadata.append(meta)

    def query(self, query_vector, k=1):
        if not self.vectors:
            return []
        
        # Cosine Similarity
        scores = []
        q_norm = np.linalg.norm(query_vector)
        for i, vec in enumerate(self.vectors):
            v_norm = np.linalg.norm(vec)
            if q_norm == 0 or v_norm == 0:
                score = 0
            else:
                score = np.dot(query_vector, vec) / (q_norm * v_norm)
            scores.append((score, self.metadata[i]))
        
        # Sort desc
        scores.sort(key=lambda x: x[0], reverse=True)
        return scores[:k]

class MultimodalRAG:
    def __init__(self):
        self.signal_db = MockVectorDB() # For time-series embeddings
        self.text_db = MockVectorDB()   # For medical literature embeddings
        
        # Seed with some dummy medical knowledge
        self._seed_knowledge()

    def _seed_knowledge(self):
        # 1. Literature
        self.text_db.add(np.random.rand(128), {"title": "Diabetic Nephropathy & CVD", "content": "Kidney dysfunction accelerates heart failure risks."})
        self.text_db.add(np.random.rand(128), {"title": "Retinopathy Stages", "content": "Proliferative retinopathy follows sustained hyperglycemia."})
        
        # 2. Historical Cases (Patient Signals)
        # Vector represents [Glucose, Kidney, Retina, Heart, Nerve] drift
        self.signal_db.add(np.array([0.8, 0.9, 0.1, 0.6, 0.1]), {"patient_id": "H001", "outcome": "Heart Attack within 6 months"})
        self.signal_db.add(np.array([0.9, 0.2, 0.8, 0.1, 0.1]), {"patient_id": "H002", "outcome": "Blindness within 1 year"})

    def retrieve_context(self, current_drift_vector):
        """
        Retrieves both similar past cases and relevant literature.
        current_drift_vector: np.array of shape (5,)
        """
        # 1. Find similar patients (Signal Search)
        # We project the 5-dim drift vector to 128-dim for 'embedding' simulation
        # In reality, we'd use a Time-Series Encoder (e.g., LSTM last state)
        # Here we just pad it for the mock
        query_sig = np.pad(current_drift_vector, (0, 128-5))
        similar_cases = self.signal_db.query(current_drift_vector, k=1)
        
        # 2. Find literature (Text Search)
        # In reality, we'd embed the Drift Alert text. Here we use random for mock.
        query_text = np.random.rand(128) 
        literature = self.text_db.query(query_text, k=1)
        
        return {
            "similar_case": similar_cases[0][1] if similar_cases else None,
            "relevant_paper": literature[0][1] if literature else None
        }

if __name__ == "__main__":
    rag = MultimodalRAG()
    # Query: High Kidney Drift (Index 1) and Heart Drift (Index 3)
    curr_drift = np.array([0.5, 0.9, 0.1, 0.7, 0.1])
    
    context = rag.retrieve_context(curr_drift)
    print("Retrieved Context:", json.dumps(context, indent=2))
