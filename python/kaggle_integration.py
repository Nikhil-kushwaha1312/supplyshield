"""
kaggle_integration.py
Module for acquiring and preparing Kaggle Supply Chain data for SupplyShield.

Primary Dataset: DataCo Smart Supply Chain for Big Data Analysis
Dataset Slug: shashwatwork/dataco-smart-supply-chain-for-big-data-analysis
"""

import os
import sys
import json
import shutil
import pandas as pd
import numpy as np

# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATASET_SLUG = "shashwatwork/dataco-smart-supply-chain-for-big-data-analysis"
DATA_FILENAME = "DataCoSupplyChainDataset.csv"
DATA_FILEPATH = os.path.join(DATA_DIR, DATA_FILENAME)


def check_kaggle_credentials() -> bool:
    """Check if Kaggle credentials exist in env vars or ~/.kaggle/kaggle.json."""
    if os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY"):
        return True
    kaggle_json_path = os.path.expanduser(os.path.join("~", ".kaggle", "kaggle.json"))
    return os.path.exists(kaggle_json_path)


def download_from_kaggle(target_dir: str = DATA_DIR) -> bool:
    """Attempt to download the dataset using the Kaggle API or kagglehub."""
    os.makedirs(target_dir, exist_ok=True)
    print(f"\n[Kaggle] Checking credentials for '{DATASET_SLUG}'...")

    # Method 1: Kaggle API
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        print(f"[Kaggle] Authenticated successfully. Downloading dataset into {target_dir}...")
        api.dataset_download_files(DATASET_SLUG, path=target_dir, unzip=True)
        if os.path.exists(DATA_FILEPATH):
            print(f"[Kaggle] Successfully extracted: {DATA_FILEPATH}")
            return True
    except Exception as e:
        print(f"[Kaggle] kaggle API download attempt: {e}")

    # Method 2: Kagglehub fallback
    try:
        import kagglehub
        print("[Kaggle] Trying kagglehub download...")
        download_path = kagglehub.dataset_download(DATASET_SLUG)
        if os.path.exists(download_path):
            for fname in os.listdir(download_path):
                if fname.endswith(".csv"):
                    src = os.path.join(download_path, fname)
                    dst = os.path.join(target_dir, DATA_FILENAME)
                    shutil.copyfile(src, dst)
                    print(f"[Kaggle] Dataset copied from {src} to {dst}")
                    return True
    except Exception as e:
        print(f"[Kaggle] kagglehub download attempt: {e}")

    return False


