"""
Page 3: Cascade Analysis — Dual-Model Architecture:
  1. Topological Cascade & SIR Epidemic Model (Network Graph dynamics)
  2. Kaggle Disruption ML Model (DataCo Smart Supply Chain empirical predictions)
"""

import os
import json
import pickle
import sys
import numpy as np
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

@st.cache_data
def load_kaggle_metrics():
    p = os.path.join(OUTPUT_DIR, "kaggle_model_metrics.json")
    return json.load(open(p)) if os.path.exists(p) else None

@st.cache_resource
def load_kaggle_model():
    p = os.path.join(OUTPUT_DIR, "kaggle_disruption_clf.pkl")
    if os.path.exists(p):
        with open(p, "rb") as f:
            return pickle.load(f)
    return None


cascade        = load_cascade()
graph_data     = load_graph()
kaggle_metrics = load_kaggle_metrics()
kaggle_bundle  = load_kaggle_model()

ui_theme.render_header(
    title="Cascade Failure & Disruption Modeling",
    subtitle="Dual-model intelligence: Network-level epidemic cascade dynamics coupled with Kaggle real-world shipment disruption ML.",
    badge="ML ANALYTICS"
)

if not cascade:
    st.error("Cascade results not found. Run `python run_pipeline.py` first.")
    st.stop()

# ── Tabs: Topological Cascade vs Kaggle Disruption ML ──────────────────────────
tab_cascade, tab_kaggle = st.tabs([
    "🕸️ Topological Cascade & SIR Dynamics",
    "📦 Kaggle Disruption ML Model (DataCo)",
])


# ===============================================================================
# TAB 1: TOPOLOGICAL CASCADE & SIR DYNAMICS
# ===============================================================================
with tab_cascade:
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

    st.markdown('<div class="section-title">📊 Graph Metric Feature Importance</div>', unsafe_allow_html=True)
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


