"""
Module 4: Resilience Strategy Recommender
- SPOF detection via articulation points
- Robustness curve (sequential node removal)
- Per-node resilience score (0–100)
- LLM-generated strategy recommendations (Gemini API with fallback)
Output: outputs/resilience_results.json
"""

import os
import json
import pickle
import numpy as np
import networkx as nx
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

OUTPUT_DIR    = os.path.join(os.path.dirname(__file__), "outputs")
GRAPH_PKL     = os.path.join(OUTPUT_DIR, "graph.pkl")
CASCADE_JSON  = os.path.join(OUTPUT_DIR, "cascade_results.json")


# ---------------------------------------------------------------------------
# SPOF Detection
# ---------------------------------------------------------------------------
def detect_spofs(G: nx.DiGraph) -> list:
    undirected = G.to_undirected()
    return list(nx.articulation_points(undirected))


# ---------------------------------------------------------------------------
# Robustness Curve
# ---------------------------------------------------------------------------
def compute_robustness_curve(G: nx.DiGraph) -> list:
    """
    Sequentially remove nodes by descending criticality.
    Track largest weakly connected component (LCC) size at each step.
    """
    G_temp = G.copy()
    all_nodes = sorted(
        G_temp.nodes(),
        key=lambda n: G_temp.nodes[n].get("criticality", 0),
        reverse=True,
    )
    n_total = len(all_nodes)
    curve = [{"nodes_removed": 0, "lcc_size": n_total, "lcc_fraction": 1.0}]

    for i, node in enumerate(all_nodes):
        if node in G_temp.nodes():
            G_temp.remove_node(node)
        if G_temp.number_of_nodes() == 0:
            lcc = 0
        else:
            lcc = max(len(c) for c in nx.weakly_connected_components(G_temp))
        curve.append({
            "nodes_removed": i + 1,
            "node_removed":  node,
            "lcc_size":      lcc,
            "lcc_fraction":  round(lcc / n_total, 4),
        })

    return curve


# ---------------------------------------------------------------------------
# Resilience Score
# ---------------------------------------------------------------------------
RISK_LABEL_SCORE = {"Safe": 1.0, "Low": 0.75, "Medium": 0.4, "High": 0.1}


def compute_resilience_scores(G: nx.DiGraph, cascade_results: dict) -> dict:
    """
    Score = 35% × inverted_risk  +  25% × output_redundancy
           + 25% × avg_edge_reliability  +  15% × (1 − betweenness_penalty)
    Returns dict: node_id → resilience score (0–100)
    """
    node_risk   = cascade_results.get("node_risk", {})
    scores      = {}

    max_bc = max(
        (G.nodes[n].get("betweenness", 0) for n in G.nodes()), default=1.0
    ) or 1.0

    for node in G.nodes():
        attr = G.nodes[node]

        # 1. Inverted risk label (35%)
        risk_label   = node_risk.get(node, {}).get("risk_label", "Medium")
        risk_score   = RISK_LABEL_SCORE.get(risk_label, 0.4)

        # 2. Output redundancy — normalised out-degree (25%)
        max_out = max((G.out_degree(n) for n in G.nodes()), default=1) or 1
        out_red  = G.out_degree(node) / max_out

        # 3. Average edge reliability (25%)
        all_edges = list(G.in_edges(node, data=True)) + list(G.out_edges(node, data=True))
        avg_rel   = (
            np.mean([e[2].get("reliability", 0.85) for e in all_edges])
            if all_edges else 0.85
        )

        # 4. Betweenness penalty (15%) — lower is better
        bc = attr.get("betweenness", 0.0)
        bc_penalty = 1.0 - (bc / max_bc)

        score = (
            0.35 * risk_score
            + 0.25 * out_red
            + 0.25 * avg_rel
            + 0.15 * bc_penalty
        ) * 100

        scores[node] = round(float(score), 2)

    return scores