def generate_bootstrap_dataset(filepath: str = DATA_FILEPATH, n_records: int = 5000):
    """
    Generates a realistic mock dataset matching the exact schema and distributions 
    of the Kaggle DataCo Smart Supply Chain dataset. Used when offline or before 
    Kaggle API credentials are supplied.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    print(f"\n[Kaggle] Generating bootstrap dataset ({n_records:,} shipment records) with DataCo schema...")
    
    rng = np.random.default_rng(42)

    shipping_modes = ["Standard Class", "Second Class", "First Class", "Same Day"]
    mode_weights = [0.60, 0.20, 0.15, 0.05]
    modes = rng.choice(shipping_modes, size=n_records, p=mode_weights)

    categories = ["Cleats", "Men's Footwear", "Women's Apparel", "Cardio Equipment", "Water Sports", "Camping & Hiking"]
    markets = ["Pacific Asia", "USCA", "Africa", "Europe", "LATAM"]
    order_regions = ["South Asia", "Southeast Asia", "North America", "Western Europe", "Central America"]

    unit_prices = np.round(rng.uniform(15.0, 350.0, size=n_records), 2)
    quantities = rng.integers(1, 6, size=n_records)
    discount_rates = np.round(rng.choice([0.0, 0.05, 0.10, 0.15, 0.20, 0.25], size=n_records, p=[0.35, 0.20, 0.20, 0.12, 0.08, 0.05]), 2)
    gross_sales = np.round(unit_prices * quantities, 2)
    discounts = np.round(gross_sales * discount_rates, 2)
    net_sales = np.round(gross_sales - discounts, 2)
    benefits = np.round(net_sales * rng.uniform(0.05, 0.40, size=n_records) - rng.uniform(0, 20, size=n_records), 2)

    scheduled_days = []
    real_days = []
    late_risks = []
    delivery_statuses = []

    for i in range(n_records):
        mode = modes[i]
        qty = quantities[i]
        disc = discount_rates[i]
        
        # Operational congestion factor based on volume and surge discounts
        congestion_risk = 0.15 * (qty / 5.0) + 0.25 * (disc / 0.25)
        
        if mode == "Same Day":
            sched = 0
            # Higher chance of failure if large quantity or rush order
            p_late = min(0.65, 0.15 + congestion_risk)
            p_on_time = 1.0 - p_late
            probs = np.array([p_on_time, p_late * 0.75, p_late * 0.25])
            probs = probs / probs.sum()
            delay = rng.choice([0, 1, 2], p=probs)
            real = sched + delay
        elif mode == "First Class":
            sched = int(rng.choice([1, 2], p=[0.4, 0.6]))
            p_late = min(0.70, 0.20 + congestion_risk)
            probs = np.array([0.15, max(0.1, 1.0 - p_late - 0.15), p_late * 0.7, p_late * 0.3])
            probs = probs / probs.sum()
            delay = rng.choice([-1, 0, 1, 2], p=probs)
            real = max(0, sched + delay)
        elif mode == "Second Class":
            sched = int(rng.choice([2, 3], p=[0.5, 0.5]))
            p_late = min(0.75, 0.25 + congestion_risk)
            probs = np.array([0.15, max(0.1, 1.0 - p_late - 0.15), p_late * 0.6, p_late * 0.3, p_late * 0.1])
            probs = probs / probs.sum()
            delay = rng.choice([-1, 0, 1, 2, 3], p=probs)
            real = max(0, sched + delay)
        else: # Standard Class
            sched = 4
            p_late = min(0.80, 0.30 + congestion_risk)
            probs = np.array([0.10, 0.15, max(0.1, 1.0 - p_late - 0.25), p_late * 0.6, p_late * 0.3, p_late * 0.1])
            probs = probs / probs.sum()
            delay = rng.choice([-2, -1, 0, 1, 2, 3], p=probs)
            real = max(0, sched + delay)

        is_late = 1 if real > sched else 0

        if is_late:
            status = "Late delivery"
        elif real < sched:
            status = "Advance shipping"
        else:
            status = "Shipping on time"

        scheduled_days.append(sched)
        real_days.append(real)
        late_risks.append(is_late)
        delivery_statuses.append(status)

    df = pd.DataFrame({
        "Type": rng.choice(["DEBIT", "TRANSFER", "PAYMENT", "CASH"], size=n_records),
        "Days for shipping (real)": real_days,
        "Days for shipment (scheduled)": scheduled_days,
        "Benefit per order": benefits,
        "Sales per customer": net_sales,
        "Delivery Status": delivery_statuses,
        "Late_delivery_risk": late_risks,
        "Category Name": rng.choice(categories, size=n_records),
        "Customer City": rng.choice(["Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune"], size=n_records),
        "Customer Country": "India",
        "Customer Segment": rng.choice(["Consumer", "Corporate", "Home Office"], size=n_records, p=[0.52, 0.30, 0.18]),
        "Department Name": rng.choice(["Apparel", "Fan Shop", "Footwear", "Outdoors", "Fitness"], size=n_records),
        "Market": rng.choice(markets, size=n_records),
        "Order City": rng.choice(["Mumbai", "Delhi", "Bengaluru", "Chennai", "Ahmedabad", "Jaipur", "Kolkata"], size=n_records),
        "Order Country": "India",
        "Order Region": rng.choice(order_regions, size=n_records),
        "Order Status": rng.choice(["COMPLETE", "PENDING", "PROCESSING", "CLOSED", "CANCELED"], size=n_records, p=[0.55, 0.20, 0.12, 0.10, 0.03]),
        "Order Item Discount Rate": discount_rates,
        "Order Item Product Price": unit_prices,
        "Order Item Quantity": quantities,
        "Sales": net_sales,
        "Shipping Mode": modes,
    })

    df.to_csv(filepath, index=False, encoding="utf-8")
    print(f"[Kaggle] Bootstrap dataset created: {filepath} ({len(df):,} rows)")
    return filepath


def ensure_dataset(force_download: bool = False) -> str:
    """Ensures the dataset is available locally, downloading or bootstrapping as needed."""
    if os.path.exists(DATA_FILEPATH) and not force_download:
        print(f"[Kaggle] Dataset found locally: {DATA_FILEPATH}")
        return DATA_FILEPATH

    if check_kaggle_credentials() or force_download:
        success = download_from_kaggle(DATA_DIR)
        if success and os.path.exists(DATA_FILEPATH):
            return DATA_FILEPATH

    print("[Kaggle] Kaggle credentials not configured or download unavailable.")
    print("[Kaggle] Generating offline fallback bootstrap dataset for immediate execution.")
    return generate_bootstrap_dataset(DATA_FILEPATH)


if __name__ == "__main__":
    ensure_dataset()
