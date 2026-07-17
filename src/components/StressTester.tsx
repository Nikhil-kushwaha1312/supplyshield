import React, { useEffect, useState } from "react";
import { Recommendation } from "../types";
import { Shield, Activity, Zap, Navigation, AlertTriangle, CheckCircle, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StressTesterProps {
  activeScenarios: string[];
  onToggleScenario: (scenarioId: string, action: "add" | "remove") => void;
  onClearScenarios: () => void;
}

const SCENARIOS_DEF = [
  { id: "FLOOD", name: "Monsoon Flood", icon: "🌧️", region: "Mumbai & West Coast", desc: "Arterial highway floods & rail cargo disruption." },
  { id: "CYCLONE", name: "East Coast Cyclone", icon: "🌀", region: "Kolkata & Chennai Ports", desc: "Bay of Bengal storms halting maritime terminals." },
  { id: "RAIL_STRIKE", name: "Railway Union Strike", icon: "🪧", region: "Nationwide Rail Network", desc: "Labor shutdowns stopping all freight trains." },
  { id: "PORT_CLOSURE", name: "JNPT Cyber Attack", icon: "💻", region: "Mumbai Port Complex", desc: "Ransomware locking custom clearing terminals." },
  { id: "FUEL_SHORTAGE", name: "Diesel Shortage", icon: "⛽", region: "Nationwide Logistics", desc: "Crude supply spikes forcing premium fuel rationing." },
  { id: "PANDEMIC", name: "Pandemic Lockdown", icon: "😷", region: "Metro Transit Corridors", desc: "Inter-state border checks, labor shortages." },
  { id: "EARTHQUAKE", name: "Himalayan Earthquake", icon: "🌋", region: "Delhi & North India", desc: "Structural damage to highway flyovers." },
  { id: "HIGHWAY_BLOCKAGE", name: "NH48 Landslide", icon: "🚧", region: "West/North-East Routes", desc: "Mass blockades forcing extreme detours." },
  { id: "WAREHOUSE_SHUTDOWN", name: "Guwahati Hub Emergency", icon: "🏢", region: "Guwahati Depot", desc: "Safety inspection choking North-East lines." },
  { id: "DEMAND_SURGE", name: "Diwali Festival Surge", icon: "⚡", region: "All Metro Hubs", desc: "E-commerce spike choking sorting facilities." },
  { id: "SUPPLIER_BANKRUPTCY", name: "Semiconductor Solvency", icon: "📉", region: "Bengaluru Tech Hub", desc: "Primary hardware supplier files for bankruptcy." },
];

const REC_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  INVENTORY: { bg: "rgba(245,158,11,0.08)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "Inventory" },
  ROUTE: { bg: "rgba(217,70,239,0.08)", text: "#e879f9", border: "rgba(217,70,239,0.25)", label: "Route" },
  SUPPLIER: { bg: "rgba(6,182,212,0.08)", text: "#67e8f9", border: "rgba(6,182,212,0.25)", label: "Supplier" },
  GENERAL: { bg: "rgba(99,102,241,0.08)", text: "#a5b4fc", border: "rgba(99,102,241,0.25)", label: "General" },
};

export default function StressTester({ activeScenarios, onToggleScenario, onClearScenarios }: StressTesterProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai-recommendations");
      const resData = await response.json();
      if (resData.status === "success") setRecommendations(resData.recommendations);
    } catch (err) {
      console.error("Recommendations fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecommendations(); }, [activeScenarios]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* ── Scenario Grid ──────────────────────────────────── */}
      <div className="xl:col-span-7 glass rounded-2xl">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
              <Activity className="h-4 w-4" style={{ color: "#fb7185" }} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                Disaster & Risk Injection Simulator
              </h3>
              <p style={{ fontSize: 10.5, color: "#475569", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>
                Toggle stress anomalies to dynamically model supply chain multipliers
              </p>
            </div>
          </div>
          {activeScenarios.length > 0 && (
            <button
              onClick={onClearScenarios}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150"
              style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185", fontFamily: "'JetBrains Mono', monospace" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.1)"; }}
            >
              <X className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SCENARIOS_DEF.map((sc, idx) => {
            const isActive = activeScenarios.includes(sc.id);
            return (
              <motion.button
                key={sc.id}
                onClick={() => onToggleScenario(sc.id, isActive ? "remove" : "add")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-xl p-3.5 text-left flex flex-col gap-2.5 cursor-pointer transition-all duration-200"
                style={{
                  background: isActive ? "rgba(244,63,94,0.07)" : "rgba(2,8,23,0.5)",
                  border: `1px solid ${isActive ? "rgba(244,63,94,0.35)" : "rgba(51,65,85,0.5)"}`,
                  boxShadow: isActive ? "0 0 16px rgba(244,63,94,0.12)" : "none",
                }}
              >
                <div className="flex items-start justify-between">
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{sc.icon}</span>
                  {isActive ? (
                    <span className="relative flex h-2 w-2 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f43f5e" }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#f43f5e" }} />
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full mt-1" style={{ background: "rgba(51,65,85,0.5)" }} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11.5, fontWeight: 700, color: isActive ? "#fca5a5" : "#e2e8f0", letterSpacing: "-0.01em" }}>
                    {sc.name}
                  </h4>
                  <span className="badge mt-1" style={{ background: "rgba(51,65,85,0.3)", color: "#475569", borderColor: "transparent", fontSize: 8 }}>
                    {sc.region}
                  </span>
                  <p style={{ fontSize: 10, color: isActive ? "#f87171" : "#475569", marginTop: 5, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                    {sc.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── AI Recommendations ─────────────────────────────── */}
      <div className="xl:col-span-5 glass rounded-2xl flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <Shield className="h-4 w-4" style={{ color: "#34d399" }} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                Resilience Advisory
              </h3>
              <p style={{ fontSize: 10.5, color: "#475569", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>Real-time AI mitigation recommendations</p>
            </div>
          </div>
          {loading && <RefreshCw className="h-4 w-4 animate-spin" style={{ color: "#475569" }} />}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => {
                const colors = REC_COLORS[rec.type] || REC_COLORS.GENERAL;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl p-3.5 relative overflow-hidden"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: colors.text }} />

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="badge" style={{ background: `${colors.text}18`, color: colors.text, borderColor: `${colors.text}40` }}>
                        {colors.label}
                      </span>
                      {rec.savings > 0 && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: "#34d399" }}>
                          ₹{rec.savings.toLocaleString()} saved
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12.5, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                      {rec.title}
                    </h4>
                    <p style={{ fontSize: 10.5, color: "#64748b", lineHeight: 1.6, marginTop: 5, fontFamily: "'Inter', sans-serif" }}>{rec.details}</p>

                    <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(2,8,23,0.4)", border: "1px solid rgba(51,65,85,0.3)" }}>
                      <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#34d399" }} />
                      <span style={{ fontSize: 10.5, color: "#6ee7b7", fontFamily: "'JetBrains Mono', monospace" }}>{rec.impact}</span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <CheckCircle className="h-6 w-6" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Environment Stable</p>
                  <p style={{ fontSize: 10.5, color: "#334155", marginTop: 4, maxWidth: 220, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                    No active stresses. Baseline redundancy and standard inventory levels are sufficient.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#334155" }} />
          <span style={{ fontSize: 9.5, color: "#334155", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
            AI maps alternative sourcing via Dijkstra & ARIMA forecast bounds
          </span>
        </div>
      </div>
    </div>
  );
}
