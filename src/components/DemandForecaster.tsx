import React, { useEffect, useState } from "react";
import { CategoryForecast } from "../types";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from "recharts";
import { BarChart2, RefreshCw, Zap, ChevronRight, Brain } from "lucide-react";
import { motion } from "motion/react";

const MODEL_META = {
  LSTM: { label: "LSTM Neurons", acc: "94.2%", sub: "Deep Learning RNN", color: "#6366f1" },
  Prophet: { label: "Prophet", acc: "91.8%", sub: "Additive Seasonality", color: "#10b981" },
  ARIMA: { label: "ARIMA Lag", acc: "84.5%", sub: "Autoregressive MA", color: "#f59e0b" },
};

/* Custom tooltip */
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-xl" style={{ background: "rgba(2,8,23,0.95)", border: "1px solid rgba(51,65,85,0.6)", backdropFilter: "blur(12px)" }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#64748b", marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2" style={{ marginBottom: 2 }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color as string }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#94a3b8" }}>{entry.name}:</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value} T
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DemandForecaster() {
  const [forecasts, setForecasts] = useState<Record<string, CategoryForecast> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Pharmaceuticals");
  const [selectedModel, setSelectedModel] = useState<"LSTM" | "Prophet" | "ARIMA">("LSTM");
  const [loading, setLoading] = useState(false);

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/demand-forecast");
      const resData = await response.json();
      if (resData.status === "success") setForecasts(resData.data);
    } catch (err) {
      console.error("Forecast fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForecasts(); }, []);

  if (!forecasts) {
    return (
      <div className="glass rounded-2xl h-96 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-7 w-7 animate-spin" style={{ color: "#475569" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#475569" }}>Computing forecasting algorithms…</span>
      </div>
    );
  }

  const catData = forecasts[selectedCategory];
  const modelAccuracies = catData?.modelAccuracies ?? { LSTM: 0, Prophet: 0, ARIMA: 0 };
  const activeModelMeta = MODEL_META[selectedModel];

  // Build chart data
  const chartData: any[] = [];
  if (catData) {
    catData.historical.forEach((pt) => chartData.push({ month: pt.month, Actual: pt.actual, LSTM: null, Prophet: null, ARIMA: null }));
    catData.predictions.forEach((pt) => chartData.push({ month: pt.month, Actual: null, LSTM: pt.LSTM, Prophet: pt.Prophet, ARIMA: pt.ARIMA }));
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* ── Selector Panel ────────────────────────────────── */}
      <div className="xl:col-span-4 glass rounded-2xl flex flex-col">
        <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div className="p-2 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <BarChart2 className="h-4 w-4" style={{ color: "#34d399" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
              Demand Forecast
            </h3>
            <p style={{ fontSize: 10.5, color: "#475569", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>
              6-month predictive interpolation
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-5">
          {/* Category selector */}
          <div>
            <label className="section-label mb-2 block">Product Class</label>
            <div className="space-y-1.5">
              {Object.keys(forecasts).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all duration-150"
                    style={{
                      background: active ? "rgba(16,185,129,0.1)" : "rgba(2,8,23,0.5)",
                      border: `1px solid ${active ? "rgba(16,185,129,0.35)" : "rgba(51,65,85,0.4)"}`,
                      boxShadow: active ? "0 0 12px rgba(16,185,129,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#6ee7b7" : "#94a3b8" }}>{cat}</span>
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: active ? "#34d399" : "#334155" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model selector */}
          <div>
            <label className="section-label mb-2 block">Forecasting Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(["LSTM", "Prophet", "ARIMA"] as const).map((m) => {
                const meta = MODEL_META[m];
                const active = selectedModel === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className="rounded-xl p-2.5 text-center cursor-pointer transition-all duration-150"
                    style={{
                      background: active ? `${meta.color}12` : "rgba(2,8,23,0.5)",
                      border: `1px solid ${active ? meta.color + "40" : "rgba(51,65,85,0.4)"}`,
                      boxShadow: active ? `0 0 12px ${meta.color}18` : "none",
                    }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: active ? meta.color : "#64748b", display: "block" }}>{m}</span>
                    <span style={{ fontSize: 8.5, color: "#334155", display: "block", marginTop: 2 }}>
                      {modelAccuracies[m]}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Model info footer */}
        <div className="px-4 py-3.5 space-y-1" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" style={{ color: activeModelMeta.color }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: activeModelMeta.color }}>{activeModelMeta.label}</span>
          </div>
          <p style={{ fontSize: 9.5, color: "#334155", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
            LSTM fits non-linear e-commerce spikes · Prophet targets multi-season holidays · ARIMA processes linear regressions
          </p>
        </div>
      </div>

      {/* ── Chart Panel ──────────────────────────────────── */}
      <div className="xl:col-span-8 glass rounded-2xl flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
          <div>
            <span className="section-label">{selectedCategory} — Historical & 6-Month Forecast</span>
            <p style={{ fontSize: 10.5, color: "#475569", marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
              Demand in Tons · Forecast horizon starts at Dec
            </p>
          </div>
          <div className="flex items-center gap-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
              <span style={{ color: "#475569" }}>Actual</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 rounded-full" style={{ background: activeModelMeta.color }} />
              <span style={{ color: "#475569" }}>Forecast</span>
            </span>
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeModelMeta.color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={activeModelMeta.color} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.25)" vertical={false} />
                <XAxis dataKey="month" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" />
                <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  x="Dec"
                  stroke="rgba(244,63,94,0.5)"
                  strokeDasharray="4 4"
                  label={{ value: "Forecast T-0", fill: "#f43f5e", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", position: "insideTopRight" }}
                />
                <Area
                  name="Actual Demand"
                  type="monotone"
                  dataKey="Actual"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#actualGrad)"
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#10b981", stroke: "rgba(16,185,129,0.3)", strokeWidth: 4 }}
                  connectNulls={false}
                />
                <Area
                  name={`${selectedModel} Forecast`}
                  type="monotone"
                  dataKey={selectedModel}
                  stroke={activeModelMeta.color}
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  fill="url(#forecastGrad)"
                  dot={{ r: 3, fill: activeModelMeta.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: activeModelMeta.color, stroke: `${activeModelMeta.color}50`, strokeWidth: 4 }}
                  connectNulls={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Model stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}>
            {(["LSTM", "Prophet", "ARIMA"] as const).map((m) => {
              const meta = MODEL_META[m];
              const active = selectedModel === m;
              return (
                <div
                  key={m}
                  className="rounded-xl p-3 cursor-pointer transition-all duration-150"
                  style={{
                    background: active ? `${meta.color}0d` : "rgba(2,8,23,0.4)",
                    border: `1px solid ${active ? meta.color + "30" : "rgba(51,65,85,0.35)"}`,
                  }}
                  onClick={() => setSelectedModel(m)}
                >
                  <span className="section-label block mb-1" style={{ color: active ? meta.color : "#334155" }}>{meta.label}</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 800, color: active ? meta.color : "#64748b" }}>{meta.acc}</span>
                  <span style={{ display: "block", fontSize: 9, color: "#334155", marginTop: 2, fontFamily: "'Inter', sans-serif" }}>{meta.sub}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
