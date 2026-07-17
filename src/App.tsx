import React, { useEffect, useState, useCallback } from "react";
import { NetworkStatus, LogisticsNode } from "./types";
import MapIndia from "./components/MapIndia";
import DashboardMetrics from "./components/DashboardMetrics";
import RiskPredictor from "./components/RiskPredictor";
import StressTester from "./components/StressTester";
import RouteOptimizer from "./components/RouteOptimizer";
import DemandForecaster from "./components/DemandForecaster";
import InventoryRisk from "./components/InventoryRisk";
import WhatIfAnalysis from "./components/WhatIfAnalysis";
import ChatAssistant from "./components/ChatAssistant";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Activity,
  Compass,
  TrendingUp,
  Layers,
  Sparkles,
  Database,
  Grid,
  Radio,
  FileText,
  Cpu,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

/* ── Live Clock ─────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
      {time.toLocaleTimeString("en-IN", { hour12: false })} IST
    </span>
  );
}

const TABS = [
  { id: "dashboard", label: "Overview", icon: Grid },
  { id: "predictor", label: "Risk Predict", icon: TrendingUp },
  { id: "stresstest", label: "Stress Test", icon: Activity },
  { id: "routes", label: "Route Optimizer", icon: Compass },
  { id: "demand", label: "Demand Forecast", icon: FileText },
  { id: "inventory", label: "Inventory Health", icon: Layers },
  { id: "chat", label: "ShieldBot AI", icon: Sparkles },
] as const;

type TabId = typeof TABS[number]["id"];

const SCENARIOS_INFO: Record<string, { name: string; description: string }> = {
  FLOOD: { name: "Monsoon Flood (West Coast)", description: "Torrential downpours chocking roads." },
  CYCLONE: { name: "East Coast Cyclone", description: "Severe storms suspending sea operations." },
  RAIL_STRIKE: { name: "Railway Worker Strike", description: "Container freights fully suspended." },
  PORT_CLOSURE: { name: "JNPT Port Cyber Attack", description: "Clearance Operating systems locked." },
  FUEL_SHORTAGE: { name: "Diesel Rationing Spike", description: "Freight rates increased by 90%." },
  PANDEMIC: { name: "Pandemic Health Checks", description: "Labor and screening checkpoint bottlenecks." },
  EARTHQUAKE: { name: "Himalayan Fault Earthquake", description: "Cracks on runways and highway bridges." },
  HIGHWAY_BLOCKAGE: { name: "NH48 Detour Blockade", description: "Protests and land shifts forcing village bypasses." },
  WAREHOUSE_SHUTDOWN: { name: "Guwahati Hub Emergency", description: "Safety inspections sealing terminal lines." },
  DEMAND_SURGE: { name: "Diwali Festival Spike", description: "E-commerce volume choke on sorter belts." },
  SUPPLIER_BANKRUPTCY: { name: "Hardware Vendor Solvency", description: "Primary semiconductor supplier insolvency." },
};

const tabVariants = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.14 } },
};

export default function App() {
  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[] | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard-metrics");
      const resData = await response.json();
      if (resData.status === "success") {
        setNetwork(resData.data);
        setActiveScenarios(resData.activeScenarios);
      }
    } catch (err) {
      console.error("Dashboard metrics fetch failed:", err);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const handleToggleScenario = async (scenarioId: string, action: "add" | "remove") => {
    try {
      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, action }),
      });
      const resData = await response.json();
      if (resData.status === "success") {
        setActiveScenarios(resData.activeScenarios);
        fetchMetrics();
      }
    } catch (err) {
      console.error("Stress-test trigger failed:", err);
    }
  };

  const handleClearScenarios = async () => {
    try {
      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const resData = await response.json();
      if (resData.status === "success") {
        setActiveScenarios([]);
        fetchMetrics();
      }
    } catch (err) {
      console.error("Clear scenarios failed:", err);
    }
  };

  /* ── Loading Screen ─────────────────────────────────── */
  if (!network) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-6" style={{ background: "#070c1a" }}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00c9a7, #0099cc)", boxShadow: "0 0 40px rgba(0,201,167,0.4)" }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 bg-emerald-400 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #e2eaf8, #00c9a7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SUPPLYSHIELD
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#3d5070", letterSpacing: "0.08em" }}>
            INITIALIZING INFRASTRUCTURE DIGITAL TWIN
          </p>
        </div>
        <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(28,42,75,0.5)" }}>
          <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, transparent, #00c9a7, transparent)", backgroundSize: "200% auto", animation: "shimmer 1.5s linear infinite" }} />
        </div>
      </div>
    );
  }

  const nodesList = Object.keys(network.nodes);
  const selectedNodeDetails: LogisticsNode | undefined = selectedNodeId ? network.nodes[selectedNodeId] : undefined;

  const nodeStatusColor = (status: string) => {
    if (status === "disrupted") return { color: "#ff6b86", bg: "rgba(255,59,92,0.08)", border: "rgba(255,59,92,0.3)" };
    if (status === "delayed") return { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" };
    return { color: "#00c9a7", bg: "rgba(0,201,167,0.08)", border: "rgba(0,201,167,0.3)" };
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col overflow-x-hidden" style={{ background: "#070c1a" }}>

      {/* Subtle grid + radial glow background */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(0,201,167,0.05) 0%, transparent 70%)" }} />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="relative z-20 border-b flex-shrink-0" style={{ borderColor: "rgba(28,42,75,0.8)", background: "rgba(7,12,26,0.92)", backdropFilter: "blur(20px)" }}>
        {/* Active crisis alert strip */}
        {activeScenarios.length > 0 && (
          <div className="alert-banner px-6" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <AlertTriangle className="h-3 w-3" />
            <span>{activeScenarios.length} Active Crisis Scenario{activeScenarios.length > 1 ? "s" : ""} Detected — Resilience Mode Active</span>
          </div>
        )}
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00c9a7, #0099cc)", boxShadow: "0 0 20px rgba(0,201,167,0.35)" }}>
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950" style={{ background: "#00c9a7", boxShadow: "0 0 6px #00c9a7" }} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #e2eaf8 30%, #00c9a7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  SUPPLYSHIELD
                </h1>
                <span className="badge badge-teal" style={{ fontSize: 8 }}>v2.4</span>
              </div>
              <p style={{ fontSize: 10, color: "#3d5070", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em", marginTop: 1 }}>
                AI-Driven Supply Chain Resilience · India Logistics Grid
              </p>
            </div>
          </div>

          {/* Telemetry strip */}
          <div className="hidden md:flex items-center gap-5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 }}>
            <div className="flex items-center gap-2" style={{ color: "#3d5070" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00c9a7", boxShadow: "0 0 6px #00c9a7" }} />
              <span>Telemetry <strong className="text-slate-300">Live</strong></span>
            </div>
            <div className="flex items-center gap-2" style={{ color: "#3d5070" }}>
              <Database className="h-3.5 w-3.5" style={{ color: "#00c9a7" }} />
              <span>DB <strong className="text-slate-300">Self-Contained</strong></span>
            </div>
            <div style={{ color: "#52688a" }}>
              <LiveClock />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-screen-2xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* KPI + Active Alerts */}
        <DashboardMetrics
          metrics={network.globalMetrics}
          activeScenarios={activeScenarios}
          onRemoveScenario={(scId) => handleToggleScenario(scId, "remove")}
          allScenarios={SCENARIOS_INFO}
        />

        {/* Map + Node Inspector */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Map */}
          <div className="xl:col-span-8">
            <MapIndia
              nodes={network.nodes}
              edges={network.edges}
              highlightedPath={highlightedPath}
              activeScenarios={activeScenarios}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                if (!nodeId) setHighlightedPath(undefined);
              }}
            />
          </div>

          {/* Node Inspector Panel */}
          <div className="xl:col-span-4 glass rounded-2xl p-5 flex flex-col" style={{ minHeight: 520 }}>
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: "1px solid rgba(28,42,75,0.7)" }}>
              <Cpu className="h-4 w-4" style={{ color: "#00c9a7" }} />
              <span className="section-label" style={{ color: "#00c9a7", fontSize: 10 }}>HUB DIAGNOSTICS</span>
            </div>

            {selectedNodeDetails ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-4"
              >
                {/* Node title + status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                      {selectedNodeDetails.name}
                    </h4>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "#6366f1", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {selectedNodeDetails.id} · {selectedNodeDetails.type}
                    </span>
                  </div>
                  <span className="badge" style={{
                    background: nodeStatusColor(selectedNodeDetails.status).bg,
                    color: nodeStatusColor(selectedNodeDetails.status).color,
                    borderColor: nodeStatusColor(selectedNodeDetails.status).border,
                  }}>
                    {selectedNodeDetails.status}
                  </span>
                </div>

                {/* Metrics rows */}
                <div className="space-y-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {[
                    { label: "Capacity", value: `${selectedNodeDetails.capacity.toLocaleString()} T` },
                    { label: "Current Load", value: `${selectedNodeDetails.currentLoad}%`, highlight: selectedNodeDetails.currentLoad > 85 },
                    { label: "Efficiency", value: `${selectedNodeDetails.efficiency}%` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span style={{ color: "#64748b" }}>{row.label}</span>
                      <span style={{ color: row.highlight ? "#fbbf24" : "#f1f5f9", fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}

                  {/* Risk score row with bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#64748b" }}>Vulnerability Risk</span>
                      <span style={{ fontWeight: 700, color: selectedNodeDetails.riskScore > 60 ? "#fb7185" : selectedNodeDetails.riskScore > 35 ? "#fbbf24" : "#34d399" }}>
                        {selectedNodeDetails.riskScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.5)" }}>
                      <div
                        className="h-full rounded-full animate-bar"
                        style={{
                          width: `${selectedNodeDetails.riskScore}%`,
                          background: selectedNodeDetails.riskScore > 60
                            ? "linear-gradient(90deg, #f43f5e, #fb923c)"
                            : selectedNodeDetails.riskScore > 35
                            ? "linear-gradient(90deg, #f59e0b, #facc15)"
                            : "linear-gradient(90deg, #10b981, #34d399)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status message */}
                <div className="mt-auto rounded-xl p-3" style={{
                  background: selectedNodeDetails.status === "disrupted" ? "rgba(244,63,94,0.08)" : "rgba(16,185,129,0.06)",
                  border: `1px solid ${selectedNodeDetails.status === "disrupted" ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.15)"}`,
                }}>
                  <p style={{ fontSize: 11, lineHeight: 1.6, color: selectedNodeDetails.status === "disrupted" ? "#fca5a5" : "#6ee7b7", fontFamily: "'Inter', sans-serif" }}>
                    {selectedNodeDetails.status === "disrupted"
                      ? "⚠ Severe operational bottleneck detected. Rerouting to nearest standby gateways is advised."
                      : "✓ Operations within baseline parameters. High-speed clearance active."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <Grid className="h-5 w-5" style={{ color: "#4f46e5" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Select a Hub Node</p>
                  <p style={{ fontSize: 10.5, color: "#475569", marginTop: 4, lineHeight: 1.5, maxWidth: 180 }}>
                    Click any terminal on the map to view live diagnostics and risk scores.
                  </p>
                </div>
              </div>
            )}

            {/* Resilience model footer */}
            <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
              <p className="section-label mb-1.5">Resilience Model Criteria</p>
              <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                Scored on route redundancy, supplier diversity, and regional safety stock buffers.
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabbed Panels ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Tab navigation */}
          <div className="flex flex-wrap gap-1 p-1 rounded-2xl w-fit" style={{ background: "rgba(11,18,36,0.8)", border: "1px solid rgba(28,42,75,0.8)", backdropFilter: "blur(12px)" }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "routes") setHighlightedPath(undefined);
                  }}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: active ? "linear-gradient(135deg, rgba(0,201,167,0.18), rgba(0,153,204,0.12))" : "transparent",
                    color: active ? "#e2eaf8" : "#3d5070",
                    border: active ? "1px solid rgba(0,201,167,0.4)" : "1px solid transparent",
                    boxShadow: active ? "0 0 16px rgba(0,201,167,0.18), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.id === "stresstest" && activeScenarios.length > 0 && (
                    <span className="flex h-1.5 w-1.5 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full opacity-75" style={{ background: "#f43f5e" }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#f43f5e" }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div key="dashboard" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <WhatIfAnalysis onRecalculateMetrics={fetchMetrics} />
                </motion.div>
              )}
              {activeTab === "predictor" && (
                <motion.div key="predictor" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <RiskPredictor nodesList={nodesList} />
                </motion.div>
              )}
              {activeTab === "stresstest" && (
                <motion.div key="stresstest" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <StressTester
                    activeScenarios={activeScenarios}
                    onToggleScenario={handleToggleScenario}
                    onClearScenarios={handleClearScenarios}
                  />
                </motion.div>
              )}
              {activeTab === "routes" && (
                <motion.div key="routes" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <RouteOptimizer
                    nodesList={nodesList}
                    onTriggerPathHighlight={(path) => setHighlightedPath(path)}
                  />
                </motion.div>
              )}
              {activeTab === "demand" && (
                <motion.div key="demand" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <DemandForecaster />
                </motion.div>
              )}
              {activeTab === "inventory" && (
                <motion.div key="inventory" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <InventoryRisk activeScenarios={activeScenarios} />
                </motion.div>
              )}
              {activeTab === "chat" && (
                <motion.div key="chat" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                  <ChatAssistant />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 flex-shrink-0 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2" style={{ borderTop: "1px solid rgba(28,42,75,0.6)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3d5070" }}>
        <span>© 2026 SupplyShield India Logistics · Critical Infrastructure Division</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00c9a7" }} />
          Secure Sovereign Environment · All simulations sandboxed
        </span>
      </footer>
    </div>
  );
}
