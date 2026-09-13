"""
Module 2: LLM Disruption Simulator
Sends 7 India-specific disruption scenarios to the Gemini API and collects
structured JSON impact reports. Falls back to pre-computed responses when
the API is unavailable.
Output: outputs/disruption_results.json
"""

import os
import json
import time

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Scenario definitions
# ---------------------------------------------------------------------------
SCENARIOS = [
    {
        "id": "PORT_STRIKE",
        "title": "JNPT Mumbai Dock Strike",
        "description": "JNPT dock workers launch an indefinite strike, halting all container operations at India's busiest port.",
        "severity": 8,
        "primary_node": "JNPT_MUMBAI",
        "affected_region": "Western India",
    },
    {
        "id": "KERALA_FLOODS",
        "title": "Kerala Monsoon Mega-Floods",
        "description": "Unprecedented monsoon flooding across Kerala disrupts road, rail, and air connectivity in southern India.",
        "severity": 9,
        "primary_node": "KOCHI_CITY",
        "affected_region": "South India",
    },
    {
        "id": "PUNE_FACTORY_FIRE",
        "title": "Pune Auto Cluster Fire",
        "description": "A major fire devastates multiple automotive component factories in the Pune Auto Cluster, disrupting OEM supply chains.",
        "severity": 7,
        "primary_node": "PUNE_AUTO",
        "affected_region": "Pune/Maharashtra",
    },
    {
        "id": "DFC_DERAILMENT",
        "title": "Dedicated Freight Corridor Derailment",
        "description": "A critical multi-train derailment on the Delhi-Mumbai DFC blocks freight movement for an extended period.",
        "severity": 8,
        "primary_node": "DELHI_DFC",
        "affected_region": "North-West corridor",
    },
    {
        "id": "CYCLONE_BAY_OF_BENGAL",
        "title": "Cyclone — Bay of Bengal",
        "description": "A Category 5 cyclone makes landfall near Visakhapatnam, devastating east coast ports, roads, and logistics infrastructure.",
        "severity": 9,
        "primary_node": "VIZAG_PORT",
        "affected_region": "East Coast India",
    },
    {
        "id": "CHINA_SEMICONDUCTOR_BAN",
        "title": "China Semiconductor Trade Ban",
        "description": "Geopolitical tensions trigger an abrupt Chinese ban on semiconductor exports to India, starving electronics manufacturing.",
        "severity": 6,
        "primary_node": "NOIDA_ELECTRONICS",
        "affected_region": "National",
    },
    {
        "id": "FUEL_CRISIS",
        "title": "National Fuel Shortage",
        "description": "A global oil supply shock combined with refinery issues creates severe diesel and petrol shortages across India.",
        "severity": 6,
        "primary_node": "NH48_DISTRIBUTION",
        "affected_region": "National",
    },
]

