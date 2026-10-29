"""
Project Chimera: Scikit-Learn Root-Cause Classifier Training Script
Trains a Random Forest multi-class model with feature importance extraction,
classification metrics, and export to a serialized artifact.
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from dataset_generator import generate_synthetic_telemetry


def train_chimera_classifier():
    print("[Chimera ML] Generating telemetry training set...")
    df = generate_synthetic_telemetry(n_samples_per_class=500, random_seed=42)

    features = [
        "response_time_ms",
        "http_status",
        "consecutive_failures",
        "cpu_usage_pct",
        "memory_usage_pct",
        "is_db_error_signature",
    ]

    X = df[features]
    y = df["category"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[Chimera ML] Training set size: {len(X_train)} | Test set size: {len(X_test)}")

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced",
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[Chimera ML] Test Accuracy: {acc * 100:.2f}%\n")
    print("[Chimera ML] Detailed Classification Report:")
    print(classification_report(y_test, y_pred))

    print("\n[Chimera ML] Feature Importances:")
    importances = model.feature_importances_
    for feat, imp in sorted(zip(features, importances), key=lambda x: x[1], reverse=True):
        print(f" - {feat:25s}: {imp * 100:.2f}%")

    os.makedirs("ml/models", exist_ok=True)
    model_path = "ml/models/chimera_rf_classifier.joblib"
    joblib.dump({"model": model, "features": features}, model_path)
    print(f"\n[Chimera ML] Model saved successfully to {model_path}")


if __name__ == "__main__":
    train_chimera_classifier()
