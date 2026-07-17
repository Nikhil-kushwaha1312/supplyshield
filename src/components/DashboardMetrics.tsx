import React, { useEffect, useRef, useState } from "react";
import { GlobalMetrics } from "../types";
import { Shield, AlertCircle, Clock, DollarSign, Leaf, Layers, Flame, ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardMetricsProps {
  metrics: GlobalMetrics;
  activeScenarios: string[];
  onRemoveScenario: (scId: string) => void;
  allScenarios: Record<string, { name: string; description: string }>;
}

/* ── Animated counter ────────────────────────────────────────── */
function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const duration = 900;

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parseFloat((eased * to).toFixed(decimals)));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [to, decimals]);

  return <>{display.toFixed(decimals)}{suffix}</>;
}

interface KPICardProps {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  glowColor: string;
  accentColor: string;
  children: React.ReactNode;
  subLabel?: React.ReactNode;
  special?: boolean;
}

function KPICard({ label, icon: Icon, iconColor, glowColor, accentColor, children, subLabel, special }: KPICardProps) {
  return (
    <div
      className="glass-hover rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: special ? `linear-gradient(135deg, ${accentColor}0a, rgba(15,23,42,0.6))` : "rgba(15,23,42,0.5)",
        border: `1px solid ${special ? accentColor + "33" : "rgba(51,65,85,0.5)"}`,
        boxShadow: special ? `0 0 24px ${accentColor}18` : "none",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Subtle top gradient accent */}
      {special && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }} />
      )}

      <div className="flex items-center justify-between">
        <span className="section-label">{label}</span>
        <div className="p-1.5 rounded-lg" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>

      <div className="metric-value" style={{ fontSize: 34, color: "#f1f5f9" }}>
        {children}
      </div>

      {subLabel && (
        <div style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 4 }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

export default function DashboardMetrics({ metrics, activeScenarios, onRemoveScenario, allScenarios }: DashboardMetricsProps) {

  const resilienceColor = metrics.resilienceScore >= 75 ? "#00c9a7" : metrics.resilienceScore >= 45 ? "#f59e0b" : "#ff3b5c";
  const resilienceGlow = metrics.resilienceScore >= 75 ? "#00c9a7" : metrics.resilienceScore >= 45 ? "#f59e0b" : "#ff3b5c";

  /* Radial arc for resilience */
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * metrics.resilienceScore) / 100;

  return (
    <div className="space-y-4">
      {/* ── KPI Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

        {/* Resilience — special card with SVG ring */}
        <div
          className="glass-hover rounded-2xl p-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden col-span-1"
          style={{
            background: `linear-gradient(135deg, ${resilienceColor}0d, rgba(11,18,36,0.95))`,
            border: `1px solid ${resilienceColor}30`,
            boxShadow: `0 0 28px ${resilienceColor}15`,
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${resilienceColor}70, transparent)` }} />
          <span className="section-label">Resilience Index</span>

          <div className="relative">
            <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(28,42,75,0.5)" strokeWidth="7" />
              <circle
                cx="44" cy="44" r={radius}
                fill="none"
                stroke={resilienceColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${resilienceColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="metric-value" style={{ fontSize: 22, color: resilienceColor }}>
                <CountUp to={metrics.resilienceScore} />
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#3d5070", letterSpacing: "0.08em" }}>/100</span>
            </div>
          </div>

          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: resilienceColor, fontWeight: 700, letterSpacing: "0.06em", textAlign: "center" }}>
            {metrics.resilienceScore >= 75 ? "HIGHLY SECURE" : metrics.resilienceScore >= 45 ? "ELEVATED RISK" : "VULNERABLE"}
          </span>
        </div>

        {/* Expected Delays */}
        <KPICard
          label="Expected Delays"
          icon={Clock}
          iconColor="#00c9a7"
          glowColor="#00c9a7"
          accentColor="#00c9a7"
          subLabel={
            metrics.delayIncreasePct > 0
              ? <><ArrowUpRight className="h-3 w-3" style={{ color: "#ff6b86" }} /><span style={{ color: "#ff6b86", fontWeight: 600 }}>High Lag</span><span style={{ color: "#3d5070" }}> on active routes</span></>
              : <><ArrowDownRight className="h-3 w-3" style={{ color: "#00c9a7" }} /><span style={{ color: "#00c9a7", fontWeight: 600 }}>Optimal</span><span style={{ color: "#3d5070" }}> on active routes</span></>
          }
        >
          <span style={{ color: metrics.delayIncreasePct > 0 ? "#ff6b86" : "#00c9a7" }}>
            +<CountUp to={metrics.delayIncreasePct} />%
          </span>
        </KPICard>

        {/* Cost Volatility */}
        <KPICard
          label="Cost Volatility"
          icon={DollarSign}
          iconColor="#67e8f9"
          glowColor="#06b6d4"
          accentColor="#06b6d4"
          subLabel={
            metrics.costIncreasePct > 0
              ? <><ArrowUpRight className="h-3 w-3" style={{ color: "#fb7185" }} /><span style={{ color: "#fb7185", fontWeight: 600 }}>Premium</span><span style={{ color: "#475569" }}> freight overheads</span></>
              : <><ArrowDownRight className="h-3 w-3" style={{ color: "#34d399" }} /><span style={{ color: "#34d399", fontWeight: 600 }}>Normal</span><span style={{ color: "#475569" }}> freight rates</span></>
          }
        >
          <span style={{ color: metrics.costIncreasePct > 0 ? "#fb7185" : "#34d399" }}>
            +<CountUp to={metrics.costIncreasePct} />%
          </span>
        </KPICard>

        {/* Carbon Footprint */}
        <KPICard
          label="Carbon Footprint"
          icon={Leaf}
          iconColor="#4ade80"
          glowColor="#10b981"
          accentColor="#10b981"
          subLabel={
            metrics.carbonEmissionPct > 15
              ? <><ArrowUpRight className="h-3 w-3" style={{ color: "#fbbf24" }} /><span style={{ color: "#fbbf24", fontWeight: 600 }}>Inefficient</span><span style={{ color: "#475569" }}> detour delta</span></>
              : <><ArrowDownRight className="h-3 w-3" style={{ color: "#34d399" }} /><span style={{ color: "#34d399", fontWeight: 600 }}>Green</span><span style={{ color: "#475569" }}> compliant</span></>
          }
        >
          <span style={{ color: metrics.carbonEmissionPct > 15 ? "#fbbf24" : "#34d399" }}>
            +<CountUp to={metrics.carbonEmissionPct} />%
          </span>
        </KPICard>

        {/* Inventory Risk */}
        <KPICard
          label="Inventory Risk"
          icon={Layers}
          iconColor="#fbbf24"
          glowColor="#f59e0b"
          accentColor="#f59e0b"
          special={metrics.inventoryShortageRisk > 40}
          subLabel={
            metrics.inventoryShortageRisk > 40
              ? <><AlertCircle className="h-3 w-3" style={{ color: "#fb7185" }} /><span style={{ color: "#fb7185", fontWeight: 600 }}>Stock-Out Threat</span></>
              : <><span style={{ color: "#34d399", fontWeight: 600 }}>Safe Buffer</span><span style={{ color: "#475569" }}> across hubs</span></>
          }
        >
          <CountUp to={metrics.inventoryShortageRisk} />
          <span style={{ fontSize: 16, color: "#94a3b8" }}>%</span>
        </KPICard>

        {/* Crisis Alerts */}
        <KPICard
          label="Crisis Alerts"
          icon={Flame}
          iconColor="#fb7185"
          glowColor="#f43f5e"
          accentColor="#f43f5e"
          special={metrics.activeAlertsCount > 0}
          subLabel={
            activeScenarios.length > 0
              ? <><span style={{ color: "#fb7185", fontWeight: 600 }}>⚠ Mitigation Required</span></>
              : <><span style={{ color: "#34d399", fontWeight: 600 }}>✓ Infrastructure Healthy</span></>
          }
        >
          <span style={{ color: metrics.activeAlertsCount > 0 ? "#fb7185" : "#34d399" }}>
            <CountUp to={metrics.activeAlertsCount} />
          </span>
        </KPICard>
      </div>

      {/* ── Active Disruptions ─────────────────────────────── */}
      <AnimatePresence>
        {activeScenarios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.25)", boxShadow: "0 0 32px rgba(244,63,94,0.08)" }}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f43f5e" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#f43f5e" }} />
                </span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#fca5a5", letterSpacing: "-0.01em" }}>
                  Active Disruption Stack
                </span>
                <span className="badge badge-rose" style={{ fontSize: 9 }}>{activeScenarios.length} LIVE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeScenarios.map((scId, idx) => {
                  const details = allScenarios[scId];
                  if (!details) return null;
                  return (
                    <motion.div
                      key={scId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.04 }}
                      className="rounded-xl p-3.5 flex flex-col gap-2.5"
                      style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: "#fca5a5", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                          {details.name}
                        </h4>
                        <button
                          onClick={() => onRemoveScenario(scId)}
                          className="flex-shrink-0 p-1 rounded-lg transition-colors cursor-pointer"
                          style={{ color: "#64748b" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#fb7185")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                          title="Resolve crisis"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p style={{ fontSize: 10.5, color: "#94a3b8", lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{details.description}</p>
                      <button
                        onClick={() => onRemoveScenario(scId)}
                        className="self-start px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150"
                        style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#fca5a5", fontFamily: "'JetBrains Mono', monospace" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.25)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.15)"; }}
                      >
                        RESOLVE CRISIS
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
