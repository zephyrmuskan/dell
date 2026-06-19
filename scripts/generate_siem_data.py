import os
import json
import random
from datetime import datetime, timedelta
from faker import Faker

# Try to import datasets
try:
    from datasets import load_dataset
    HAS_DATASETS = True
except Exception:
    HAS_DATASETS = False

fake = Faker()

# Define fallsbacks if HF download fails
FALLBACK_THREATS = [
    {
        "event_id": "evt-77823-x",
        "event_type": "endpoint",
        "meta_risk_score": 0.87,
        "meta_confidence": 0.89,
        "severity": "Critical",
        "description": "Suspicious shell execution spawning process net.exe under user SYSTEM",
        "raw_log": "EndpointLog: host=DEV1248 msg='unusual child process net.exe spawned by cmd.exe parent svchost.exe'",
        "user": "SYSTEM",
        "device_id": "DEV1248",
        "meta_geo_location": "New York, USA",
        "mitre_technique": "T1059.003 - Command and Scripting Interpreter: Windows Shell"
    },
    {
        "event_id": "evt-04511-k",
        "event_type": "cloud",
        "meta_risk_score": 0.72,
        "meta_confidence": 0.65,
        "severity": "High",
        "description": "Critical vulnerability exposure (CVE-2026-1049) detected on public subnet",
        "raw_log": "CloudAudit: service=AWS-EC2 instance=SRV-0451 status=EXPOSED method=TCP-3389",
        "user": "ubuntu",
        "device_id": "SRV-0451",
        "meta_geo_location": "Virginia, USA",
        "mitre_technique": "T1190 - Exploit Public-Facing Application"
    },
    {
        "event_id": "evt-12489-y",
        "event_type": "auth",
        "meta_risk_score": 0.64,
        "meta_confidence": 0.60,
        "severity": "Medium",
        "description": "Impossible travel login detected: Simultaneous session in US and UK",
        "raw_log": "AuthLog: user=USR-7782 status=SUCCESS location_1='Chicago, US' location_2='London, UK'",
        "user": "USR-7782",
        "device_id": "USR-7782-Session",
        "meta_geo_location": "London, UK",
        "mitre_technique": "T1148 - Impossible Travel Behavior"
    }
]

def load_siem_dataset():
    """Load darkknight25/Advanced_SIEM_Dataset or fallback to generated SIEM records."""
    if not HAS_DATASETS:
        print("[!] HF datasets library not available. Using synthetic schema data.")
        return FALLBACK_THREATS

    print("[*] Attempting to download darkknight25/Advanced_SIEM_Dataset from Hugging Face...")
    try:
        # Load train split of the dataset
        ds = load_dataset("darkknight25/Advanced_SIEM_Dataset", split="train")
        df = ds.to_pandas()
        
        # Flattened dataset processing
        print(f"[+] Successfully loaded dataset. Total records: {len(df)}")
        
        # Sample interesting records matching our requirements
        processed_threats = []
        
        # Look for Critical, High, Medium severity threats across categories
        for s_level in ["Critical", "High", "Medium"]:
            sub_df = df[df["severity"].str.lower() == s_level.lower()] if "severity" in df.columns else df
            if len(sub_df) == 0:
                sub_df = df
            
            # Select 1 record
            sample_row = sub_df.sample(n=1).iloc[0]
            
            # Build threat record mapping
            processed_threats.append({
                "event_id": str(sample_row.get("event_id", fake.uuid4())),
                "event_type": str(sample_row.get("event_type", "endpoint")),
                "meta_risk_score": float(sample_row.get("meta_risk_score", random.uniform(0.5, 0.95))),
                "meta_confidence": float(sample_row.get("meta_confidence", random.uniform(0.55, 0.90))),
                "severity": s_level,
                "description": str(sample_row.get("description", "Potential SIEM security anomaly")),
                "raw_log": str(sample_row.get("raw_log", fake.sentence())),
                "user": str(sample_row.get("user", fake.user_name())),
                "device_id": str(sample_row.get("device_id", fake.hostname())),
                "meta_geo_location": str(sample_row.get("meta_geo_location", fake.city())),
                "mitre_technique": str(sample_row.get("additional_info", "T1059 - Command Execution"))
            })
            
        return processed_threats

    except Exception as e:
        print(f"[!] Could not download or process Hugging Face dataset ({e}).")
        print("[!] Falling back to local high-fidelity SIEM mock schema...")
        return FALLBACK_THREATS

def generate_faker_telemetry(device_id):
    """Generate Faker simulated telemetry logs for device."""
    telemetry = []
    # 5 random background system events
    for _ in range(5):
        event_time = (datetime.now() - timedelta(minutes=random.randint(10, 60))).strftime("%H:%M:%S")
        ip = fake.ipv4_private()
        processes = ["chrome.exe", "svchost.exe", "powershell.exe", "msmpeng.exe", "explorer.exe"]
        telemetry.append(f"Telemetry [{event_time}]: host={device_id} proc={random.choice(processes)} conn={ip} status=ACTIVE cpu={random.randint(1, 12)}% mem={random.randint(10, 70)}%")
    return telemetry

def generate_faker_patch_events(device_id):
    """Generate patch events using Faker."""
    patches = []
    for _ in range(2):
        event_time = (datetime.now() - timedelta(days=random.randint(1, 6))).strftime("%Y-%m-%d %H:%M:%S")
        patch_id = f"KB{random.randint(5000000, 5099999)}"
        patches.append(f"PatchHistory [{event_time}]: host={device_id} patch={patch_id} status=INSTALLED result=SUCCESS")
    return patches