# ---------------------------------------------------------------------------
# LLM Strategy Generation
# ---------------------------------------------------------------------------
FALLBACK_STRATEGIES = [
    {
        "id": "S01",
        "title": "JNPT Capacity Expansion & Mundra Redundancy Partnership",
        "type": "Infrastructure",
        "priority": "Critical",
        "description": (
            "JNPT handles 55% of India's container traffic, creating a catastrophic single point of failure. "
            "Expand JNPT capacity by 40% and formalise a real-time cargo-diversion agreement with Mundra Port "
            "to activate automatically when JNPT operations fall below 60% capacity."
        ),
        "implementation_steps": [
            "Commission automated vessel traffic management system at JNPT (Year 1)",
            "Sign tripartite agreement: JNPT–Adani–Ministry of Ports for overflow protocols (6 months)",
            "Build 8-km connecting rail spur from Mundra to WDFC to enable 24h cargo rerouting",
            "Install real-time AIS-based cargo tracking between both ports",
            "Conduct joint annual simulation drills for strike/disaster rerouting",
        ],
        "cost_crore": 8500,
        "timeline": "24–36 months",
    },
    {
        "id": "S02",
        "title": "Dedicated Freight Corridor Resilience Hardening",
        "type": "Infrastructure",
        "priority": "High",
        "description": (
            "The Delhi–Mumbai DFC carries ₹2.1 lakh crore of freight annually. A single derailment blocks "
            "both directions for 72+ hours. Add bypass loops at critical junctions, deploy AI-based predictive "
            "maintenance, and pre-position recovery equipment at 5 strategic points along the corridor."
        ),
        "implementation_steps": [
            "Install 12 km of emergency bypass loops at Palanpur, Ajmer, and Vadodara junctions",
            "Deploy 24-hour AI-based track defect detection drones across 1,500 km of DFC",
            "Pre-position 5 Heavy Breakdown & Recovery Trains with 4-hour mobilisation SLA",
            "Establish DFC command centre with real-time freight tracking integration",
            "Create tri-annual derailment simulation exercises with NDRF",
        ],
        "cost_crore": 4200,
        "timeline": "18–24 months",
    },
    {
        "id": "S03",
        "title": "North-East India Multi-Modal Connectivity Uplift",
        "type": "Infrastructure",
        "priority": "High",
        "description": (
            "Guwahati and the North-East remain critically isolated when NH16 or rail lines are disrupted by "
            "cyclones or floods. Build 3 resilient connectivity redundancies: air cargo upgrade, river logistics "
            "on the Brahmaputra, and a strategic highway bypass via the Stilwell Road corridor."
        ),
        "implementation_steps": [
            "Upgrade Guwahati and Agartala airports to Category C cargo hubs (Year 1–2)",
            "Commission 6 river cargo barges on the Brahmaputra for 50,000 MT monthly capacity",
            "Begin Stilwell Road (India–Myanmar) resilience upgrade for emergency road access",
            "Build 200 MT emergency strategic food/medicine warehouses at 5 North-East points",
            "Negotiate bilateral logistics MOU with Bangladesh for alternative coastal routing",
        ],
        "cost_crore": 6800,
        "timeline": "36–48 months",
    },
    {
        "id": "S04",
        "title": "National Semiconductor Strategic Reserve & Fab Incentive",
        "type": "Policy",
        "priority": "Critical",
        "description": (
            "India imports 100% of advanced semiconductors, creating a ₹22,000 crore annual vulnerability. "
            "Establish a 90-day strategic chip stockpile, accelerate PLI semiconductor fabs, and sign emergency "
            "supply agreements with Taiwan (TSMC), South Korea (Samsung), and Japan (Renesas)."
        ),
        "implementation_steps": [
            "Create 90-day strategic semiconductor reserve (₹3,000 crore allocation, Year 1)",
            "Activate PLI Scheme tranche 2 with ₹15,000 crore for 3 wafer fab projects",
            "Sign emergency supply MOU with Taiwan SEMI Association (6 months)",
            "Fast-track visa and R&D incentives for 500 chip engineers from Taiwan/South Korea",
            "Establish India Semiconductor Mission (ISM) crisis response protocol",
        ],
        "cost_crore": 18000,
        "timeline": "12–60 months (phased)",
    },
    {
        "id": "S05",
        "title": "National Supply Chain Visibility Platform (NSCVP)",
        "type": "Operational",
        "priority": "High",
        "description": (
            "India lacks a unified real-time view of its supply chain. Build a government-industry digital "
            "platform integrating port, rail, road, and air cargo data with AI-based disruption early warning, "
            "akin to Singapore's CALISTA platform but scaled for India's complexity."
        ),
        "implementation_steps": [
            "Integrate data from JNPT, Adani Ports, Indian Railways, NHAI, AAI under unified API",
            "Deploy AI/ML disruption prediction engine (weather, strikes, accidents, geopolitical)",
            "Build mobile app + API access for 50,000 logistics SMEs across India",
            "Mandate data contribution from all CPSEs in logistics under Digital India mission",
            "Conduct public-private hackathon to crowdsource alerting algorithms",
        ],
        "cost_crore": 1200,
        "timeline": "12–18 months",
    },
    {
        "id": "S06",
        "title": "Strategic Petroleum & Fuel Reserve Expansion",
        "type": "Policy",
        "priority": "Medium",
        "description": (
            "India's strategic petroleum reserves cover only 9.5 days of consumption. "
            "Expand to 30 days and create a priority allocation protocol for logistics and emergency services "
            "during fuel crises, preventing supply chain paralysis."
        ),
        "implementation_steps": [
            "Commission 3 new SPR caverns at Padur, Mangalore, and Bikaner (15M barrels total)",
            "Legislate Essential Logistics Fuel Priority Act with automatic activation triggers",
            "Create dynamic petroleum routing algorithm prioritising agricultural & medical supply chains",
            "Sign long-term oil supply agreements with UAE, Saudi, and USA as diversity hedge",
            "Launch Green Logistics subsidy: 40% CAPEX subsidy for EV fleet conversion by top 100 logistics companies",
        ],
        "cost_crore": 12000,
        "timeline": "24–36 months",
    },
]


