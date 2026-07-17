export interface LogisticsNode {
  id: string;
  name: string;
  type: "hub" | "port" | "airport" | "warehouse" | "plant";
  lat: number;
  lng: number;
  capacity: number;
  currentLoad: number;
  riskScore: number;
  efficiency: number;
  status: "active" | "delayed" | "disrupted";
}

export interface LogisticsEdge {
  source: string;
  target: string;
  distance: number;
  mode: "road" | "rail" | "air" | "sea";
  baseTime: number;
  baseCost: number;
  co2: number;
  reliability: number;
  highwayCode?: string;
}

export interface GlobalMetrics {
  resilienceScore: number;
  delayIncreasePct: number;
  costIncreasePct: number;
  carbonEmissionPct: number;
  inventoryShortageRisk: number;
  activeAlertsCount: number;
}

export interface NetworkStatus {
  nodes: Record<string, LogisticsNode>;
  edges: LogisticsEdge[];
  globalMetrics: GlobalMetrics;
}

export interface Recommendation {
  title: string;
  type: "ROUTE" | "INVENTORY" | "TRANSPORT" | "SUPPLIER";
  details: string;
  impact: string;
  savings: number;
}

export interface ModelMetrics {
  predictedDelayHours: number;
  probability: number;
  riskCategory: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  accuracy: number;
  featureImportance: Record<string, number>;
}

export interface PredictRiskResult {
  input: {
    source: string;
    destination: string;
    cargoType: string;
    transportMode: string;
    priority: string;
    date: string;
  };
  summary: {
    delayProbability: number;
    expectedDelayHours: number;
    riskScore: number;
    confidenceLevel: number;
    optimalModel: string;
  };
  compareModels: Record<string, ModelMetrics>;
}

export interface RouteOptimizationResult {
  source: string;
  destination: string;
  metricUsed: string;
  dijkstra: {
    path: string[];
    cost: number;
    metricLabel: string;
  };
  aStar: {
    path: string[];
    cost: number;
    visitedNodes: number;
  };
  geneticTSP: {
    description: string;
    path: string[];
    totalDistanceKm: number;
    generationsHistory: { gen: number; bestDistance: number }[];
  };
}

export interface ForecastPoint {
  month: string;
  actual?: number;
  LSTM?: number;
  Prophet?: number;
  ARIMA?: number;
}

export interface CategoryForecast {
  historical: ForecastPoint[];
  predictions: ForecastPoint[];
  modelAccuracies: {
    LSTM: number;
    Prophet: number;
    ARIMA: number;
  };
}

export interface InventoryItem {
  nodeId: string;
  nodeName: string;
  currentInventory: number;
  recommendedInventory: number;
  safetyStock: number;
  reorderPoint: number;
  stockOutProbability: number;
  overstockProbability: number;
  status: "CRITICAL_LOW" | "OVERSTOCKED" | "OPTIMAL";
}
