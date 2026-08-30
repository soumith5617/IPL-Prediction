import sys
import json
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

results = []

def record_test(feature, test_name, passed, details=""):
    results.append({
        "feature": feature,
        "test_name": test_name,
        "passed": passed,
        "details": details
    })
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} {feature} :: {test_name} - {details}")

print("=================================================================")
print("     COMPREHENSIVE FULL-FEATURE QA AUDIT SUITE EXECUTION        ")
print("=================================================================\n")

# 1. System Health
try:
    r = client.get("/api/health")
    data = r.json()
    record_test("System Health", "GET /api/health returns 200 and healthy", r.status_code == 200 and data.get("status") == "healthy", f"Models loaded: Score={data.get('score_model_loaded')}, Win={data.get('win_model_loaded')}")
except Exception as e:
    record_test("System Health", "GET /api/health", False, str(e))

# 2. Dashboard Analytics Summary
try:
    r = client.get("/api/analytics/dashboard-summary")
    data = r.json()
    has_keys = all(k in data for k in ["total_matches", "total_players", "total_venues"])
    record_test("Dashboard Analytics", "GET /api/analytics/dashboard-summary", r.status_code == 200 and has_keys, f"Matches: {data.get('total_matches')}, Players: {data.get('total_players')}")
except Exception as e:
    record_test("Dashboard Analytics", "GET /api/analytics/dashboard-summary", False, str(e))

# 3. Model Evaluation Metrics
try:
    r = client.get("/api/analytics/model-metrics")
    data = r.json()
    has_score_metrics = "score_model" in data and "MAE" in data["score_model"]["best_metrics"]
    has_win_metrics = "win_probability_model" in data and ("ROC_AUC" in data["win_probability_model"]["best_metrics"] or "AUC" in data["win_probability_model"]["best_metrics"])
    record_test("Model Metrics", "GET /api/analytics/model-metrics", r.status_code == 200 and has_score_metrics and has_win_metrics, f"Score MAE: {data['score_model']['best_metrics']['MAE']}, Win ROC-AUC: {data['win_probability_model']['best_metrics'].get('ROC_AUC')}")
except Exception as e:
    record_test("Model Metrics", "GET /api/analytics/model-metrics", False, str(e))

# 4. Score Prediction Normal
score_payload = {
    "batting_team": "Chennai Super Kings",
    "bowling_team": "Mumbai Indians",
    "city": "Mumbai",
    "current_score": 85,
    "wickets_lost": 2,
    "overs_completed": 10.0,
    "runs_last_5": 42,
    "wickets_last_5": 1
}
try:
    r = client.post("/api/predict/score", json=score_payload)
    data = r.json()
    valid_score = r.status_code == 200 and "prediction" in data and data["prediction"]["predicted_score"] > 85
    record_test("Score Prediction", "Normal 10-over score forecast", valid_score, f"Predicted: {data['prediction']['predicted_score']}, Range: {data['prediction']['lower_bound']}-{data['prediction']['upper_bound']}")
except Exception as e:
    record_test("Score Prediction", "Normal 10-over score forecast", False, str(e))

# 5. Score Prediction Boundary: 0.0 overs
score_p0 = {**score_payload, "current_score": 0, "wickets_lost": 0, "overs_completed": 0.0, "runs_last_5": 0, "wickets_last_5": 0}
try:
    r = client.post("/api/predict/score", json=score_p0)
    data = r.json()
    record_test("Score Prediction", "Boundary: 0.0 overs completed", r.status_code == 200, f"Predicted: {data.get('prediction', {}).get('predicted_score')}, CRR: {data.get('current_run_rate')}")
except Exception as e:
    record_test("Score Prediction", "Boundary: 0.0 overs completed", False, str(e))

# 6. Score Prediction Boundary: 19.5 overs
score_p195 = {**score_payload, "current_score": 190, "wickets_lost": 4, "overs_completed": 19.5, "runs_last_5": 58, "wickets_last_5": 1}
try:
    r = client.post("/api/predict/score", json=score_p195)
    data = r.json()
    record_test("Score Prediction", "Boundary: 19.5 overs completed", r.status_code == 200, f"Predicted: {data.get('prediction', {}).get('predicted_score')}")
except Exception as e:
    record_test("Score Prediction", "Boundary: 19.5 overs completed", False, str(e))

# 7. Score Prediction Validation: Reject Identical Teams
bad_teams = {**score_payload, "bowling_team": "Chennai Super Kings"}
try:
    r = client.post("/api/predict/score", json=bad_teams)
    record_test("Score Prediction", "Validation: Reject identical teams", r.status_code == 422, f"Status: {r.status_code}")
except Exception as e:
    record_test("Score Prediction", "Validation: Reject identical teams", False, str(e))

# 8. Score Prediction Validation: Reject Overs > 20.0
bad_overs = {**score_payload, "overs_completed": 20.1}
try:
    r = client.post("/api/predict/score", json=bad_overs)
    record_test("Score Prediction", "Validation: Reject overs > 20", r.status_code == 422, f"Status: {r.status_code}")
except Exception as e:
    record_test("Score Prediction", "Validation: Reject overs > 20", False, str(e))

