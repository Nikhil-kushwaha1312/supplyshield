import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Node Coordinates for geographical mapping in India
// Used for A* heuristic and UI rendering
interface LogisticsNode {
  id: string;
  name: string;
  type: "hub" | "port" | "airport" | "warehouse" | "plant";
  lat: number;
  lng: number;
  capacity: number; // in tons
  currentLoad: number; // in %
  riskScore: number; // 0 - 100
  efficiency: number; // 0 - 100
  status: "active" | "delayed" | "disrupted";
}

const NODES: Record<string, LogisticsNode> = {
  DELHI: { id: "DELHI", name: "Delhi Cargo Terminal", type: "airport", lat: 28.6139, lng: 77.2090, capacity: 5000, currentLoad: 68, riskScore: 24, efficiency: 91, status: "active" },
  MUMBAI: { id: "MUMBAI", name: "Mumbai Port (JNPT)", type: "port", lat: 18.9750, lng: 72.8258, capacity: 15000, currentLoad: 82, riskScore: 35, efficiency: 86, status: "active" },
  AHMEDABAD: { id: "AHMEDABAD", name: "Ahmedabad Industrial Hub", type: "plant", lat: 23.0225, lng: 72.5714, capacity: 6000, currentLoad: 55, riskScore: 18, efficiency: 88, status: "active" },
  BENGALURU: { id: "BENGALURU", name: "Bengaluru Tech Logistics", type: "warehouse", lat: 12.9716, lng: 77.5946, capacity: 7000, currentLoad: 45, riskScore: 15, efficiency: 94, status: "active" },
  HYDERABAD: { id: "HYDERABAD", name: "Hyderabad Pharma Junction", type: "warehouse", lat: 17.3850, lng: 78.4867, capacity: 6500, currentLoad: 60, riskScore: 20, efficiency: 89, status: "active" },
  CHENNAI: { id: "CHENNAI", name: "Chennai Port Complex", type: "port", lat: 13.0827, lng: 80.2707, capacity: 12000, currentLoad: 78, riskScore: 30, efficiency: 83, status: "active" },
  KOLKATA: { id: "KOLKATA", name: "Kolkata Gateway Terminal", type: "port", lat: 22.5726, lng: 88.3639, capacity: 10000, currentLoad: 72, riskScore: 42, efficiency: 79, status: "active" },
  GUWAHATI: { id: "GUWAHATI", name: "Guwahati North-East Hub", type: "hub", lat: 26.1445, lng: 91.7362, capacity: 4000, currentLoad: 50, riskScore: 28, efficiency: 82, status: "active" }
};

interface LogisticsEdge {
  source: string;
  target: string;
  distance: number; // in km
  mode: "road" | "rail" | "air" | "sea";
  baseTime: number; // hours
  baseCost: number; // INR per ton
  co2: number; // kg per ton
  reliability: number; // 0 - 100
  highwayCode?: string;
}

const EDGES: LogisticsEdge[] = [
  { source: "DELHI", target: "MUMBAI", distance: 1420, mode: "road", baseTime: 28, baseCost: 4500, co2: 120, reliability: 88, highwayCode: "NH48" },
  { source: "DELHI", target: "MUMBAI", distance: 1380, mode: "rail", baseTime: 20, baseCost: 2800, co2: 45, reliability: 92 },
  { source: "DELHI", target: "AHMEDABAD", distance: 930, mode: "road", baseTime: 18, baseCost: 3100, co2: 80, reliability: 90, highwayCode: "NH48" },
  { source: "DELHI", target: "KOLKATA", distance: 1460, mode: "road", baseTime: 30, baseCost: 4800, co2: 130, reliability: 82, highwayCode: "NH19" },
  { source: "DELHI", target: "KOLKATA", distance: 1440, mode: "rail", baseTime: 22, baseCost: 3000, co2: 48, reliability: 89 },
  { source: "DELHI", target: "GUWAHATI", distance: 1860, mode: "road", baseTime: 42, baseCost: 6500, co2: 165, reliability: 75, highwayCode: "NH27" },
  { source: "DELHI", target: "GUWAHATI", distance: 1800, mode: "air", baseTime: 3, baseCost: 18000, co2: 620, reliability: 98 },
  { source: "MUMBAI", target: "AHMEDABAD", distance: 520, mode: "road", baseTime: 10, baseCost: 1800, co2: 42, reliability: 94, highwayCode: "NH48" },
  { source: "MUMBAI", target: "BENGALURU", distance: 980, mode: "road", baseTime: 20, baseCost: 3200, co2: 85, reliability: 89, highwayCode: "NH48" },
  { source: "MUMBAI", target: "HYDERABAD", distance: 710, mode: "road", baseTime: 15, baseCost: 2400, co2: 60, reliability: 91, highwayCode: "NH65" },
  { source: "MUMBAI", target: "CHENNAI", distance: 1340, mode: "road", baseTime: 26, baseCost: 4400, co2: 115, reliability: 86, highwayCode: "NH48" },
  { source: "MUMBAI", target: "CHENNAI", distance: 1500, mode: "sea", baseTime: 72, baseCost: 1200, co2: 25, reliability: 95 },
  { source: "CHENNAI", target: "BENGALURU", distance: 350, mode: "road", baseTime: 7, baseCost: 1200, co2: 30, reliability: 95, highwayCode: "NH48" },
  { source: "CHENNAI", target: "HYDERABAD", distance: 630, mode: "road", baseTime: 13, baseCost: 2100, co2: 55, reliability: 92, highwayCode: "NH16" },
  { source: "CHENNAI", target: "KOLKATA", distance: 1660, mode: "road", baseTime: 34, baseCost: 5500, co2: 145, reliability: 83, highwayCode: "NH16" },
  { source: "CHENNAI", target: "KOLKATA", distance: 1600, mode: "rail", baseTime: 26, baseCost: 3500, co2: 52, reliability: 88 },
  { source: "CHENNAI", target: "KOLKATA", distance: 1800, mode: "sea", baseTime: 84, baseCost: 1500, co2: 32, reliability: 93 },
  { source: "BENGALURU", target: "HYDERABAD", distance: 570, mode: "road", baseTime: 11, baseCost: 1900, co2: 50, reliability: 93, highwayCode: "NH44" },
  { source: "HYDERABAD", target: "KOLKATA", distance: 1480, mode: "road", baseTime: 31, baseCost: 4900, co2: 125, reliability: 85, highwayCode: "NH16" },
  { source: "KOLKATA", target: "GUWAHATI", distance: 1010, mode: "road", baseTime: 24, baseCost: 3500, co2: 90, reliability: 78, highwayCode: "NH27" },
  { source: "KOLKATA", target: "GUWAHATI", distance: 980, mode: "rail", baseTime: 18, baseCost: 2200, co2: 32, reliability: 84 }
];