# ---------------------------------------------------------------------------
# Fallback pre-computed responses (used when API is unavailable)
# ---------------------------------------------------------------------------
FALLBACK_RESPONSES = {
    "PORT_STRIKE": {
        "scenario_id": "PORT_STRIKE",
        "scenario_title": "JNPT Mumbai Dock Strike",
        "node_impacts": [
            {"node_id": "JNPT_MUMBAI",    "severity_pct": 95, "impact_type": "operational_halt",   "description": "Complete suspension of container loading/unloading operations"},
            {"node_id": "MUMBAI_CITY",    "severity_pct": 60, "impact_type": "supply_disruption",  "description": "Consumer goods shortage begins within 72 hours"},
            {"node_id": "PUNE_AUTO",      "severity_pct": 70, "impact_type": "production_slowdown","description": "Imported component inventory depleted in 5–7 days"},
            {"node_id": "MUMBAI_RAIL",    "severity_pct": 40, "impact_type": "congestion",         "description": "Rail terminals overwhelmed by diverted cargo"},
            {"node_id": "MUNDRA_PORT",    "severity_pct": 55, "impact_type": "overflow_demand",    "description": "Surge in vessels diverting from JNPT strains capacity"},
        ],
        "cascade_risk_nodes": ["MUMBAI_CITY", "PUNE_AUTO", "MUNDRA_PORT", "MUMBAI_RAIL", "NH48_DISTRIBUTION"],
        "affected_sectors": ["Automotive", "Electronics", "Consumer Goods", "Pharmaceuticals"],
        "economic_loss_crore": 8500,
        "cascade_timeline": {
            "day_1":  "Port operations suspended; 120+ vessels anchored offshore; perishables at risk",
            "day_3":  "Pune auto cluster reports 30% production slowdown; Mumbai retail shelves thinning",
            "day_7":  "₹8,500 crore loss estimate; electronics imports halted; Mundra nearing full capacity",
            "day_14": "National automotive output drops 18%; emergency import route via Chennai activated",
            "day_30": "Supply chain partially restored via Mundra/Chennai; JNPT backlog cleared 40%",
        },
        "resilience_actions": [
            "Immediately divert container vessels to Mundra Port",
            "Activate emergency rail freight corridor Mumbai–Pune",
            "Release strategic petroleum reserves to maintain fuel supply",
            "Fast-track air freight for critical electronics components",
            "Invoke Essential Services Maintenance Act to end strike",
        ],
    },
    "KERALA_FLOODS": {
        "scenario_id": "KERALA_FLOODS",
        "scenario_title": "Kerala Monsoon Mega-Floods",
        "node_impacts": [
            {"node_id": "KOCHI_CITY",       "severity_pct": 90, "impact_type": "infrastructure_damage", "description": "City under 2–4 m floodwater; port and airport closed"},
            {"node_id": "BENGALURU_KIA",    "severity_pct": 50, "impact_type": "capacity_reduction",    "description": "Diverted traffic from Kochi overwhelms Bengaluru cargo hub"},
            {"node_id": "CHENNAI_PORT",     "severity_pct": 35, "impact_type": "overflow_demand",       "description": "Kerala-bound shipments re-routed via Chennai"},
            {"node_id": "BENGALURU_CITY",   "severity_pct": 45, "impact_type": "supply_disruption",     "description": "NH544 blocked; Bengaluru logistics severely constrained"},
        ],
        "cascade_risk_nodes": ["KOCHI_CITY", "BENGALURU_CITY", "CHENNAI_PORT", "BENGALURU_KIA"],
        "affected_sectors": ["Spices & Agriculture", "Fisheries", "Tourism", "IT Services Logistics"],
        "economic_loss_crore": 12000,
        "cascade_timeline": {
            "day_1":  "Kochi airport shut; Cochin port suspended; 2.3 lakh people displaced",
            "day_3":  "NH544 and NH66 blocked; Kerala isolated from road freight network",
            "day_7":  "₹12,000 crore damage; food and medicine airlifts from IAF bases",
            "day_14": "Partial road restoration; Kochi port operating at 30% capacity",
            "day_30": "Flood waters receding; full logistics restoration expected in 60 days",
        },
        "resilience_actions": [
            "Pre-position emergency goods stockpiles in Bengaluru and Coimbatore",
            "Activate Mangalore Port as backup for Kerala cargo",
            "Deploy IAF aircraft for humanitarian and critical goods supply",
            "Divert sea freight to Chennai and Tuticorin ports",
            "Establish temporary road bypass via Palakkad corridor",
        ],
    },
    "PUNE_FACTORY_FIRE": {
        "scenario_id": "PUNE_FACTORY_FIRE",
        "scenario_title": "Pune Auto Cluster Fire",
        "node_impacts": [
            {"node_id": "PUNE_AUTO",     "severity_pct": 80, "impact_type": "production_halt",    "description": "60% of cluster capacity destroyed; 18 factories affected"},
            {"node_id": "MUMBAI_CITY",   "severity_pct": 30, "impact_type": "supply_disruption",  "description": "Auto-component supply to Mumbai OEMs disrupted"},
            {"node_id": "JNPT_MUMBAI",   "severity_pct": 25, "impact_type": "export_decline",     "description": "Auto-export volumes drop 35% as components unavailable"},
            {"node_id": "DELHI_NCR",     "severity_pct": 20, "impact_type": "supply_disruption",  "description": "Maruti, Hero, and Tata face component shortages from Pune"},
        ],
        "cascade_risk_nodes": ["PUNE_AUTO", "MUMBAI_CITY", "JNPT_MUMBAI", "DELHI_NCR"],
        "affected_sectors": ["Automotive", "Auto-Components", "Insurance"],
        "economic_loss_crore": 4200,
        "cascade_timeline": {
            "day_1":  "Fire controlled after 18 hours; 6 factories completely gutted; 3,200 workers displaced",
            "day_3":  "OEM production lines at Maruti, Tata begin halting due to missing components",
            "day_7":  "₹4,200 crore estimated loss; auto production nationally down 12%",
            "day_14": "Emergency imports from Thailand and South Korea; spot prices +40%",
            "day_30": "Temporary production restored at 50%; full recovery estimated 4–6 months",
        },
        "resilience_actions": [
            "Activate Chennai Auto Corridor for emergency component sourcing",
            "Fast-track insurance claims to accelerate factory rebuilding",
            "Import critical components from Thailand, South Korea via air freight",
            "Distribute production across Chakan and Nasik clusters",
            "Establish shared component inventory buffer across OEMs",
        ],
    },
    "DFC_DERAILMENT": {
        "scenario_id": "DFC_DERAILMENT",
        "scenario_title": "Dedicated Freight Corridor Derailment",
        "node_impacts": [
            {"node_id": "DELHI_DFC",       "severity_pct": 85, "impact_type": "operational_halt",  "description": "Northern DFC section blocked for 72+ hours"},
            {"node_id": "MUMBAI_RAIL",     "severity_pct": 60, "impact_type": "capacity_reduction", "description": "DFC traffic diverted to conventional rail; severe congestion"},
            {"node_id": "AHMEDABAD_RAIL",  "severity_pct": 55, "impact_type": "congestion",         "description": "Freight queues backing up 200 km on conventional lines"},
            {"node_id": "JNPT_MUMBAI",     "severity_pct": 40, "impact_type": "supply_disruption",  "description": "Rail-dependent imports piling up at JNPT unable to clear"},
            {"node_id": "NOIDA_ELECTRONICS","severity_pct": 45, "impact_type": "input_shortage",    "description": "Component delivery from ports delayed 4–6 days"},
        ],
        "cascade_risk_nodes": ["DELHI_DFC", "MUMBAI_RAIL", "AHMEDABAD_RAIL", "JNPT_MUMBAI", "NOIDA_ELECTRONICS"],
        "affected_sectors": ["Manufacturing", "FMCG", "Coal & Power", "Fertilizers"],
        "economic_loss_crore": 6800,
        "cascade_timeline": {
            "day_1":  "Derailment at Palanpur section; 34 wagons off track; DFC halted both directions",
            "day_3":  "Conventional rail overwhelmed; coal power plants flagging 3-day inventory",
            "day_7":  "₹6,800 crore loss; FMCG distribution disrupted nationally",
            "day_14": "DFC partially restored; backlog clearance begins",
            "day_30": "Full DFC operations restored; best practices review mandated",
        },
        "resilience_actions": [
            "Immediately divert freight to NH48 road corridor (emergency trucking mobilisation)",
            "Restore conventional rail network to full freight priority",
            "Air-freight critical components for electronics manufacturers",
            "Pre-position coal stockpiles at power stations to 15-day buffer",
            "Deploy NDRF and RVNL emergency restoration teams round-the-clock",
        ],
    },
    "CYCLONE_BAY_OF_BENGAL": {
        "scenario_id": "CYCLONE_BAY_OF_BENGAL",
        "scenario_title": "Cyclone — Bay of Bengal",
        "node_impacts": [
            {"node_id": "VIZAG_PORT",    "severity_pct": 92, "impact_type": "infrastructure_damage", "description": "Port completely shut; 3 berths structurally damaged"},
            {"node_id": "KOLKATA_PORT",  "severity_pct": 65, "impact_type": "capacity_reduction",    "description": "Operating at 35% capacity under strong winds and surge"},
            {"node_id": "KOLKATA_CITY",  "severity_pct": 55, "impact_type": "supply_disruption",     "description": "Last-mile logistics paralysed; city cut off from road freight"},
            {"node_id": "GUWAHATI_CITY", "severity_pct": 50, "impact_type": "isolation",             "description": "North-East India cut off as NH16 and rail lines washed out"},
            {"node_id": "HYD_RGIA",      "severity_pct": 40, "impact_type": "capacity_reduction",    "description": "Airport temporarily closed; cargo diverts to Bengaluru"},
        ],
        "cascade_risk_nodes": ["VIZAG_PORT", "KOLKATA_PORT", "KOLKATA_CITY", "GUWAHATI_CITY", "HYD_RGIA"],
        "affected_sectors": ["Fisheries", "Agriculture", "Steel & Mining", "Pharmaceuticals"],
        "economic_loss_crore": 15000,
        "cascade_timeline": {
            "day_1":  "Cyclone makes landfall at 220 kmph; Visakhapatnam port devastated; 8 lakh evacuated",
            "day_3":  "NH16 blocked by debris; North-East India supply chain severed; Odisha steel plants shuttered",
            "day_7":  "₹15,000 crore loss; 40% of east coast logistics offline",
            "day_14": "Vizag port emergency operations begin; Kolkata handling overflow",
            "day_30": "Partial restoration; full reconstruction of Vizag berths 6–8 months",
        },
        "resilience_actions": [
            "Divert eastern seaboard cargo to Kolkata and Paradip Port",
            "Airlift critical medicines and food to North-East India",
            "Deploy Navy vessels for coastal relief and cargo runs",
            "Accelerate NH16 debris clearance with NHAI emergency contractor network",
            "Activate Kolkata as primary eastern gateway with temporary berth expansion",
        ],
    },
    "CHINA_SEMICONDUCTOR_BAN": {
        "scenario_id": "CHINA_SEMICONDUCTOR_BAN",
        "scenario_title": "China Semiconductor Trade Ban",
        "node_impacts": [
            {"node_id": "NOIDA_ELECTRONICS","severity_pct": 75, "impact_type": "input_shortage",    "description": "60% of chip supply cut off; production lines at risk in 14 days"},
            {"node_id": "DELHI_IGI",        "severity_pct": 30, "impact_type": "volume_decline",    "description": "Electronics import volumes collapse at air cargo terminal"},
            {"node_id": "JNPT_MUMBAI",      "severity_pct": 35, "impact_type": "volume_decline",    "description": "Sea freight electronics imports drop 40%"},
            {"node_id": "BENGALURU_CITY",   "severity_pct": 40, "impact_type": "production_impact", "description": "IT hardware assembly and telecom equipment manufacturing disrupted"},
        ],
        "cascade_risk_nodes": ["NOIDA_ELECTRONICS", "BENGALURU_CITY", "DELHI_IGI", "JNPT_MUMBAI"],
        "affected_sectors": ["Consumer Electronics", "Telecom", "Semiconductors", "Defence Electronics"],
        "economic_loss_crore": 22000,
        "cascade_timeline": {
            "day_1":  "Ban announced; ₹22,000 crore in annual semiconductor imports at risk; Sensex falls 3%",
            "day_3":  "Chip brokers activate Taiwan, South Korea, US supply routes at 2–3× premium",
            "day_7":  "Mobile phone and laptop production slows; consumer prices rising",
            "day_14": "Emergency bilateral deals signed with Taiwan and Japan",
            "day_30": "Alternate supply chains partially established; semiconductor self-sufficiency drive accelerated",
        },
        "resilience_actions": [
            "Fast-track diplomatic outreach to Taiwan, South Korea, US for alternative supply agreements",
            "Activate PLI scheme for domestic semiconductor wafer fabrication (₹76,000 crore)",
            "Divert defence electronics to priority domestic production",
            "Build 90-day strategic semiconductor stockpile at government level",
            "Incentivise TSMC, Intel, Samsung to establish India fabs under emergency timeline",
        ],
    },
    "FUEL_CRISIS": {
        "scenario_id": "FUEL_CRISIS",
        "scenario_title": "National Fuel Shortage",
        "node_impacts": [
            {"node_id": "NH48_DISTRIBUTION","severity_pct": 70, "impact_type": "operational_constraint","description": "Trucking fleet grounded by 50% due to diesel unavailability"},
            {"node_id": "MUMBAI_CITY",      "severity_pct": 45, "impact_type": "supply_disruption",     "description": "Last-mile delivery collapse; retail shelves thinning"},
            {"node_id": "DELHI_NCR",        "severity_pct": 45, "impact_type": "supply_disruption",     "description": "Food and essential goods distribution severely curtailed"},
            {"node_id": "JNPT_MUMBAI",      "severity_pct": 35, "impact_type": "capacity_reduction",    "description": "Port equipment and yard tractors running on emergency reserves"},
            {"node_id": "DELHI_DFC",        "severity_pct": 30, "impact_type": "capacity_reduction",    "description": "Freight train frequency cut 25% due to locomotive fuel constraints"},
        ],
        "cascade_risk_nodes": ["NH48_DISTRIBUTION", "MUMBAI_CITY", "DELHI_NCR", "JNPT_MUMBAI", "NAGPUR_WAREHOUSE"],
        "affected_sectors": ["FMCG", "Agriculture & Food", "Trucking", "Aviation"],
        "economic_loss_crore": 9500,
        "cascade_timeline": {
            "day_1":  "Petrol pump queues; trucking associations announce partial strike over fuel prices",
            "day_3":  "Vegetable and dairy prices spike 25%; hospitals activate fuel priority protocols",
            "day_7":  "₹9,500 crore GDP impact; essential goods corridors declared priority",
            "day_14": "Emergency oil imports arrive; rationing system for transport sector implemented",
            "day_30": "Fuel supply normalises; GDP recovery begins; EV fleet adoption accelerated",
        },
        "resilience_actions": [
            "Release 15-day strategic petroleum reserves immediately",
            "Declare essential goods trucking corridors with priority fuel access",
            "Emergency crude oil purchase from Middle East at spot prices",
            "Temporarily suspend fuel export quotas to prioritise domestic supply",
            "Accelerate EV adoption in logistics with emergency subsidies to fleet operators",
        ],
    },
}


