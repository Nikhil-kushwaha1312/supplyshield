# SupplyShield 🛡️

**AI-Driven Supply Chain Stress Testing & Resilience Optimization Platform for India's Critical Logistics Network.**

SupplyShield models India's multimodal supply chain as an interactive topological network graph, simulating cascade failure dynamics, predicting shipment disruption risk with Machine Learning trained on Kaggle supply chain datasets, and generating AI-backed resilience mitigation strategies.

---

## Architecture & Modules

1. **Module 1: Graph Construction (`module1_graph_construction.py`)**
   - Builds India's multimodal supply chain (ports, airports, rail hubs, factories, warehouses, cities) using NetworkX.
   - Computes Betweenness, Closeness, PageRank, and identifies Single Points of Failure (articulation points).

2. **Module 2: Disruption Simulator (`module2_disruption_simulator.py`)**
   - Simulates 7 India-specific disruption scenarios (dock strikes, monsoon floods, freight derailments, fuel crises).
   - Evaluates economic loss in ₹ Crores, affected industry sectors, and hub-level capacity shocks.

3. **Module 3: Cascade Failure Modeling (`module3_cascade_prediction.py`)**
   - Extracts 15 graph-topological features per node.
   - Trains a Gradient Boosting classifier to classify node risk levels and simulates epidemic failure diffusion using a discrete SIR model.

4. **Module 3B: Kaggle Disruption ML Model (`train_kaggle_model.py` & `kaggle_integration.py`)**
   - Ingests the DataCo Smart Supply Chain dataset from Kaggle (with offline fallback bootstrapping).
   - Trains a Gradient Boosting model with 5-fold cross-validation predicting late delivery/disruption risks.
   - Computes multimodal reliability statistics across shipping modes.

5. **Module 4: Resilience Optimization (`module4_resilience_recommender.py`)**
   - Computes sequential node removal robustness curves and per-node resilience scores (0–100).
   - Generates actionable infrastructure and operational mitigation action cards.

---

## Quickstart

### 1. Installation
```bash
cd python
pip install -r requirements.txt
```

### 2. Run Analysis Pipeline
```bash
python run_pipeline.py
```

### 3. Launch the Dashboard
```bash
streamlit run 0_🏠_Overview.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.
