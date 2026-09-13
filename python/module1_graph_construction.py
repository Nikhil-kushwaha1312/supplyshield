"""
Module 1: Supply Chain Graph Construction
Builds India's supply chain as a NetworkX DiGraph with 30+ nodes and 45+ edges.
Computes centrality metrics, PageRank, and identifies articulation points (SPOFs).
Output: outputs/graph.pkl
"""

import os
import pickle
import json
import networkx as nx

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Node definitions
# ---------------------------------------------------------------------------
NODES = [
    # Ports (5)
    {"id": "JNPT_MUMBAI",       "label": "JNPT Mumbai",            "type": "port",      "lat": 18.948, "lng": 72.954, "capacity": 92, "criticality": 9.5},
    {"id": "MUNDRA_PORT",        "label": "Mundra Port",            "type": "port",      "lat": 22.839, "lng": 69.706, "capacity": 85, "criticality": 8.8},
    {"id": "CHENNAI_PORT",       "label": "Chennai Port",           "type": "port",      "lat": 13.082, "lng": 80.287, "capacity": 78, "criticality": 8.5},
    {"id": "VIZAG_PORT",         "label": "Visakhapatnam Port",     "type": "port",      "lat": 17.686, "lng": 83.218, "capacity": 70, "criticality": 7.8},
    {"id": "KOLKATA_PORT",       "label": "Kolkata Port",           "type": "port",      "lat": 22.572, "lng": 88.363, "capacity": 68, "criticality": 7.5},
    # Airports (4)
    {"id": "DELHI_IGI",          "label": "Delhi IGI Airport",      "type": "airport",   "lat": 28.556, "lng": 77.100, "capacity": 88, "criticality": 9.0},
    {"id": "MUMBAI_CSIA",        "label": "Mumbai CSIA Airport",    "type": "airport",   "lat": 19.093, "lng": 72.874, "capacity": 82, "criticality": 8.7},
    {"id": "BENGALURU_KIA",      "label": "Bengaluru KIA",          "type": "airport",   "lat": 13.198, "lng": 77.706, "capacity": 75, "criticality": 8.0},
    {"id": "HYD_RGIA",           "label": "Hyderabad RGIA",         "type": "airport",   "lat": 17.240, "lng": 78.429, "capacity": 72, "criticality": 7.8},
    # Railway Hubs (3)
    {"id": "DELHI_DFC",          "label": "Delhi DFC Terminal",     "type": "rail_hub",  "lat": 28.679, "lng": 77.069, "capacity": 80, "criticality": 8.8},
    {"id": "MUMBAI_RAIL",        "label": "Mumbai Rail Junction",   "type": "rail_hub",  "lat": 18.940, "lng": 72.835, "capacity": 76, "criticality": 8.3},
    {"id": "AHMEDABAD_RAIL",     "label": "Ahmedabad Rail Hub",     "type": "rail_hub",  "lat": 23.027, "lng": 72.570, "capacity": 70, "criticality": 7.8},
    # Factories (4)
    {"id": "PUNE_AUTO",          "label": "Pune Auto Cluster",      "type": "factory",   "lat": 18.520, "lng": 73.856, "capacity": 85, "criticality": 8.5},
    {"id": "CHENNAI_AUTO",       "label": "Chennai Auto Corridor",  "type": "factory",   "lat": 12.900, "lng": 80.100, "capacity": 88, "criticality": 8.8},
    {"id": "NOIDA_ELECTRONICS",  "label": "Noida Electronics",      "type": "factory",   "lat": 28.535, "lng": 77.391, "capacity": 82, "criticality": 8.0},
    {"id": "SURAT_TEXTILES",     "label": "Surat Textiles",         "type": "factory",   "lat": 21.170, "lng": 72.831, "capacity": 80, "criticality": 7.5},
    # Warehouses (3)
    {"id": "NAGPUR_WAREHOUSE",   "label": "Nagpur Central WH",      "type": "warehouse", "lat": 21.145, "lng": 79.088, "capacity": 72, "criticality": 7.0},
    {"id": "NH48_DISTRIBUTION",  "label": "NH48 Distribution Hub",  "type": "warehouse", "lat": 22.300, "lng": 73.200, "capacity": 68, "criticality": 7.2},
    {"id": "LUDHIANA_COLD",      "label": "Ludhiana Cold Storage",  "type": "warehouse", "lat": 30.901, "lng": 75.811, "capacity": 65, "criticality": 6.8},
    # Cities (11)
    {"id": "DELHI_NCR",          "label": "Delhi NCR",              "type": "city",      "lat": 28.679, "lng": 77.069, "capacity": 95, "criticality": 9.8},
    {"id": "MUMBAI_CITY",        "label": "Mumbai",                 "type": "city",      "lat": 19.076, "lng": 72.877, "capacity": 93, "criticality": 9.6},
    {"id": "BENGALURU_CITY",     "label": "Bengaluru",              "type": "city",      "lat": 12.971, "lng": 77.594, "capacity": 88, "criticality": 9.0},
    {"id": "KOLKATA_CITY",       "label": "Kolkata",                "type": "city",      "lat": 22.572, "lng": 88.363, "capacity": 85, "criticality": 8.5},
    {"id": "HYDERABAD_CITY",     "label": "Hyderabad",              "type": "city",      "lat": 17.385, "lng": 78.487, "capacity": 86, "criticality": 8.7},
    {"id": "CHENNAI_CITY",       "label": "Chennai",                "type": "city",      "lat": 13.082, "lng": 80.270, "capacity": 87, "criticality": 8.8},
    {"id": "AHMEDABAD_CITY",     "label": "Ahmedabad",              "type": "city",      "lat": 23.022, "lng": 72.571, "capacity": 84, "criticality": 8.2},
    {"id": "JAIPUR_CITY",        "label": "Jaipur",                 "type": "city",      "lat": 26.912, "lng": 75.787, "capacity": 75, "criticality": 7.5},
    {"id": "LUCKNOW_CITY",       "label": "Lucknow",                "type": "city",      "lat": 26.847, "lng": 80.947, "capacity": 72, "criticality": 7.2},
    {"id": "KOCHI_CITY",         "label": "Kochi",                  "type": "city",      "lat": 9.931,  "lng": 76.267, "capacity": 70, "criticality": 7.0},
    {"id": "GUWAHATI_CITY",      "label": "Guwahati",               "type": "city",      "lat": 26.144, "lng": 91.736, "capacity": 65, "criticality": 6.5},
]