def build_prompt(scenario: dict) -> str:
    return f"""You are an expert supply chain analyst specializing in India's logistics infrastructure.

Analyze the following disruption scenario and provide a detailed impact assessment in strict JSON format.

SCENARIO:
- ID: {scenario['id']}
- Title: {scenario['title']}  
- Description: {scenario['description']}
- Severity: {scenario['severity']}/10
- Primary affected node: {scenario['primary_node']}
- Affected region: {scenario['affected_region']}

INDIA SUPPLY CHAIN NODES (for reference):
Ports: JNPT_MUMBAI, MUNDRA_PORT, CHENNAI_PORT, VIZAG_PORT, KOLKATA_PORT
Airports: DELHI_IGI, MUMBAI_CSIA, BENGALURU_KIA, HYD_RGIA
Rail Hubs: DELHI_DFC, MUMBAI_RAIL, AHMEDABAD_RAIL
Factories: PUNE_AUTO, CHENNAI_AUTO, NOIDA_ELECTRONICS, SURAT_TEXTILES
Warehouses: NAGPUR_WAREHOUSE, NH48_DISTRIBUTION, LUDHIANA_COLD
Cities: DELHI_NCR, MUMBAI_CITY, BENGALURU_CITY, KOLKATA_CITY, HYDERABAD_CITY, CHENNAI_CITY, AHMEDABAD_CITY, JAIPUR_CITY, LUCKNOW_CITY, KOCHI_CITY, GUWAHATI_CITY

Return ONLY valid JSON matching this exact schema (no markdown, no commentary):
{{
  "scenario_id": "{scenario['id']}",
  "scenario_title": "{scenario['title']}",
  "node_impacts": [
    {{"node_id": "NODE_ID", "severity_pct": 0-100, "impact_type": "string", "description": "string"}}
  ],
  "cascade_risk_nodes": ["NODE_ID_LIST"],
  "affected_sectors": ["sector names"],
  "economic_loss_crore": number,
  "cascade_timeline": {{
    "day_1": "what happens on day 1",
    "day_3": "what happens by day 3",
    "day_7": "what happens by day 7",
    "day_14": "what happens by day 14",
    "day_30": "what happens by day 30"
  }},
  "resilience_actions": ["action 1", "action 2", "action 3", "action 4", "action 5"]
}}"""


