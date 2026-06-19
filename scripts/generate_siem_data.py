import os
import json
import random
from datetime import datetime, timedelta
from faker import Faker

try:
    from datasets import load_dataset
    HAS_DATASETS = True
except Exception:
    HAS_DATASETS = False

fake = Faker()

# Define fallbacks if HF download fails
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
        "meta_risk_score": 0.50,
        "meta_confidence": 0.85,
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
        return FALLBACK_THREATS

    print("[*] Attempting to download darkknight25/Advanced_SIEM_Dataset from Hugging Face...")
    try:
        ds = load_dataset("darkknight25/Advanced_SIEM_Dataset", split="train")
        df = ds.to_pandas()
        processed_threats = []
        
        for s_level in ["Critical", "High", "Medium"]:
            sub_df = df[df["severity"].str.lower() == s_level.lower()] if "severity" in df.columns else df
            if len(sub_df) == 0:
                sub_df = df
            
            sample_row = sub_df.sample(n=1).iloc[0]
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
        print(f"[!] Falling back to local SIEM mock schema: {e}")
        return FALLBACK_THREATS

def generate_shap_importance(event_type, action, confidence):
    """Generate SHAP values matching event type."""
    if event_type.lower() == "endpoint":
        return [
            {"feature": "Matches Known Virus Profile", "val": 35, "type": "positive"},
            {"feature": "Spike in Failed Password Attempts", "val": 25, "type": "positive"},
            {"feature": "Device Antivirus Turned Off", "val": 20, "type": "positive"},
            {"feature": "Strange Background Command Execution", "val": 15, "type": "positive"},
            {"feature": "Local Firewalls Running", "val": -8, "type": "negative"}
        ]
    elif event_type.lower() == "cloud" or "patch" in action.lower():
        return [
            {"feature": "Severity of Known Software Vulnerabilities", "val": 38, "type": "positive"},
            {"feature": "Open Network Port Flagged", "val": 22, "type": "positive"},
            {"feature": "Unsecured Cloud API Commands", "val": 15, "type": "positive"},
            {"feature": "Protected Cloud Network Rule Active", "val": -10, "type": "negative"}
        ]
    else:
        return [
            {"feature": "Impossible Travel Distance Alert", "val": 32, "type": "positive"},
            {"feature": "Attempted Access to Restricted Personnel Files", "val": 28, "type": "positive"},
            {"feature": "Multiple Logins from Different Locations", "val": 20, "type": "positive"},
            {"feature": "Verified Company VPN Connection", "val": -16, "type": "negative"}
        ]

def generate_subagents(dev_type, confidence):
    """Generate Multi-Agent steps details."""
    if dev_type == "Endpoint Device":
        details = f"Flagged background software updates. Confidence score restricted to {confidence}%."
    elif dev_type == "Server":
        details = f"Flagged scheduled DB maintenance window. Confidence score restricted to {confidence}%."
    else: # User Account
        details = f"Flagged global corporate VPN routing. Confidence score restricted to {confidence}%."

    steps = [
        {"name": "Ingestion Agent", "status": "completed", "score": 100, "details": "Telemetry and SIEM log streams parsed cleanly."},
        {"name": "Threat Intel Matcher", "status": "completed", "score": 92, "details": "Compared IOC markers to 3 public malware dictionaries."},
        {"name": "UEBA Anomaly Baseline", "status": "completed", "score": 85, "details": "Detected deviation score in user habits."},
        {"name": "Devil's Advocate Falsifier", "status": "completed", "score": 30, "details": details}
    ]
    return steps

