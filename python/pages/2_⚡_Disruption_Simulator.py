"""
Page 2: Disruption Simulator — Scenario selector and LLM impact analysis.
"""

import os
import json
import sys
import streamlit as st
import plotly.graph_objects as go

# Add parent directory to path to import ui_theme
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import ui_theme

st.set_page_config(page_title="Disruption Simulator · SupplyShield", page_icon="⚡", layout="wide")

ui_theme.inject_theme()
ui_theme.render_sidebar_nav()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")


# ── Load data ──────────────────────────────────────────────────────────────────
@st.cache_data
def load_disruption():
    p = os.path.join(OUTPUT_DIR, "disruption_results.json")
    return json.load(open(p)) if os.path.exists(p) else None

disruption = load_disruption()

ui_theme.render_header(
    title="Disruption Simulator",
    subtitle="AI-generated impact assessments, temporal cascade timelines, and sector exposure for India-specific disruption scenarios.",
    badge="SCENARIO MODELING"
)

if not disruption:
    st.error("Disruption results not found. Run `python run_pipeline.py` first.")
    st.stop()

# ── Sidebar: Scenario selector ────────────────────────────────────────────────
with st.sidebar:
    st.markdown("**Scenario Options**")
    scenario_options = {v["scenario_title"]: k for k, v in disruption.items()}
    selected_title   = st.selectbox("Select scenario", list(scenario_options.keys()), index=0)
    selected_id      = scenario_options[selected_title]
    data             = disruption[selected_id]

    st.markdown("---")
    sev = data.get("severity", 5)
    sev_color = "#f43f5e" if sev >= 8 else "#f59e0b" if sev >= 6 else "#3b82f6"
    st.markdown(f"""
    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:8px">
      <div style="font-size:32px;font-weight:800;color:{sev_color}">{sev}/10</div>
      <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">Severity Index</div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown(f"**Region:** {data.get('affected_region','N/A')}")
    st.markdown(f"**Primary Hub:** `{data.get('primary_node','N/A')}`")

# ── Scenario overview card ────────────────────────────────────────────────────
st.markdown(f"""
<div class="surface-card">
  <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:6px">⚡ {data.get('scenario_title', selected_title)}</div>
  <div style="font-size:12px;color:var(--text-muted)">
    Category: <strong style="color:var(--text-secondary)">{selected_id.replace('_', ' ')}</strong> · 
    Target Area: <strong style="color:var(--text-secondary)">{data.get('affected_region','India')}</strong>
  </div>
</div>
""", unsafe_allow_html=True)

# ── Row 1: Economic callout + Affected sectors ────────────────────────────────
col_a, col_b = st.columns([1, 2])

with col_a:
    loss = data.get("economic_loss_crore", 0)
    st.markdown(f"""
    <div class="surface-card" style="text-align:center">
      <div class="kpi-label">Estimated Economic Exposure</div>
      <div style="font-size:40px;font-weight:800;color:var(--accent-amber);margin:8px 0">₹{loss:,} Cr</div>
      <div class="kpi-label">Crores INR</div>
    </div>
    """, unsafe_allow_html=True)

    sectors = data.get("affected_sectors", [])
    sector_chips = "".join(f'<span class="tag-chip danger">{sec}</span>' for sec in sectors)
    st.markdown(f"""<div class="surface-card">
      <div class="kpi-label">Affected Industry Sectors</div>
      <div style="margin-top:8px">{sector_chips}</div>
    </div>""", unsafe_allow_html=True)

with col_b:
    # Node impact bar chart
    node_impacts = data.get("node_impacts", [])
    if node_impacts:
        node_ids    = [ni.get("node_id", "?") for ni in node_impacts]
        sev_vals    = [ni.get("severity_pct", 0) for ni in node_impacts]
        impact_types = [ni.get("impact_type", "").replace("_", " ").title() for ni in node_impacts]
        descriptions = [ni.get("description", "") for ni in node_impacts]

        colors = [f"hsl({max(0, 120 - s * 1.2)}, 75%, 50%)" for s in sev_vals]

        fig_impact = go.Figure(go.Bar(
            y=node_ids,
            x=sev_vals,
            orientation="h",
            marker=dict(color=colors),
            text=[f"{s}%" for s in sev_vals],
            textposition="outside",
            textfont=dict(color="#94a3b8", size=10),
            customdata=list(zip(impact_types, descriptions)),
            hovertemplate="<b>%{y}</b><br>Severity: %{x}%<br>Type: %{customdata[0]}<br>%{customdata[1]}<extra></extra>",
        ))
        ui_theme.apply_plotly_theme(fig_impact, height=280, title="Node Capacity Impairment (%)")
        st.plotly_chart(fig_impact, use_container_width=True)

# ── Row 2: Timeline + Resilience actions ──────────────────────────────────────
col_c, col_d = st.columns(2)

with col_c:
    st.markdown('<div class="section-title">📅 Propagation Timeline</div>', unsafe_allow_html=True)
    timeline = data.get("cascade_timeline", {})
    day_order = ["day_1", "day_3", "day_7", "day_14", "day_30"]
    day_labels = {"day_1": "Day 1", "day_3": "Day 3", "day_7": "Day 7",
                  "day_14": "Day 14", "day_30": "Day 30"}

    timeline_items = ""
    for dk in day_order:
        if dk in timeline:
            timeline_items += f"""
            <div style="margin-bottom:12px;padding-left:14px;border-left:2px solid var(--accent-blue)">
              <div style="font-size:11px;font-weight:700;color:var(--accent-blue);text-transform:uppercase">{day_labels[dk]}</div>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:2px">{timeline[dk]}</div>
            </div>"""
    st.markdown(f'<div class="surface-card">{timeline_items}</div>', unsafe_allow_html=True)

with col_d:
    st.markdown('<div class="section-title">🛡️ Immediate Action Plan</div>', unsafe_allow_html=True)
    actions = data.get("resilience_actions", [])
    action_items = ""
    for i, action in enumerate(actions, 1):
        action_items += f"""
        <div style="margin-bottom:8px;padding:8px 12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:12px;color:#a7f3d0">
          <strong>{i}.</strong> {action}
        </div>"""
    st.markdown(f'<div class="surface-card">{action_items}</div>', unsafe_allow_html=True)

# ── All scenarios comparison ───────────────────────────────────────────────────
st.markdown('<div class="section-title">📊 Cross-Scenario Impact Comparison</div>', unsafe_allow_html=True)

names    = [v.get("scenario_title", k) for k, v in disruption.items()]
losses   = [v.get("economic_loss_crore", 0) for k, v in disruption.items()]
severities = [v.get("severity", 5) for k, v in disruption.items()]

fig_compare = go.Figure()
fig_compare.add_trace(go.Bar(
    name="Economic Loss (₹ Cr)",
    x=names, y=losses,
    marker=dict(color="rgba(59,130,246,0.7)", line=dict(color="#3b82f6", width=1)),
    yaxis="y",
))
fig_compare.add_trace(go.Scatter(
    name="Severity Score",
    x=names, y=severities,
    mode="lines+markers",
    line=dict(color="#f59e0b", width=2),
    marker=dict(size=7, color="#f59e0b"),
    yaxis="y2",
))
fig_compare.update_layout(
    yaxis2=dict(title="Severity /10", overlaying="y", side="right",
                range=[0, 12], gridcolor="rgba(0,0,0,0)", tickfont=dict(color="#64748b")),
    barmode="group",
)
ui_theme.apply_plotly_theme(fig_compare, height=340)
st.plotly_chart(fig_compare, use_container_width=True)
