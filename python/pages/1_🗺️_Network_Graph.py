"""
Page 1: Network Graph — Plotly Scatter geo map of India's supply chain.
"""

import os
import json
import sys
import streamlit as st
import plotly.graph_objects as go

# Add parent directory to path to import ui_theme
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import ui_theme

st.set_page_config(page_title="Network Graph · SupplyShield", page_icon="🗺️", layout="wide")

ui_theme.inject_theme()
ui_theme.render_sidebar_nav()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")


# ── Load data ─────────────────────────────────────────────────────────────────
@st.cache_data
def load_graph():
    p = os.path.join(OUTPUT_DIR, "graph.json")
    return json.load(open(p)) if os.path.exists(p) else None

@st.cache_data
def load_cascade():
    p = os.path.join(OUTPUT_DIR, "cascade_results.json")
    return json.load(open(p)) if os.path.exists(p) else None

graph_data = load_graph()
cascade    = load_cascade()

ui_theme.render_header(
    title="Supply Chain Network Map",
    subtitle="Geographic representation of India's transport hubs, multimodal connections, and critical bottleneck nodes.",
    badge="INTERACTIVE TOPOLOGY"
)

if not graph_data:
    st.error("Graph data not found. Run `python run_pipeline.py` first.")
    st.stop()

nodes = graph_data["nodes"]
edges = graph_data["edges"]
spofs = set(graph_data.get("spofs", []))

node_risk = (cascade or {}).get("node_risk", {})
node_lookup = {n["id"]: n for n in nodes}

# ── Colour / symbol maps ──────────────────────────────────────────────────────
TYPE_COLOR = {
    "port":      "#06b6d4",
    "airport":   "#8b5cf6",
    "rail_hub":  "#3b82f6",
    "factory":   "#f59e0b",
    "warehouse": "#10b981",
    "city":      "#ec4899",
}
TYPE_SYMBOL = {
    "port":      "circle",
    "airport":   "triangle-up",
    "rail_hub":  "square",
    "factory":   "diamond",
    "warehouse": "pentagon",
    "city":      "circle",
}
RISK_COLOR = {
    "High":   "#f43f5e",
    "Medium": "#f59e0b",
    "Low":    "#3b82f6",
    "Safe":   "#10b981",
}
MODE_COLOR = {
    "road": "rgba(148,163,184,0.35)",
    "rail": "rgba(59,130,246,0.45)",
    "air":  "rgba(6,182,212,0.45)",
    "sea":  "rgba(20,184,166,0.45)",
}

# ── Sidebar filters ───────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("**Map Controls**")
    colour_by   = st.radio("Colour nodes by", ["Node Type", "Risk Level"], index=0)
    show_edges  = st.checkbox("Show transport links", value=True)
    show_spofs  = st.checkbox("Highlight SPOFs (⚠️)", value=True)
    selected_modes = st.multiselect("Transport modes", ["road", "rail", "air", "sea"],
                                    default=["road", "rail", "air", "sea"])

# ── Build figure ──────────────────────────────────────────────────────────────
fig = go.Figure()

# ── Edge traces (one per mode) ─────────────────────────────────────────────
if show_edges:
    mode_edges: dict[str, list] = {m: [] for m in ["road", "rail", "air", "sea"]}
    for edge in edges:
        mode = edge.get("mode", "road")
        src  = node_lookup.get(edge["source"])
        dst  = node_lookup.get(edge["target"])
        if src and dst and mode in selected_modes:
            mode_edges[mode].append((src["lng"], dst["lng"], src["lat"], dst["lat"],
                                     edge.get("reliability", 0.85), edge.get("distance_km", 0)))

    for mode, edge_list in mode_edges.items():
        if not edge_list or mode not in selected_modes:
            continue
        lons, lats, texts = [], [], []
        for (slon, dlon, slat, dlat, rel, dist) in edge_list:
            lons += [slon, dlon, None]
            lats += [slat, dlat, None]
            texts += [f"{mode.title()} | {dist} km | Reliability: {rel:.0%}", "", ""]

        fig.add_trace(go.Scattergeo(
            lon=lons, lat=lats,
            mode="lines",
            line=dict(color=MODE_COLOR.get(mode, "rgba(150,150,150,0.3)"), width=1.5),
            name=f"{mode.title()} links",
            hoverinfo="text",
            hovertext=texts,
            showlegend=True,
        ))

# ── Node traces (one per type) ────────────────────────────────────────────
type_groups: dict[str, list] = {}
for nd in nodes:
    t = nd.get("type", "city")
    type_groups.setdefault(t, []).append(nd)

