"""
Page 3: Cascade Analysis — Risk distribution, SIR curves, feature importance.
"""

import os
import json
import sys
import streamlit as st
import plotly.graph_objects as go

# Add parent directory to path to import ui_theme
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import ui_theme

st.set_page_config(page_title="Cascade Analysis · SupplyShield", page_icon="🔬", layout="wide")

ui_theme.inject_theme()
ui_theme.render_sidebar_nav()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")


# ── Load data ──────────────────────────────────────────────────────────────────
@st.cache_data
def load_cascade():
    p = os.path.join(OUTPUT_DIR, "cascade_results.json")
    return json.load(open(p)) if os.path.exists(p) else None

@st.cache_data
def load_graph():
    p = os.path.join(OUTPUT_DIR, "graph.json")
    return json.load(open(p)) if os.path.exists(p) else None

cascade    = load_cascade()
graph_data = load_graph()

ui_theme.render_header(
    title="Cascade Failure Modeling",
    subtitle="Machine learning risk classification, SIR epidemic propagation dynamics, and feature importance analysis.",
    badge="ML ANALYTICS"
)

if not cascade:
    st.error("Cascade results not found. Run `python run_pipeline.py` first.")
    st.stop()

# ── Model accuracy KPIs ────────────────────────────────────────────────────────
cv = cascade.get("cv_scores", {})
risk_dist = cascade.get("risk_distribution", {})
node_risk = cascade.get("node_risk", {})

high_count = risk_dist.get("High", 0)
safe_count = risk_dist.get("Safe", 0)

st.markdown(f"""
<div class="kpi-grid">
  <div class="kpi-box purple">
    <div class="kpi-header"><span class="kpi-label">5-Fold CV Accuracy</span><span class="kpi-icon">🎯</span></div>
    <div class="kpi-value">{cv.get('mean',0):.1%}</div>
  </div>
  <div class="kpi-box">
    <div class="kpi-header"><span class="kpi-label">Accuracy Std Dev</span><span class="kpi-icon">📊</span></div>
    <div class="kpi-value">{cv.get('std',0):.1%}</div>
  </div>
  <div class="kpi-box rose">
    <div class="kpi-header"><span class="kpi-label">High-Risk Nodes</span><span class="kpi-icon">⚠️</span></div>
    <div class="kpi-value">{high_count}</div>
  </div>
  <div class="kpi-box emerald">
    <div class="kpi-header"><span class="kpi-label">Safe Nodes</span><span class="kpi-icon">✅</span></div>
    <div class="kpi-value">{safe_count}</div>
  </div>
</div>
""", unsafe_allow_html=True)


# ── Row 1: Risk distribution + Per-node cascade probability ───────────────────
col_a, col_b = st.columns([1, 2])

with col_a:
    RISK_COLORS = {"High": "#f43f5e", "Medium": "#f59e0b", "Low": "#3b82f6", "Safe": "#10b981"}
    labels = list(risk_dist.keys())
    values = list(risk_dist.values())

    fig_pie = go.Figure(go.Pie(
        labels=labels,
        values=values,
        hole=0.6,
        marker=dict(colors=[RISK_COLORS.get(l, "#64748b") for l in labels]),
        textfont=dict(color="#f8fafc", size=12),
        textinfo="label+value",
        pull=[0.05 if l == "High" else 0 for l in labels],
    ))
    ui_theme.apply_plotly_theme(fig_pie, height=340, title="Node Risk Classification")
    st.plotly_chart(fig_pie, use_container_width=True)

with col_b:
    node_ids = list(node_risk.keys())
    sir_data = cascade.get("sir_model", {})
    inf_prob = sir_data.get("infection_probability", {})

    sorted_nodes = sorted(node_ids, key=lambda n: inf_prob.get(n, 0), reverse=True)
    node_labels  = [node_risk[n].get("risk_label", "Safe") for n in sorted_nodes]
    node_probs   = [inf_prob.get(n, 0) for n in sorted_nodes]
    bar_colors   = [RISK_COLORS.get(l, "#64748b") for l in node_labels]

    if graph_data:
        label_map = {nd["id"]: nd.get("label", nd["id"]) for nd in graph_data["nodes"]}
    else:
        label_map = {}
    display_names = [label_map.get(n, n) for n in sorted_nodes]

    fig_bar = go.Figure(go.Bar(
        x=node_probs[:15],
        y=display_names[:15],
        orientation="h",
        marker=dict(color=bar_colors[:15]),
        text=[f"{p:.1%}" for p in node_probs[:15]],
        textposition="outside",
        textfont=dict(color="#94a3b8", size=10),
    ))
    ui_theme.apply_plotly_theme(fig_bar, height=340, title="Top 15 Vulnerable Nodes (Cascade Probability)")
    st.plotly_chart(fig_bar, use_container_width=True)

# ── Row 2: SIR curves ─────────────────────────────────────────────────────────
st.markdown('<div class="section-title">🦠 SIR Epidemic Propagation Model</div>', unsafe_allow_html=True)
sir = cascade.get("sir_model", {})
timeline = sir.get("timeline", {})
steps = list(range(1, len(timeline.get("S", [])) + 1))

fig_sir = go.Figure()
sir_cfg = [
    ("S", "Susceptible", "#3b82f6", "rgba(59,130,246,0.1)"),
    ("I", "Infected",    "#f43f5e", "rgba(244,63,94,0.1)"),
    ("R", "Recovered",   "#10b981", "rgba(16,185,129,0.1)"),
]
for key, name, color, fill in sir_cfg:
    vals = timeline.get(key, [])
    fig_sir.add_trace(go.Scatter(
        x=steps, y=vals,
        name=name,
        mode="lines",
        line=dict(color=color, width=2.5),
        fill="tozeroy",
        fillcolor=fill,
    ))

ui_theme.apply_plotly_theme(fig_sir, height=300, title="SIR Network Failure Propagation Over Time")
st.plotly_chart(fig_sir, use_container_width=True)

# ── Row 3: Feature importance ──────────────────────────────────────────────────
st.markdown('<div class="section-title">📊 Gradient Boosting — Feature Importance</div>', unsafe_allow_html=True)
feat_imp = cascade.get("feature_importance", {})
feat_sorted = sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)
feat_names  = [f[0] for f in feat_sorted]
feat_vals   = [f[1] for f in feat_sorted]

fig_fi = go.Figure(go.Bar(
    x=feat_vals,
    y=feat_names,
    orientation="h",
    marker=dict(color="#3b82f6"),
    text=[f"{v:.4f}" for v in feat_vals],
    textposition="outside",
    textfont=dict(color="#94a3b8", size=10),
))
ui_theme.apply_plotly_theme(fig_fi, height=360)
st.plotly_chart(fig_fi, use_container_width=True)
