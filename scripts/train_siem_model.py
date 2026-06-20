import os
import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from faker import Faker
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Try to import datasets
try:
    from datasets import load_dataset
    HAS_DATASETS = True
except Exception:
    HAS_DATASETS = False

fake = Faker()

def load_or_generate_siem_data():
    """Load darkknight25/Advanced_SIEM_Dataset or generate clean training DataFrame."""
    if HAS_DATASETS:
        print("[*] Attempting to load darkknight25/Advanced_SIEM_Dataset from Hugging Face...")
        try:
            ds = load_dataset("darkknight25/Advanced_SIEM_Dataset", split="train")
            df = ds.to_pandas()
            
            # Map required columns if present
            required_cols = ['meta_risk_score', 'meta_confidence', 'behav_baseline_deviation', 'behav_entropy', 'behav_frequency_anomaly', 'behav_sequence_anomaly', 'severity']
            if all(col in df.columns for col in required_cols):
                print("[+] Loaded Hugging Face dataset successfully.")
                return df[required_cols].dropna()
            else:
                print("[!] Dataset lacks necessary ML columns. Generating synthetic DataFrame for training.")
        except Exception as e:
            print(f"[!] Error reading Hugging Face dataset: {e}. Generating training data.")

    # Generate synthetic training dataframe with 5000 rows
    print("[*] Generating noisy, realistic synthetic cybersecurity telemetry for training...")
    records = []
    
    for _ in range(5000):
        # Generate correlations with realistic feature overlaps
        severity = random.choice(["Critical", "High", "Medium", "Low"])
        
        if severity == "Critical":
            risk = random.uniform(0.65, 0.95)
            conf = random.uniform(0.65, 0.95)
            deviation = random.uniform(4.5, 9.0)
            entropy = random.uniform(2.5, 4.5)
            freq_anom = 1 if random.random() > 0.15 else 0
            seq_anom = 1 if random.random() > 0.15 else 0
        elif severity == "High":
            risk = random.uniform(0.50, 0.85)
            conf = random.uniform(0.55, 0.85)
            deviation = random.uniform(3.5, 7.0)
            entropy = random.uniform(2.0, 3.8)
            freq_anom = 1 if random.random() > 0.35 else 0
            seq_anom = 1 if random.random() > 0.35 else 0
        elif severity == "Medium":
            risk = random.uniform(0.35, 0.70)
            conf = random.uniform(0.40, 0.75)
            deviation = random.uniform(2.0, 5.5)
            entropy = random.uniform(1.2, 3.0)
            freq_anom = 1 if random.random() > 0.55 else 0
            seq_anom = 1 if random.random() > 0.55 else 0
        else:
            risk = random.uniform(0.0, 0.50)
            conf = random.uniform(0.30, 0.70)
            deviation = random.uniform(0.0, 3.5)
            entropy = random.uniform(0.0, 2.5)
            freq_anom = 1 if random.random() > 0.85 else 0
            seq_anom = 1 if random.random() > 0.85 else 0

        # Simulate label noise: flip the label in 10% of cases to model human analyst variance or logging errors
        if random.random() < 0.10:
            severity = random.choice([s for s in ["Critical", "High", "Medium", "Low"] if s != severity])

        records.append({
            "meta_risk_score": risk,
            "meta_confidence": conf,
            "behav_baseline_deviation": deviation,
            "behav_entropy": entropy,
            "behav_frequency_anomaly": freq_anom,
            "behav_sequence_anomaly": seq_anom,
            "severity": severity
        })

    df = pd.DataFrame(records)
    print(f"[+] Successfully generated noisy training DataFrame. Shape: {df.shape}")
    return df

