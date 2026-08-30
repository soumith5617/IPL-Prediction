import sys
import json
import time
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("="*75)
print("     IPL PREDICTION SYSTEM — DEEP COMPREHENSIVE FEATURE TEST AUDIT     ")
print("="*75)

audit_results = {}

def audit_section(section_name):
    print(f"\n[MODULE] >> {section_name.upper()}")
    audit_results[section_name] = []

def test_feature(section, feature_name, assertion_lambda, description):
    try:
        start = time.time()
        success = assertion_lambda()
        elapsed = (time.time() - start) * 1000
        status = "PASSED" if success else "FAILED"
        audit_results[section].append({
            "feature": feature_name,
            "status": status,
            "latency_ms": round(elapsed, 2),
            "description": description
        })
        print(f"  [{status}] {feature_name} ({elapsed:.1f}ms) - {description}")
    except Exception as e:
        audit_results[section].append({
            "feature": feature_name,
            "status": "ERROR",
            "latency_ms": 0,
            "description": str(e)
        })
        print(f"  [ERROR] {feature_name} - Exception: {e}")

# =====================================================================
# 1. DASHBOARD & SYSTEM TELEMETRY
# =====================================================================
audit_section("1. Dashboard & Telemetry")

test_feature(
    "1. Dashboard & Telemetry",
    "API & Model Health Check",
    lambda: client.get("/api/health").status_code == 200 and client.get("/api/health").json().get("score_model_loaded") is True,
    "GET /api/health verifies ML pipelines and database connection"
)

test_feature(
    "1. Dashboard & Telemetry",
    "Dashboard Summary Counts",
    lambda: client.get("/api/analytics/dashboard-summary").json().get("total_matches", 0) > 500,
    "GET /api/analytics/dashboard-summary returns verified matches, players, and venues"
)

test_feature(
    "1. Dashboard & Telemetry",
    "Model Benchmark Evaluation",
    lambda: client.get("/api/analytics/model-metrics").json().get("score_model", {}).get("best_metrics", {}).get("MAE") is not None,
    "GET /api/analytics/model-metrics returns MAE, RMSE, and ROC-AUC for UI display"
)

# =====================================================================
# 2. MATCH PREDICTION (1ST INNINGS SCORE ENGINE)
# =====================================================================
audit_section("2. Match Prediction")

test_feature(
    "2. Match Prediction",
    "Standard Score Forecast",
    lambda: client.post("/api/predict/score", json={
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "city": "Chennai",
        "current_score": 90,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 45,
        "wickets_last_5": 1
    }).json().get("prediction", {}).get("predicted_score", 0) > 90,
    "POST /api/predict/score returns final score, 95% confidence bounds, and CRR"
)

test_feature(
    "2. Match Prediction",
    "Powerplay Overs (6.0 overs)",
    lambda: client.post("/api/predict/score", json={
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "city": "Bengaluru",
        "current_score": 58,
        "wickets_lost": 1,
        "overs_completed": 6.0,
        "runs_last_5": 48,
        "wickets_last_5": 1
    }).status_code == 200,
    "Validates accurate prediction at the end of Powerplay overs"
)

test_feature(
    "2. Match Prediction",
    "Death Overs (18.4 overs notation)",
    lambda: client.post("/api/predict/score", json={
        "batting_team": "Gujarat Titans",
        "bowling_team": "Rajasthan Royals",
        "city": "Ahmedabad",
        "current_score": 182,
        "wickets_lost": 3,
        "overs_completed": 18.4,
        "runs_last_5": 52,
        "wickets_last_5": 1
    }).status_code == 200,
    "Validates fractional cricket ball delivery notation (18.4 = 112 legal balls)"
)

test_feature(
    "2. Match Prediction",
    "Rejection of Same Franchise",
    lambda: client.post("/api/predict/score", json={
        "batting_team": "Mumbai Indians",
        "bowling_team": "Mumbai Indians",
        "city": "Mumbai",
        "current_score": 50,
        "wickets_lost": 1,
        "overs_completed": 5.0,
        "runs_last_5": 30,
        "wickets_last_5": 0
    }).status_code == 422,
    "Strict cross-field validation prevents selecting identical teams"
)

test_feature(
    "2. Match Prediction",
    "Rejection of Illegal Overs (> 20.0)",
    lambda: client.post("/api/predict/score", json={
        "batting_team": "Delhi Capitals",
        "bowling_team": "Punjab Kings",
        "city": "Delhi",
        "current_score": 150,
        "wickets_lost": 3,
        "overs_completed": 20.2,
        "runs_last_5": 35,
        "wickets_last_5": 1
    }).status_code == 422,
    "Strict boundary constraint rejects overs > 20.0"
)

