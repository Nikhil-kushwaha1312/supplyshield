import React, { useState } from "react";
import { Sliders, Check, HelpCircle, TrendingUp, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

interface WhatIfAnalysisProps {
  onRecalculateMetrics: () => void;
}

interface SliderCardProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displaySuffix: string;
  description: string;
  accentColor: string;
  onChange: (val: number) => void;
}

function SliderCard({ label, hint, value, min, max, step = 1, displaySuffix, description, accentColor, onChange }: SliderCardProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(2,8,23,0.6)", border: "1px solid rgba(51,65,85,0.5)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>{label}</span>
          <span title={hint} className="cursor-help">
            <HelpCircle className="h-3.5 w-3.5" style={{ color: "#334155" }} />
          </span>
        </div>
        <span className="metric-value" style={{ fontSize: 18, color: accentColor }}>
          {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}{displaySuffix}
        </span>
      </div>

      {/* Custom range with gradient fill */}
      <div className="relative py-1">
        <div className="w-full h-1 rounded-full" style={{ background: "rgba(51,65,85,0.5)" }}>
          <div className="h-full rounded-full transition-all duration-150" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ margin: 0 }}
        />
        {/* Thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 pointer-events-none transition-all duration-150"
          style={{ left: `calc(${pct}% - 7px)`, background: "white", borderColor: accentColor, boxShadow: `0 0 8px ${accentColor}80` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#334155" }}>{min}{displaySuffix}</span>
        <p style={{ fontSize: 9.5, color: "#475569", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>{description}</p>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#334155" }}>{max}{displaySuffix}</span>
      </div>
    </div>
  );
}

export default function WhatIfAnalysis({ onRecalculateMetrics }: WhatIfAnalysisProps) {
  const [supplierDiversity, setSupplierDiversity] = useState(65);
  const [safetyStockMultiplier, setSafetyStockMultiplier] = useState(1.0);
  const [alternateRouteReady, setAlternateRouteReady] = useState(false);
  const [emergencyBudgetBuffer, setEmergencyBudgetBuffer] = useState(20);
  const [isSaving, setIsSaving] = useState(false);

  const triggerRecalculate = async (sDiv: number, sStock: number, aRoute: boolean, eBudget: number) => {
    try {
      setIsSaving(true);
      await fetch("/api/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierDiversity: sDiv, safetyStockMultiplier: sStock, alternateRouteReady: aRoute, emergencyBudgetBuffer: eBudget }),
      });
      onRecalculateMetrics();
    } catch (err) {
      console.error("What-If post error:", err);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: "rgba(217,70,239,0.12)", border: "1px solid rgba(217,70,239,0.2)" }}>
            <Sliders className="h-4 w-4" style={{ color: "#d946ef" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              What-If Policy Simulator
            </h3>
            <p style={{ fontSize: 10.5, color: "#475569", fontFamily: "'Inter', sans-serif", marginTop: 1 }}>
              Calibrate resilience variables to compute real-time impact on network metrics
            </p>
          </div>
        </div>

        {isSaving && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Zap className="h-3.5 w-3.5 animate-pulse" style={{ color: "#818cf8" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#818cf8", fontWeight: 600 }}>Recalculating…</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Diversity */}
          <SliderCard
            label="Supplier Diversity"
            hint="Diversification ratio of sourcing vital raw inputs across regional states"
            value={supplierDiversity}
            min={20} max={100}
            displaySuffix="%"
            description="Buffers supplier bankruptcies"
            accentColor="#d946ef"
            onChange={(v) => { setSupplierDiversity(v); triggerRecalculate(v, safetyStockMultiplier, alternateRouteReady, emergencyBudgetBuffer); }}
          />

          {/* Safety Stock */}
          <SliderCard
            label="Safety Stock Calibration"
            hint="Multiplier applied to standard stock guidelines across regional warehouses"
            value={safetyStockMultiplier}
            min={0.5} max={2.5} step={0.1}
            displaySuffix="×"
            description="Higher stock cushions delays"
            accentColor="#6366f1"
            onChange={(v) => { setSafetyStockMultiplier(v); triggerRecalculate(supplierDiversity, v, alternateRouteReady, emergencyBudgetBuffer); }}
          />

          {/* Emergency Budget */}
          <SliderCard
            label="Contingency Reserve Funds"
            hint="Financial emergency buffer for expediting urgent cargo"
            value={emergencyBudgetBuffer}
            min={5} max={50}
            displaySuffix="%"
            description="Offsets route failure premiums"
            accentColor="#f59e0b"
            onChange={(v) => { setEmergencyBudgetBuffer(v); triggerRecalculate(supplierDiversity, safetyStockMultiplier, alternateRouteReady, v); }}
          />

          {/* Alternate Route Toggle */}
          <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: "rgba(2,8,23,0.6)", border: "1px solid rgba(51,65,85,0.5)" }}>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>Active Standby Corridors</span>
              </div>
              <p style={{ fontSize: 9.5, color: "#475569", fontFamily: "'Inter', sans-serif" }}>
                Parallel sea and rail agreements bypass flood closures
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="h-3.5 w-3.5" style={{ color: alternateRouteReady ? "#10b981" : "#334155" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: alternateRouteReady ? "#34d399" : "#475569", fontWeight: 600 }}>
                  {alternateRouteReady ? "STANDBY ENGAGED" : "STANDBY INACTIVE"}
                </span>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => {
                const val = !alternateRouteReady;
                setAlternateRouteReady(val);
                triggerRecalculate(supplierDiversity, safetyStockMultiplier, val, emergencyBudgetBuffer);
              }}
              className="flex-shrink-0 cursor-pointer"
            >
              <div
                className="relative w-12 h-6 rounded-full transition-all duration-250"
                style={{
                  background: alternateRouteReady ? "rgba(16,185,129,0.25)" : "rgba(15,23,42,0.8)",
                  border: `1px solid ${alternateRouteReady ? "rgba(16,185,129,0.5)" : "rgba(51,65,85,0.7)"}`,
                  boxShadow: alternateRouteReady ? "0 0 12px rgba(16,185,129,0.3)" : "none",
                }}
              >
                <motion.div
                  animate={{ x: alternateRouteReady ? 26 : 3 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "white", boxShadow: alternateRouteReady ? "0 0 8px rgba(16,185,129,0.7)" : "0 1px 3px rgba(0,0,0,0.5)" }}
                >
                  {alternateRouteReady && <Check className="h-2.5 w-2.5" style={{ color: "#10b981" }} />}
                </motion.div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
