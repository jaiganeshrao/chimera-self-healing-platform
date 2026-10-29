"""
Project Chimera: Synthetic Dataset Generator for Root-Cause Analysis
Generates realistic failure telemetry for training and evaluating Scikit-Learn models.
NOTE: As required by project guidelines, synthetic data is utilized to establish baseline
patterns and ML feature representations, without claiming real-world predictive superiority.
"""

import numpy as np
import pandas as pd
import os

CATEGORIES = [
    "SERVICE_CRASH",
    "REQUEST_TIMEOUT",
    "HIGH_RESOURCE_USAGE",
    "DATABASE_CONNECTIVITY_FAILURE",
    "HTTP_ERROR_SPIKE",
]


def generate_synthetic_telemetry(n_samples_per_class: int = 400, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    records = []

    for _ in range(n_samples_per_class):
        records.append({
            "response_time_ms": int(np.random.normal(30, 15)),
            "http_status": np.random.choice([503, 0], p=[0.75, 0.25]),
            "consecutive_failures": int(np.random.randint(1, 5)),
            "cpu_usage_pct": float(np.clip(np.random.normal(12, 5), 0, 100)),
            "memory_usage_pct": float(np.clip(np.random.normal(35, 8), 0, 100)),
            "is_db_error_signature": 0,
            "category": "SERVICE_CRASH",
        })

    for _ in range(n_samples_per_class):
        records.append({
            "response_time_ms": int(np.clip(np.random.normal(3300, 300), 2900, 6000)),
            "http_status": np.random.choice([200, 504], p=[0.7, 0.3]),
            "consecutive_failures": int(np.random.randint(1, 4)),
            "cpu_usage_pct": float(np.clip(np.random.normal(65, 10), 0, 100)),
            "memory_usage_pct": float(np.clip(np.random.normal(55, 10), 0, 100)),
            "is_db_error_signature": 0,
            "category": "REQUEST_TIMEOUT",
        })

    for _ in range(n_samples_per_class):
        is_cpu_bound = np.random.rand() > 0.5
        records.append({
            "response_time_ms": int(np.clip(np.random.normal(1200, 400), 200, 2800)),
            "http_status": 200,
            "consecutive_failures": int(np.random.randint(1, 3)),
            "cpu_usage_pct": float(np.clip(np.random.normal(92, 5) if is_cpu_bound else np.random.normal(50, 10), 0, 100)),
            "memory_usage_pct": float(np.clip(np.random.normal(91, 4) if not is_cpu_bound else np.random.normal(60, 10), 0, 100)),
            "is_db_error_signature": 0,
            "category": "HIGH_RESOURCE_USAGE",
        })

    for _ in range(n_samples_per_class):
        records.append({
            "response_time_ms": int(np.clip(np.random.normal(900, 250), 300, 2500)),
            "http_status": 500,
            "consecutive_failures": int(np.random.randint(1, 6)),
            "cpu_usage_pct": float(np.clip(np.random.normal(30, 8), 0, 100)),
            "memory_usage_pct": float(np.clip(np.random.normal(45, 8), 0, 100)),
            "is_db_error_signature": 1,
            "category": "DATABASE_CONNECTIVITY_FAILURE",
        })

    for _ in range(n_samples_per_class):
        records.append({
            "response_time_ms": int(np.clip(np.random.normal(180, 60), 40, 500)),
            "http_status": 500,
            "consecutive_failures": int(np.random.randint(2, 6)),
            "cpu_usage_pct": float(np.clip(np.random.normal(25, 7), 0, 100)),
            "memory_usage_pct": float(np.clip(np.random.normal(40, 6), 0, 100)),
            "is_db_error_signature": 0,
            "category": "HTTP_ERROR_SPIKE",
        })

    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df


if __name__ == "__main__":
    os.makedirs("ml/datasets", exist_ok=True)
    dataset = generate_synthetic_telemetry(n_samples_per_class=400)
    output_path = "ml/datasets/synthetic_incident_telemetry.csv"
    dataset.to_csv(output_path, index=False)
    print(f"Dataset generated with {len(dataset)} records at {output_path}")
    print("Class distribution:")
    print(dataset["category"].value_counts())