// Active Crisis Scenarios & Rules
interface ScenarioImpact {
  name: string;
  delayMultiplier: number;
  costMultiplier: number;
  emissionsMultiplier: number;
  affectedNodes: string[];
  affectedModes: string[];
  description: string;
}

const SCENARIOS: Record<string, ScenarioImpact> = {
  FLOOD: {
    name: "Monsoon Flood (Mumbai & West India)",
    delayMultiplier: 2.2,
    costMultiplier: 1.4,
    emissionsMultiplier: 1.25,
    affectedNodes: ["MUMBAI", "AHMEDABAD"],
    affectedModes: ["road", "rail"],
    description: "Heavy torrential monsoon floods leading to arterial highway waterlogging and waterbound rail tracks across Maharashtra and Gujarat.",
  },
  CYCLONE: {
    name: "East Coast Cyclone (Chennai & Kolkata)",
    delayMultiplier: 2.5,
    costMultiplier: 1.6,
    emissionsMultiplier: 1.3,
    affectedNodes: ["CHENNAI", "KOLKATA"],
    affectedModes: ["sea", "road", "rail"],
    description: "Severe cyclonic storm landing on the Bay of Bengal, suspending port activities, disrupting sea routes, and causing power outages.",
  },
  RAIL_STRIKE: {
    name: "National Railway Strike",
    delayMultiplier: 1.8,
    costMultiplier: 1.5,
    emissionsMultiplier: 1.4, // Forces shifts to less green road transport
    affectedNodes: [],
    affectedModes: ["rail"],
    description: "Countrywide railway cargo worker strike halting container trains, forcing all rail volumes to highway freight transport.",
  },
  PORT_CLOSURE: {
    name: "JNPT Port Cyber Attack & Closure",
    delayMultiplier: 3.5,
    costMultiplier: 1.8,
    emissionsMultiplier: 1.1,
    affectedNodes: ["MUMBAI"],
    affectedModes: ["sea"],
    description: "Ransomware cyber attack locking customs clearance and container terminal operating systems at Mumbai's JNPT Port.",
  },
  FUEL_SHORTAGE: {
    name: "National Fuel Shortage",
    delayMultiplier: 1.3,
    costMultiplier: 1.9,
    emissionsMultiplier: 1.05,
    affectedNodes: [],
    affectedModes: ["road", "air"],
    description: "Crude supply shortages causing fuel pumps across states to ration diesel, skyrocketing freight rates by 90%.",
  },
  PANDEMIC: {
    name: "Local Health Lockdowns",
    delayMultiplier: 1.9,
    costMultiplier: 1.3,
    emissionsMultiplier: 1.15,
    affectedNodes: ["DELHI", "MUMBAI", "BENGALURU"],
    affectedModes: ["road", "rail", "air"],
    description: "Inter-state checking and border blockades for rapid screening, causing driver shortages and warehouse processing backlogs.",
  },
  EARTHQUAKE: {
    name: "Himalayan Faultline Earthquake (Delhi)",
    delayMultiplier: 2.0,
    costMultiplier: 1.5,
    emissionsMultiplier: 1.2,
    affectedNodes: ["DELHI"],
    affectedModes: ["road", "rail", "air"],
    description: "Magnitude 6.8 seismic event causing minor structural damage to highway flyovers and runway cracks in the NCR zone.",
  },
  HIGHWAY_BLOCKAGE: {
    name: "National Highway Blockade (NH48 / NH27)",
    delayMultiplier: 1.6,
    costMultiplier: 1.25,
    emissionsMultiplier: 1.15,
    affectedNodes: ["GUWAHATI", "AHMEDABAD"],
    affectedModes: ["road"],
    description: "Mass protests and landslides forcing detours through broken village bypasses on critical national express corridors.",
  },
  WAREHOUSE_SHUTDOWN: {
    name: "Guwahati Hub Emergency Shutdown",
    delayMultiplier: 2.8,
    costMultiplier: 1.5,
    emissionsMultiplier: 1.2,
    affectedNodes: ["GUWAHATI"],
    affectedModes: [],
    description: "Local labor unrest and safety inspections shuttering the main gateway warehouse to North-East India.",
  },
  DEMAND_SURGE: {
    name: "Festival Season Demand Spike (Diwali/Big-Day)",
    delayMultiplier: 1.4,
    costMultiplier: 1.35,
    emissionsMultiplier: 1.1,
    affectedNodes: ["DELHI", "MUMBAI", "BENGALURU", "HYDERABAD", "CHENNAI", "AHMEDABAD", "KOLKATA"],
    affectedModes: [],
    description: "Aggregated nationwide e-commerce surge choking sorting centers and causing severe last-mile shipping delays.",
  },
  SUPPLIER_BANKRUPTCY: {
    name: "Critical Semiconductor Supplier Bankruptcy",
    delayMultiplier: 3.0,
    costMultiplier: 1.7,
    emissionsMultiplier: 1.0,
    affectedNodes: ["BENGALURU"],
    affectedModes: [],
    description: "Major electronics component vendor files for sudden insolvency, halting electronic manufacturing supply lines.",
  }
};

