import React, { useState } from "react";
import { PredictRiskResult, ModelMetrics } from "../types";
import { TrendingUp, Cpu, Zap, Compass, ChevronRight, CheckCircle, Truck, Train, Plane, Ship } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RiskPredictorProps {
  nodesList: string[];
}

const TRANSPORT_ICONS: Record<string, React.ElementType> = {
  road: Truck,
  rail: Train,
  air: Plane,
  sea: Ship,
};

const TRANSPORT_COLORS: Record<string, string> = {
  road: "#6366f1",
  rail: "#f59e0b",
  air: "#06b6d4",
  sea: "#10b981",
};

export default function RiskPredictor({ nodesList }: RiskPredictorProps) {
  const [source, setSource] = useState("DELHI");
  const [destination, setDestination] = useState("MUMBAI");
  const [cargoType, setCargoType] = useState("Pharmaceuticals");
  const [transportMode, setTransportMode] = useState("road");
  const [priority, setPriority] = useState("standard");
  const [date, setDate] = useState("2026-07-15");

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictRiskResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("CatBoost");

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/predict-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination, cargoType, transportMode, priority, date }),
      });
      const resData = await response.json();
      if (resData.status === "success") {
        setPrediction(resData);
        setSelectedModel(resData.summary.optimalModel);
      }
    } catch (err) {
      console.error("Predict error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentModelData: ModelMetrics | undefined = prediction?.compareModels[selectedModel];

  const riskColor = (prob: number) => {
    if (prob >= 65) return "#f43f5e";
    if (prob >= 35) return "#f59e0b";
    return "#10b981";
  };

  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* ── Config Panel ──────────────────────────────────── */}
      <div className="lg:col-span-5 glass rounded-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div className="p-2 rounded-xl" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Cpu className="h-4 w-4" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              AI Freight Risk Classifier
            </h3>
            <p style={{ fontSize: 10.5, color: "#475569", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>
              CatBoost · XGBoost · LightGBM · Random Forest ensemble
            </p>
          </div>
        </div>

        <form onSubmit={handlePredict} className="flex-1 flex flex-col p-5 gap-4">
          {/* Source / Destination */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Origin Hub", value: source, onChange: setSource, disableVal: "" },
              { label: "Destination Hub", value: destination, onChange: setDestination, disableVal: source },
            ].map((field) => (
              <div key={field.label}>
                <label className="section-label mb-1.5 block">{field.label}</label>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="input-base"
                >
                  {nodesList.map((node) => (
                    <option key={node} value={node} disabled={node === field.disableVal}>{node}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Cargo Type */}
          <div>
            <label className="section-label mb-1.5 block">Cargo Classification</label>
            <select value={cargoType} onChange={(e) => setCargoType(e.target.value)} className="input-base">
              <option value="Pharmaceuticals">Pharmaceuticals — Critical Cold-Chain</option>
              <option value="Electronics">Electronics — High-Value Microchips</option>
              <option value="Food & Agriculture">Food & Agriculture — Perishables</option>
              <option value="Auto Parts">Automotive Machinery & Parts</option>
              <option value="Chemicals">Industrial Chemicals — Hazardous</option>
            </select>
          </div>

          {/* Transport Mode */}
          <div>
            <label className="section-label mb-2 block">Carrier Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {["road", "rail", "air", "sea"].map((mode) => {
                const Icon = TRANSPORT_ICONS[mode];
                const color = TRANSPORT_COLORS[mode];
                const active = transportMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTransportMode(mode)}
                    className="py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer"
                    style={{
                      background: active ? `${color}15` : "rgba(2,8,23,0.7)",
                      border: `1px solid ${active ? color + "50" : "rgba(51,65,85,0.5)"}`,
                      boxShadow: active ? `0 0 12px ${color}20` : "none",
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: active ? color : "#475569" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: active ? color : "#475569" }}>
                      {mode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1.5 block">Shipment Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-base">
                <option value="standard">Standard Dispatch</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical SLA Delivery</option>
              </select>
            </div>
            <div>
              <label className="section-label mb-1.5 block">Transit Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-base"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-auto w-full py-3 rounded-xl font-bold text-xs text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "1px solid rgba(99,102,241,0.4)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.25)",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "0.02em",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Zap className="h-4 w-4 animate-pulse" />
                Computing ML Simulations…
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Run ML Risk Inference
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Results Panel ─────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-5">
        <AnimatePresence mode="wait">
          {prediction ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Summary row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Radial delay probability */}
                <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3">
                  <span className="section-label" style={{ color: "#6366f1" }}>Delay Probability</span>

                  <div className="relative">
                    <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                      <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth="9" />
                      <circle
                        cx="64" cy="64" r={radius}
                        fill="none"
                        stroke={riskColor(prediction.summary.delayProbability)}
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (circumference * prediction.summary.delayProbability) / 100}
                        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 8px ${riskColor(prediction.summary.delayProbability)}80)` }}
                      />
                      <defs>
                        <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="metric-value" style={{ fontSize: 28, color: riskColor(prediction.summary.delayProbability) }}>
                        {prediction.summary.delayProbability}%
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#475569", letterSpacing: "0.08em" }}>RISK INDEX</span>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 pt-3" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
                    <div className="text-center">
                      <span className="section-label block mb-1">Expected Lag</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{prediction.summary.expectedDelayHours}h</span>
                    </div>
                    <div className="text-center">
                      <span className="section-label block mb-1">Confidence</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#34d399" }}>±{prediction.summary.confidenceLevel}%</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Algorithm */}
                <div className="glass rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="section-label" style={{ color: "#10b981" }}>Optimal Algorithm</span>
                    <span className="badge badge-emerald">Best Fit</span>
                  </div>

                  <div>
                    <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                      {prediction.summary.optimalModel}
                    </h4>
                    <p style={{ fontSize: 10.5, color: "#64748b", lineHeight: 1.6, marginTop: 6, fontFamily: "'Inter', sans-serif" }}>
                      Highest validation accuracy on historical monsoon and festival anomalies for the{" "}
                      <strong style={{ color: "#94a3b8" }}>{source} → {destination}</strong> corridor.
                    </p>
                  </div>

                  <div className="space-y-2 pt-3" style={{ borderTop: "1px solid rgba(51,65,85,0.4)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {[
                      { label: "Ensemble Accuracy", value: "92.4% AUC" },
                      { label: "Forest Depth", value: "12 Layers" },
                      { label: "Estimators", value: "1,500 Trees" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span style={{ color: "#475569" }}>{r.label}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model benchmarking */}
              <div className="glass rounded-2xl p-5 space-y-4">
                <span className="section-label">Model Benchmarking</span>

                {/* Model tabs */}
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(prediction.compareModels).map((mKey) => {
                    const m = prediction.compareModels[mKey];
                    const active = selectedModel === mKey;
                    const isOptimal = mKey === prediction.summary.optimalModel;
                    return (
                      <button
                        key={mKey}
                        onClick={() => setSelectedModel(mKey)}
                        className="rounded-xl p-3 text-left cursor-pointer transition-all duration-150 relative"
                        style={{
                          background: active ? "rgba(99,102,241,0.12)" : "rgba(2,8,23,0.5)",
                          border: `1px solid ${active ? "rgba(99,102,241,0.4)" : "rgba(51,65,85,0.4)"}`,
                          boxShadow: active ? "0 0 16px rgba(99,102,241,0.15)" : "none",
                        }}
                      >
                        {isOptimal && (
                          <span className="absolute -top-1.5 -right-1.5">
                            <CheckCircle className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
                          </span>
                        )}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: active ? "#a5b4fc" : "#64748b", display: "block" }}>{mKey}</span>
                        <span style={{ fontSize: 9, color: "#334155", display: "block", marginTop: 2 }}>Acc: {m.accuracy}%</span>
                      </button>
                    );
                  })}
                </div>

                {/* Model detail */}
                {currentModelData && (
                  <motion.div
                    key={selectedModel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1"
                  >
                    {/* Stats */}
                    <div className="space-y-3">
                      <span className="section-label" style={{ color: "#6366f1" }}>Model Estimates — {selectedModel}</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { label: "Probability", value: `${currentModelData.probability}%`, color: riskColor(currentModelData.probability) },
                          { label: "Predicted Lag", value: `${currentModelData.predictedDelayHours}h`, color: "#f1f5f9" },
                          { label: "Confidence", value: `${currentModelData.confidence}%`, color: "#34d399" },
                          {
                            label: "Risk Severity",
                            value: currentModelData.riskCategory,
                            color: currentModelData.riskCategory === "HIGH" ? "#fb7185" : currentModelData.riskCategory === "MEDIUM" ? "#fbbf24" : "#34d399",
                          },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-xl p-3" style={{ background: "rgba(2,8,23,0.6)", border: "1px solid rgba(51,65,85,0.4)" }}>
                            <span className="section-label block mb-1">{stat.label}</span>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feature Importance */}
                    <div className="space-y-3">
                      <span className="section-label" style={{ color: "#6366f1" }}>Feature Importance</span>
                      <div className="space-y-2.5">
                        {Object.entries(currentModelData.featureImportance).map(([fKey, fWeight]) => (
                          <div key={fKey}>
                            <div className="flex items-center justify-between mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 }}>
                              <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{fKey}</span>
                              <span style={{ color: "#6366f1", fontWeight: 600 }}>{fWeight}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.4)" }}>
                              <div
                                className="h-full rounded-full animate-bar"
                                style={{ width: `${fWeight}%`, background: "linear-gradient(90deg, #4f46e5, #06b6d4)" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl flex flex-col items-center justify-center text-center p-8 gap-5"
              style={{ minHeight: 420 }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <Compass className="h-7 w-7" style={{ color: "#4f46e5" }} />
              </div>
              <div>
                <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>Awaiting ML Simulation</h4>
                <p style={{ fontSize: 11, color: "#334155", marginTop: 6, maxWidth: 300, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                  Configure shipping coordinates, cargo classifications, and carrier modes to compute neural risk indexes across all models.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
