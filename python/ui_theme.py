"""
ui_theme.py — Centralized Design System & Theme Engine for SupplyShield
Includes dark mode tokens, typography hierarchy, UI primitives,
navigation styling, and Plotly chart customization.
"""

import os
import json
import streamlit as st
import plotly.graph_objects as go

# ---------------------------------------------------------------------------
# Design System Tokens & Master CSS
# ---------------------------------------------------------------------------
THEME_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  --bg-primary:     #080c14;
  --bg-secondary:   #0d1322;
  --bg-card:        #111827;
  --bg-card-hover:  #162032;
  --text-primary:   #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted:     #64748b;
  --border-subtle:  rgba(255, 255, 255, 0.08);
  --border-glow:    rgba(59, 130, 246, 0.3);
  --accent-blue:    #3b82f6;
  --accent-cyan:    #06b6d4;
  --accent-emerald: #10b981;
  --accent-amber:   #f59e0b;
  --accent-rose:    #f43f5e;
  --accent-purple:  #8b5cf6;
  --shadow-sm:      0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md:      0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow:    0 0 25px rgba(59, 130, 246, 0.15);
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

/* Global Reset */
html, body, [data-testid="stAppViewContainer"] {
  background-color: var(--bg-primary) !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  color: var(--text-primary) !important;
  -webkit-font-smoothing: antialiased;
}

[data-testid="stSidebar"] {
  background-color: var(--bg-secondary) !important;
  border-right: 1px solid var(--border-subtle) !important;
}

[data-testid="stSidebar"] * {
  color: var(--text-primary) !important;
}

.block-container {
  padding: 2rem 2.5rem !important;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeInUp 0.4s ease-out forwards;
}

#MainMenu, footer {
  visibility: hidden;
}

header[data-testid="stHeader"] {
  background: transparent !important;
}

/* Sidebar Toggle Controls (Expand / Collapse Button) */
[data-testid="collapsedControl"],
[data-testid="stSidebarCollapseButton"],
button[aria-label="Expand sidebar"],
button[aria-label="Collapse sidebar"] {
  visibility: visible !important;
  display: flex !important;
  color: var(--text-primary) !important;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-subtle) !important;
  border-radius: 8px !important;
  padding: 6px !important;
  transition: all 0.2s ease !important;
  z-index: 999999 !important;
}

[data-testid="collapsedControl"]:hover,
[data-testid="stSidebarCollapseButton"]:hover {
  background: var(--bg-card-hover) !important;
  border-color: rgba(59, 130, 246, 0.4) !important;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.25) !important;
}

[data-testid="collapsedControl"] svg,
[data-testid="stSidebarCollapseButton"] svg {
  fill: var(--text-primary) !important;
  color: var(--text-primary) !important;
}

/* Clean Typography Header */
.header-container {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
}

.header-badge {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: var(--accent-blue);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 6px;
  margin-bottom: 0;
  line-height: 1.5;
}

/* Reusable Card Surfaces */
.surface-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.surface-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

/* KPI Components */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
  margin-bottom: 2rem;
}

.kpi-box {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
}

.kpi-box::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent-blue);
  opacity: 0.8;
}

.kpi-box.emerald::before { background: var(--accent-emerald); }
.kpi-box.amber::before   { background: var(--accent-amber); }
.kpi-box.rose::before    { background: var(--accent-rose); }
.kpi-box.purple::before  { background: var(--accent-purple); }

.kpi-box:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.kpi-icon {
  font-size: 18px;
  opacity: 0.85;
}

.kpi-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Section Header */
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 1.75rem 0 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

/* Sidebar Styling */
.nav-header {
  padding: 12px 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.nav-brand {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

.nav-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 500;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  margin-top: 16px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-emerald);
  animation: pulseDot 2s infinite ease-in-out;
}

.status-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-emerald);
}

/* Badges & Chips */
.tag-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  margin: 3px;
}

.tag-chip.danger {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.25);
  color: #fecdd3;
}

.tag-chip.success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
  color: #a7f3d0;
}
</style>
"""


def inject_theme():
    """Injects master design system styles into Streamlit document."""
    st.markdown(THEME_CSS, unsafe_allow_html=True)


def render_header(title: str, subtitle: str, badge: str = "LIVE INTELLIGENCE"):
    """Renders standardized page header."""
    st.markdown(f"""
    <div class="header-container">
      <div class="header-title-row">
        <h1 class="header-title">{title}</h1>
        <span class="header-badge">{badge}</span>
      </div>
      <p class="header-subtitle">{subtitle}</p>
    </div>
    """, unsafe_allow_html=True)


def render_sidebar_nav():
    """Renders consistent sidebar branding and status indicator."""
    with st.sidebar:
        st.markdown("""
        <div class="nav-header">
          <div class="nav-brand">🛡️ SupplyShield</div>
          <div class="nav-subtitle">India Supply Chain Intelligence</div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("""
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span class="status-text">Pipeline Operational</span>
        </div>
        """, unsafe_allow_html=True)


def apply_plotly_theme(fig: go.Figure, height: int = 350, title: str = "") -> go.Figure:
    """Applies standardized dark theme to Plotly figures."""
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, sans-serif", color="#94a3b8", size=11),
        title=dict(
            text=title,
            font=dict(family="Inter, sans-serif", color="#f8fafc", size=13, weight=700),
            x=0.0,
            y=0.98,
        ) if title else None,
        margin=dict(l=10, r=20, t=35 if title else 15, b=25),
        height=height,
        hoverlabel=dict(
            bgcolor="#111827",
            bordercolor="rgba(59, 130, 246, 0.4)",
            font=dict(family="Inter, sans-serif", size=12, color="#f8fafc"),
        ),
        xaxis=dict(
            gridcolor="rgba(255, 255, 255, 0.05)",
            zerolinecolor="rgba(255, 255, 255, 0.08)",
            tickfont=dict(color="#64748b", size=10),
            title_font=dict(color="#94a3b8", size=11),
        ),
        yaxis=dict(
            gridcolor="rgba(255, 255, 255, 0.05)",
            zerolinecolor="rgba(255, 255, 255, 0.08)",
            tickfont=dict(color="#94a3b8", size=10),
            title_font=dict(color="#94a3b8", size=11),
        ),
        legend=dict(
            bgcolor="rgba(17, 24, 39, 0.8)",
            bordercolor="rgba(255, 255, 255, 0.08)",
            borderwidth=1,
            font=dict(color="#94a3b8", size=10),
        ),
    )
    return fig
