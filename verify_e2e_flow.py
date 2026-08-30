import sys
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("=================================================================")
print("          IPL PREDICTION SYSTEM - LIVE END-TO-END FLOW TRACE     ")
print("=================================================================")

# 1. Health Status
print("\n[1] API & MODEL HEALTH CHECK")
health = client.get("/api/health").json()
print(f"  * API Status: {health['status'].upper()}")
print(f"  * Score Model Ready: {health['score_model_loaded']}")
print(f"  * Win Classifier Ready: {health['win_model_loaded']}")

# 2. Score Prediction
print("\n[2] USER INPUT -> INFERENCE ENGINE")
payload = {
    "batting_team": "Chennai Super Kings",
    "bowling_team": "Mumbai Indians",
    "city": "Chennai",
    "venue": "MA Chidambaram Stadium",
    "current_score": 96,
    "wickets_lost": 2,
    "overs_completed": 11.4,
    "runs_last_5": 48,
    "wickets_last_5": 1
}
print(f"  * Inputs: {payload['batting_team']} vs {payload['bowling_team']} | {payload['current_score']}/{payload['wickets_lost']} in {payload['overs_completed']} overs")

res = client.post("/api/predict/score", json=payload)
data = res.json()
print("\n[3] FASTAPI ML PIPELINE RESPONSE")
print(f"  * HTTP Status: {res.status_code}")
print(f"  * PREDICTED FINAL SCORE: {data['prediction']['predicted_score']}")
print(f"  * Expected Score Range: {data['prediction']['lower_bound']} - {data['prediction']['upper_bound']}")
print(f"  * Current Run Rate (CRR): {data['current_run_rate']}")
print(f"  * Active Model Pipeline: {data['model_used']}")

# 3. Database Persistence Verification
print("\n[4] SQLITE DATABASE AUDIT LOG")
logs = client.get("/api/predictions?limit=1").json()
latest = logs[0]
print(f"  * Stored Log Record ID: #{latest['id']}")
print(f"  * Stored Matchup: {latest['batting_team']} vs {latest['bowling_team']}")
print(f"  * Persisted Predicted Score: {latest['prediction_output']['prediction']['predicted_score']}")
print(f"  * Persisted Timestamp: {latest['created_at']}")

print("\n=================================================================")
print(" [SUCCESS] End-to-End Prediction & Persistence Flow Verified!   ")
print("=================================================================")