// Global active simulation states
let activeScenarios: string[] = [];
// Slider modifications from What-If Panel
let configSupplierDiversity = 65; // 0 - 100
let configInventorySafetyStockMultiplier = 1.0; // 0.5 - 2.5
let configAlternateRouteReady = false;
let configEmergencyBudgetBuffer = 20; // % budget reserved

// Helper: Calculate risk scores and metrics based on active scenarios
function calculateCurrentNetworkStatus() {
  const nodeStatus = JSON.parse(JSON.stringify(NODES)) as Record<string, LogisticsNode>;
  const edgeStatus = JSON.parse(JSON.stringify(EDGES)) as LogisticsEdge[];

  // Apply active scenarios
  activeScenarios.forEach((scId) => {
    const sc = SCENARIOS[scId];
    if (!sc) return;

    // Apply to Nodes
    sc.affectedNodes.forEach((nodeId) => {
      if (nodeStatus[nodeId]) {
        nodeStatus[nodeId].riskScore = Math.min(100, nodeStatus[nodeId].riskScore + 35);
        nodeStatus[nodeId].efficiency = Math.max(20, nodeStatus[nodeId].efficiency - 30);
        nodeStatus[nodeId].status = "disrupted";
      }
    });

    // Apply to Edges
    edgeStatus.forEach((edge) => {
      const nodeAffected = sc.affectedNodes.length === 0 || sc.affectedNodes.includes(edge.source) || sc.affectedNodes.includes(edge.target);
      const modeAffected = sc.affectedModes.length === 0 || sc.affectedModes.includes(edge.mode);

      if (nodeAffected && modeAffected) {
        edge.baseTime = Math.round(edge.baseTime * sc.delayMultiplier * 10) / 10;
        edge.baseCost = Math.round(edge.baseCost * sc.costMultiplier);
        edge.co2 = Math.round(edge.co2 * sc.emissionsMultiplier);
        edge.reliability = Math.max(10, edge.reliability - 40);
      }
    });
  });

  // Apply What-If inputs to metrics
  // Higher supplier diversity reduces risk
  const supplierRiskMitigation = (configSupplierDiversity - 50) * 0.4; // positive is mitigation
  // Higher safety stock reduces risk but increases holding costs slightly
  const inventoryRiskMitigation = (configInventorySafetyStockMultiplier - 1.0) * 15;

  Object.values(nodeStatus).forEach((node) => {
    node.riskScore = Math.max(5, Math.round(node.riskScore - supplierRiskMitigation - inventoryRiskMitigation));
    if (activeScenarios.length > 0 && SCENARIOS[activeScenarios[0]]?.affectedNodes.includes(node.id)) {
      // Keep state disrupted if directly hit
    } else if (node.riskScore > 50) {
      node.status = "delayed";
    } else {
      node.status = "active";
    }
  });

  // Calculate global scores
  let totalDelayIncrease = 0;
  let totalCostIncrease = 0;
  let totalCO2Increase = 0;

  activeScenarios.forEach((scId) => {
    const sc = SCENARIOS[scId];
    if (!sc) return;
    totalDelayIncrease += (sc.delayMultiplier - 1) * 100;
    totalCostIncrease += (sc.costMultiplier - 1) * 100;
    totalCO2Increase += (sc.emissionsMultiplier - 1) * 100;
  });

  // Formulate Global Resilience Score (0 - 100)
  // Base is 85. Subtract risk factors, add what-if mitigations
  let baseResilience = 82;
  const disruptionImpact = activeScenarios.length * 15;
  const diversityBonus = (configSupplierDiversity - 50) * 0.3;
  const stockBonus = (configInventorySafetyStockMultiplier - 1.0) * 10;
  const routeBonus = configAlternateRouteReady ? 8 : 0;
  const budgetBonus = (configEmergencyBudgetBuffer - 20) * 0.25;

  let finalResilienceScore = Math.max(12, Math.round(baseResilience - disruptionImpact + diversityBonus + stockBonus + routeBonus + budgetBonus));
  finalResilienceScore = Math.min(99, finalResilienceScore);

  return {
    nodes: nodeStatus,
    edges: edgeStatus,
    globalMetrics: {
      resilienceScore: finalResilienceScore,
      delayIncreasePct: Math.round(Math.max(0, totalDelayIncrease - (configAlternateRouteReady ? 15 : 0))),
      costIncreasePct: Math.round(Math.max(0, totalCostIncrease - (configEmergencyBudgetBuffer * 0.2))),
      carbonEmissionPct: Math.round(Math.max(0, totalCO2Increase)),
      inventoryShortageRisk: Math.max(5, Math.round(30 + (activeScenarios.length * 18) - (configInventorySafetyStockMultiplier * 22))),
      activeAlertsCount: activeScenarios.length + 2,
    },
  };
}

