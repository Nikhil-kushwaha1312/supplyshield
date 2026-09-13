"""
Page 4: Resilience Strategies — Scores, SPOFs, robustness curve, strategy cards.
"""

import os
import json
import sys
import streamlit as st
import plotly.graph_objects as go

# Add parent directory to path to import ui_theme
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import ui_theme

st.set_page_config(page_title="Resilience Strategies · SupplyShield", page_icon="🛡️", layout="wide")

ui_theme.inject_theme()
ui_theme.render_sidebar_nav()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")


# ── Load data ──────────────────────────────────────────────────────────────────
@st.cache_data
def load_resilience():
    p = os.path.join(OUTPUT_DIR, "resilience_results.json")
    return json.load(open(p)) if os.path.exists(p) else None

@st.cache_data
def load_graph():
    p = os.path.join(OUTPUT_DIR, "graph.json")
    return json.load(open(p)) if os.path.exists(p) else None

resilience = load_resilience()
graph_data = load_graph()

ui_theme.render_header(
    title="Resilience Optimization Strategies",
    subtitle="Node-level resilience scores, topological bottleneck analysis, and AI-recommended mitigation strategies.",
    badge="STRATEGIC MITIGATION"
)

if not resilience:
    st.error("Resilience results not found. Run `python run_pipeline.py` first.")
    st.stop()

summary = resilience.get("summary", {})
spofs   = resilience.get("spofs", [])
scores  = resilience.get("resilience_scores", {})
strategies = resilience.get("strategies", [])
robustness = resilience.get("robustness_curve", [])
spof_labels = resilience.get("spof_labels", {})

if graph_data:
    label_map = {nd["id"]: nd.get("label", nd["id"]) for nd in graph_data["nodes"]}
else:
    label_map = {}

# ── Summary KPIs ──────────────────────────────────────────────────────────────
st.markdown(f"""
<div class="kpi-grid">
  <div class="kpi-box rose">
    <div class="kpi-header"><span class="kpi-label">Articulation Points</span><span class="kpi-icon">⚠️</span></div>
    <div class="kpi-value">{summary.get('total_spofs',0)}</div>
  </div>
  <div class="kpi-box emerald">
    <div class="kpi-header"><span class="kpi-label">Avg Resilience</span><span class="kpi-icon">💪</span></div>
    <div class="kpi-value">{summary.get('avg_resilience_score',0):.1f}</div>
  </div>
  <div class="kpi-box amber">
    <div class="kpi-header"><span class="kpi-label">Min Node Score</span><span class="kpi-icon">🔻</span></div>
    <div class="kpi-value">{summary.get('min_resilience_score',0):.1f}</div>
  </div>
  <div class="kpi-box">
    <div class="kpi-header"><span class="kpi-label">Max Node Score</span><span class="kpi-icon">🔺</span></div>
    <div class="kpi-value">{summary.get('max_resilience_score',0):.1f}</div>
  </div>
  <div class="kpi-box purple">
    <div class="kpi-header"><span class="kpi-label">AI Action Cards</span><span class="kpi-icon">🤖</span></div>
    <div class="kpi-value">{summary.get('num_strategies',0)}</div>
  </div>
</div>
""", unsafe_allow_html=True)

# ── Row 1: Resilience scores bar + SPOF cards ─────────────────────────────────
col_a, col_b = st.columns([2, 1])

with col_a:
    sorted_scores = sorted(scores.items(), key=lambda x: x[1])
    node_ids_sorted = [s[0] for s in sorted_scores]
    score_vals      = [s[1] for s in sorted_scores]
    display_labels  = [label_map.get(n, n) for n in node_ids_sorted]

    bar_colors = []
    for v in score_vals:
        if v < 40:   bar_colors.append("#f43f5e")
        elif v < 55: bar_colors.append("#f59e0b")
        elif v < 70: bar_colors.append("#3b82f6")
        else:        bar_colors.append("#10b981")

    is_spof = [n in spofs for n in node_ids_sorted]

    fig_scores = go.Figure()
    fig_scores.add_trace(go.Bar(
        x=score_vals,
        y=display_labels,
        orientation="h",
        marker=dict(color=bar_colors),
        text=[f"{v:.1f}" + (" ⚠️" if s else "") for v, s in zip(score_vals, is_spof)],
        textposition="outside",
        textfont=dict(color="#94a3b8", size=10),
    ))
    ui_theme.apply_plotly_theme(fig_scores, height=650, title="Per-Node Resilience Index (0–100)")
    st.plotly_chart(fig_scores, use_container_width=True)

with col_b:
    st.markdown('<div class="section-title">⚠️ Single Points of Failure</div>', unsafe_allow_html=True)
    for spof_id in spofs:
        lbl = spof_labels.get(spof_id, label_map.get(spof_id, spof_id))
        score = scores.get(spof_id, 0)
        st.markdown(f"""
        <div class="surface-card" style="border-left:3px solid var(--accent-amber)">
          <div style="font-size:14px;font-weight:700;color:var(--text-primary)">⚠️ {lbl}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">ID: <code>{spof_id}</code> · Resilience Score: <strong>{score:.1f}</strong></div>
        </div>""", unsafe_allow_html=True)

# ── Robustness curve ───────────────────────────────────────────────────────────
st.markdown('<div class="section-title">📉 Network Robustness Curve (Sequential Node Removal)</div>', unsafe_allow_html=True)
rob_x = [pt["nodes_removed"] for pt in robustness]
rob_y = [pt["lcc_fraction"]  for pt in robustness]

fig_rob = go.Figure()
fig_rob.add_trace(go.Scatter(
    x=rob_x, y=rob_y,
    mode="lines+markers",
    name="LCC Fraction",
    line=dict(color="#3b82f6", width=2.5),
    marker=dict(size=5, color="#3b82f6"),
    fill="tozeroy",
    fillcolor="rgba(59,130,246,0.08)",
    hovertemplate="Nodes removed: %{x}<br>LCC: %{y:.1%}<extra></extra>",
))
ui_theme.apply_plotly_theme(fig_rob, height=300)
st.plotly_chart(fig_rob, use_container_width=True)

# ── Strategy cards ────────────────────────────────────────────────────────────
st.markdown('<div class="section-title">🤖 AI-Generated Resilience Strategies</div>', unsafe_allow_html=True)

for strat in strategies:
    stype    = strat.get("type", "Infrastructure")
    priority = strat.get("priority", "High")
    steps    = strat.get("implementation_steps", [])
    cost     = strat.get("cost_crore", 0)
    timeline_s = strat.get("timeline", "TBD")

    priority_class = "danger" if priority == "Critical" else "warning" if priority == "High" else ""
    steps_html = "\n".join(f"<li style='margin-bottom:4px'>{s}</li>" for s in steps)

    st.markdown(f"""
    <div class="surface-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:16px;font-weight:700;color:var(--text-primary)">{strat.get('id','')} — {strat.get('title','')}</div>
        <div>
          <span class="tag-chip">{stype}</span>
          <span class="tag-chip {priority_class}">{priority} Priority</span>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">{strat.get('description','')}</div>
      <ol style="font-size:12px;color:var(--text-muted);padding-left:20px;margin-bottom:12px">{steps_html}</ol>
      <div style="display:flex;gap:24px;padding-top:10px;border-top:1px solid var(--border-subtle);font-size:12px;color:var(--text-muted)">
        <div>Est. Cost: <strong style="color:var(--text-primary)">₹{cost:,} Cr</strong></div>
        <div>Implementation Window: <strong style="color:var(--text-primary)">{timeline_s}</strong></div>
      </div>
    </div>""", unsafe_allow_html=True)