# ---------------------------------------------------------------------------
# Edge definitions
# ---------------------------------------------------------------------------
EDGES = [
    # Sea routes (port ↔ port)
    ("JNPT_MUMBAI",      "MUNDRA_PORT",        {"distance_km": 520,  "throughput": 85, "reliability": 0.90, "mode": "sea"}),
    ("JNPT_MUMBAI",      "CHENNAI_PORT",       {"distance_km": 1370, "throughput": 75, "reliability": 0.85, "mode": "sea"}),
    ("MUNDRA_PORT",      "KOLKATA_PORT",       {"distance_km": 2800, "throughput": 60, "reliability": 0.80, "mode": "sea"}),
    ("CHENNAI_PORT",     "VIZAG_PORT",         {"distance_km": 700,  "throughput": 65, "reliability": 0.87, "mode": "sea"}),
    ("VIZAG_PORT",       "KOLKATA_PORT",       {"distance_km": 860,  "throughput": 55, "reliability": 0.83, "mode": "sea"}),
    ("CHENNAI_PORT",     "KOCHI_CITY",         {"distance_km": 620,  "throughput": 50, "reliability": 0.88, "mode": "sea"}),

    # Port → City (road/rail)
    ("JNPT_MUMBAI",      "MUMBAI_CITY",        {"distance_km": 65,   "throughput": 92, "reliability": 0.95, "mode": "road"}),
    ("MUNDRA_PORT",      "AHMEDABAD_CITY",     {"distance_km": 340,  "throughput": 78, "reliability": 0.88, "mode": "road"}),
    ("CHENNAI_PORT",     "CHENNAI_CITY",       {"distance_km": 15,   "throughput": 90, "reliability": 0.96, "mode": "road"}),
    ("VIZAG_PORT",       "HYDERABAD_CITY",     {"distance_km": 620,  "throughput": 62, "reliability": 0.84, "mode": "road"}),
    ("KOLKATA_PORT",     "KOLKATA_CITY",       {"distance_km": 12,   "throughput": 88, "reliability": 0.94, "mode": "road"}),

    # Port → Factory
    ("JNPT_MUMBAI",      "PUNE_AUTO",          {"distance_km": 155,  "throughput": 88, "reliability": 0.92, "mode": "road"}),
    ("MUNDRA_PORT",      "SURAT_TEXTILES",     {"distance_km": 295,  "throughput": 80, "reliability": 0.89, "mode": "road"}),
    ("CHENNAI_PORT",     "CHENNAI_AUTO",       {"distance_km": 45,   "throughput": 85, "reliability": 0.93, "mode": "road"}),

    # Airport → City
    ("DELHI_IGI",        "DELHI_NCR",          {"distance_km": 20,   "throughput": 85, "reliability": 0.96, "mode": "road"}),
    ("MUMBAI_CSIA",      "MUMBAI_CITY",        {"distance_km": 30,   "throughput": 80, "reliability": 0.95, "mode": "road"}),
    ("BENGALURU_KIA",    "BENGALURU_CITY",     {"distance_km": 35,   "throughput": 72, "reliability": 0.94, "mode": "road"}),
    ("HYD_RGIA",         "HYDERABAD_CITY",     {"distance_km": 25,   "throughput": 70, "reliability": 0.95, "mode": "road"}),

    # Air cargo routes
    ("DELHI_IGI",        "MUMBAI_CSIA",        {"distance_km": 1148, "throughput": 75, "reliability": 0.92, "mode": "air"}),
    ("DELHI_IGI",        "BENGALURU_KIA",      {"distance_km": 1740, "throughput": 65, "reliability": 0.91, "mode": "air"}),
    ("MUMBAI_CSIA",      "BENGALURU_KIA",      {"distance_km": 845,  "throughput": 60, "reliability": 0.90, "mode": "air"}),
    ("DELHI_IGI",        "KOLKATA_CITY",       {"distance_km": 1305, "throughput": 55, "reliability": 0.89, "mode": "air"}),
    ("HYD_RGIA",         "BENGALURU_KIA",      {"distance_km": 500,  "throughput": 50, "reliability": 0.91, "mode": "air"}),

    # Railway routes
    ("DELHI_DFC",        "MUMBAI_RAIL",        {"distance_km": 1384, "throughput": 90, "reliability": 0.88, "mode": "rail"}),
    ("DELHI_DFC",        "AHMEDABAD_RAIL",     {"distance_km": 945,  "throughput": 82, "reliability": 0.87, "mode": "rail"}),
    ("MUMBAI_RAIL",      "AHMEDABAD_RAIL",     {"distance_km": 493,  "throughput": 85, "reliability": 0.89, "mode": "rail"}),
    ("DELHI_DFC",        "LUCKNOW_CITY",       {"distance_km": 510,  "throughput": 72, "reliability": 0.86, "mode": "rail"}),
    ("DELHI_DFC",        "DELHI_NCR",          {"distance_km": 10,   "throughput": 88, "reliability": 0.97, "mode": "rail"}),
    ("MUMBAI_RAIL",      "MUMBAI_CITY",        {"distance_km": 8,    "throughput": 90, "reliability": 0.97, "mode": "rail"}),
    ("AHMEDABAD_RAIL",   "AHMEDABAD_CITY",     {"distance_km": 5,    "throughput": 82, "reliability": 0.97, "mode": "rail"}),
    ("DELHI_DFC",        "NOIDA_ELECTRONICS",  {"distance_km": 25,   "throughput": 78, "reliability": 0.92, "mode": "rail"}),
    ("MUMBAI_RAIL",      "PUNE_AUTO",          {"distance_km": 150,  "throughput": 80, "reliability": 0.90, "mode": "rail"}),
    ("AHMEDABAD_RAIL",   "SURAT_TEXTILES",     {"distance_km": 260,  "throughput": 75, "reliability": 0.88, "mode": "rail"}),

    # Warehouse ↔ City / Hub
    ("NAGPUR_WAREHOUSE", "MUMBAI_CITY",        {"distance_km": 830,  "throughput": 65, "reliability": 0.85, "mode": "road"}),
    ("NAGPUR_WAREHOUSE", "HYDERABAD_CITY",     {"distance_km": 500,  "throughput": 62, "reliability": 0.84, "mode": "road"}),
    ("NAGPUR_WAREHOUSE", "KOLKATA_CITY",       {"distance_km": 1100, "throughput": 58, "reliability": 0.82, "mode": "road"}),
    ("NH48_DISTRIBUTION","MUMBAI_CITY",        {"distance_km": 300,  "throughput": 70, "reliability": 0.86, "mode": "road"}),
    ("NH48_DISTRIBUTION","AHMEDABAD_CITY",     {"distance_km": 100,  "throughput": 72, "reliability": 0.88, "mode": "road"}),
    ("LUDHIANA_COLD",    "DELHI_NCR",          {"distance_km": 310,  "throughput": 60, "reliability": 0.85, "mode": "road"}),
    ("LUDHIANA_COLD",    "JAIPUR_CITY",        {"distance_km": 450,  "throughput": 55, "reliability": 0.82, "mode": "road"}),

    # City ↔ City (road/rail)
    ("DELHI_NCR",        "JAIPUR_CITY",        {"distance_km": 280,  "throughput": 70, "reliability": 0.87, "mode": "road"}),
    ("DELHI_NCR",        "LUCKNOW_CITY",       {"distance_km": 555,  "throughput": 68, "reliability": 0.85, "mode": "road"}),
    ("LUCKNOW_CITY",     "KOLKATA_CITY",       {"distance_km": 992,  "throughput": 58, "reliability": 0.83, "mode": "road"}),
    ("BENGALURU_CITY",   "CHENNAI_CITY",       {"distance_km": 346,  "throughput": 80, "reliability": 0.90, "mode": "road"}),
    ("HYDERABAD_CITY",   "BENGALURU_CITY",     {"distance_km": 570,  "throughput": 75, "reliability": 0.88, "mode": "road"}),
    ("HYDERABAD_CITY",   "CHENNAI_CITY",       {"distance_km": 630,  "throughput": 72, "reliability": 0.87, "mode": "road"}),
    ("KOCHI_CITY",       "BENGALURU_CITY",     {"distance_km": 545,  "throughput": 60, "reliability": 0.86, "mode": "road"}),
    ("KOLKATA_CITY",     "GUWAHATI_CITY",      {"distance_km": 990,  "throughput": 50, "reliability": 0.78, "mode": "road"}),
    ("CHENNAI_AUTO",     "CHENNAI_CITY",       {"distance_km": 30,   "throughput": 85, "reliability": 0.93, "mode": "road"}),
    ("NOIDA_ELECTRONICS","DELHI_NCR",          {"distance_km": 20,   "throughput": 82, "reliability": 0.94, "mode": "road"}),
    ("PUNE_AUTO",        "MUMBAI_CITY",        {"distance_km": 155,  "throughput": 88, "reliability": 0.93, "mode": "road"}),
]