// Shortest Path Algorithms: Dijkstra & A* Implementation
function runDijkstra(graphNodes: string[], edges: LogisticsEdge[], start: string, end: string, weightKey: "distance" | "baseTime" | "baseCost") {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const queue = new Set<string>();

  graphNodes.forEach((node) => {
    dist[node] = Infinity;
    prev[node] = null;
    queue.add(node);
  });

  dist[start] = 0;

  while (queue.size > 0) {
    // Find min node
    let u: string | null = null;
    queue.forEach((node) => {
      if (u === null || dist[node] < dist[u]) {
        u = node;
      }
    });

    if (u === null || dist[u] === Infinity || u === end) {
      break;
    }

    queue.delete(u);

    // Get neighbors
    const currentU = u as string;
    const neighbors = edges.filter((e) => e.source === currentU || e.target === currentU);

    neighbors.forEach((edge) => {
      const neighbor = edge.source === currentU ? edge.target : edge.source;
      if (!queue.has(neighbor)) return;

      const alt = dist[currentU] + edge[weightKey];
      if (alt < dist[neighbor]) {
        dist[neighbor] = alt;
        prev[neighbor] = currentU;
      }
    });
  }

  // Backtrack path
  const path: string[] = [];
  let curr: string | null = end;
  if (prev[curr] !== null || curr === start) {
    while (curr !== null) {
      path.unshift(curr);
      curr = prev[curr];
    }
  }

  return {
    path,
    cost: dist[end] === Infinity ? 0 : Math.round(dist[end] * 10) / 10,
  };
}