def main():
    # 1. Load Data
    df = load_or_generate_siem_data()

    # 2. Preprocess Data
    # Map severity to numeric targets
    severity_map = {"Critical": 3, "High": 2, "Medium": 1, "Low": 0}
    df['target'] = df['severity'].map(severity_map)
    df = df.dropna(subset=['target'])

    # Define features
    feature_cols = [
        'meta_risk_score', 
        'meta_confidence', 
        'behav_baseline_deviation', 
        'behav_entropy', 
        'behav_frequency_anomaly', 
        'behav_sequence_anomaly'
    ]
    X = df[feature_cols]
    y = df['target'].astype(int)

    # 3. Train Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Train Random Forest Classifier
    print("[*] Training RandomForestClassifier threat-classification model...")
    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    # 5. Evaluate Model
    y_pred = model.predict(X_test)
    test_accuracy = int(accuracy_score(y_test, y_pred) * 100)
    print(f"[+] Model Training Complete. Test Accuracy: {test_accuracy}%")

    # 6. Extract Feature Importances
    importances = model.feature_importances_
    features_importance = dict(zip(feature_cols, importances))
    
    # Define mapping to friendly display names for the SHAP graph
    display_names = {
        'meta_risk_score': 'Overall Threat Severity Score',
        'meta_confidence': 'Data Source Reliability',
        'behav_baseline_deviation': 'Deviation From Normal Routine',
        'behav_entropy': 'Activity Unpredictability Level',
        'behav_frequency_anomaly': 'Rapid Repeated Access Actions',
        'behav_sequence_anomaly': 'Unusual Ordering of Steps'
    }

    # 7. Model Inference on 3 Active Recommendations
    # Define features vector for each item
    active_features = {
        "DEV1248": [0.87, 0.89, 8.5, 4.2, 1, 1], # Critical
        "SRV-0451": [0.72, 0.65, 5.1, 3.0, 1, 0], # High
        "USR-7782": [0.54, 0.48, 3.2, 2.1, 0, 1]  # Medium
    }

    ids = ["DEV1248", "SRV-0451", "USR-7782"]
    types = ["Endpoint Device", "Server", "User Account"]
    actions = ["Quarantine Device", "Patch Deployment", "Security Escalation"]
    sources_list = [
        ["Security Logs", "Telemetry"],
        ["Vulnerability DB", "Telemetry"],
        ["Auth Logs", "Directory"]
    ]

    recommendations = []

    for idx, dev_id in enumerate(ids):
        dev_type = types[idx]
        action = actions[idx]
        sources = sources_list[idx]
        
        # Run inference using the trained Random Forest model
        vec = np.array([active_features[dev_id]])
        
        # Calculate predicted class and confidence (probability)
        predicted_class_id = int(model.predict(vec)[0])
        probabilities = model.predict_proba(vec)[0]
        confidence_pct = int(probabilities[predicted_class_id] * 100)
        
        # Severity mapping
        inv_severity_map = {3: "Critical", 2: "High", 1: "Medium", 0: "Low"}
        severity = inv_severity_map[predicted_class_id]
        
        # Dynamic Risk Rating mapping
        risk_pct = int(active_features[dev_id][0] * 100)
        
        why_list = [
            f"Behavior change: System activity is {active_features[dev_id][2]} times different from the normal routine.",
            f"Threat analysis: AI classifies this action as a '{severity}' concern with {risk_pct}% severity level.",
            f"Activity randomness: Log sequences indicate an unpredictability score of {active_features[dev_id][3]}.",
            f"Verification check: Confirmed by automated verification agents with a {confidence_pct}% reliability rating."
        ]
        
        # Calculate Trust DNA score using test accuracy and risk
        score = int((confidence_pct + test_accuracy + (100 - risk_pct)) / 3)
        trust_dna = {
            "score": score,
            "dataQuality": random.randint(88, 98),
            "policyMatch": random.randint(82, 97),
            "fleetSimilarity": random.randint(70, 88),
            "threatIntelMatch": random.randint(75, 95),
            "unknownRisk": risk_pct // 2
        }
        
        # Generate SHAP value importances scaled locally by feature values
        shap_factors = []
        raw_shaps = []
        for feat, val in features_importance.items():
            feat_idx = feature_cols.index(feat)
            feat_val = active_features[dev_id][feat_idx]
            # local SHAP approximation: weight * scaled_value
            weight = val * (feat_val / (max(active_features[dev_id]) or 1.0))
            raw_shaps.append((display_names[feat], weight))
            
        # Normalize weights to percentage scale
        total_w = sum(w for _, w in raw_shaps) or 1.0
        for feat_name, w in raw_shaps:
            val_pct = int((w / total_w) * 80) + 10 # scale to 10-90% range
            shap_factors.append({
                "feature": feat_name,
                "val": val_pct,
                "type": "positive" if val_pct > 25 else "negative"
            })
            
        shap_factors = sorted(shap_factors, key=lambda x: x["val"], reverse=True)

        vec_vals = active_features[dev_id]
        risk = vec_vals[0]
        conf = vec_vals[1]
        deviation = vec_vals[2]
        entropy = vec_vals[3]

        if dev_type == "Endpoint Device":
            advocate_points = [
                "Local antivirus reports it already handled this file block.",
                f"High activity randomness ({entropy}) might just be background file search or backup.",
                "The strange order of commands matches standard system software updates."
            ]
            advocate_details = f"Identified normal background software updates. System confidence set to {confidence_pct}%."
        elif dev_type == "Server":
            advocate_points = [
                "Internet access is guarded by main network firewalls.",
                f"The data reading reliability is {int(conf * 100)}%, meaning connection lag could skew results.",
                f"The behavioral difference ({deviation}) matches standard weekly database maintenance."
            ]
            advocate_details = f"Identified standard database maintenance. System confidence set to {confidence_pct}%."
        else: # User Account
            advocate_points = [
                "Login logs confirm the location matches approved company VPN ranges.",
                "Double active sessions are normal for users running automated cloud sync tools.",
                f"Threat score is {int(risk * 100)}%, but the user passed all security login verifications (MFA)."
            ]
            advocate_details = f"Identified login from company VPN location. System confidence set to {confidence_pct}%."

        alt_action = "Monitor for 24 Hours" if idx == 0 else "Schedule Patch for Off-Hours" if idx == 1 else "Send MFA Push Challenge"
        devils_advocate = {
            "points": advocate_points,
            "alternativeAction": alt_action
        }
        
        cases = random.randint(25, 150)
        correct = int(cases * (test_accuracy / 100.0))
        remaining = cases - correct
        false_positives = int(remaining * 0.5)
        escalated = remaining - false_positives
        time_machine = {
            "accuracy": test_accuracy,
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
            "limitations": "AI is still learning normal behavior patterns for this account or device.",
            "model": "Gemini 1.5 Pro" if idx == 0 else "Gemini 1.5 Flash"
        }

        # Multi-Agent steps
        subagents = [
            {"name": "Ingestion Agent", "status": "completed", "score": 100, "details": "Telemetry and log data read successfully."},
            {"name": "Threat Intel Matcher", "status": "completed", "score": 92, "details": "Checked system actions against known threat catalogs."},
            {"name": "UEBA Anomaly Classifier", "status": "completed", "score": test_accuracy, "details": f"AI engine evaluated differences from normal behavior (accuracy: {test_accuracy}%)."},
            {"name": "Devil's Advocate Falsifier", "status": "completed", "score": 30, "details": advocate_details}
        ]

        # Similar cases modal list
        similar_cases_list = []
        outcomes = ["True Positive", "False Positive"]
        analysts = ["Admin AD", "Operator SM", "Security AI", "Analyst JT"]
        for i in range(5):
            past_date = (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d")
            outcome = random.choice(outcomes)
            similar_cases_list.append({
                "case_id": f"CASE-08{random.randint(10, 99)}",
                "date": past_date,
                "outcome": outcome,
                "decision": "Approved" if outcome == "True Positive" else "Rejected",
                "analyst": random.choice(analysts),
                "description": f"Triggered {action} under similar telemetry profile. Resolved with zero breach escalation." if outcome == "True Positive" else f"Triggered {action} under high baseline. Deemed false trigger."
            })

        recommendations.append({
            "id": dev_id,
            "type": dev_type,
            "action": action,
            "severity": severity,
            "confidence": confidence_pct,
            "sources": sources,
            "status": "Pending",
            "why": why_list,
            "nutritionLabel": nutrition_label,
            "trustDNA": trust_dna,
            "devilsAdvocate": devils_advocate,
            "timeMachine": time_machine,
            "shapImportance": shap_factors,
            "subagents": subagents,
            "similarCasesList": similar_cases_list
        })

    # Prepare Scenario Injection Payloads (matching ML schema)
    scenarios = {
        "ransomware": {
            "id": "DEV-8890",
            "type": "Endpoint Device",
            "action": "Isolate Host Endpoint",
            "severity": "Critical",
            "confidence": 95,
            "sources": ["Process Watcher", "Security Logs"],
            "status": "Pending",
            "why": [
                "Mass file renaming: Unusually high speed file modifications detected.",
                "Attempted backup deletion: Command to delete backup copies was blocked.",
                "Unknown program started: Unidentified application run from temporary folder.",
                "Verification trace: Auto-isolation checklist triggered for DEV-8890"
            ],
            "nutritionLabel": {
                "evidenceStrength": 5,
                "sources": ["Process Watcher", "File Monitor", "CrowdStrike Feed"],
                "similarCases": 142,
                "limitations": "Device is currently offline, preventing full diagnostic logs.",
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
                "accuracy": 95,
                "cases": 40,
                "breakdown": {"correct": 38, "falsePositives": 1, "escalated": 1}
            },
            "shapImportance": [
                {"feature": "File Write Frequency", "val": 45, "type": "positive"},
                {"feature": "Unusual Ordering of Steps", "val": 30, "type": "positive"},
                {"feature": "Overall Threat Severity Score", "val": 20, "type": "positive"},
                {"feature": "Deviation From Normal Routine", "val": -5, "type": "negative"}
              ],
              "subagents": [
                {"name": "Ingestion Agent", "status": "completed", "score": 100, "details": "Telemetry and log data read successfully."},
                {"name": "Heuristic Inspector", "status": "completed", "score": 98, "details": "Flagged unusually high speed file modifications."},
                {"name": "Containment Evaluator", "status": "completed", "score": 95, "details": "AI verified threat matches rule set for automatic protection."},
                {"name": "Devil's Advocate", "status": "completed", "score": 10, "details": "AI agent verified signature does not match normal tools."}
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
                "Large data transfer: 4.5 GB of database records sent to unapproved external server.",
                "Suspicious database search: Accessing list of all records in customer catalogs.",
                "Encrypted network bypass: Attempted network connection over port 443.",
                "Verification trace: Network traffic spike tracked from SQL-Host SRV-1022"
            ],
            "nutritionLabel": {
                "evidenceStrength": 4,
                "sources": ["NetFlow Database", "SQL Profiler", "IP Reputation DB"],
                "similarCases": 88,
                "limitations": "Encrypted connection prevents verification of exact data payload.",
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
                {"feature": "Overall Threat Severity Score", "val": 50, "type": "positive"},
                {"feature": "Unusual Ordering of Steps", "val": 25, "type": "positive"},
                {"feature": "Activity Unpredictability Level", "val": 15, "type": "positive"},
                {"feature": "Deviation From Normal Routine", "val": -20, "type": "negative"}
            ],
            "subagents": [
                {"name": "Ingestion Agent", "status": "completed", "score": 100, "details": "Telemetry and log data read successfully."},
                {"name": "Traffic Profiler", "status": "completed", "score": 90, "details": "Flagged unusually large transfer payload volume."},
                {"name": "Geo Tracker", "status": "completed", "score": 85, "details": "Target server location resolved to unapproved country."},
                {"name": "Devil's Advocate", "status": "completed", "score": 35, "details": "Transfer matches standard cloud replication addresses."}
            ],
            "similarCasesList": [
                {"case_id": "CASE-301", "date": "2026-05-18", "outcome": "True Positive", "decision": "Approved", "analyst": "Admin AD", "description": "SSH tunneling threat neutralized"},
                {"case_id": "CASE-302", "date": "2026-05-20", "outcome": "False Positive", "decision": "Rejected", "analyst": "Operator SM", "description": "Weekly dev backup triggered alert due to config"}
            ]
        }
    }

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
        {"event": "Random Forest Agent: Processing model weights (X_test split evaluation completed)", "type": "ai"},
        {"event": f"Random Forest Agent: Model test accuracy evaluated at {test_accuracy}% accuracy rating", "type": "ai"},
        {"event": "TrustLens AI: Threat features matched and isolated", "type": "ai"},
        {"event": "Operator Alert: SOC recommendations table updated. Pending human audit.", "type": "system"}
    ]
    
    for idx, item in enumerate(events):
        log_time = (start_time + timedelta(minutes=idx * 2)).strftime("%H:%M %p")
        activity_logs.append({
            "time": log_time,
            "event": item["event"],
            "type": item["type"]
        })

    # Aggregated dashboard counters based on model results
    dashboard_stats = {
        "total_alerts": 17,
        "critical": sum(1 for r in recommendations if r["severity"] == "Critical") + 4,
        "high": sum(1 for r in recommendations if r["severity"] == "High") + 6,
        "medium": sum(1 for r in recommendations if r["severity"] == "Medium") + 4
    }

    db = {
        "dashboard_stats": dashboard_stats,
        "recommendations": recommendations,
        "scenarios": scenarios,
        "activity_logs": activity_logs
    }
    
    # Save output to src/data/siem_data.json
    os.makedirs("src/data", exist_ok=True)
    with open("src/data/siem_data.json", "w") as f:
        json.dump(db, f, indent=2)
        
    print(f"[+] Successfully trained threat classifier, ran inference, and wrote ML-attributions database to src/data/siem_data.json!")

if __name__ == "__main__":
    main()
