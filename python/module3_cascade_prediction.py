"""
Module 3: Cascade Failure Prediction
- Builds a 15-feature vector per node
- Trains a Gradient Boosting Classifier (Safe / Low / Medium / High risk)
- Runs an SIR epidemic model over the graph
Output: outputs/cascade_results.json
"""

import os
import json
import pickle
import numpy as np
import networkx as nx
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score, StratifiedKFold

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
GRAPH_PKL  = os.path.join(OUTPUT_DIR, "graph.pkl")


# ---------------------------------------------------------------------------
# Feature Engineering
# ---------------------------------------------------------------------------
NODE_TYPES = ["port", "airport", "rail_hub", "factory", "warehouse", "city"]
TYPE_ONE_HOT = {t: i for i, t in enumerate(NODE_TYPES[:4])}  # 4 one-hot dims


def extract_features(G: nx.DiGraph) -> tuple[np.ndarray, list]:
    """Return feature matrix (N×15) and ordered node list."""
    nodes = list(G.nodes())
    features = []

    for node in nodes:
        attr = G.nodes[node]
        ntype = attr.get("type", "city")

        # 11 numeric features
        f = [
            attr.get("betweenness",            0.0),
            attr.get("closeness",              0.0),
            attr.get("eigenvector",            0.0),
            attr.get("pagerank",               0.0),
            attr.get("clustering",             0.0),
            float(attr.get("in_degree",        0)),
            float(attr.get("out_degree",       0)),
            float(attr.get("capacity",         50)) / 100.0,
            float(attr.get("criticality",      5))  / 10.0,
            float(attr.get("avg_neighbour_capacity", 50)) / 100.0,
            attr.get("avg_edge_reliability",   0.85),
        ]

        # 4 one-hot for node type
        oh = [0.0, 0.0, 0.0, 0.0]
        idx = TYPE_ONE_HOT.get(ntype)
        if idx is not None:
            oh[idx] = 1.0
        f.extend(oh)

        features.append(f)

    return np.array(features, dtype=np.float32), nodes


def assign_risk_label(G: nx.DiGraph, node: str) -> str:
    """
    Heuristic risk label based on node metrics.
    Used to generate synthetic training labels.
    """
    attr = G.nodes[node]
    bc   = attr.get("betweenness",  0.0)
    pr   = attr.get("pagerank",     0.0)
    cap  = attr.get("capacity",     50) / 100.0
    crit = attr.get("criticality",  5)  / 10.0
    rel  = attr.get("avg_edge_reliability", 0.85)

    score = (bc * 0.3) + (pr * 0.25) + ((1 - cap) * 0.2) + (crit * 0.15) + ((1 - rel) * 0.1)

    if score > 0.35:   return "High"
    if score > 0.20:   return "Medium"
    if score > 0.10:   return "Low"
    return "Safe"


def augment_data(X: np.ndarray, y: list, n_augment: int = 14) -> tuple[np.ndarray, np.ndarray]:
    """Gaussian noise augmentation to create ~450 training samples."""
    rng = np.random.default_rng(42)
    Xa, ya = [X], [np.array(y)]

    for _ in range(n_augment):
        noise = rng.normal(0, 0.05, size=X.shape)
        Xa.append(np.clip(X + noise, 0, 1))
        ya.append(np.array(y))

    return np.vstack(Xa), np.concatenate(ya)