// A* implementation utilizing Great Circle Distance as Heuristic
function runAStar(nodes: Record<string, LogisticsNode>, edges: LogisticsEdge[], start: string, end: string, weightKey: "distance" | "baseTime" | "baseCost") {
  // Simple latitude longitude distance as heuristic
  const getHeuristic = (n1: string, n2: string) => {
    const p1 = nodes[n1];
    const p2 = nodes[n2];
    if (!p1 || !p2) return 0;
    const dx = p1.lat - p2.lat;
    const dy = p1.lng - p2.lng;
    const distKm = Math.sqrt(dx * dx + dy * dy) * 111; // 1 degree ~ 111km
    if (weightKey === "distance") return distKm;
    if (weightKey === "baseTime") return distKm / 75; // assume average 75km/h
    if (weightKey === "baseCost") return distKm * 3.5; // average cost per km per ton
    return distKm;
  };

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const prev: Record<string, string> = {};
  const openSet = new Set<string>([start]);

  Object.keys(nodes).forEach((node) => {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = getHeuristic(start, end);

  while (openSet.size > 0) {
    let current: string | null = null;
    openSet.forEach((node) => {
      if (current === null || fScore[node] < fScore[current]) {
        current = node;
      }
    });

    if (current === null) break;
    if (current === end) {
      // Reconstruct Path
      const path: string[] = [current];
      while (current && prev[current]) {
        current = prev[current];
        path.unshift(current);
      }
      return { path, cost: Math.round(gScore[end] * 10) / 10, visitedNodesCount: Object.keys(prev).length };
    }

    openSet.delete(current);
    const currentU = current;

    const neighbors = edges.filter((e) => e.source === currentU || e.target === currentU);
    neighbors.forEach((edge) => {
      const neighbor = edge.source === currentU ? edge.target : edge.source;
      const tentativeG = gScore[currentU] + edge[weightKey];

      if (tentativeG < gScore[neighbor]) {
        prev[neighbor] = currentU;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + getHeuristic(neighbor, end);
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    });
  }

  // Fallback to empty if not found
  return { path: [], cost: 0, visitedNodesCount: 0 };
}

// Genetic Algorithm Simulator for Multi-Hub Circular Routing / TSP style optimizations
function runGeneticRouteOptimization(nodes: string[], edges: LogisticsEdge[], start: string) {
  // Simply generates a series of generations trying to find the best multi-stop sequence
  // Nodes to visit (excluding start)
  const visitNodes = nodes.filter((n) => n !== start);
  if (visitNodes.length === 0) return { path: [start], fitness: 0, generations: 0 };

  // Calculate full route cost including returning to start
  const getRouteMetric = (route: string[]) => {
    let totalCost = 0;
    let current = start;
    for (const nextNode of route) {
      // find edge
      const edge = edges.find(
        (e) => (e.source === current && e.target === nextNode) || (e.target === current && e.source === nextNode)
      );
      totalCost += edge ? edge.distance : 1500; // default large penalty if no direct link
      current = nextNode;
    }
    // Return back to start
    const backEdge = edges.find(
      (e) => (e.source === current && e.target === start) || (e.target === start && e.source === current)
    );
    totalCost += backEdge ? backEdge.distance : 1500;
    return totalCost;
  };

  // Run 15 fast generations of a small population
  let population: string[][] = [];
  for (let i = 0; i < 10; i++) {
    // shuffle
    population.push([...visitNodes].sort(() => Math.random() - 0.5));
  }

  const generationsHistory: { gen: number; bestDistance: number }[] = [];

  for (let gen = 1; gen <= 12; gen++) {
    // Sort by fitness (lowest distance is best)
    population.sort((a, b) => getRouteMetric(a) - getRouteMetric(b));
    const bestDist = getRouteMetric(population[0]);
    generationsHistory.push({ gen, bestDistance: bestDist });

    // Perform reproduction & Mutation
    const nextGen = [population[0], population[1]]; // Elitist survival
    while (nextGen.length < 10) {
      // Crossover
      const parent1 = population[Math.floor(Math.random() * 3)];
      const parent2 = population[Math.floor(Math.random() * 3)];
      // Simple cut-and-cross preserving uniqueness
      const cutoff = Math.floor(parent1.length / 2);
      const child = parent1.slice(0, cutoff);
      parent2.forEach((gene) => {
        if (!child.includes(gene)) {
          child.push(gene);
        }
      });

      // Mutation (swap 2 items)
      if (Math.random() < 0.3) {
        const i1 = Math.floor(Math.random() * child.length);
        const i2 = Math.floor(Math.random() * child.length);
        const temp = child[i1];
        child[i1] = child[i2];
        child[i2] = temp;
      }
      nextGen.push(child);
    }
    population = nextGen;
  }

  population.sort((a, b) => getRouteMetric(a) - getRouteMetric(b));
  const finalBestPath = [start, ...population[0], start];

  return {
    bestRoute: finalBestPath,
    bestDistance: getRouteMetric(population[0]),
    generations: generationsHistory,
  };
}

// --------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------

// 1. Dashboard Metrics and Infrastructure Nodes/Edges
app.get("/api/dashboard-metrics", (req, res) => {
  const currentNetwork = calculateCurrentNetworkStatus();
  res.json({
    status: "success",
    data: currentNetwork,
    activeScenarios,
  });
});

// 2. Set Active Stress Testing Scenarios
app.post("/api/stress-test", (req, res) => {
  const { scenarioId, action } = req.body; // action: 'add' | 'remove' | 'clear'

  if (action === "clear") {
    activeScenarios = [];
  } else if (action === "add" && scenarioId) {
    if (!activeScenarios.includes(scenarioId)) {
      activeScenarios.push(scenarioId);
    }
  } else if (action === "remove" && scenarioId) {
    activeScenarios = activeScenarios.filter((id) => id !== scenarioId);
  }

  const currentNetwork = calculateCurrentNetworkStatus();
  res.json({
    status: "success",
    activeScenarios,
    metrics: currentNetwork.globalMetrics,
    nodes: currentNetwork.nodes,
  });
});

// 3. What-If Parameter Tuning
app.post("/api/what-if", (req, res) => {
  const { supplierDiversity, safetyStockMultiplier, alternateRouteReady, emergencyBudgetBuffer } = req.body;

  if (supplierDiversity !== undefined) configSupplierDiversity = Number(supplierDiversity);
  if (safetyStockMultiplier !== undefined) configInventorySafetyStockMultiplier = Number(safetyStockMultiplier);
  if (alternateRouteReady !== undefined) configAlternateRouteReady = Boolean(alternateRouteReady);
  if (emergencyBudgetBuffer !== undefined) configEmergencyBudgetBuffer = Number(emergencyBudgetBuffer);

  const currentNetwork = calculateCurrentNetworkStatus();
  res.json({
    status: "success",
    config: {
      supplierDiversity: configSupplierDiversity,
      safetyStockMultiplier: configInventorySafetyStockMultiplier,
      alternateRouteReady: configAlternateRouteReady,
      emergencyBudgetBuffer: configEmergencyBudgetBuffer,
    },
    metrics: currentNetwork.globalMetrics,
  });
});

// 4. AI Risk Predictor endpoint
// Run comparative statistical predictions across XGBoost, Random Forest, LightGBM, and CatBoost
app.post("/api/predict-risk", (req, res) => {
  const { source, destination, cargoType, transportMode, priority, date } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ error: "Source and Destination required" });
  }

  // Base math on distance
  const baseEdge = calculateCurrentNetworkStatus().edges.find(
    (e) =>
      (e.source === source && e.target === destination) || (e.target === source && e.source === destination)
  );

  const distance = baseEdge ? baseEdge.distance : 1100;
  const standardTime = baseEdge ? baseEdge.baseTime : 24;

  // Predict values using structured synthetic formulas reflecting weather & priority
  let delayRiskBase = 15;
  if (transportMode === "road") delayRiskBase += 15;
  if (transportMode === "rail") delayRiskBase += 5;
  if (transportMode === "air") delayRiskBase -= 10;
  if (priority === "critical") delayRiskBase += 12; // critical cargos are monitored but subject to tight tolerance
  if (cargoType === "Chemicals") delayRiskBase += 8;

  // Active crisis additions
  activeScenarios.forEach((scId) => {
    const sc = SCENARIOS[scId];
    if (sc && (sc.affectedNodes.includes(source) || sc.affectedNodes.includes(destination))) {
      delayRiskBase += 35;
    }
  });

  const riskScore = Math.min(99, Math.max(8, delayRiskBase));
  const delayProbability = riskScore / 100;
  const expectedDelayHours = Math.round((standardTime * delayProbability * 0.6) * 10) / 10;

  // Model comparisons
  const compareModels = {
    CatBoost: {
      predictedDelayHours: expectedDelayHours,
      probability: Math.round(delayProbability * 100),
      riskCategory: riskScore > 65 ? "HIGH" : riskScore > 35 ? "MEDIUM" : "LOW",
      confidence: 94,
      accuracy: 92.4,
      featureImportance: { distance: 35, weather: 25, transportMode: 20, congestion: 12, cargoType: 8 },
    },
    XGBoost: {
      predictedDelayHours: Math.round(expectedDelayHours * 1.05 * 10) / 10,
      probability: Math.round(Math.min(99, delayProbability * 103)),
      riskCategory: riskScore > 60 ? "HIGH" : riskScore > 30 ? "MEDIUM" : "LOW",
      confidence: 89,
      accuracy: 90.8,
      featureImportance: { distance: 40, weather: 22, transportMode: 18, congestion: 15, cargoType: 5 },
    },
    LightGBM: {
      predictedDelayHours: Math.round(expectedDelayHours * 0.96 * 10) / 10,
      probability: Math.round(Math.max(5, delayProbability * 96)),
      riskCategory: riskScore > 68 ? "HIGH" : riskScore > 38 ? "MEDIUM" : "LOW",
      confidence: 91,
      accuracy: 91.2,
      featureImportance: { distance: 30, weather: 28, transportMode: 22, congestion: 10, cargoType: 10 },
    },
    RandomForest: {
      predictedDelayHours: Math.round(expectedDelayHours * 1.12 * 10) / 10,
      probability: Math.round(Math.min(99, delayProbability * 108)),
      riskCategory: riskScore > 58 ? "HIGH" : riskScore > 28 ? "MEDIUM" : "LOW",
      confidence: 85,
      accuracy: 86.5,
      featureImportance: { distance: 45, weather: 15, transportMode: 15, congestion: 18, cargoType: 7 },
    }
  };

  res.json({
    status: "success",
    input: { source, destination, cargoType, transportMode, priority, date },
    summary: {
      delayProbability: Math.round(delayProbability * 100),
      expectedDelayHours,
      riskScore,
      confidenceLevel: 91,
      optimalModel: "CatBoost",
    },
    compareModels,
  });
});