for ntype, node_list in type_groups.items():
    lats, lons, texts, sizes, colors, symbols = [], [], [], [], [], []
    for nd in node_list:
        lats.append(nd["lat"])
        lons.append(nd["lng"])
        risk = node_risk.get(nd["id"], {}).get("risk_label", "Safe")
        crit = nd.get("criticality", 5)
        cap  = nd.get("capacity", 50)
        spof = nd["id"] in spofs

        # Colour
        if colour_by == "Risk Level":
            color = RISK_COLOR.get(risk, "#64748b")
        else:
            color = TYPE_COLOR.get(ntype, "#64748b")

        # Size by criticality
        size = 10 + crit * 2.5
        if spof and show_spofs:
            size += 8

        colors.append(color)
        sizes.append(size)
        symbols.append(TYPE_SYMBOL.get(ntype, "circle"))

        spof_tag = " ⚠️ SPOF" if spof else ""
        texts.append(
            f"<b>{nd.get('label', nd['id'])}{spof_tag}</b><br>"
            f"Type: {ntype.replace('_', ' ').title()}<br>"
            f"Risk: {risk}<br>"
            f"Capacity: {cap}% | Criticality: {crit}/10<br>"
            f"Coords: {nd['lat']:.3f}°N, {nd['lng']:.3f}°E"
        )

    fig.add_trace(go.Scattergeo(
        lat=lats, lon=lons,
        mode="markers+text",
        marker=dict(
            size=sizes,
            color=colors,
            symbol=symbols,
            line=dict(width=1.5, color="rgba(255,255,255,0.3)"),
        ),
        text=[nd.get("label", nd["id"]).split()[0] for nd in node_list],
        textfont=dict(size=9, color="#94a3b8"),
        textposition="top center",
        name=ntype.replace("_", " ").title(),
        hovertext=texts,
        hoverinfo="text",
        hoverlabel=dict(bgcolor="#111827", bordercolor="#3b82f6",
                        font=dict(family="Inter", size=12, color="#f8fafc")),
        showlegend=True,
    ))

fig.update_layout(
    geo=dict(
        scope="asia",
        projection_type="mercator",
        center=dict(lat=22.0, lon=82.0),
        lataxis=dict(range=[6, 38]),
        lonaxis=dict(range=[65, 100]),
        bgcolor="rgba(8,12,20,1)",
        showland=True,
        landcolor="rgba(17,24,39,1)",
        showocean=True,
        oceancolor="rgba(8,12,20,1)",
        showlakes=True,
        lakecolor="rgba(8,12,20,1)",
        showrivers=True,
        rivercolor="rgba(30,60,100,0.5)",
        showcountries=True,
        countrycolor="rgba(59,130,246,0.25)",
        showsubunits=True,
        subunitcolor="rgba(59,130,246,0.15)",
        showcoastlines=True,
        coastlinecolor="rgba(59,130,246,0.3)",
    ),
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Inter", color="#94a3b8"),
    legend=dict(
        bgcolor="rgba(17,24,39,0.85)",
        bordercolor="rgba(255,255,255,0.08)",
        borderwidth=1,
        font=dict(size=11, color="#94a3b8"),
        orientation="v",
        x=0.01, y=0.99,
        xanchor="left", yanchor="top",
    ),
    margin=dict(l=0, r=0, t=0, b=0),
    height=620,
)

st.plotly_chart(fig, use_container_width=True)

# ── Info panels ────────────────────────────────────────────────────────────────
c1, c2, c3 = st.columns(3)

with c1:
    st.markdown("""<div class="surface-card">
    <div class="kpi-label">Transport Mode Legend</div>
    <div style="margin-top:10px">
      <div class="legend-item"><div class="legend-dot" style="background:#94a3b8"></div> Road Link</div>
      <div class="legend-item"><div class="legend-dot" style="background:#3b82f6"></div> Rail Link</div>
      <div class="legend-item"><div class="legend-dot" style="background:#06b6d4"></div> Air Link</div>
      <div class="legend-item"><div class="legend-dot" style="background:#14b8a6"></div> Sea Link</div>
    </div>
    </div>""", unsafe_allow_html=True)

with c2:
    st.markdown("""<div class="surface-card">
    <div class="kpi-label">Node Type Legend</div>
    <div style="margin-top:10px">
      <div class="legend-item"><div class="legend-dot" style="background:#06b6d4"></div> ⚓ Port</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8b5cf6"></div> ✈️ Airport</div>
      <div class="legend-item"><div class="legend-dot" style="background:#3b82f6"></div> 🚂 Rail Hub</div>
      <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> 🏭 Factory</div>
      <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> 🏪 Warehouse</div>
      <div class="legend-item"><div class="legend-dot" style="background:#ec4899"></div> 🏙️ City</div>
    </div>
    </div>""", unsafe_allow_html=True)

with c3:
    spof_labels = [graph_data["nodes"][i]["label"]
                   for i in range(len(graph_data["nodes"]))
                   if graph_data["nodes"][i]["id"] in spofs]
    spof_html = "".join(f'<span class="tag-chip danger">⚠️ {l}</span>'
                        for l in spof_labels[:8])
    st.markdown(f"""<div class="surface-card">
    <div class="kpi-label">Single Points of Failure ({len(spofs)})</div>
    <div style="margin-top:12px">{spof_html}</div>
    </div>""", unsafe_allow_html=True)
