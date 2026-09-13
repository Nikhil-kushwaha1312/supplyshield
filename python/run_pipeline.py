"""
run_pipeline.py - Sequential runner for SupplyShield Modules 1-4.
Run this first to populate outputs/ before launching the Streamlit dashboard.

Usage:
    python run_pipeline.py

Then launch the dashboard:
    streamlit run module5_dashboard.py
"""

import time
import sys
import io

# Fix UTF-8 output on Windows (prevents cp1252 UnicodeEncodeError)
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def run_module(name: str, fn):
    print(f"\n{'='*60}")
    print(f"  Running {name}")
    print(f"{'='*60}")
    t0 = time.time()
    result = fn()
    elapsed = time.time() - t0
    print(f"\n  Completed in {elapsed:.1f}s")
    return result


def main():
    print("\n" + "=" * 60)
    print("  [SupplyShield] Full Pipeline Runner")
    print("=" * 60)
    print("\nThis will run all 4 analysis modules sequentially.")
    print("Estimated time: ~30-60 seconds\n")

    t_total = time.time()

    # Module 1: Graph Construction
    from module1_graph_construction import run as m1
    run_module("Module 1: Graph Construction", m1)

    # Module 2: Disruption Simulator
    from module2_disruption_simulator import run as m2
    run_module("Module 2: Disruption Simulator", m2)

    # Module 3: Cascade Prediction
    from module3_cascade_prediction import run as m3
    run_module("Module 3: Cascade Failure Prediction", m3)

    # Module 4: Resilience Recommender
    from module4_resilience_recommender import run as m4
    run_module("Module 4: Resilience Strategy Recommender", m4)

    elapsed_total = time.time() - t_total
    print("\n" + "=" * 60)
    print(f"  [OK] All modules complete in {elapsed_total:.1f}s")
    print("=" * 60)
    print("\nOutputs written to: outputs/")
    print("  graph.pkl                -- NetworkX DiGraph (serialised)")
    print("  graph.json               -- Graph data for dashboard")
    print("  disruption_results.json  -- 7 scenario impact reports")
    print("  cascade_results.json     -- Risk labels, SIR model, feature importance")
    print("  resilience_results.json  -- Scores, SPOFs, robustness curve, strategies")
    print("\nLaunch the dashboard:")
    print("  streamlit run 0_🏠_Overview.py\n")


if __name__ == "__main__":
    main()