def generate_similar_cases(action):
    """Generate similarity table records."""
    outcomes = ["True Positive", "False Positive"]
    analysts = ["Admin AD", "Operator SM", "Security AI", "Analyst JT"]
    cases = []
    
    for i in range(5):
        past_date = (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d")
        outcome = random.choice(outcomes)
        cases.append({
            "case_id": f"CASE-08{random.randint(10, 99)}",
            "date": past_date,
            "outcome": outcome,
            "decision": "Approved" if outcome == "True Positive" else "Rejected",
            "analyst": random.choice(analysts),
            "description": f"Triggered {action} under similar telemetry profile. Resolved with zero breach escalation." if outcome == "True Positive" else f"Triggered {action} under high baseline. Deemed false trigger caused by script."
        })
    return cases

def main():
    threat_records = load_siem_dataset()
    
    ids = ["DEV1248", "SRV-0451", "USR-7782"]
    types = ["Endpoint Device", "Server", "User Account"]
    actions = ["Quarantine Device", "Patch Deployment", "Security Escalation"]
    sources_list = [
        ["Security Logs", "Telemetry"],
        ["Vulnerability DB", "Telemetry"],
        ["Auth Logs", "Directory"]
    ]
    
    recommendations = []
    
    for idx, threat in enumerate(threat_records):
        dev_id = ids[idx]
        dev_type = types[idx]
        action = actions[idx]
        sources = sources_list[idx]
        
        conf_pct = int(threat["meta_confidence"] * 100)
        risk_pct = int(threat["meta_risk_score"] * 100)
        
        why_list = [
            f"Unusual action pattern: Threat technique identified matches standard security catalog '{threat['mitre_technique']}'",
            f"Threat analysis: The AI classifies this action with a {risk_pct}% risk rating.",
            f"Activity description: Behavior matches signature: '{threat['description']}'",
            f"Verification snippet: Raw log audit snippet: '{threat['raw_log'][:75]}...'"
        ]
        
        score = int((conf_pct + (100 - risk_pct) * 0.5) / 1.5)
        trust_dna = {
            "score": score,
            "dataQuality": random.randint(85, 98),
            "policyMatch": random.randint(80, 97),
            "fleetSimilarity": random.randint(65, 88),
            "threatIntelMatch": random.randint(70, 95),
            "unknownRisk": risk_pct // 2
        }
        
        alt_action = "Monitor for 24 Hours" if idx == 0 else "Schedule Patch for Off-Hours" if idx == 1 else "Send MFA Push Challenge"
        
        if dev_type == "Endpoint Device":
            advocate_points = [
                "Active daemon logs indicate local security agent resolved the threat file signature internally.",
                "High behavioral entropy may be caused by normal background compression or system indexing.",
                "Unusual command sequence anomaly matched standard system host software update actions."
            ]
        elif dev_type == "Server":
            advocate_points = [
                "Public interface access is protected by upstream perimeter firewalls and subnet rules.",
                f"Data ingestion confidence is moderate ({conf_pct}%), meaning transient log dropouts could skew risk metrics.",
                "Behavioral baseline deviation matches typical weekly database maintenance routines."
            ]
        else: # User Account
            advocate_points = [
                "Active Directory authentication logs show session IP belongs to approved corporate VPN gateway ranges.",
                "Simultaneous parallel sessions are expected for user accounts running automated cloud storage sync tools.",
                f"Risk rating ({risk_pct}%) is elevated but user completed standard MFA challenges successfully."
            ]

        devils_advocate = {
            "points": advocate_points,
            "alternativeAction": alt_action
        }
        
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
        
        nutrition_label = {
            "evidenceStrength": random.choice([3, 4]),
            "sources": sources + ["Malware Database", "SIEM Event Collector"],
            "similarCases": cases * 12,
            "limitations": f"Telemetry profile for location '{threat['meta_geo_location']}' not fully baseline calibrated.",
            "model": "Gemini 1.5 Pro" if idx == 0 else "Gemini 1.5 Flash"
        }
        
        recommendations.append({
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
            "timeMachine": time_machine,
            "shapImportance": generate_shap_importance(threat["event_type"], action, conf_pct),
            "subagents": generate_subagents(dev_type, conf_pct),
            "similarCasesList": generate_similar_cases(action)
        })

    # Prepare Scenario Injection Payloads
    scenarios = {
        "ransomware": {
            "id": "DEV-8890",
            "type": "Endpoint Device",
            "action": "Isolate Host Endpoint",
            "severity": "Critical",
            "confidence": 94,
            "sources": ["Process Watcher", "Security Logs"],
            "status": "Pending",
            "why": [
                "Mass file renaming detected - Unusual entropy matched ransomware baseline patterns",
                "Shadow copy deletion attempted - Command 'vssadmin.exe delete shadows' blocked",
                "Unsigned binary Execution - Binary 'decryptor.exe' executed in Temp folder",
                "Raw log trail: File isolate recommendation generated forDEV-8890"
            ],
            "nutritionLabel": {
                "evidenceStrength": 5,
                "sources": ["Process Watcher", "File Monitor", "CrowdStrike Feed"],
                "similarCases": 142,
                "limitations": "Endpoint offline state inhibits complete memory dump",
                "model": "Gemini 1.5 Pro"
            },
            "trustDNA": {
                "score": 95,
                "dataQuality": 98,
                "policyMatch": 99,
                "fleetSimilarity": 90,
                "threatIntelMatch": 97,
                "unknownRisk": 10
            },
            "devilsAdvocate": {
                "points": [
                    "User was running official bulk batch compression utility tool.",
                    "File server backup synced successfully 2 minutes prior."
                ],
                "alternativeAction": "Snapshot and Monitor File Writes"
            },
            "timeMachine": {
                "accuracy": 97,
                "cases": 40,
                "breakdown": {"correct": 38, "falsePositives": 1, "escalated": 1}
            },
            "shapImportance": [
                {"feature": "File Write Frequency", "val": 45, "type": "positive"},
                {"feature": "VSSADMIN Command Call", "val": 30, "type": "positive"},
                {"feature": "Entropy Variance", "val": 20, "type": "positive"},
                {"feature": "Endpoint Agent Active", "val": -5, "type": "negative"}
            ],
            "subagents": [
                {"name": "Ingestion Agent", "status": "completed", "score": 100, "details": "Parsed DEV-8890 host process logs"},
                {"name": "Heuristic Inspector", "status": "completed", "score": 98, "details": "Flagged high file system entropy anomaly"},
                {"name": "Containment Evaluator", "status": "completed", "score": 95, "details": "Determined containment score meets auto-isolation rules"},
                {"name": "Devil's Advocate", "status": "completed", "score": 10, "details": "No baseline software matches decrypter signatures."}
            ],
            "similarCasesList": [
                {"case_id": "CASE-112", "date": "2026-06-01", "outcome": "True Positive", "decision": "Approved", "analyst": "Admin AD", "description": "Locky variants quarantined on SRV-901"},
                {"case_id": "CASE-113", "date": "2026-06-03", "outcome": "True Positive", "decision": "Approved", "analyst": "Operator SM", "description": "WannaCry footprint matched and isolated DEV-8800"}
            ]
        },
        "exfiltration": {
            "id": "SRV-1022",
            "type": "Database Server",
            "action": "Block External Gateway IP",
            "severity": "High",
            "confidence": 83,
            "sources": ["NetFlow", "Firewall Logs"],
            "status": "Pending",
            "why": [
                "Bulk DB dump transfer - 4.5 GB of outbound traffic to unauthorized server",
                "Unusual database query execution - SELECT * executed on customer catalog database",
                "Connection over port 443 - outbound SSH tunneling bypass detection",
                "Raw log trail: NetFlow outbound spike detected from SQL-Host SRV-1022"
            ],
            "nutritionLabel": {
                "evidenceStrength": 4,
                "sources": ["NetFlow Database", "SQL Profiler", "IP Reputation DB"],
                "similarCases": 88,
                "limitations": "SSL encryption hides actual data payload stream",
                "model": "Gemini 1.5 Flash"
            },
            "trustDNA": {
                "score": 82,
                "dataQuality": 90,
                "policyMatch": 85,
                "fleetSimilarity": 70,
                "threatIntelMatch": 80,
                "unknownRisk": 25
            },
            "devilsAdvocate": {
                "points": [
                    "Outbound IP belongs to official AWS disaster backup repository.",
                    "Scheduled data migration job was registered in calendar."
                ],
                "alternativeAction": "Throttle Bandwidth to 10kb/s"
            },
            "timeMachine": {
                "accuracy": 88,
                "cases": 25,
                "breakdown": {"correct": 22, "falsePositives": 2, "escalated": 1}
            },
            "shapImportance": [
                {"feature": "Outbound Bytes Spike", "val": 50, "type": "positive"},
                {"feature": "Port Tunneling Heuristic", "val": 25, "type": "positive"},
                {"feature": "Unauthorized Remote IP", "val": 15, "type": "positive"},
                {"feature": "Migration Cron Active", "val": -20, "type": "negative"}
            ],
            "subagents": [
                {"name": "Ingestion Agent", "status": "completed", "score": 100, "details": "Parsed router NetFlow records"},
                {"name": "Traffic Profiler", "status": "completed", "score": 90, "details": "Identified anomalous payload volume"},
                {"name": "Geo Tracker", "status": "completed", "score": 85, "details": "Destination IP resolved to unapproved country"},
                {"name": "Devil's Advocate", "status": "completed", "score": 35, "details": "Outbound matches cloud migration endpoints."}
            ],
            "similarCasesList": [
                {"case_id": "CASE-301", "date": "2026-05-18", "outcome": "True Positive", "decision": "Approved", "analyst": "Analyst JT", "description": "SSH tunneling threat neutralized"},
                {"case_id": "CASE-302", "date": "2026-05-20", "outcome": "False Positive", "decision": "Rejected", "analyst": "Operator SM", "description": "Weekly dev backup triggered alert due to stale config"}
            ]
        }
    }

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

    db = {
        "dashboard_stats": {
            "total_alerts": 17,
            "critical": 5,
            "high": 7,
            "medium": 5
        },
        "recommendations": recommendations,
        "scenarios": scenarios,
        "activity_logs": activity_logs
    }
    
    os.makedirs("src/data", exist_ok=True)
    with open("src/data/siem_data.json", "w") as f:
        json.dump(db, f, indent=2)
        
    print("[+] Successfully wrote SIEM database file to src/data/siem_data.json!")

if __name__ == "__main__":
    main()