def main():
    # Load dataset
    threat_records = load_siem_dataset()
    
    # We want exactly 3 main recommendations matching our 3 dashboard devices:
    # 1. DEV1248 (Quarantine Device - Critical)
    # 2. SRV-0451 (Patch Deployment - High)
    # 3. USR-7782 (Security Escalation - Medium)
    
    target_recommendations = []
    ids = ["DEV1248", "SRV-0451", "USR-7782"]
    types = ["Endpoint Device", "Server", "User Account"]
    actions = ["Quarantine Device", "Patch Deployment", "Security Escalation"]
    sources_list = [
        ["Security Logs", "Telemetry"],
        ["Vulnerability DB", "Telemetry"],
        ["Auth Logs", "Directory"]
    ]
    
    for idx, threat in enumerate(threat_records):
        # Override metadata to fit our 3 screens flow
        dev_id = ids[idx]
        dev_type = types[idx]
        action = actions[idx]
        sources = sources_list[idx]
        
        # Calculate scores
        conf_pct = int(threat["meta_confidence"] * 100)
        risk_pct = int(threat["meta_risk_score"] * 100)
        
        # Synthesize explainable AI reasoning checklist
        why_list = [
            f"Unusual threat indicator detected - MITRE Technique: {threat['mitre_technique']}",
            f"Telemetry baseline anomaly - risk rating evaluated at {risk_pct}% risk level",
            f"Faker-simulated process deviation - unusual behavioral signature matches description: '{threat['description']}'",
            f"Raw payload trace - audit snippet: '{threat['raw_log'][:75]}...'"
        ]
        
        # Synthesize trust DNA parameters based on risk and confidence
        score = int((conf_pct + (100 - risk_pct) * 0.5) / 1.5)
        trust_dna = {
            "score": score,
            "dataQuality": random.randint(85, 98),
            "policyMatch": random.randint(80, 97),
            "fleetSimilarity": random.randint(65, 88),
            "threatIntelMatch": random.randint(70, 95),
            "unknownRisk": risk_pct // 2
        }
        
        # Alternative action
        alt_action = "Monitor for 24 Hours" if idx == 0 else "Schedule Patch for Off-Hours" if idx == 1 else "Send MFA Push Challenge"
        
        devils_advocate = {
            "points": [
                f"Faker-simulated patch activity detected: {random.choice(generate_faker_patch_events(dev_id))}",
                f"Active connection logs indicate system host outbound traffic is baseline normal.",
                f"Anomaly threshold deviation is close to typical deviation baseline."
            ],
            "alternativeAction": alt_action
        }
        
        # Time Machine breakdown
        cases = random.randint(25, 150)
        correct = int(cases * 0.90)
        false_positives = int(cases * 0.07)
        escalated = cases - correct - false_positives
        time_machine = {
            "accuracy": 90,
            "cases": cases,
            "breakdown": {
                "correct": correct,
                "falsePositives": false_positives,
                "escalated": escalated
            }
        }
        
        # Nutrition Label
        nutrition_label = {
            "evidenceStrength": random.choice([3, 4]),
            "sources": sources + ["Malware Database", "SIEM Event Collector"],
            "similarCases": cases * 12,
            "limitations": f"Telemetry profile for location '{threat['meta_geo_location']}' not fully baseline calibrated.",
            "model": "Gemini 1.5 Pro" if idx == 0 else "Gemini 1.5 Flash"
        }
        
        target_recommendations.append({
            "id": dev_id,
            "type": dev_type,
            "action": action,
            "severity": threat["severity"],
            "confidence": conf_pct,
            "sources": sources,
            "status": "Pending",
            "why": why_list,
            "nutritionLabel": nutrition_label,
            "trustDNA": trust_dna,
            "devilsAdvocate": devils_advocate,
            "timeMachine": time_machine
        })

    # Generate Synthetic IT Telemetry Logs using Faker
    activity_logs = []
    start_time = datetime.now() - timedelta(minutes=20)
    
    events = [
        {"event": "Faker System Telemetry: Memory footprint spikes on node DEV1248", "type": "system"},
        {"event": "Faker Security Probe: Scanning detected on port 80/443 of SRV-0451", "type": "system"},
        {"event": "Faker System Audit: Active directory password failure threshold reached for USR-7782", "type": "system"},
        {"event": "SIEM Collector: Received event type auth for target USR-7782-Session", "type": "system"},
        {"event": "SIEM Collector: Endpoint anomaly log compiled for host DEV1248", "type": "system"},
        {"event": "TrustLens AI: Spawning threat-classification agent sequence", "type": "ai"},
        {"event": "TrustLens AI: Processing neural baseline deviation weights", "type": "ai"},
        {"event": "TrustLens AI: Reasoning model Gemini 1.5 Pro loaded threat indicators", "type": "ai"},
        {"event": "TrustLens AI: Security recommendation actions compiled", "type": "ai"},
        {"event": "Operator Alert: SOC recommendations table updated. Pending human audit.", "type": "system"}
    ]
    
    for idx, item in enumerate(events):
        log_time = (start_time + timedelta(minutes=idx * 2)).strftime("%H:%M %p")
        activity_logs.append({
            "time": log_time,
            "event": item["event"],
            "type": item["type"]
        })

    # Build full database
    db = {
        "dashboard_stats": {
            "total_alerts": 17,
            "critical": 5,
            "high": 7,
            "medium": 5
        },
        "recommendations": target_recommendations,
        "activity_logs": activity_logs
    }
    
    # Save output to src/data/siem_data.json
    os.makedirs("src/data", exist_ok=True)
    with open("src/data/siem_data.json", "w") as f:
        json.dump(db, f, indent=2)
        
    print("[+] Successfully wrote SIEM database file to src/data/siem_data.json!")

if __name__ == "__main__":
    main()