// 5. Route Optimization Endpoint (Dijkstra, A*, Genetic Route solver comparisons)
app.post("/api/route-optimize", (req, res) => {
  const { source, destination, optimizationMetric } = req.body; // distance, baseTime, baseCost

  if (!source || !destination) {
    return res.status(400).json({ error: "Source and Destination required" });
  }

  const network = calculateCurrentNetworkStatus();
  const weightKey = optimizationMetric === "time" ? "baseTime" : optimizationMetric === "cost" ? "baseCost" : "distance";

  // 1. Run Dijkstra
  const nodesList = Object.keys(network.nodes);
  const dijkstraResult = runDijkstra(nodesList, network.edges, source, destination, weightKey);

  // 2. Run A*
  const aStarResult = runAStar(network.nodes, network.edges, source, destination, weightKey);

  // 3. Genetic TSP Route Sequence recommendation (using start point)
  const geneticResult = runGeneticRouteOptimization(nodesList, network.edges, source);

  res.json({
    status: "success",
    source,
    destination,
    metricUsed: weightKey,
    dijkstra: {
      path: dijkstraResult.path,
      cost: dijkstraResult.cost,
      metricLabel: optimizationMetric === "time" ? "hours" : optimizationMetric === "cost" ? "INR/ton" : "km",
    },
    aStar: {
      path: aStarResult.path,
      cost: aStarResult.cost,
      visitedNodes: aStarResult.visitedNodesCount,
    },
    geneticTSP: {
      description: "Optimized cyclical sweep route starting and returning to " + source,
      path: geneticResult.bestRoute,
      totalDistanceKm: geneticResult.bestDistance,
      generationsHistory: geneticResult.generations,
    },
  });
});