# ---------------------------------------------------------------------------
# SIR Epidemic Model
# ---------------------------------------------------------------------------
def run_sir(G: nx.DiGraph, seed_nodes: list, steps: int = 30,
            base_rate: float = 0.3, recovery_rate: float = 0.15) -> dict:
    """
    Discrete-time SIR model.
    Returns dict with per-step S/I/R counts and per-node infection probability.
    """
    n = G.number_of_nodes()
    nodes = list(G.nodes())
    node_idx = {nd: i for i, nd in enumerate(nodes)}

    state = np.zeros(n, dtype=int)   # 0=S, 1=I, 2=R
    for seed in seed_nodes:
        if seed in node_idx:
            state[node_idx[seed]] = 1

    # Build adjacency array with reliability weights
    adj = {nd: [] for nd in nodes}
    for src, dst, edata in G.edges(data=True):
        rel = edata.get("reliability", 0.85)
        adj[src].append((dst, rel))

    sir_timeline = {"S": [], "I": [], "R": []}
    node_infection_count = np.zeros(n)

    for _step in range(steps):
        new_state = state.copy()
        for i, nd in enumerate(nodes):
            if state[i] == 1:
                node_infection_count[i] += 1
                # Spread to successors
                for (nb, rel) in adj.get(nd, []):
                    j = node_idx[nb]
                    if state[j] == 0:
                        p_infect = base_rate * (1 - rel)
                        if np.random.random() < p_infect:
                            new_state[j] = 1
                # Recovery
                if np.random.random() < recovery_rate:
                    new_state[i] = 2
            elif state[i] == 0:
                pass
        state = new_state
        sir_timeline["S"].append(int((state == 0).sum()))
        sir_timeline["I"].append(int((state == 1).sum()))
        sir_timeline["R"].append(int((state == 2).sum()))

    # Infection probability = fraction of steps spent infected
    inf_prob = {nodes[i]: round(float(node_infection_count[i] / steps), 4)
                for i in range(n)}

    return {"timeline": sir_timeline, "infection_probability": inf_prob}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run():
    print("=" * 60)
    print("Module 3: Cascade Failure Prediction")
    print("=" * 60)

    print("\n[1/5] Loading graph from outputs/graph.pkl...")
    if not os.path.exists(GRAPH_PKL):
        raise FileNotFoundError("Run module1_graph_construction.py first!")
    with open(GRAPH_PKL, "rb") as f:
        G = pickle.load(f)
    print(f"  Graph loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    print("\n[2/5] Extracting 15-feature vectors...")
    X_base, nodes = extract_features(G)
    y_base = [assign_risk_label(G, nd) for nd in nodes]
    print(f"  Base samples: {len(nodes)}")
    from collections import Counter
    print(f"  Label distribution: {dict(Counter(y_base))}")

    print("\n[3/5] Augmenting training data (~450 samples)...")
    le = LabelEncoder()
    y_enc = le.fit_transform(y_base)
    X_aug, y_aug = augment_data(X_base, y_enc, n_augment=14)
    print(f"  Augmented samples: {len(X_aug)}")

    print("\n[4/5] Training Gradient Boosting Classifier...")
    clf = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42,
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X_aug, y_aug, cv=cv, scoring="accuracy")
    clf.fit(X_aug, y_aug)
    print(f"  CV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # Per-node risk prediction
    y_pred = clf.predict(X_base)
    y_pred_labels = le.inverse_transform(y_pred)
    y_pred_proba = clf.predict_proba(X_base)

    node_risk = {}
    for i, nd in enumerate(nodes):
        node_risk[nd] = {
            "risk_label": y_pred_labels[i],
            "probabilities": {
                le.classes_[j]: round(float(y_pred_proba[i][j]), 4)
                for j in range(len(le.classes_))
            },
        }

    # Feature importance
    feature_names = [
        "Betweenness", "Closeness", "Eigenvector", "PageRank", "Clustering",
        "In-degree", "Out-degree", "Capacity", "Criticality",
        "Avg Neighbour Capacity", "Avg Edge Reliability",
        "Type: Port", "Type: Airport", "Type: Rail Hub", "Type: Factory",
    ]
    importance = {
        name: round(float(imp), 6)
        for name, imp in zip(feature_names, clf.feature_importances_)
    }

    print("\n[5/5] Running SIR epidemic model...")
    # Seed from 3 highest-risk nodes by betweenness
    sorted_by_bc = sorted(nodes, key=lambda nd: G.nodes[nd].get("betweenness", 0), reverse=True)
    seed_nodes = sorted_by_bc[:3]
    np.random.seed(42)
    sir_result = run_sir(G, seed_nodes=seed_nodes, steps=40)
    print(f"  SIR seed nodes: {seed_nodes}")

    # Save classifier for use in dashboard
    clf_path = os.path.join(OUTPUT_DIR, "cascade_clf.pkl")
    with open(clf_path, "wb") as f:
        pickle.dump({"clf": clf, "le": le, "nodes": nodes}, f)

    results = {
        "node_risk": node_risk,
        "feature_importance": importance,
        "cv_scores": {
            "mean": round(float(cv_scores.mean()), 4),
            "std":  round(float(cv_scores.std()),  4),
            "per_fold": [round(float(s), 4) for s in cv_scores],
        },
        "sir_model": {
            "seed_nodes": seed_nodes,
            "steps": 40,
            "base_rate": 0.3,
            "recovery_rate": 0.15,
            **sir_result,
        },
        "risk_distribution": dict(Counter(y_pred_labels)),
    }

    out_path = os.path.join(OUTPUT_DIR, "cascade_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Module 3 complete.")
    print(f"   CV Accuracy: {cv_scores.mean():.3f} | Risk distribution: {dict(Counter(y_pred_labels))}")
    print(f"   Saved: {out_path}")
    return results


if __name__ == "__main__":
    run()