# ===============================================================================
# TAB 2: KAGGLE DISRUPTION ML MODEL (DATACO DATASET)
# ===============================================================================
with tab_kaggle:
    if not kaggle_metrics:
        st.warning("Kaggle model metrics not found. Run `python train_kaggle_model.py` to train.")
    else:
        k_cv = kaggle_metrics.get("cv_scores", {})
        k_test = kaggle_metrics.get("test_metrics", {})
        k_samples = kaggle_metrics.get("samples_analyzed", 0)

        st.markdown(f"""
        <div class="kpi-grid">
          <div class="kpi-box purple">
            <div class="kpi-header"><span class="kpi-label">Kaggle Dataset Samples</span><span class="kpi-icon">📁</span></div>
            <div class="kpi-value">{k_samples:,}</div>
          </div>
          <div class="kpi-box emerald">
            <div class="kpi-header"><span class="kpi-label">5-Fold CV Accuracy</span><span class="kpi-icon">🎯</span></div>
            <div class="kpi-value">{k_cv.get('mean', 0):.1%}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-header"><span class="kpi-label">Test ROC-AUC Score</span><span class="kpi-icon">📈</span></div>
            <div class="kpi-value">{k_test.get('roc_auc', 0):.3f}</div>
          </div>
          <div class="kpi-box rose">
            <div class="kpi-header"><span class="kpi-label">Disruption Test Accuracy</span><span class="kpi-icon">⚡</span></div>
            <div class="kpi-value">{k_test.get('accuracy', 0):.1%}</div>
          </div>
        </div>
        """, unsafe_allow_html=True)

        col_k1, col_k2 = st.columns([1, 1])

        with col_k1:
            st.markdown('<div class="section-title">🚚 Empirical Modal Reliability & Delay Risk</div>', unsafe_allow_html=True)
            mode_stats = kaggle_metrics.get("modal_statistics", {})
            m_names = list(mode_stats.keys())
            m_rel   = [mode_stats[m]["empirical_reliability"] * 100 for m in m_names]
            m_late  = [mode_stats[m]["late_delivery_rate"] * 100 for m in m_names]

            fig_mode = go.Figure()
            fig_mode.add_trace(go.Bar(
                name="On-Time Reliability (%)",
                x=m_names,
                y=m_rel,
                marker_color="#10b981",
                text=[f"{v:.1f}%" for v in m_rel],
                textposition="auto"
            ))
            fig_mode.add_trace(go.Bar(
                name="Late Delivery Risk (%)",
                x=m_names,
                y=m_late,
                marker_color="#f43f5e",
                text=[f"{v:.1f}%" for v in m_late],
                textposition="auto"
            ))
            fig_mode.update_layout(barmode="group")
            ui_theme.apply_plotly_theme(fig_mode, height=330, title="Modal Delivery Reliability Benchmark")
            st.plotly_chart(fig_mode, use_container_width=True)

        with col_k2:
            st.markdown('<div class="section-title">🎯 Model Confusion Matrix</div>', unsafe_allow_html=True)
            cm = kaggle_metrics.get("confusion_matrix", [[0, 0], [0, 0]])
            cm_z = [[cm[0][0], cm[0][1]], [cm[1][0], cm[1][1]]]
            cm_text = [
                [f"True On-Time: {cm[0][0]}", f"False Disruption: {cm[0][1]}"],
                [f"Missed Disruption: {cm[1][0]}", f"True Disruption: {cm[1][1]}"]
            ]

            fig_cm = go.Figure(data=go.Heatmap(
                z=cm_z,
                x=["Predicted On-Time", "Predicted Disruption"],
                y=["Actual On-Time", "Actual Disrupted"],
                text=cm_text,
                texttemplate="%{text}",
                colorscale="Blues",
                showscale=False,
            ))
            ui_theme.apply_plotly_theme(fig_cm, height=330, title="Test Set Disruption Classification")
            st.plotly_chart(fig_cm, use_container_width=True)

        st.markdown('<div class="section-title">📊 Feature Importance in Disruption Prediction</div>', unsafe_allow_html=True)
        k_feat_imp = kaggle_metrics.get("feature_importance", {})
        k_sorted = sorted(k_feat_imp.items(), key=lambda x: x[1], reverse=True)
        k_names = [x[0] for x in k_sorted]
        k_vals  = [x[1] for x in k_sorted]

        fig_kfi = go.Figure(go.Bar(
            x=k_vals,
            y=k_names,
            orientation="h",
            marker=dict(color="#8b5cf6"),
            text=[f"{v:.4f}" for v in k_vals],
            textposition="outside",
            textfont=dict(color="#94a3b8", size=10),
        ))
        ui_theme.apply_plotly_theme(fig_kfi, height=320)
        st.plotly_chart(fig_kfi, use_container_width=True)

        # Interactive Shipment Disruption Simulator
        st.markdown('<div class="section-title">🧪 Live Shipment Disruption Risk Simulator</div>', unsafe_allow_html=True)
        st.caption("Use the Kaggle-trained Gradient Boosting model to evaluate delivery failure probability for an ad-hoc shipment order.")

        if kaggle_bundle and "clf" in kaggle_bundle:
            clf = kaggle_bundle["clf"]
            feature_names = kaggle_bundle.get("feature_names", [])
            encoders = kaggle_bundle.get("encoders", {})

            sim_col1, sim_col2, sim_col3 = st.columns(3)

            with sim_col1:
                sel_mode = st.selectbox("Shipping Mode", ["Standard Class", "Second Class", "First Class", "Same Day"])
                sched_days = st.slider("Days for Shipment (Scheduled)", min_value=0, max_value=7, value=3)

            with sim_col2:
                prod_price = st.slider("Item Unit Price ($)", min_value=10.0, max_value=400.0, value=120.0, step=5.0)
                item_qty = st.slider("Order Quantity", min_value=1, max_value=6, value=2)

            with sim_col3:
                discount_rate = st.slider("Discount Rate", min_value=0.0, max_value=0.30, value=0.10, step=0.05)
                benefit = st.slider("Estimated Order Profit ($)", min_value=-50.0, max_value=250.0, value=35.0, step=5.0)

            # Build feature row matching trained feature_names
            gross_val = prod_price * item_qty
            net_val = gross_val * (1.0 - discount_rate)
            
            # Mode encoded
            le_mode = encoders.get("Shipping Mode")
            mode_enc = int(le_mode.transform([sel_mode])[0]) if le_mode is not None else 0

            feature_dict = {
                "Days for shipment (scheduled)": sched_days,
                "Benefit per order": benefit,
                "Order Item Discount Rate": discount_rate,
                "Order Item Product Price": prod_price,
                "Order Item Quantity": item_qty,
                "Sales": net_val,
                "Sales per customer": net_val,
                "Shipping Mode Encoded": mode_enc,
            }

            input_vector = np.array([[feature_dict.get(fn, 0.0) for fn in feature_names]])
            pred_class = clf.predict(input_vector)[0]
            pred_probs = clf.predict_proba(input_vector)[0]
            disrupt_prob = float(pred_probs[1]) if len(pred_probs) > 1 else float(pred_class)

            risk_badge = "🔴 HIGH DISRUPTION RISK" if disrupt_prob > 0.50 else "🟢 LOW RISK / ON TIME"
            bg_color = "rgba(244,63,94,0.12)" if disrupt_prob > 0.50 else "rgba(16,185,129,0.12)"
            border_color = "#f43f5e" if disrupt_prob > 0.50 else "#10b981"

            st.markdown(f"""
            <div style="background:{bg_color}; border:1px solid {border_color}; border-radius:10px; padding:18px; margin-top:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h4 style="margin:0; color:#f8fafc;">Predicted Outcome: {risk_badge}</h4>
                  <p style="margin:4px 0 0 0; color:#94a3b8; font-size:13px;">
                    Mode: <b>{sel_mode}</b> | Scheduled Days: <b>{sched_days}</b> | Net Value: <b>${net_val:.2f}</b>
                  </p>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:12px; color:#94a3b8; text-transform:uppercase;">Disruption Probability</span>
                  <div style="font-size:26px; font-weight:700; color:{border_color};">{disrupt_prob:.1%}</div>
                </div>
              </div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.info("Kaggle trained classifier artifact is loading...")
