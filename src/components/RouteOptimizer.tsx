import React, { useState } from "react";
import { RouteOptimizationResult } from "../types";
import { Navigation, Compass, ChevronRight, Zap, Timer, DollarSign, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RouteOptimizerProps {
  nodesList: string[];
  onTriggerPathHighlight: (path: string[] | undefined) => void;
}

const METRIC_OPTIONS = [
  { id: "time", label: "Transit Speed", desc: "Shortest transit time", icon: Timer, color: "#6366f1" },
  { id: "cost", label: "Freight Cost", desc: "Lowest budget route", icon: DollarSign, color: "#10b981" },
  { id: "distance", label: "Distance", desc: "Direct highway miles", icon: Ruler, color: "#f59e0b" },
];

function PathChip({ node, role }: { node: string; role?: "origin" | "dest" | "mid" }) {
  const colors = {
    origin: { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)", text: "#a5b4fc" },
    dest: { bg: "rgba(217,70,239,0.15)", border: "rgba(217,70,239,0.4)", text: "#e879f9" },
    mid: { bg: "rgba(51,65,85,0.3)", border: "rgba(51,65,85,0.5)", text: "#94a3b8" },
  };
  const c = colors[role ?? "mid"];
  return (
    <span
      className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontFamily: "'JetBrains Mono', monospace" }}
    >
      {node}
    </span>
  );
}