def build_graph() -> nx.DiGraph:
    """Build and return the supply chain DiGraph."""
    G = nx.DiGraph()

    # Add nodes
    for n in NODES:
        G.add_node(n["id"], **{k: v for k, v in n.items() if k != "id"})

    # Add edges
    for src, dst, attrs in EDGES:
        G.add_edge(src, dst, **attrs)

    return G


def compute_centrality(G: nx.DiGraph) -> nx.DiGraph:
    """Compute centrality metrics and attach to node attributes."""
    print("  Computing betweenness centrality...")
    bc = nx.betweenness_centrality(G, weight="distance_km", normalized=True)

    print("  Computing closeness centrality...")
    cc = nx.closeness_centrality(G, distance="distance_km")

    print("  Computing eigenvector centrality...")
    try:
        ec = nx.eigenvector_centrality(G, max_iter=1000, weight="throughput")
    except nx.PowerIterationFailedConvergence:
        ec = {n: 0.0 for n in G.nodes()}

    print("  Computing PageRank...")
    pr = nx.pagerank(G, weight="throughput")

    print("  Computing clustering coefficient...")
    clust = nx.clustering(G.to_undirected())

    print("  Computing degree metrics...")
    in_deg  = dict(G.in_degree())
    out_deg = dict(G.out_degree())

    for node in G.nodes():
        G.nodes[node]["betweenness"]   = round(bc.get(node, 0), 6)
        G.nodes[node]["closeness"]     = round(cc.get(node, 0), 6)
        G.nodes[node]["eigenvector"]   = round(ec.get(node, 0), 6)
        G.nodes[node]["pagerank"]      = round(pr.get(node, 0), 6)
        G.nodes[node]["clustering"]    = round(clust.get(node, 0), 6)
        G.nodes[node]["in_degree"]     = in_deg.get(node, 0)
        G.nodes[node]["out_degree"]    = out_deg.get(node, 0)

        # Avg neighbour capacity
        neighbours = list(G.predecessors(node)) + list(G.successors(node))
        if neighbours:
            avg_cap = np.mean([G.nodes[nb].get("capacity", 50) for nb in neighbours])
        else:
            avg_cap = G.nodes[node].get("capacity", 50)
        G.nodes[node]["avg_neighbour_capacity"] = round(avg_cap, 2)

        # Avg edge reliability (all edges touching this node)
        all_edges = list(G.in_edges(node, data=True)) + list(G.out_edges(node, data=True))
        if all_edges:
            avg_rel = np.mean([e[2].get("reliability", 0.8) for e in all_edges])
        else:
            avg_rel = 0.8
        G.nodes[node]["avg_edge_reliability"] = round(avg_rel, 4)

    return G


