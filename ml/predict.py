"""
Prediction Service Module for IPL Prediction System.
Provides predict_score() and predict_win_probability() returning structured dictionaries.
"""

import os
import json
from typing import Dict, Any, Optional
import pandas as pd
import joblib

from ml.preprocessing import normalize_team_name

class PredictionService:
    def __init__(self, models_dir: str = "ml/models"):
        self.models_dir = models_dir
        self.score_model = None
        self.win_model = None
        self.score_metadata = {}
        self.win_metadata = {}
        self.load_models()

    def load_models(self):
        score_path = os.path.join(self.models_dir, "score_predictor.joblib")
        win_path = os.path.join(self.models_dir, "win_predictor.joblib")
        score_m_path = os.path.join(self.models_dir, "score_metrics.json")
        win_m_path = os.path.join(self.models_dir, "win_metrics.json")

        if os.path.exists(score_path):
            self.score_model = joblib.load(score_path)
        if os.path.exists(win_path):
            self.win_model = joblib.load(win_path)

        if os.path.exists(score_m_path):
            with open(score_m_path, "r") as f:
                self.score_metadata = json.load(f)
        if os.path.exists(win_m_path):
            with open(win_m_path, "r") as f:
                self.win_metadata = json.load(f)

    def predict_score(
        self,
        batting_team: str,
        bowling_team: str,
        city: str = "Mumbai",
        current_score: int = 85,
        wickets_lost: int = 2,
        overs_completed: float = 10.0,
        runs_last_5: Optional[int] = None,
        wickets_last_5: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Predicts 1st innings total score with confidence bounds.
        Returns structured dictionary.
        """
        if self.score_model is None:
            self.load_models()
        if self.score_model is None:
            raise RuntimeError("Score prediction model is not loaded.")

        batting_team_norm = normalize_team_name(batting_team)
        bowling_team_norm = normalize_team_name(bowling_team)
        city = str(city or "Neutral").strip()

        # Compute CRR
        crr = current_score / overs_completed if overs_completed > 0 else 6.0
        if runs_last_5 is None:
            runs_last_5 = int(round(crr * min(5.0, overs_completed)))
        if wickets_last_5 is None:
            wickets_last_5 = min(wickets_lost, 1 if wickets_lost <= 2 else 2)

        input_df = pd.DataFrame([{
            'batting_team': batting_team_norm,
            'bowling_team': bowling_team_norm,
            'city': city,
            'current_score': current_score,
            'wickets_lost': wickets_lost,
            'overs_completed': overs_completed,
            'runs_last_5': runs_last_5,
            'wickets_last_5': wickets_last_5,
            'crr': crr
        }])

        raw_pred = float(self.score_model.predict(input_df)[0])
        predicted_score = max(int(round(raw_pred)), current_score + (10 - wickets_lost))

        margin = 8  # ~1 std error (RMSE is ~8.8)
        lower_bound = max(predicted_score - margin, current_score)
        upper_bound = predicted_score + margin

        model_name = self.score_metadata.get("model_name", "Random Forest")

        return {
            "predicted_score": predicted_score,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "model": model_name,
            "batting_team": batting_team_norm,
            "bowling_team": bowling_team_norm,
            "current_score": current_score,
            "wickets_lost": wickets_lost,
            "overs_completed": overs_completed,
            "current_run_rate": round(crr, 2)
        }

    def predict_win_probability(
        self,
        batting_team: str,
        bowling_team: str,
        city: str = "Kolkata",
        target_score: int = 180,
        current_score: int = 110,
        wickets_lost: int = 3,
        overs_completed: float = 12.0
    ) -> Dict[str, Any]:
        """
        Calculates calibrated match win probabilities during 2nd innings chase.
        Returns structured dictionary.
        """
        if self.win_model is None:
            self.load_models()
        if self.win_model is None:
            raise RuntimeError("Win probability model is not loaded.")

        batting_team_norm = normalize_team_name(batting_team)
        bowling_team_norm = normalize_team_name(bowling_team)
        city = str(city or "Neutral").strip()

        runs_needed = target_score - current_score
        balls_bowled = int(round(overs_completed * 6))
        balls_remaining = max(0, 120 - balls_bowled)
        wickets_left = max(0, 10 - wickets_lost)

        model_name = self.win_metadata.get("model_name", "Gradient Boosting Classifier")

        # Compute CRR and RRR
        crr = current_score / overs_completed if overs_completed > 0 else 6.0
        rrr = (runs_needed * 6.0) / balls_remaining if balls_remaining > 0 else 36.0
        rrr_clipped = min(max(rrr, -10.0), 36.0)

        # Deterministic cricket rules
        if runs_needed <= 0:
            return {
                "team_a_probability": 1.0,
                "team_b_probability": 0.0,
                "chasing_team": batting_team_norm,
                "defending_team": bowling_team_norm,
                "runs_needed": 0,
                "balls_remaining": balls_remaining,
                "wickets_remaining": wickets_left,
                "current_run_rate": round(crr, 2),
                "required_run_rate": 0.0,
                "model": "Deterministic"
            }

        if wickets_left == 0 or (balls_remaining == 0 and runs_needed > 0):
            return {
                "team_a_probability": 0.0,
                "team_b_probability": 1.0,
                "chasing_team": batting_team_norm,
                "defending_team": bowling_team_norm,
                "runs_needed": runs_needed,
                "balls_remaining": balls_remaining,
                "wickets_remaining": wickets_left,
                "current_run_rate": round(crr, 2),
                "required_run_rate": 36.0,
                "model": "Deterministic"
            }

        input_df = pd.DataFrame([{
            'batting_team': batting_team_norm,
            'bowling_team': bowling_team_norm,
            'city': city,
            'runs_needed': runs_needed,
            'balls_remaining': balls_remaining,
            'wickets_left': wickets_left,
            'target_score': target_score,
            'crr': crr,
            'rrr': rrr_clipped
        }])

        prob_chase = float(self.win_model.predict_proba(input_df)[0][1])
        prob_chase = round(min(max(prob_chase, 0.005), 0.995), 4)
        prob_defend = round(1.0 - prob_chase, 4)

        return {
            "team_a_probability": prob_chase,
            "team_b_probability": prob_defend,
            "chasing_team": batting_team_norm,
            "defending_team": bowling_team_norm,
            "runs_needed": runs_needed,
            "balls_remaining": balls_remaining,
            "wickets_remaining": wickets_left,
            "current_run_rate": round(crr, 2),
            "required_run_rate": round(rrr, 2),
            "model": model_name
        }

# Global instance
prediction_service = PredictionService()

# Helper shortcut functions
def predict_score(*args, **kwargs):
    return prediction_service.predict_score(*args, **kwargs)

def predict_win_probability(*args, **kwargs):
    return prediction_service.predict_win_probability(*args, **kwargs)

if __name__ == "__main__":
    print("[*] Testing Score Prediction Service:")
    score_res = predict_score(
        batting_team="Chennai Super Kings",
        bowling_team="Mumbai Indians",
        city="Mumbai",
        current_score=85,
        wickets_lost=2,
        overs_completed=10.0
    )
    print(json.dumps(score_res, indent=2))

    print("\n[*] Testing Win Probability Service:")
    win_res = predict_win_probability(
        batting_team="Royal Challengers Bengaluru",
        bowling_team="Kolkata Knight Riders",
        city="Kolkata",
        target_score=185,
        current_score=110,
        wickets_lost=3,
        overs_completed=12.0
    )
    print(json.dumps(win_res, indent=2))