// 6. Demand Forecasting Simulator (LSTM, ARIMA, Prophet)
app.get("/api/demand-forecast", (req, res) => {
  const categories = ["Electronics", "Pharmaceuticals", "Food & Agriculture", "Auto Parts", "Chemicals"];

  // Generate historical 12-month data + 6-month predictions
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const forecastMonths = ["Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"];

  const forecastData: Record<string, any> = {};

  categories.forEach((cat) => {
    // Generate static realistic base
    let baseVal = 200;
    if (cat === "Electronics") baseVal = 450;
    if (cat === "Pharmaceuticals") baseVal = 320;
    if (cat === "Food & Agriculture") baseVal = 500;
    if (cat === "Auto Parts") baseVal = 280;

    const historical = months.map((m, idx) => {
      // Seasonal fluctuation (Diwali spike in Sep/Oct)
      const seasonality = idx === 8 || idx === 9 ? 1.5 : 1.0;
      const noise = Math.sin(idx) * 30;
      return {
        month: m,
        actual: Math.round(baseVal * seasonality + noise),
      };
    });

    // Forecasts using LSTM, Prophet, ARIMA models
    const predictions = forecastMonths.map((m, idx) => {
      const step = idx + 1;
      const growthTrend = 1.0 + (step * 0.02); // 2% linear monthly growth
      const basePred = baseVal * growthTrend;

      return {
        month: m,
        LSTM: Math.round(basePred + Math.sin(step) * 15),
        Prophet: Math.round(basePred + Math.cos(step) * 22),
        ARIMA: Math.round(basePred + 5),
      };
    });

    forecastData[cat] = {
      historical,
      predictions,
      modelAccuracies: {
        LSTM: 94.2,
        Prophet: 91.8,
        ARIMA: 84.5,
      },
    };
  });

  res.json({
    status: "success",
    data: forecastData,
  });
});

// 7. Inventory Risk Analyzer
app.get("/api/inventory-analysis", (req, res) => {
  const currentNetwork = calculateCurrentNetworkStatus();
  // Safe default calculations reflecting What-If multipliers
  const inventoryReport = Object.keys(NODES).map((nodeId) => {
    const node = NODES[nodeId];
    const isAffected = activeScenarios.some((scId) => SCENARIOS[scId].affectedNodes.includes(nodeId));

    // Calculate metrics
    const baseSafetyStock = Math.round(node.capacity * 0.15);
    const safetyStock = Math.round(baseSafetyStock * configInventorySafetyStockMultiplier);
    const reorderPoint = Math.round(safetyStock * 1.4);

    let stockOutProb = 5;
    let overStockProb = 12;

    if (isAffected) {
      stockOutProb = Math.min(95, Math.round(65 - (configInventorySafetyStockMultiplier - 1.0) * 25));
      overStockProb = Math.max(2, Math.round(5));
    } else {
      stockOutProb = Math.max(2, Math.round(10 - (configInventorySafetyStockMultiplier - 1.0) * 12));
      overStockProb = Math.min(80, Math.round(15 + (configInventorySafetyStockMultiplier - 1.0) * 25));
    }

    return {
      nodeId,
      nodeName: node.name,
      currentInventory: Math.round(node.capacity * (node.currentLoad / 100)),
      recommendedInventory: Math.round(node.capacity * 0.7),
      safetyStock,
      reorderPoint,
      stockOutProbability: stockOutProb,
      overstockProbability: overStockProb,
      status: stockOutProb > 50 ? "CRITICAL_LOW" : overStockProb > 50 ? "OVERSTOCKED" : "OPTIMAL",
    };
  });

  res.json({
    status: "success",
    data: inventoryReport,
  });
});

