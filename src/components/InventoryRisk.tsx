import React, { useEffect, useState } from "react";
import { InventoryItem } from "../types";
import { Layers, AlertTriangle, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface InventoryRiskProps {
  activeScenarios: string[];
}

function MiniGauge({ value, color }: { value: number; color: string }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const half = circumference / 2;
  return (
    <svg width="36" height="20" viewBox="0 0 36 20">
      <path
        d={`M 2 18 A ${radius} ${radius} 0 0 1 34 18`}
        fill="none"
        stroke="rgba(51,65,85,0.4)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M 2 18 A ${radius} ${radius} 0 0 1 34 18`}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={half}
        strokeDashoffset={half - (half * Math.min(value, 100)) / 100}
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

export default function InventoryRisk({ activeScenarios }: InventoryRiskProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory-analysis");
      const resData = await response.json();
      if (resData.status === "success") setItems(resData.data);
    } catch (err) {
      console.error("Inventory error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [activeScenarios]);

  const statusConfig = {
    CRITICAL_LOW: {
      icon: AlertCircle,
      iconColor: "#fb7185",
      label: "High Stock-Out Threat",
      barColor: "linear-gradient(90deg, #f43f5e, #fb923c)",
      topBorder: "#f43f5e",
      bg: "rgba(244,63,94,0.05)",
      border: "rgba(244,63,94,0.2)",
      badge: { bg: "rgba(244,63,94,0.1)", text: "#fb7185", border: "rgba(244,63,94,0.3)" },
    },
    OVERSTOCKED: {
      icon: AlertTriangle,
      iconColor: "#fbbf24",
      label: "Storage Capacity Alert",
      barColor: "linear-gradient(90deg, #f59e0b, #facc15)",
      topBorder: "#f59e0b",
      bg: "rgba(245,158,11,0.05)",
      border: "rgba(245,158,11,0.2)",
      badge: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
    },
    NORMAL: {
      icon: CheckCircle,
      iconColor: "#34d399",
      label: "Optimal Stock Buffer",
      barColor: "linear-gradient(90deg, #10b981, #34d399)",
      topBorder: "#10b981",
      bg: "rgba(15,23,42,0.5)",
      border: "rgba(51,65,85,0.5)",
      badge: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.3)" },
    },
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Layers className="h-4 w-4" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              Regional Warehouse & Inventory Diagnostics
            </h3>
            <p style={{ fontSize: 10.5, color: "#475569", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>
              Real-time stock-out and overflow risk, dynamically calculated from what-if parameters
            </p>
          </div>
        </div>
        {loading && <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: "#475569" }} />}
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const statusKey = (item.status as keyof typeof statusConfig) in statusConfig ? item.status as keyof typeof statusConfig : "NORMAL";
            const cfg = statusConfig[statusKey];
            const StatusIcon = cfg.icon;
            const fillPct = Math.min(100, (item.currentInventory / item.recommendedInventory) * 70);

            return (
              <motion.div
                key={item.nodeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-2xl flex flex-col relative overflow-hidden"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  paddingTop: "3px",
                }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${cfg.topBorder}90, transparent)` }} />

                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12.5, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                        {item.nodeName}
                      </h4>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#6366f1", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {item.nodeId} Depot
                      </span>
                    </div>
                    <span
                      className="badge flex-shrink-0"
                      style={{ background: cfg.badge.bg, color: cfg.badge.text, borderColor: cfg.badge.border, fontSize: 7.5 }}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Stock bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                      <span style={{ color: "#475569" }}>Active Load</span>
                      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{item.currentInventory.toLocaleString()} T</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.4)" }}>
                      <div
                        className="h-full rounded-full animate-bar"
                        style={{ width: `${fillPct}%`, background: cfg.barColor }}
                      />
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="space-y-1.5 pt-2" style={{ borderTop: "1px solid rgba(51,65,85,0.3)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 }}>
                    {[
                      { label: "Safety Stock", value: `${item.safetyStock.toLocaleString()} T` },
                      { label: "Reorder Point", value: `${item.reorderPoint.toLocaleString()} T` },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <span style={{ color: "#475569" }}>{row.label}</span>
                        <span style={{ color: "#e2e8f0" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mini gauges row */}
                  <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: "1px solid rgba(51,65,85,0.3)" }}>
                    <div className="text-center">
                      <MiniGauge value={item.stockOutProbability} color={item.stockOutProbability > 50 ? "#f43f5e" : "#10b981"} />
                      <span className="section-label block" style={{ fontSize: 8 }}>Stock-Out</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: item.stockOutProbability > 50 ? "#fb7185" : "#e2e8f0" }}>
                        {item.stockOutProbability}%
                      </span>
                    </div>
                    <div className="text-center">
                      <MiniGauge value={item.overstockProbability} color={item.overstockProbability > 50 ? "#f59e0b" : "#10b981"} />
                      <span className="section-label block" style={{ fontSize: 8 }}>Overstock</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: item.overstockProbability > 50 ? "#fbbf24" : "#e2e8f0" }}>
                        {item.overstockProbability}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status footer */}
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ borderTop: `1px solid ${cfg.border}`, background: `${cfg.topBorder}08` }}
                >
                  <StatusIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cfg.iconColor }} />
                  <span style={{ fontSize: 9.5, color: cfg.iconColor, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{cfg.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