export default function RouteOptimizer({ nodesList, onTriggerPathHighlight }: RouteOptimizerProps) {
  const [source, setSource] = useState("DELHI");
  const [destination, setDestination] = useState("CHENNAI");
  const [metric, setMetric] = useState("time");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/route-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination, optimizationMetric: metric }),
      });
      const resData = await response.json();
      if (resData.status === "success") {
        setResult(resData);
        onTriggerPathHighlight(resData.dijkstra.path);
      }
    } catch (err) {
      console.error("Optimize error:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeMetric = METRIC_OPTIONS.find((m) => m.id === metric)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ── Config Panel ─────────────────────────────────── */}
      <div className="lg:col-span-5 glass rounded-2xl flex flex-col">
        <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div className="p-2 rounded-xl" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <Compass className="h-4 w-4" style={{ color: "#c4b5fd" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              Multi-Criteria Pathfinding
            </h3>
            <p style={{ fontSize: 10.5, color: "#475569", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>
              Dijkstra · A* Heuristic · Genetic TSP
            </p>
          </div>
        </div>

        <form onSubmit={handleOptimize} className="flex-1 flex flex-col p-5 gap-4">
          {/* Nodes */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Origin", value: source, set: setSource, disable: "" },
              { label: "Terminus", value: destination, set: setDestination, disable: source },
            ].map((f) => (
              <div key={f.label}>
                <label className="section-label mb-1.5 block">{f.label}</label>
                <select value={f.value} onChange={(e) => f.set(e.target.value)} className="input-base">
                  {nodesList.map((n) => (
                    <option key={n} value={n} disabled={n === f.disable}>{n}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Optimization Goal */}
          <div>
            <label className="section-label mb-2 block">Optimization Goal</label>
            <div className="grid grid-cols-3 gap-2">
              {METRIC_OPTIONS.map((item) => {
                const Icon = item.icon;
                const active = metric === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMetric(item.id)}
                    className="p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-150 cursor-pointer"
                    style={{
                      background: active ? `${item.color}12` : "rgba(2,8,23,0.6)",
                      border: `1px solid ${active ? item.color + "45" : "rgba(51,65,85,0.5)"}`,
                      boxShadow: active ? `0 0 14px ${item.color}20` : "none",
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: active ? item.color : "#475569" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", color: active ? item.color : "#475569", textAlign: "center", lineHeight: 1.3 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-auto w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #7c3aed, #c026d3)",
              border: "1px solid rgba(139,92,246,0.4)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(139,92,246,0.25)",
              fontFamily: "'Space Grotesk', sans-serif",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <><Zap className="h-4 w-4 animate-pulse" /> Computing Route Polynomials…</>
            ) : (
              <><Navigation className="h-4 w-4" /> Execute Multi-Model Resolver</>
            )}
          </button>

          <p style={{ fontSize: 9.5, color: "#334155", fontFamily: "'JetBrains Mono', monospace", textAlign: "center", lineHeight: 1.5 }}>
            Dijkstra O(V²+E) · A* Haversine heuristic · Genetic TSP mutations
          </p>
        </form>
      </div>

      {/* ── Results Panel ────────────────────────────────── */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Dijkstra + A* comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dijkstra */}
                <div className="glass rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="section-label" style={{ color: "#c4b5fd" }}>Dijkstra Model</span>
                    <span className="badge badge-violet">Guaranteed Shortest</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                      {result.dijkstra.cost.toLocaleString()}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748b" }}>{result.dijkstra.metricLabel}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#475569" }}>Complexity: O(V² + E)</div>
                  <div className="pt-2" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
                    <span className="section-label block mb-2">Path Sequence</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {result.dijkstra.path.map((node, idx) => (
                        <React.Fragment key={node}>
                          {idx > 0 && <ChevronRight className="h-3 w-3" style={{ color: "#334155" }} />}
                          <PathChip
                            node={node}
                            role={idx === 0 ? "origin" : idx === result.dijkstra.path.length - 1 ? "dest" : "mid"}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* A* */}
                <div className="glass rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="section-label" style={{ color: "#67e8f9" }}>A* Heuristic</span>
                    <span className="badge badge-emerald">Superior Speed</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                      {result.aStar.cost.toLocaleString()}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748b" }}>{result.dijkstra.metricLabel}</span>
                  </div>
                  <div className="space-y-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                    <div className="flex justify-between">
                      <span style={{ color: "#475569" }}>Evaluated Nodes</span>
                      <span style={{ color: "#34d399", fontWeight: 700 }}>{result.aStar.visitedNodes} hops</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#475569" }}>Heuristic</span>
                      <span style={{ color: "#e2e8f0" }}>Haversine GC</span>
                    </div>
                  </div>
                  <div className="pt-2" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
                    <span className="section-label block mb-2">Interpolated Path</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {result.aStar.path.map((node, idx) => (
                        <React.Fragment key={node}>
                          {idx > 0 && <ChevronRight className="h-3 w-3" style={{ color: "#334155" }} />}
                          <PathChip
                            node={node}
                            role={idx === 0 ? "origin" : idx === result.aStar.path.length - 1 ? "dest" : "mid"}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Genetic TSP */}
              <div className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="section-label" style={{ color: "#e879f9" }}>Genetic Cyclical Sweep (TSP)</span>
                  <span className="badge badge-violet">12 Generations</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tour path */}
                  <div className="space-y-2">
                    <span className="section-label block">Mutation & Crossover Tour</span>
                    <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                      Optimal sweeping tour starting and returning to{" "}
                      <strong style={{ color: "#94a3b8" }}>{source}</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {result.geneticTSP.path.map((node, idx) => (
                        <React.Fragment key={`${node}-${idx}`}>
                          {idx > 0 && <ChevronRight className="h-2.5 w-2.5" style={{ color: "#334155" }} />}
                          <PathChip
                            node={node}
                            role={idx === 0 || idx === result.geneticTSP.path.length - 1 ? "dest" : "mid"}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Convergence Chart */}
                  <div>
                    <span className="section-label block mb-3">Convergence Curve (km)</span>
                    <div className="flex items-end gap-1 h-24 border-l border-b" style={{ borderColor: "rgba(51,65,85,0.4)" }}>
                      {result.geneticTSP.generationsHistory.map((g, idx) => {
                        const maxDist = Math.max(...result.geneticTSP.generationsHistory.map((h) => h.bestDistance));
                        const minDist = Math.min(...result.geneticTSP.generationsHistory.map((h) => h.bestDistance));
                        const heightPct = maxDist === minDist ? 80 : ((maxDist - g.bestDistance) / (maxDist - minDist)) * 75 + 15;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group cursor-pointer">
                            <div
                              className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-100"
                              style={{
                                height: `${heightPct}%`,
                                background: "linear-gradient(to top, rgba(217,70,239,0.5), rgba(139,92,246,0.8))",
                                opacity: 0.7,
                              }}
                              title={`Gen ${g.gen}: ${Math.round(g.bestDistance)} km`}
                            />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: "#334155" }}>G{g.gen}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl flex flex-col items-center justify-center text-center p-8 gap-5"
              style={{ minHeight: 420 }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <Compass className="h-7 w-7" style={{ color: "#7c3aed" }} />
              </div>
              <div>
                <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>Awaiting Pathfinding Constraints</h4>
                <p style={{ fontSize: 11, color: "#334155", marginTop: 6, maxWidth: 300, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                  Define source and destination, then execute to compute multi-model route curves and highlight optimal tracks on the map.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