def build_strategy_prompt(spofs: list, low_resilience: list, risk_dist: dict, G: nx.DiGraph) -> str:
    spof_labels = [G.nodes[n].get("label", n) for n in spofs[:5] if n in G.nodes()]
    low_labels  = [G.nodes[n].get("label", n) for n in low_resilience[:5] if n in G.nodes()]
    return f"""You are a senior infrastructure resilience strategist for India's logistics ministry.

SUPPLY CHAIN ANALYSIS CONTEXT:
- Total nodes: {G.number_of_nodes()} | Total edges: {G.number_of_edges()}
- Single Points of Failure (SPOFs): {spof_labels}
- Lowest resilience nodes: {low_labels}
- Risk distribution: Safe={risk_dist.get('Safe',0)}, Low={risk_dist.get('Low',0)}, Medium={risk_dist.get('Medium',0)}, High={risk_dist.get('High',0)}

Generate 6 strategic resilience recommendations for India's supply chain.
Return ONLY valid JSON as a list (no markdown):
[
  {{
    "id": "S01",
    "title": "Strategy title",
    "type": "Infrastructure | Policy | Operational",
    "priority": "Critical | High | Medium | Low",
    "description": "2-3 sentence description",
    "implementation_steps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
    "cost_crore": number,
    "timeline": "e.g. 12-18 months"
  }}
]"""


def call_gemini_strategies(prompt: str) -> list | None:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return None
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=3000),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        print(f"    [WARN] Gemini API error: {e}")
        return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run():
    print("=" * 60)
    print("Module 4: Resilience Strategy Recommender")
    print("=" * 60)

    print("\n[1/5] Loading graph and cascade results...")
    if not os.path.exists(GRAPH_PKL):
        raise FileNotFoundError("Run module1_graph_construction.py first!")
    with open(GRAPH_PKL, "rb") as f:
        G = pickle.load(f)

    if not os.path.exists(CASCADE_JSON):
        raise FileNotFoundError("Run module3_cascade_prediction.py first!")
    with open(CASCADE_JSON) as f:
        cascade_results = json.load(f)

    print("\n[2/5] Detecting single points of failure...")
    spofs = detect_spofs(G)
    G.graph["spofs"] = spofs
    print(f"  SPOFs identified: {len(spofs)}")
    for spof in spofs[:6]:
        label = G.nodes[spof].get("label", spof)
        print(f"    ⚠️  {label}")

    print("\n[3/5] Computing robustness curve...")
    robustness_curve = compute_robustness_curve(G)
    print(f"  Robustness curve computed ({len(robustness_curve)} points)")

    print("\n[4/5] Computing per-node resilience scores...")
    resilience_scores = compute_resilience_scores(G, cascade_results)
    sorted_scores = sorted(resilience_scores.items(), key=lambda x: x[1])
    print(f"  Score range: {sorted_scores[0][1]:.1f} – {sorted_scores[-1][1]:.1f}")

    low_resilience_nodes = [nd for nd, sc in sorted_scores[:8]]
    risk_dist = cascade_results.get("risk_distribution", {})

    print("\n[5/5] Generating resilience strategies...")
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key and api_key != "MY_GEMINI_API_KEY":
        strategies = call_gemini_strategies(
            build_strategy_prompt(spofs, low_resilience_nodes, risk_dist, G)
        )
        if strategies:
            print(f"  ✅ Gemini generated {len(strategies)} strategies")
        else:
            strategies = FALLBACK_STRATEGIES
            print(f"  ℹ️  Using pre-computed fallback strategies")
    else:
        strategies = FALLBACK_STRATEGIES
        print(f"  ℹ️  Using pre-computed fallback strategies")

    results = {
        "spofs": spofs,
        "spof_labels": {n: G.nodes[n].get("label", n) for n in spofs if n in G.nodes()},
        "resilience_scores": resilience_scores,
        "robustness_curve": robustness_curve,
        "low_resilience_nodes": low_resilience_nodes,
        "strategies": strategies,
        "summary": {
            "total_spofs":          len(spofs),
            "avg_resilience_score": round(float(np.mean(list(resilience_scores.values()))), 2),
            "min_resilience_score": round(float(min(resilience_scores.values())), 2),
            "max_resilience_score": round(float(max(resilience_scores.values())), 2),
            "num_strategies":       len(strategies),
        },
    }

    out_path = os.path.join(OUTPUT_DIR, "resilience_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Module 4 complete.")
    print(f"   SPOFs: {len(spofs)} | Avg resilience: {results['summary']['avg_resilience_score']:.1f} | Strategies: {len(strategies)}")
    print(f"   Saved: {out_path}")
    return results


if __name__ == "__main__":
    run()
