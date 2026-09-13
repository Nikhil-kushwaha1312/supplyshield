"""
0_🏠_Overview.py — SupplyShield Streamlit Dashboard Overview Page
Run with: streamlit run 0_🏠_Overview.py
"""

import os
import json
import streamlit as st
import plotly.graph_objects as go

import ui_theme

# ── Page config (must be first Streamlit call) ──────────────────────────────
st.set_page_config(
    page_title="SupplyShield — Overview",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Inject design system
ui_theme.inject_theme()
ui_theme.render_sidebar_nav()

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")


# ── Data loading helpers ──────────────────────────────────────────────────────
@st.cache_data
def load_graph_json():
    path = os.path.join(OUTPUT_DIR, "graph.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

@st.cache_data
def load_disruption():
    path = os.path.join(OUTPUT_DIR, "disruption_results.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

@st.cache_data
def load_cascade():
    path = os.path.join(OUTPUT_DIR, "cascade_results.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

@st.cache_data
def load_resilience():
    path = os.path.join(OUTPUT_DIR, "resilience_results.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def pipeline_ready():
    return all(os.path.exists(os.path.join(OUTPUT_DIR, f))
               for f in ["graph.json", "disruption_results.json",
                          "cascade_results.json", "resilience_results.json"])


# ── Header / Hero ─────────────────────────────────────────────────────────────
ui_theme.render_header(
    title="SupplyChain Resilience Intelligence",
    subtitle="Real-time disruption simulation, ML cascade failure modeling, and automated logistics risk mitigation for India's critical transport network.",
    badge="ENTERPRISE MONITORING"
)

# ── Pipeline check guard ──────────────────────────────────────────────────────
if not pipeline_ready():
    st.warning("⚠️ Pipeline outputs not found. Run `python run_pipeline.py` from the `python/` directory to generate data.")
    st.stop()

# ── Load data ─────────────────────────────────────────────────────────────────
graph_data   = load_graph_json()
disruption   = load_disruption()
cascade      = load_cascade()
resilience   = load_resilience()

# ── KPI Cards ────────────────────────────────────────────────────────────────
stats           = graph_data["stats"] if graph_data else {}
num_nodes       = stats.get("num_nodes", 0)
num_edges       = stats.get("num_edges", 0)
num_spofs       = len(resilience.get("spofs", [])) if resilience else 0
avg_resilience  = resilience["summary"]["avg_resilience_score"] if resilience else 0
total_exposure  = sum(v.get("economic_loss_crore", 0) for v in disruption.values()) if disruption else 0

st.markdown(f"""
<div class="kpi-grid">
  <div class="kpi-box">
    <div class="kpi-header"><span class="kpi-label">Network Nodes</span><span class="kpi-icon">🔵</span></div>
    <div class="kpi-value">{num_nodes}</div>
  </div>
  <div class="kpi-box purple">
    <div class="kpi-header"><span class="kpi-label">Transport Links</span><span class="kpi-icon">🔗</span></div>
    <div class="kpi-value">{num_edges}</div>
  </div>
  <div class="kpi-box emerald">
    <div class="kpi-header"><span class="kpi-label">Avg Resilience</span><span class="kpi-icon">💪</span></div>
    <div class="kpi-value">{avg_resilience:.0f}<span style="font-size:16px;color:var(--text-muted)">/100</span></div>
  </div>
  <div class="kpi-box rose">
    <div class="kpi-header"><span class="kpi-label">Critical SPOFs</span><span class="kpi-icon">⚠️</span></div>
    <div class="kpi-value">{num_spofs}</div>
  </div>
  <div class="kpi-box amber">
    <div class="kpi-header"><span class="kpi-label">Economic Exposure</span><span class="kpi-icon">💸</span></div>
    <div class="kpi-value">₹{total_exposure//1000}K Cr</div>
  </div>
</div>
""", unsafe_allow_html=True)


# ── Row 1: Economic Impact by Scenario + Resilience Gauge ────────────────────
st.markdown('<div class="section-title">📊 Economic Impact & System Resilience</div>', unsafe_allow_html=True)
col1, col2 = st.columns([3, 1])

with col1:
    if disruption:
        scenario_names  = [v.get("scenario_title", k) for k, v in disruption.items()]
        economic_losses = [v.get("economic_loss_crore", 0) for v in disruption.values()]

        fig_eco = go.Figure(go.Bar(
            y=scenario_names,
            x=economic_losses,
            orientation="h",
            marker=dict(
                color=economic_losses,
                colorscale=[[0, "#1e3a8a"], [0.5, "#d97706"], [1, "#e11d48"]],
                showscale=False,
            ),
            text=[f"₹{v:,} Cr" for v in economic_losses],
            textposition="outside",
            textfont=dict(color="#94a3b8", size=10),
        ))
        ui_theme.apply_plotly_theme(fig_eco, height=320, title="Simulated Economic Loss by Scenario (₹ Crore)")
        st.plotly_chart(fig_eco, use_container_width=True)

with col2:
    # Resilience gauge
    fig_gauge = go.Figure(go.Indicator(
        mode="gauge+number",
        value=avg_resilience,
        number=dict(font=dict(size=36, color="#f8fafc", family="Inter")),
        gauge=dict(
            axis=dict(range=[0, 100], tickcolor="#64748b", tickfont=dict(color="#64748b", size=9)),
            bar=dict(color="#3b82f6", thickness=0.22),
            bgcolor="rgba(255,255,255,0.02)",
            bordercolor="rgba(255,255,255,0.08)",
            steps=[
                dict(range=[0, 40],   color="rgba(244,63,94,0.15)"),
                dict(range=[40, 70],  color="rgba(245,158,11,0.15)"),
                dict(range=[70, 100], color="rgba(16,185,129,0.15)"),
            ],
        ),
    ))
    ui_theme.apply_plotly_theme(fig_gauge, height=320, title="System Robustness")
    st.plotly_chart(fig_gauge, use_container_width=True)


# ── Row 2: Risk distribution + Node type breakdown ────────────────────────────
st.markdown('<div class="section-title">🔬 Network Risk Profile</div>', unsafe_allow_html=True)
col3, col4 = st.columns(2)

with col3:
    if cascade:
        risk_dist = cascade.get("risk_distribution", {})
        labels = list(risk_dist.keys())
        values = list(risk_dist.values())
        risk_colors = {"High": "#f43f5e", "Medium": "#f59e0b", "Low": "#3b82f6", "Safe": "#10b981"}
        fig_risk = go.Figure(go.Pie(
            labels=labels,
            values=values,
            hole=0.6,
            marker=dict(colors=[risk_colors.get(l, "#64748b") for l in labels]),
            textfont=dict(color="#f8fafc", size=12),
            textinfo="label+value",
        ))
        ui_theme.apply_plotly_theme(fig_risk, height=280, title="Node Cascade Failure Risk Classification")
        st.plotly_chart(fig_risk, use_container_width=True)

with col4:
    if graph_data:
        node_types = {}
        for nd in graph_data.get("nodes", []):
            t = nd.get("type", "unknown")
            node_types[t] = node_types.get(t, 0) + 1

        type_emojis = {"port": "⚓", "airport": "✈️", "rail_hub": "🚂",
                       "factory": "🏭", "warehouse": "🏪", "city": "🏙️"}
        type_colors = {"port": "#06b6d4", "airport": "#8b5cf6", "rail_hub": "#3b82f6",
                       "factory": "#f59e0b", "warehouse": "#10b981", "city": "#ec4899"}

        labels = [f"{type_emojis.get(t, '📍')} {t.replace('_',' ').title()}" for t in node_types]
        values = list(node_types.values())
        colors = [type_colors.get(t, "#64748b") for t in node_types]

        fig_types = go.Figure(go.Bar(
            x=labels,
            y=values,
            marker=dict(color=colors),
            text=values,
            textposition="outside",
            textfont=dict(color="#94a3b8"),
        ))
        ui_theme.apply_plotly_theme(fig_types, height=280, title="Infrastructure Distribution by Hub Type")
        st.plotly_chart(fig_types, use_container_width=True)


# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown("""
<div style='margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--border-subtle); text-align:center; color:var(--text-muted); font-size:11px;'>
  SupplyShield Enterprise Intelligence Platform · Built with NetworkX, Scikit-learn & Streamlit
</div>
""", unsafe_allow_html=True)
