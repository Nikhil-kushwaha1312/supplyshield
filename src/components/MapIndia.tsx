import React, { useState } from "react";
import { LogisticsNode, LogisticsEdge } from "../types";
import { 
  Shield, 
  AlertTriangle, 
  Radio, 
  Navigation, 
  Landmark, 
  Zap, 
  Compass, 
  Layers, 
  Globe, 
  Grid, 
  Eye, 
  EyeOff,
  Activity,
  MapPin,
  TrendingUp
} from "lucide-react";

interface MapIndiaProps {
  nodes: Record<string, LogisticsNode>;
  edges: LogisticsEdge[];
  highlightedPath?: string[];
  activeScenarios: string[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export default function MapIndia({
  nodes,
  edges,
  highlightedPath,
  activeScenarios,
  selectedNodeId,
  onSelectNode,
}: MapIndiaProps) {
  const [hoveredNode, setHoveredNode] = useState<LogisticsNode | null>(null);
  
  // Interactive Toggles for the High-tech Digital Twin map
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [colorByMode, setColorByMode] = useState<boolean>(true);
  const [showNeighboringCountries, setShowNeighboringCountries] = useState<boolean>(true);
  
  // Real-time mouse coordinates
  const [coordsText, setCoordsText] = useState<string>("SYS-NAV // 21.1458° N, 79.0882° E");

  // Map coordinates (Lat/Lng) to SVG viewport percentages
  // Precise India boundaries: Lng 68.0 to 97.5, Lat 8.0 to 36.0
  const mapCoords = (lat: number, lng: number) => {
    const minLng = 68.0;
    const maxLng = 97.5;
    const minLat = 8.0;
    const maxLat = 36.0;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Lat increases upwards, SVG y increases downwards
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

    // Apply slight scaling / adjustments for perfect visual spacing
    return {
      x: 10 + x * 0.8,
      y: 5 + y * 0.9,
    };
  };

  // Check if an edge is part of the currently highlighted route
  const isEdgeHighlighted = (sourceId: string, targetId: string) => {
    if (!highlightedPath || highlightedPath.length < 2) return false;
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      const u = highlightedPath[i];
      const v = highlightedPath[i + 1];
      if ((u === sourceId && v === targetId) || (u === targetId && v === sourceId)) {
        return true;
      }
    }
    return false;
  };

  // Convert client cursor position inside SVG container to India Lat/Lng coordinates
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;

    // Inverse coordinates mapping
    let x_lng_pct = (pctX - 10) / 0.8;
    let y_lat_pct = (pctY - 5) / 0.9;
    
    x_lng_pct = Math.max(0, Math.min(100, x_lng_pct));
    y_lat_pct = Math.max(0, Math.min(100, y_lat_pct));
    
    const minLng = 68.0;
    const maxLng = 97.5;
    const minLat = 8.0;
    const maxLat = 36.0;
    
    const lng = minLng + (x_lng_pct / 100) * (maxLng - minLng);
    const lat = minLat + (1 - y_lat_pct / 100) * (maxLat - minLat);
    
    setCoordsText(`SYS-NAV // ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
  };

  return (
    <div id="map-container" className="relative w-full h-[520px] bg-slate-950/70 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300">
      
      {/* Visual Corner Ornaments */}
      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-700 pointer-events-none rounded-tl-sm z-10" />
      <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-700 pointer-events-none rounded-tr-sm z-10" />
      <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-700 pointer-events-none rounded-bl-sm z-10" />
      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-700 pointer-events-none rounded-br-sm z-10" />

      {/* Map Header with Real-time indicators */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-700/80 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">LOGISTICS DIGITAL TWIN v2.5</span>
        </div>
        {activeScenarios.length > 0 && (
          <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-800/80 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md text-red-400 text-[10px] font-bold w-fit animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span>CRITICAL DISRUPTION ACTIVE: {activeScenarios.length} INCIDENT{activeScenarios.length > 1 ? "S" : ""}</span>
          </div>
        )}
      </div>

      {/* Floating Interactive Controls Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="bg-slate-900/95 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle high-tech mapping grid"
            className={`p-1.5 rounded-lg transition-colors border ${showGrid ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowRadar(!showRadar)}
            title="Toggle node scanner sweeps"
            className={`p-1.5 rounded-lg transition-colors border ${showRadar ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}
          >
            <Radio className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowContours(!showContours)}
            title="Toggle geographic contour lines"
            className={`p-1.5 rounded-lg transition-colors border ${showContours ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}
          >
            <Compass className="h-4 w-4" />
          </button>
          <button
            onClick={() => setColorByMode(!colorByMode)}
            title="Toggle transportation mode pathing colors"
            className={`p-1.5 rounded-lg transition-colors border ${colorByMode ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowNeighboringCountries(!showNeighboringCountries)}
            title="Toggle neighboring countries context"
            className={`p-1.5 rounded-lg transition-colors border ${showNeighboringCountries ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}
          >
            <Globe className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary SVG Canvas */}
      <div className="flex-1 w-full relative">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full select-none"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
        >
          {/* Custom SVG Definitions for Gradients and Glow Effects */}
          <defs>
            <filter id="neon-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.0" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="neon-glow-fuchsia" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="india-fill-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b1329" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="ocean-under-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Underlay glowing oceans */}
          <rect width="100" height="100" fill="url(#ocean-under-glow)" />

          {/* Topographic/Elevation contours near Northern Border (Himalayas) */}
          {showContours && (
            <g stroke="rgba(244, 63, 94, 0.05)" strokeWidth="0.15" fill="none" className="transition-opacity duration-500">
              <path d="M 32 10 Q 38 7 44 9" />
              <path d="M 30 14 Q 38 10 48 12" />
              <path d="M 34 16 Q 40 12 52 14" />
              <path d="M 50 16 Q 58 19 66 21" />
            </g>
          )}

          {/* Maritime / Sea depth shipping contours on West and East oceans */}
          {showContours && (
            <g stroke="rgba(56, 189, 248, 0.06)" strokeWidth="0.18" fill="none" className="transition-opacity duration-500">
              <path d="M 12 60 Q 22 75 35 90" strokeDasharray="1 2" />
              <path d="M 8 68 Q 20 84 38 95" />
              <path d="M 72 55 Q 60 70 52 85" strokeDasharray="1 2" />
              <path d="M 78 63 Q 66 80 55 93" />
            </g>
          )}

          {/* Neighboring Countries (Context Layer) */}
          {showNeighboringCountries && (
            <g stroke="rgba(71, 85, 105, 0.25)" strokeWidth="0.15" fill="none" strokeDasharray="1 2" className="transition-opacity duration-500">
              {/* Sri Lanka */}
              <path d="M 49 92 C 50 91, 51 91, 51.5 93 C 51.5 94.5, 50.5 95, 49.5 94.5 C 48.5 94, 48.5 92.5, 49 92 Z" fill="rgba(30, 41, 59, 0.25)" />
              {/* Bangladesh */}
              <path d="M 65.5 42 C 66 38, 67 36, 68 35 C 70 34.5, 71 35.5, 71.5 37 C 72 38.5, 71.5 40, 71 40.5 C 70 41, 68 41.5, 65.5 42 Z" />
              {/* Nepal */}
              <path d="M 48 13 L 60 20 L 59 22.5 L 47.5 16 Z" />
              {/* Bhutan */}
              <path d="M 64 21 L 68.5 21.5 L 68 23 L 63.5 22.5 Z" />
              {/* Pakistan Border slice */}
              <path d="M 38 4 C 36 6, 33 8, 30 12 C 27 16, 24 20, 22 25 L 16 31" />
            </g>
          )}

          {/* Beautiful High-Fidelity Contour Background of India */}
          {/* Multi-layered path with inner gradient, outer stroke, and digital wireframes */}
          <g id="india-subcontinent">
            {/* Ambient drop shadow path */}
            <path
              d="M 38.5 11 C 37.5 10, 37.0 7, 38.0 4.5 C 38.8 2.5, 41.2 2.0, 42.0 4.5 C 42.5 6.0, 41.5 8.0, 42.5 10 C 43.5 11, 45.0 11.5, 46.0 13 C 48.0 13.5, 50.0 14.0, 52.0 14 C 54.0 14.2, 55.5 15.5, 56.5 16 C 58.5 18, 59.8 20.5, 60.5 22.5 C 59.5 24.5, 59.0 26.0, 61.5 27.5 C 62.5 28.0, 64.0 27.5, 65.5 27.5 C 67.5 27.0, 69.5 26.5, 71.5 26.8 C 73.5 26.5, 75.0 27.5, 76.5 29 C 76.8 30.5, 75.8 32.0, 75.0 33 C 73.5 33.8, 72.0 33.5, 70.5 34 C 68.5 33.5, 67.0 32.5, 65.5 32 C 64.5 33.5, 63.8 35.0, 61.8 34.5 C 59.8 34.0, 58.5 35.5, 57.0 36.8 C 55.5 36.0, 54.5 35.5, 53.5 36 C 54.2 39.0, 54.8 40.5, 55.5 41 C 58.0 43.5, 60.5 45.0, 63.0 46 C 65.5 44.5, 68.0 43.0, 70.0 42 C 71.5 43.5, 72.5 45.0, 70.5 46.5 C 68.5 48.0, 65.5 49.0, 62.5 48.5 C 59.5 48.0, 58.0 50.0, 56.5 52 C 55.0 54.0, 54.0 56.0, 53.5 58 C 52.5 60.5, 52.8 63.0, 53.2 65.5 C 53.5 68.0, 53.8 70.5, 52.5 73 C 51.5 75.5, 50.5 78.0, 49.5 80.5 C 48.2 83.5, 47.0 86.5, 45.5 89.5 C 44.8 90.5, 44.2 91.0, 43.5 89.5 C 42.8 87.5, 42.2 85.0, 41.8 82.5 C 41.2 80.0, 40.5 77.5, 39.8 75 C 38.8 72.0, 37.5 69.5, 36.0 67 C 34.5 64.0, 33.0 61.0, 31.5 58 C 30.0 55.0, 28.0 52.5, 26.0 50 C 24.5 48.0, 23.0 46.0, 21.5 44 C 20.0 42.0, 18.0 40.5, 16.5 39.5 C 15.5 39.0, 15.0 38.0, 16.5 37.0 C 18.0 36.0, 20.5 35.0, 22.5 34 C 24.5 32.5, 26.5 30.5, 28.5 28 C 30.5 26.0, 32.5 25.0, 34.5 25 C 36.0 25.0, 37.0 23.0, 37.5 21 C 38.0 19.0, 38.5 16.5, 38.5 14 C 38.5 12.5, 38.0 12.0, 38.5 11 Z"
              fill="rgba(2, 6, 23, 0.75)"
              className="drop-shadow-[0_10px_15px_rgba(30,41,59,0.5)]"
            />
            {/* Detailed styled inner body */}
            <path
              d="M 38.5 11 C 37.5 10, 37.0 7, 38.0 4.5 C 38.8 2.5, 41.2 2.0, 42.0 4.5 C 42.5 6.0, 41.5 8.0, 42.5 10 C 43.5 11, 45.0 11.5, 46.0 13 C 48.0 13.5, 50.0 14.0, 52.0 14 C 54.0 14.2, 55.5 15.5, 56.5 16 C 58.5 18, 59.8 20.5, 60.5 22.5 C 59.5 24.5, 59.0 26.0, 61.5 27.5 C 62.5 28.0, 64.0 27.5, 65.5 27.5 C 67.5 27.0, 69.5 26.5, 71.5 26.8 C 73.5 26.5, 75.0 27.5, 76.5 29 C 76.8 30.5, 75.8 32.0, 75.0 33 C 73.5 33.8, 72.0 33.5, 70.5 34 C 68.5 33.5, 67.0 32.5, 65.5 32 C 64.5 33.5, 63.8 35.0, 61.8 34.5 C 59.8 34.0, 58.5 35.5, 57.0 36.8 C 55.5 36.0, 54.5 35.5, 53.5 36 C 54.2 39.0, 54.8 40.5, 55.5 41 C 58.0 43.5, 60.5 45.0, 63.0 46 C 65.5 44.5, 68.0 43.0, 70.0 42 C 71.5 43.5, 72.5 45.0, 70.5 46.5 C 68.5 48.0, 65.5 49.0, 62.5 48.5 C 59.5 48.0, 58.0 50.0, 56.5 52 C 55.0 54.0, 54.0 56.0, 53.5 58 C 52.5 60.5, 52.8 63.0, 53.2 65.5 C 53.5 68.0, 53.8 70.5, 52.5 73 C 51.5 75.5, 50.5 78.0, 49.5 80.5 C 48.2 83.5, 47.0 86.5, 45.5 89.5 C 44.8 90.5, 44.2 91.0, 43.5 89.5 C 42.8 87.5, 42.2 85.0, 41.8 82.5 C 41.2 80.0, 40.5 77.5, 39.8 75 C 38.8 72.0, 37.5 69.5, 36.0 67 C 34.5 64.0, 33.0 61.0, 31.5 58 C 30.0 55.0, 28.0 52.5, 26.0 50 C 24.5 48.0, 23.0 46.0, 21.5 44 C 20.0 42.0, 18.0 40.5, 16.5 39.5 C 15.5 39.0, 15.0 38.0, 16.5 37.0 C 18.0 36.0, 20.5 35.0, 22.5 34 C 24.5 32.5, 26.5 30.5, 28.5 28 C 30.5 26.0, 32.5 25.0, 34.5 25 C 36.0 25.0, 37.0 23.0, 37.5 21 C 38.0 19.0, 38.5 16.5, 38.5 14 C 38.5 12.5, 38.0 12.0, 38.5 11 Z"
              fill="url(#india-fill-grad)"
              stroke="rgba(99, 102, 241, 0.4)"
              strokeWidth="0.4"
            />
            {/* Glowing neon wire outline */}
            <path
              d="M 38.5 11 C 37.5 10, 37.0 7, 38.0 4.5 C 38.8 2.5, 41.2 2.0, 42.0 4.5 C 42.5 6.0, 41.5 8.0, 42.5 10 C 43.5 11, 45.0 11.5, 46.0 13 C 48.0 13.5, 50.0 14.0, 52.0 14 C 54.0 14.2, 55.5 15.5, 56.5 16 C 58.5 18, 59.8 20.5, 60.5 22.5 C 59.5 24.5, 59.0 26.0, 61.5 27.5 C 62.5 28.0, 64.0 27.5, 65.5 27.5 C 67.5 27.0, 69.5 26.5, 71.5 26.8 C 73.5 26.5, 75.0 27.5, 76.5 29 C 76.8 30.5, 75.8 32.0, 75.0 33 C 73.5 33.8, 72.0 33.5, 70.5 34 C 68.5 33.5, 67.0 32.5, 65.5 32 C 64.5 33.5, 63.8 35.0, 61.8 34.5 C 59.8 34.0, 58.5 35.5, 57.0 36.8 C 55.5 36.0, 54.5 35.5, 53.5 36 C 54.2 39.0, 54.8 40.5, 55.5 41 C 58.0 43.5, 60.5 45.0, 63.0 46 C 65.5 44.5, 68.0 43.0, 70.0 42 C 71.5 43.5, 72.5 45.0, 70.5 46.5 C 68.5 48.0, 65.5 49.0, 62.5 48.5 C 59.5 48.0, 58.0 50.0, 56.5 52 C 55.0 54.0, 54.0 56.0, 53.5 58 C 52.5 60.5, 52.8 63.0, 53.2 65.5 C 53.5 68.0, 53.8 70.5, 52.5 73 C 51.5 75.5, 50.5 78.0, 49.5 80.5 C 48.2 83.5, 47.0 86.5, 45.5 89.5 C 44.8 90.5, 44.2 91.0, 43.5 89.5 C 42.8 87.5, 42.2 85.0, 41.8 82.5 C 41.2 80.0, 40.5 77.5, 39.8 75 C 38.8 72.0, 37.5 69.5, 36.0 67 C 34.5 64.0, 33.0 61.0, 31.5 58 C 30.0 55.0, 28.0 52.5, 26.0 50 C 24.5 48.0, 23.0 46.0, 21.5 44 C 20.0 42.0, 18.0 40.5, 16.5 39.5 C 15.5 39.0, 15.0 38.0, 16.5 37.0 C 18.0 36.0, 20.5 35.0, 22.5 34 C 24.5 32.5, 26.5 30.5, 28.5 28 C 30.5 26.0, 32.5 25.0, 34.5 25 C 36.0 25.0, 37.0 23.0, 37.5 21 C 38.0 19.0, 38.5 16.5, 38.5 14 C 38.5 12.5, 38.0 12.0, 38.5 11 Z"
              fill="none"
              stroke="rgba(56, 189, 248, 0.45)"
              strokeWidth="0.8"
              filter="url(#neon-glow-cyan)"
            />
          </g>

          {/* Core Mapping Grid Overlay */}
          {showGrid && (
            <g opacity="0.05" stroke="#38bdf8" strokeWidth="0.1" className="transition-opacity duration-500">
              <line x1="10" y1="0" x2="10" y2="100" />
              <line x1="20" y1="0" x2="20" y2="100" />
              <line x1="30" y1="0" x2="30" y2="100" />
              <line x1="40" y1="0" x2="40" y2="100" />
              <line x1="50" y1="0" x2="50" y2="100" />
              <line x1="60" y1="0" x2="60" y2="100" />
              <line x1="70" y1="0" x2="70" y2="100" />
              <line x1="80" y1="0" x2="80" y2="100" />
              <line x1="90" y1="0" x2="90" y2="100" />

              <line x1="0" y1="10" x2="100" y2="10" />
              <line x1="0" y1="20" x2="100" y2="20" />
              <line x1="0" y1="30" x2="100" y2="30" />
              <line x1="0" y1="40" x2="100" y2="40" />
              <line x1="0" y1="50" x2="100" y2="50" />
              <line x1="0" y1="60" x2="100" y2="60" />
              <line x1="0" y1="70" x2="100" y2="70" />
              <line x1="0" y1="80" x2="100" y2="80" />
              <line x1="0" y1="90" x2="100" y2="90" />
            </g>
          )}

          {/* Regional Divisions/Borders (Subtle High-Tech Grid) */}
          {showGrid && (
            <g stroke="rgba(148, 163, 184, 0.1)" strokeWidth="0.12" fill="none" strokeDasharray="1 1" className="transition-opacity duration-500">
              {/* North-South dividing axis */}
              <path d="M 45 4 L 45 90" />
              {/* East-West dividing axis */}
              <path d="M 15 50 L 80 50" />
            </g>
          )}

          {/* Draw Connection Edges */}
          {edges.map((edge, index) => {
            const startNode = nodes[edge.source];
            const endNode = nodes[edge.target];
            if (!startNode || !endNode) return null;

            const startPos = mapCoords(startNode.lat, startNode.lng);
            const endPos = mapCoords(endNode.lat, endNode.lng);

            const isHighlighted = isEdgeHighlighted(edge.source, edge.target);

            // Determine if the route is disrupted (either source/target is disrupted or scenario affected)
            const sourceDisrupted = startNode.status === "disrupted";
            const targetDisrupted = endNode.status === "disrupted";
            const isDisrupted = sourceDisrupted && targetDisrupted;

            let strokeColor = "rgba(71, 85, 105, 0.4)";
            let strokeWidth = "0.45";
            let strokeDash = "none";
            let animateGlow = false;
            let glowColor = "rgba(71, 85, 105, 0.1)";

            if (isHighlighted) {
              strokeColor = "#d946ef"; // vibrant fuchsia highlight
              strokeWidth = "1.3";
              animateGlow = true;
              glowColor = "rgba(217, 70, 239, 0.55)";
            } else if (isDisrupted) {
              strokeColor = "rgba(239, 68, 68, 0.85)"; // critical red
              strokeWidth = "0.55";
              strokeDash = "1 1";
              glowColor = "rgba(239, 68, 68, 0.3)";
            } else if (colorByMode) {
              // Custom Mode-Based Logistics Colors
              if (edge.mode === "air") {
                strokeColor = "rgba(168, 85, 247, 0.55)"; // Purple
                strokeWidth = "0.5";
                strokeDash = "3 2";
                glowColor = "rgba(168, 85, 247, 0.18)";
              } else if (edge.mode === "sea") {
                strokeColor = "rgba(6, 182, 212, 0.55)"; // Deep Cyan
                strokeWidth = "0.5";
                strokeDash = "1 1";
                glowColor = "rgba(6, 182, 212, 0.18)";
              } else if (edge.mode === "rail") {
                strokeColor = "rgba(16, 185, 129, 0.55)"; // Emerald
                strokeWidth = "0.45";
                strokeDash = "4 2";
                glowColor = "rgba(16, 185, 129, 0.15)";
              } else {
                // road
                strokeColor = "rgba(245, 158, 11, 0.55)"; // Amber
                strokeWidth = "0.45";
                strokeDash = "2 2";
                glowColor = "rgba(245, 158, 11, 0.15)";
              }
            } else {
              // Standard active connection
              strokeColor = "rgba(16, 185, 129, 0.4)";
              strokeWidth = "0.4";
              strokeDash = "2 1";
            }

            // High-fidelity arc math for logistics routing curves (mid-curve offset)
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2 - 2;

            return (
              <g key={`edge-${index}`} className="group/edge">
                {/* Underlay glow path */}
                {(animateGlow || colorByMode) && (
                  <path
                    d={`M ${startPos.x} ${startPos.y} Q ${midX} ${midY}, ${endPos.x} ${endPos.y}`}
                    fill="none"
                    stroke={glowColor}
                    strokeWidth={animateGlow ? "3.2" : "1.8"}
                    className={animateGlow ? "animate-pulse" : ""}
                  />
                )}
                
                {/* Actual routing line */}
                <path
                  id={`edge-path-${index}`}
                  d={`M ${startPos.x} ${startPos.y} Q ${midX} ${midY}, ${endPos.x} ${endPos.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  className="transition-all duration-500 group-hover/edge:stroke-width-[1.0] cursor-pointer"
                />

                {/* Animated Flow pulses (Marching Ants v2) */}
                {!isDisrupted && (
                  <path
                    d={`M ${startPos.x} ${startPos.y} Q ${midX} ${midY}, ${endPos.x} ${endPos.y}`}
                    fill="none"
                    stroke={
                      isHighlighted 
                        ? "#f472b6" 
                        : edge.mode === "air" 
                        ? "#d8b4fe" 
                        : edge.mode === "sea" 
                        ? "#67e8f9" 
                        : edge.mode === "rail" 
                        ? "#34d399" 
                        : "#fbbf24"
                    }
                    strokeWidth={Number(strokeWidth) * 0.9}
                    strokeDasharray="2 12"
                    strokeDashoffset="100"
                    className="animate-[dash_8s_linear_infinite]"
                  />
                )}
              </g>
            );
          })}

          {/* Draw Nodes */}
          {Object.values(nodes).map((node) => {
            const { x, y } = mapCoords(node.lat, node.lng);
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNode?.id === node.id;

            // Colors based on infrastructure class and state status
            let glowColor = "rgba(99, 102, 241, 0.4)";
            if (node.type === "port") {
              glowColor = "rgba(34, 211, 238, 0.5)";
            } else if (node.type === "airport") {
              glowColor = "rgba(251, 191, 36, 0.5)";
            } else if (node.type === "plant") {
              glowColor = "rgba(244, 114, 182, 0.5)";
            } else if (node.type === "hub") {
              glowColor = "rgba(52, 211, 153, 0.5)";
            }

            if (node.status === "disrupted") {
              glowColor = "rgba(239, 68, 68, 0.85)";
            } else if (node.status === "delayed") {
              glowColor = "rgba(234, 179, 8, 0.75)";
            }

            return (
              <g key={`node-${node.id}`} className="cursor-pointer">
                
                {/* Glowing Radar sweeps centered on active/major nodes */}
                {showRadar && node.status === "active" && (
                  <g opacity="0.4">
                    <circle
                      cx={x}
                      cy={y}
                      r="1"
                      fill="none"
                      stroke={node.type === "port" ? "#22d3ee" : node.type === "airport" ? "#fbbf24" : node.type === "plant" ? "#f472b6" : node.type === "warehouse" ? "#818cf8" : "#34d399"}
                      strokeWidth="0.08"
                    >
                      <animate
                        attributeName="r"
                        values="1;8"
                        dur="3.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0"
                        dur="3.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={x}
                      cy={y}
                      r="1"
                      fill="none"
                      stroke={node.type === "port" ? "#22d3ee" : node.type === "airport" ? "#fbbf24" : node.type === "plant" ? "#f472b6" : node.type === "warehouse" ? "#818cf8" : "#34d399"}
                      strokeWidth="0.05"
                    >
                      <animate
                        attributeName="r"
                        values="1;8"
                        dur="3.5s"
                        begin="1.75s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0"
                        dur="3.5s"
                        begin="1.75s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                )}

                {/* Broad warning ping wave for disrupted/delayed nodes */}
                {(node.status === "disrupted" || node.status === "delayed") && (
                  <circle
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="none"
                    stroke={node.status === "disrupted" ? "rgba(239,68,68,0.85)" : "rgba(234,179,8,0.8)"}
                    strokeWidth="0.18"
                  >
                    <animate
                      attributeName="r"
                      values="1;5;1"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="1;0;1"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Outer interactive ring on mouse hover */}
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="2.0"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "1.6" : isHovered ? "1.4" : "1.0"}
                  className="transition-all duration-300"
                  fill={node.status === "disrupted" ? "#ef4444" : node.status === "delayed" ? "#eab308" : isSelected ? "#fff" : "currentColor"}
                  style={{
                    color: node.type === "port" ? "#22d3ee" : node.type === "airport" ? "#fbbf24" : node.type === "plant" ? "#f472b6" : node.type === "warehouse" ? "#818cf8" : "#34d399",
                    filter: `drop-shadow(0 0 ${isSelected ? "7px" : "3.5px"} ${glowColor})`,
                  }}
                  onClick={() => onSelectNode(isSelected ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                />

                {/* Node Identifier Label (Tactical Monospace Font) */}
                <text
                  x={x}
                  y={y - 2.5}
                  textAnchor="middle"
                  fill={isSelected ? "#fff" : isHovered ? "#38bdf8" : "#94a3b8"}
                  fontSize="1.3"
                  fontWeight={isSelected || isHovered ? "bold" : "600"}
                  fontFamily="monospace"
                  letterSpacing="0.12"
                  className="pointer-events-none transition-all duration-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Global Keyframe styles for SVG Animations */}
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -100;
            }
          }
        `}</style>
      </div>

      {/* Real-time System Navigation Coordinate Streamer */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/85 border border-slate-800/80 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md flex items-center gap-1.5 pointer-events-none">
        <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
        <span className="text-[9px] font-mono tracking-widest text-slate-400">{coordsText}</span>
      </div>

      {/* Refined Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-lg flex flex-col gap-2.5 text-[11px] text-slate-400 pointer-events-auto w-[240px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-slate-200 tracking-wider font-mono">INFRASTRUCTURE STATUS</span>
          <Globe className="h-3.5 w-3.5 text-slate-500" />
        </div>
        
        {/* Node status indicators */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"></span>
            <span>Port Terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"></span>
            <span>Airport Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.5)]"></span>
            <span>Warehouse</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_rgba(244,114,182,0.5)]"></span>
            <span>Plant / Factory</span>
          </div>
        </div>

        {/* Dynamic Route status section based on colorByMode */}
        <div className="border-t border-slate-800 pt-2 flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono font-semibold tracking-wider uppercase mb-0.5">
            {colorByMode ? "TRANSPORT MODE FLOWS" : "ROUTE STATUS"}
          </span>
          
          {colorByMode ? (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 border-t border-dashed border-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[10px]">🚚 Roadway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 border-t border-dashed border-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px]">🚂 Railway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 border-t border-dashed border-purple-400 shadow-[0_0_4px_rgba(168,85,247,0.5)]"></div>
                <span className="text-[10px]">✈️ Airway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 border-t border-dashed border-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.5)]"></div>
                <span className="text-[10px]">🚢 Seaway</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-emerald-500"></div>
                <span>Primary Active Route</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-slate-600"></div>
                <span>Inactive Connection</span>
              </div>
            </>
          )}

          {/* Highlight and disruption statuses */}
          <div className="flex items-center gap-2 border-t border-slate-800/60 pt-1.5 mt-0.5">
            <div className="w-6 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
            <span className="font-semibold text-slate-300">Optimized Path Highlight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-red-500 animate-pulse"></div>
            <span className="text-red-400 font-semibold">Simulated Crisis Disruption</span>
          </div>
        </div>
      </div>

      {/* Floating Detailed State/Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/98 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-[12px] w-[265px] animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(68, mapCoords(hoveredNode.lat, hoveredNode.lng).x)}%`,
            top: `${Math.min(62, mapCoords(hoveredNode.lat, hoveredNode.lng).y - 4)}%`,
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <Landmark className="h-4 w-4 text-cyan-400" />
              <span>{hoveredNode.name}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-widest border ${
                hoveredNode.status === "disrupted"
                  ? "bg-red-950/80 text-red-400 border-red-800"
                  : hoveredNode.status === "delayed"
                  ? "bg-yellow-950/80 text-yellow-400 border-yellow-800"
                  : "bg-emerald-950/80 text-emerald-400 border-emerald-800"
              }`}
            >
              {hoveredNode.status}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between font-mono">
              <span>Infrastructure:</span>
              <span className="text-slate-100 capitalize font-semibold">{hoveredNode.type}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Risk Severity:</span>
              <span className={`font-bold ${hoveredNode.riskScore > 60 ? "text-red-400" : hoveredNode.riskScore > 30 ? "text-yellow-400" : "text-emerald-400"}`}>
                {hoveredNode.riskScore}%
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Terminal Capacity:</span>
              <span className="text-slate-100 font-semibold">{hoveredNode.capacity.toLocaleString()} T</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Operational Load:</span>
              <span className="text-slate-100 font-semibold">{hoveredNode.currentLoad}%</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>System Efficiency:</span>
              <span className="text-slate-100 font-semibold">{hoveredNode.efficiency}%</span>
            </div>
          </div>
          <div className="mt-2.5 text-[9px] text-slate-500 italic text-center border-t border-slate-800/80 pt-2">
            Click node to view full diagnostic analytics
          </div>
        </div>
      )}
    </div>
  );
}