def detect_spofs(G: nx.DiGraph) -> list:
    """Return articulation points of the undirected view of G."""
    undirected = G.to_undirected()
    spofs = list(nx.articulation_points(undirected))
    print(f"  Detected {len(spofs)} single points of failure (articulation points)")
    return spofs


def export_graph_json(G: nx.DiGraph, spofs: list) -> dict:
    """Export graph data as a plain dict for JSON serialisation."""
    nodes = []
    for node_id, attrs in G.nodes(data=True):
        nodes.append({"id": node_id, **attrs})

    edges = []
    for src, dst, attrs in G.edges(data=True):
        edges.append({"source": src, "target": dst, **attrs})

    return {
        "nodes": nodes,
        "edges": edges,
        "spofs": spofs,
        "stats": {
            "num_nodes": G.number_of_nodes(),
            "num_edges": G.number_of_edges(),
            "is_weakly_connected": nx.is_weakly_connected(G),
            "density": round(nx.density(G), 4),
        },
    }


def run():
    print("=" * 60)
    print("Module 1: Graph Construction")
    print("=" * 60)

    print("\n[1/4] Building supply chain graph...")
    G = build_graph()
    print(f"  Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")

    print("\n[2/4] Computing centrality metrics...")
    G = compute_centrality(G)

    print("\n[3/4] Detecting single points of failure...")
    spofs = detect_spofs(G)
    nx.set_graph_attr = lambda: None  # no-op
    G.graph["spofs"] = spofs

    print("\n[4/4] Serialising outputs...")
    graph_pkl = os.path.join(OUTPUT_DIR, "graph.pkl")
    with open(graph_pkl, "wb") as f:
        pickle.dump(G, f)
    print(f"  Saved: {graph_pkl}")

    graph_json_data = export_graph_json(G, spofs)
    graph_json = os.path.join(OUTPUT_DIR, "graph.json")
    with open(graph_json, "w") as f:
        json.dump(graph_json_data, f, indent=2)
    print(f"  Saved: {graph_json}")

    print("\n✅ Module 1 complete.")
    print(f"   Nodes: {G.number_of_nodes()} | Edges: {G.number_of_edges()} | SPOFs: {len(spofs)}")
    return G


if __name__ == "__main__":
    run()