# 9. Score Prediction Validation: Reject Illegal Ball Count (10.8)
bad_balls = {**score_payload, "overs_completed": 10.8}
try:
    r = client.post("/api/predict/score", json=bad_balls)
    record_test("Score Prediction", "Validation: Reject invalid ball fraction 10.8", r.status_code == 422, f"Status: {r.status_code}")
except Exception as e:
    record_test("Score Prediction", "Validation: Reject invalid ball fraction 10.8", False, str(e))

# 10. Win Probability Prediction (2nd Innings)
win_payload = {
    "batting_team": "Royal Challengers Bengaluru",
    "bowling_team": "Kolkata Knight Riders",
    "city": "Bengaluru",
    "target_score": 195,
    "current_score": 110,
    "wickets_lost": 2,
    "overs_completed": 12.0
}
try:
    r = client.post("/api/predict/win", json=win_payload)
    data = r.json()
    prob = data.get("prediction", {}).get("team_a_probability", 0)
    record_test("Win Probability", "POST /api/predict/win valid chase", r.status_code == 200 and prob > 0, f"Chasing Win Prob: {prob * 100:.1f}%, Defending: {data.get('prediction', {}).get('team_b_probability', 0)*100:.1f}%")
except Exception as e:
    record_test("Win Probability", "POST /api/predict/win valid chase", False, str(e))

# 11. Pre-Match Comparison Forecast
match_payload = {
    "team1": "Chennai Super Kings",
    "team2": "Mumbai Indians",
    "venue": "MA Chidambaram Stadium",
    "city": "Chennai"
}
try:
    r = client.post("/api/predict/match", json=match_payload)
    data = r.json()
    valid_match = r.status_code == 200 and "projected_win_probabilities" in data
    win_probs = data.get("projected_win_probabilities", {})
    record_test("Pre-Match Prediction", "POST /api/predict/match", valid_match, f"Matchup: {data.get('matchup')}, Probs: {win_probs}")
except Exception as e:
    record_test("Pre-Match Prediction", "POST /api/predict/match", False, str(e))

# 12. Teams List
try:
    r = client.get("/api/teams")
    data = r.json()
    record_test("Teams API", "GET /api/teams returns franchise list", r.status_code == 200 and len(data) >= 10, f"Found {len(data)} franchises")
except Exception as e:
    record_test("Teams API", "GET /api/teams", False, str(e))

# 13. Head-to-Head Comparison
try:
    r = client.get("/api/teams/compare/h2h?team1=Chennai%20Super%20Kings&team2=Mumbai%20Indians")
    data = r.json()
    has_h2h = "total_head_to_head_matches" in data and data["total_head_to_head_matches"] > 0
    record_test("Head-to-Head API", "GET /api/teams/compare/h2h CSK vs MI", r.status_code == 200 and has_h2h, f"Total H2H Matches: {data.get('total_head_to_head_matches')}, CSK Wins: {data.get('team1_wins')}, MI Wins: {data.get('team2_wins')}")
except Exception as e:
    record_test("Head-to-Head API", "GET /api/teams/compare/h2h", False, str(e))

# 14. Players Pagination
try:
    r = client.get("/api/players?limit=10&page=1")
    data = r.json()
    record_test("Players API", "GET /api/players pagination", r.status_code == 200 and len(data.get("players", [])) == 10, f"Total Players: {data.get('total')}")
except Exception as e:
    record_test("Players API", "GET /api/players pagination", False, str(e))

# 15. Players Search
try:
    r = client.get("/api/players?search=Kohli")
    data = r.json()
    players = data.get("players", [])
    found = any("Kohli" in p.get("name", "") for p in players)
    record_test("Players API", "GET /api/players?search=Kohli", r.status_code == 200 and found, f"Found {len(players)} match(es)")
except Exception as e:
    record_test("Players API", "GET /api/players search", False, str(e))

# 16. Player Dossier & 6-Axis Radar
try:
    r = client.get("/api/players/1")
    data = r.json()
    player_obj = data.get("player", {})
    has_radar = len(data.get("radar_chart", [])) > 0
    record_test("Player Dossier", "GET /api/players/{id} with radar chart", r.status_code == 200 and "name" in player_obj and has_radar, f"Player: {player_obj.get('name')}, Country: {player_obj.get('country')}, Radar Axes: {len(data.get('radar_chart', []))}")
except Exception as e:
    record_test("Player Dossier", "GET /api/players/{id}", False, str(e))

# 17. Prediction History Logs
try:
    r = client.get("/api/predictions?limit=5")
    data = r.json()
    is_list = isinstance(data, list)
    record_test("Audit History", "GET /api/predictions list logs", r.status_code == 200 and is_list, f"Retrieved {len(data)} stored records")
except Exception as e:
    record_test("Audit History", "GET /api/predictions", False, str(e))

print("\n=================================================================")
passed_count = sum(1 for t in results if t["passed"])
total_count = len(results)
print(f" TOTAL QA TESTS EXECUTED: {total_count} | PASSED: {passed_count} | FAILED: {total_count - passed_count}")
print("=================================================================")