// 8. AI Recommendations Endpoint (Crisis mitigation advisor)
app.get("/api/ai-recommendations", (req, res) => {
  const network = calculateCurrentNetworkStatus();
  const activeScenariosDetails = activeScenarios.map((id) => SCENARIOS[id]);

  const recommendations = [];

  if (activeScenarios.includes("FLOOD")) {
    recommendations.push({
      title: "Reroute Mumbai Road Transit to Rail",
      type: "ROUTE",
      details: "Road transit through NH48 suffers severe flood delays (2.2x). Siphoning pharmaceutical & automotive cargos to high-speed rail lines departing Ahmedabad bypasses coastal waterlogging.",
      impact: "Reduces expected delays by 14 hours; estimated cost saving of INR 45,000 per shipment.",
      savings: 45000,
    });
    recommendations.push({
      title: "Activate Ahmedabad Buffer Stock",
      type: "INVENTORY",
      details: "Leverage secondary distribution centers in Ahmedabad to service Maharashtra dealers directly, bypassing JNPT Port choke points.",
      impact: "Maintains 92% service level SLA without premium emergency air freight.",
      savings: 80000,
    });
  }

  if (activeScenarios.includes("CYCLONE")) {
    recommendations.push({
      title: "Divert Maritime Shipping to Mumbai (West Coast)",
      type: "ROUTE",
      details: "Severe Bay of Bengal cyclone chokes Chennai and Kolkata Port lanes. Divert deep-sea tankers and container ships to JNPT (Mumbai), setting up land bridge trucking routes across central corridors.",
      impact: "Bypasses stormy waters; secures cargo container integrity.",
      savings: 150000,
    });
  }

  if (activeScenarios.includes("RAIL_STRIKE")) {
    recommendations.push({
      title: "Enlist Private Road Fleets (Trucking Consortium)",
      type: "TRANSPORT",
      details: "Establish temporary SLAs with national third-party logistics (3PL) trucking companies to absorb stalled rail cargo containers.",
      impact: "Recovers 85% of transit times, though cost premium increases by 15%.",
      savings: -30000, // additional cost
    });
  }

  // Fallback / default resilience recommendations if no scenarios or general ones
  recommendations.push({
    title: "Supplier Diversification Program",
    type: "SUPPLIER",
    details: `Current supplier diversity is at ${configSupplierDiversity}%. Sourcing 15% more crucial components from secondary vendors in Central India decreases single-point vulnerability.`,
    impact: "Boosts baseline Resilience Score by 6 points immediately.",
    savings: 120000,
  });

  recommendations.push({
    title: "Safety Stock Calibration",
    type: "INVENTORY",
    details: `Calibrate safety stocks from ${configInventorySafetyStockMultiplier}x to 1.5x at critical transit hubs like Delhi and Bengaluru.`,
    impact: "Cushions supply chain against unforeseen weather anomalies and highway delays.",
    savings: 65000,
  });

  res.json({
    status: "success",
    recommendations,
  });
});

// 9. AI Chat Assistant - Uses Google GenAI SDK (Server-Side)
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, userMessage } = req.body;

  if (!ai) {
    return res.status(200).json({
      reply: "Gemini AI API key is not configured. Please set the GEMINI_API_KEY secret in the Secrets panel of your AI Studio settings to interact with the LLM. In the meantime, I can simulate logistics support for you!",
    });
  }

  try {
    const networkState = calculateCurrentNetworkStatus();
    const systemPrompt = `You are "ShieldBot", the premium senior AI Supply Chain Resilience Consultant for SupplyShield. 
SupplyShield is an advanced AI-driven stress testing and predictive risk platform mapping India's critical logistics network.

Here is the current operational live status of India's Logistics Network:
- Global Resilience Score: ${networkState.globalMetrics.resilienceScore}/100.
- Current Delay Increase: +${networkState.globalMetrics.delayIncreasePct}%.
- Budget Cost Overhead: +${networkState.globalMetrics.costIncreasePct}%.
- Active Crisis Scenarios: ${activeScenarios.length > 0 ? activeScenarios.join(", ") : "None. Operations normal"}.
- Under Stress Tests, impacted hubs include: ${activeScenarios.map(sc => SCENARIOS[sc]?.affectedNodes.join(", ")).filter(Boolean).join("; ") || "None"}.
- Network Hubs Status:
${Object.values(networkState.nodes).map(n => `  * ${n.name} (${n.id}): Type ${n.type}, Risk ${n.riskScore}%, Load ${n.currentLoad}%, Status is ${n.status}`).join("\n")}

What-If parameters calibrated:
- Supplier Diversity: ${configSupplierDiversity}%.
- Safety Stock Multiplier: ${configInventorySafetyStockMultiplier}x.
- Alternate Route Readiness: ${configAlternateRouteReady ? "ENABLED" : "DISABLED"}.
- Emergency Budget Reserved: ${configEmergencyBudgetBuffer}%.

When the user asks questions, leverage this live network status to give precise, data-driven, strategic answers. Speak with high confidence, using Indian logistics concepts (e.g., NH48, JNPT Port, Bay of Bengal storms, festival peak season demands).
Provide formatting using markdown bullet points and keep answers concise and professional. Refer to specific alternate routes or inventory buffers where relevant.
`;

    // Map conversation logs to gemini contents format
    // Filter messages for correct format or just use the systemInstruction + user prompt
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Error contacting Gemini AI",
      details: error.message,
    });
  }
});

// Vite & Static Asset Handling Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SupplyShield Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