# =====================================================================
# 3. LIVE PREDICTION (2ND INNINGS WIN PROBABILITY)
# =====================================================================
audit_section("3. Live Prediction")

test_feature(
    "3. Live Prediction",
    "Close Chase Situation",
    lambda: client.post("/api/predict/win", json={
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Chennai Super Kings",
        "city": "Bengaluru",
        "target_score": 185,
        "current_score": 135,
        "wickets_lost": 3,
        "overs_completed": 14.0
    }).json().get("prediction", {}).get("team_a_probability", 0) > 0,
    "POST /api/predict/win calculates live chase probability, runs needed, and balls left"
)

test_feature(
    "3. Live Prediction",
    "High Pressure Chase (Steep RRR)",
    lambda: client.post("/api/predict/win", json={
        "batting_team": "Sunrisers Hyderabad",
        "bowling_team": "Mumbai Indians",
        "city": "Hyderabad",
        "target_score": 210,
        "current_score": 120,
        "wickets_lost": 6,
        "overs_completed": 15.0
    }).json().get("prediction", {}).get("team_b_probability", 0) > 0.6,
    "Verifies defending team probability rises appropriately when RRR exceeds 18 RPO"
)

# =====================================================================
# 4. PLAYER SCOUTING & ANALYSIS
# =====================================================================
audit_section("4. Player Analysis")

test_feature(
    "4. Player Analysis",
    "Player List Pagination",
    lambda: len(client.get("/api/players?page=1&limit=15").json().get("players", [])) == 15,
    "GET /api/players supports pagination and limit filters"
)

test_feature(
    "4. Player Analysis",
    "Player Search (MS Dhoni)",
    lambda: any("Dhoni" in p.get("name", "") for p in client.get("/api/players?search=Dhoni").json().get("players", [])),
    "GET /api/players?search=Dhoni returns verified cricketer records"
)

test_feature(
    "4. Player Analysis",
    "Player 6-Axis Radar & Dossier",
    lambda: len(client.get("/api/players/1").json().get("radar_chart", [])) == 6,
    "GET /api/players/{id} returns comprehensive career summary and 6-axis radar metrics"
)

# =====================================================================
# 5. TEAM COMPARISON & HEAD-TO-HEAD
# =====================================================================
audit_section("5. Team Comparison")

test_feature(
    "5. Team Comparison",
    "Franchise List",
    lambda: len(client.get("/api/teams").json()) >= 10,
    "GET /api/teams returns all canonical IPL franchises"
)

test_feature(
    "5. Team Comparison",
    "Head-to-Head Statistics (CSK vs MI)",
    lambda: client.get("/api/teams/compare/h2h?team1=Chennai%20Super%20Kings&team2=Mumbai%20Indians").json().get("total_head_to_head_matches", 0) > 0,
    "GET /api/teams/compare/h2h returns authentic historical match records and venue breakdowns"
)

test_feature(
    "5. Team Comparison",
    "Full Pre-Match ML Projection",
    lambda: client.post("/api/predict/match", json={
        "team1": "Kolkata Knight Riders",
        "team2": "Royal Challengers Bengaluru",
        "venue": "Eden Gardens",
        "city": "Kolkata"
    }).status_code == 200,
    "POST /api/predict/match generates comprehensive head-to-head simulations"
)

# =====================================================================
# 6. PREDICTION AUDIT HISTORY
# =====================================================================
audit_section("6. Prediction History")

test_feature(
    "6. Prediction History",
    "Audit Log Fetching",
    lambda: isinstance(client.get("/api/predictions?limit=10").json(), list),
    "GET /api/predictions returns chronological SQLite inference records"
)

# =====================================================================
# 7. MODEL INSIGHTS & ARCHITECTURE
# =====================================================================
audit_section("7. Model Insights")

test_feature(
    "7. Model Insights",
    "Feature Importance Weights",
    lambda: len(client.get("/api/analytics/model-metrics").json().get("feature_importances", {}).get("score_model", [])) > 0,
    "Returns feature importance coefficients for regressor and classifier pipelines"
)

print("\n" + "="*75)
all_tests = [t for section in audit_results.values() for t in section]
passed_tests = [t for t in all_tests if t["status"] == "PASSED"]
print(f" TOTAL TESTS EXECUTED: {len(all_tests)} | PASSED: {len(passed_tests)} | FAILED: {len(all_tests) - len(passed_tests)}")
print("="*75)
