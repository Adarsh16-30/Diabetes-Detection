import requests
import os

URL = "https://raw.githubusercontent.com/npradaschnor/Pima-Indians-Diabetes-Dataset/master/diabetes.csv"
OUTPUT_PATH = "diabetes_project/data/samples/patient_data.csv"

def download_data():
    print(f"Downloading Pima Indians Diabetes Dataset from {URL}...")
    try:
        response = requests.get(URL)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, "wb") as f:
            f.write(response.content)
            
        print(f"✅ Dataset saved to {OUTPUT_PATH}")
    except Exception as e:
        print(f"❌ Failed to download dataset: {e}")

if __name__ == "__main__":
    download_data()