def call_gemini(prompt: str) -> dict | None:
    """Call Gemini API and return parsed JSON dict, or None on failure."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        print(f"    [WARN] Gemini API error: {e}")
        return None


def simulate_scenario(scenario: dict) -> dict:
    """Run a single scenario through Gemini (with fallback)."""
    sid = scenario["id"]
    print(f"  Scenario: {scenario['title']} (severity {scenario['severity']}/10)")

    result = call_gemini(build_prompt(scenario))
    if result is not None:
        print(f"    ✅ Gemini API response received")
    else:
        result = FALLBACK_RESPONSES[sid].copy()
        print(f"    ℹ️  Using pre-computed fallback response")

    result["severity"] = scenario["severity"]
    result["primary_node"] = scenario["primary_node"]
    result["affected_region"] = scenario["affected_region"]
    return result


def run():
    print("=" * 60)
    print("Module 2: LLM Disruption Simulator")
    print("=" * 60)

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if api_key and api_key != "MY_GEMINI_API_KEY":
        print(f"\n✅ Gemini API key detected — live LLM mode active")
    else:
        print(f"\nℹ️  No valid API key — using fallback pre-computed responses")

    results = {}
    for i, scenario in enumerate(SCENARIOS, 1):
        print(f"\n[{i}/{len(SCENARIOS)}] ", end="")
        results[scenario["id"]] = simulate_scenario(scenario)
        if i < len(SCENARIOS):
            time.sleep(1)  # rate-limiting politeness

    out_path = os.path.join(OUTPUT_DIR, "disruption_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Module 2 complete.")
    print(f"   Scenarios processed: {len(results)}")
    print(f"   Saved: {out_path}")
    return results


if __name__ == "__main__":
    run()
