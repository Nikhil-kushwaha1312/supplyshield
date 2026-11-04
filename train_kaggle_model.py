"""
train_kaggle_model.py
Preprocesses Kaggle supply chain data, trains Gradient Boosting disruption model,
and outputs model evaluation metrics and multimodal route reliability statistics for SupplyShield.

Outputs:
  - outputs/kaggle_disruption_clf.pkl
  - outputs/kaggle_model_metrics.json
"""

import os
import json
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

from kaggle_integration import ensure_dataset

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_dataset() -> pd.DataFrame:
    """Ensures dataset is present and loads with robust encoding fallback."""
    csv_path = ensure_dataset()
    print(f"\n[1/5] Loading data from {csv_path}...")
    try:
        df = pd.read_csv(csv_path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(csv_path, encoding="ISO-8859-1")
    print(f"  Dataset loaded: {len(df):,} rows, {len(df.columns)} columns")
    return df


def preprocess_data(df: pd.DataFrame):
    """Clean data, encode features, and calculate modal reliability statistics."""
    print("\n[2/5] Cleaning and feature engineering...")

    # Required feature candidates
    target_col = "Late_delivery_risk"
    if target_col not in df.columns:
        if "Delivery Status" in df.columns:
            df[target_col] = (df["Delivery Status"] == "Late delivery").astype(int)
        else:
            raise ValueError(f"Target column '{target_col}' not found in dataset!")

    # Calculate modal disruption statistics
    mode_stats = {}
    if "Shipping Mode" in df.columns:
        for mode, group in df.groupby("Shipping Mode"):
            late_rate = float(group[target_col].mean())
            avg_sched = float(group["Days for shipment (scheduled)"].mean()) if "Days for shipment (scheduled)" in group else 3.0
            avg_real = float(group["Days for shipping (real)"].mean()) if "Days for shipping (real)" in group else avg_sched
            mode_stats[mode] = {
                "sample_count": int(len(group)),
                "late_delivery_rate": round(late_rate, 4),
                "empirical_reliability": round(1.0 - late_rate, 4),
                "avg_scheduled_days": round(avg_sched, 2),
                "avg_real_days": round(avg_real, 2),
            }

    # Core numerical and categorical predictors
    feature_cols = [
        "Shipping Mode",
        "Days for shipment (scheduled)",
        "Benefit per order",
        "Order Item Discount Rate",
        "Order Item Product Price",
        "Order Item Quantity",
    ]

    # Include optional fields if present in DataCo
    optional_cols = ["Sales", "Sales per customer"]
    for col in optional_cols:
        if col in df.columns and col not in feature_cols:
            feature_cols.append(col)

    available_cols = [c for c in feature_cols if c in df.columns]
    sub_df = df[available_cols + [target_col]].dropna().copy()

    # Encode categorical columns
    encoders = {}
    if "Shipping Mode" in sub_df.columns:
        le_mode = LabelEncoder()
        sub_df["Shipping Mode Encoded"] = le_mode.fit_transform(sub_df["Shipping Mode"].astype(str))
        encoders["Shipping Mode"] = le_mode
        available_cols.remove("Shipping Mode")
        available_cols.append("Shipping Mode Encoded")

    X = sub_df[available_cols].values
    y = sub_df[target_col].values
    print(f"  Processed features ({len(available_cols)}): {available_cols}")
    print(f"  Class balance: On-time (0): {int((y == 0).sum()):,}, Disrupted/Late (1): {int((y == 1).sum()):,}")

    return X, y, available_cols, encoders, mode_stats


def run():
    print("=" * 60)
    print("SupplyShield - Kaggle Disruption ML Model Training")
    print("=" * 60)

    df = load_dataset()
    X, y, feature_names, encoders, mode_stats = preprocess_data(df)

    # Subsample if dataset is very large (~180k rows) for rapid training without sacrificing variance
    if len(X) > 40000:
        rng = np.random.default_rng(42)
        idx = rng.choice(len(X), size=40000, replace=False)
        X, y = X[idx], y[idx]
        print(f"  Subsampled to 40,000 records for optimal training convergence.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\n[3/5] Evaluating 5-Fold Stratified Cross-Validation...")
    clf = GradientBoostingClassifier(
        n_estimators=180,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"  5-Fold CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    print("\n[4/5] Training final Gradient Boosting Classifier on train split...")
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    test_acc = float((y_pred == y_test).mean())
    test_auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"  Test Accuracy: {test_acc:.3f}")
    print(f"  Test ROC-AUC:  {test_auc:.3f}")
    print(f"  Confusion Matrix: {cm}")

    # Feature Importance
    importance = {
        name: round(float(imp), 4)
        for name, imp in zip(feature_names, clf.feature_importances_)
    }
    # Sort importance descending
    importance = dict(sorted(importance.items(), key=lambda item: item[1], reverse=True))

    print("\n[5/5] Saving model and metrics to outputs/...")
    model_path = os.path.join(OUTPUT_DIR, "kaggle_disruption_clf.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "clf": clf,
            "feature_names": feature_names,
            "encoders": encoders,
            "mode_stats": mode_stats,
        }, f)

    metrics = {
        "dataset_name": "DataCo Smart Supply Chain (Kaggle)",
        "samples_analyzed": int(len(X)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "cv_scores": {
            "mean": round(float(cv_scores.mean()), 4),
            "std": round(float(cv_scores.std()), 4),
            "per_fold": [round(float(s), 4) for s in cv_scores],
        },
        "test_metrics": {
            "accuracy": round(test_acc, 4),
            "roc_auc": round(test_auc, 4),
            "precision": round(float(report["1"]["precision"]), 4),
            "recall": round(float(report["1"]["recall"]), 4),
            "f1_score": round(float(report["1"]["f1-score"]), 4),
        },
        "confusion_matrix": cm,
        "feature_importance": importance,
        "modal_statistics": mode_stats,
    }

    metrics_path = os.path.join(OUTPUT_DIR, "kaggle_model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"  Model saved to:   {model_path}")
    print(f"  Metrics saved to: {metrics_path}")
    print("\n[OK] Kaggle ML Disruption Model training complete.")
    return metrics


if __name__ == "__main__":
    run()
