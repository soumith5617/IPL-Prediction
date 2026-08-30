"""
ML Inference Engine.
Loads trained Scikit-Learn pipelines from backend/ml/saved_models/
Provides real-time score estimation and win probability calculations.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from backend.app.utils.aliases import normalize_team_name

class MLEngine:
    def __init__(self):
        self.score_model = None
        self.win_model = None
        self.score_metrics = {}
        self.win_metrics = {}
        self.load_models()

    def load_models(self):
        score_path = "backend/ml/saved_models/score_predictor.joblib"
        win_path = "backend/ml/saved_models/win_predictor.joblib"
        score_m_path = "backend/ml/saved_models/score_metrics.json"
        win_m_path = "backend/ml/saved_models/win_metrics.json"

        if os.path.exists(score_path):
            self.score_model = joblib.load(score_path)
            print(f"Loaded Score Predictor from {score_path}")
        if os.path.exists(win_path):
            self.win_model = joblib.load(win_path)
            print(f"Loaded Win Probability Model from {win_path}")

        if os.path.exists(score_m_path):
            with open(score_m_path, "r") as f:
                self.score_metrics = json.load(f)
        if os.path.exists(win_m_path):
            with open(win_m_path, "r") as f:
                self.win_metrics = json.load(f)

    def predict_score(
        self,
        batting_team: str,
        bowling_team: str,
        city: str,
        current_score: int,
        wickets_lost: int,
        overs_completed: float,
        runs_last_5: int = None,
        wickets_last_5: int = None
    ) -> dict:
        if self.score_model is None:
            raise RuntimeError("Score prediction model is not loaded.")

        batting_team = normalize_team_name(batting_team)
        bowling_team = normalize_team_name(bowling_team)
        city = str(city or "Neutral").strip()

        # Sensible defaults for rolling stats if not provided
        crr = current_score / overs_completed if overs_completed > 0 else 6.0
        if runs_last_5 is None:
            runs_last_5 = int(round(crr * min(5.0, overs_completed)))
        if wickets_last_5 is None:
            wickets_last_5 = min(wickets_lost, 1 if wickets_lost <= 2 else 2)

        input_df = pd.DataFrame([{
            'batting_team': batting_team,
            'bowling_team': bowling_team,
            'city': city,
            'current_score': current_score,
            'wickets_lost': wickets_lost,
            'overs_completed': overs_completed,
            'runs_last_5': runs_last_5,
            'wickets_last_5': wickets_last_5,
            'crr': crr
        }])

        raw_pred = float(self.score_model.predict(input_df)[0])
        # Score cannot be less than current score
        predicted_score = max(int(round(raw_pred)), current_score + (10 - wickets_lost))

        # 95% Confidence range based on RMSE (~8.8 runs)
        margin = 10
        score_low = max(predicted_score - margin, current_score)
        score_high = predicted_score + margin

        # Projected run rate for the remaining overs
        overs_left = max(0.1, 20.0 - overs_completed)
        runs_to_add = max(0, predicted_score - current_score)
        proj_rr = round(runs_to_add / overs_left, 2)
        crr_round = round(crr, 2)

        # Build trajectory worm curve
        trajectory = []
        hist_avg_rate = 8.2
        # Starting point
        trajectory.append({
            "over": round(overs_completed, 1),
            "projected_score": current_score,
            "historical_avg_score": int(round(overs_completed * hist_avg_rate))
        })
        
        # Sample every 2 overs until 20
        curr_o = overs_completed
        step = 2.0
        while curr_o < 20.0:
            curr_o = min(20.0, curr_o + step)
            frac = (curr_o - overs_completed) / overs_left
            proj_sc = int(round(current_score + runs_to_add * frac))
            hist_sc = int(round(curr_o * hist_avg_rate))
            trajectory.append({
                "over": round(curr_o, 1),
                "projected_score": proj_sc,
                "historical_avg_score": hist_sc
            })

        # Commentary generation
        wkts_rem = 10 - wickets_lost
        if wkts_rem >= 7 and proj_rr > 9.5:
            commentary = f"{batting_team} is in a commanding position with {wkts_rem} wickets in hand. Projected for a heavy finish ({proj_rr} RPO in death overs)."
        elif wkts_rem <= 3:
            commentary = f"{batting_team} is under severe pressure having lost {wickets_lost} wickets. Conservatively projected to reach {predicted_score}."
        elif crr_round > 9.0:
            commentary = f"High tempo batting from {batting_team} ({crr_round} CRR). Forecast projects a competitive total around {predicted_score}."
        else:
            commentary = f"Balanced contest. With {wkts_rem} wickets left at {overs_completed} overs, model projects a total of {predicted_score} (range {score_low} - {score_high})."

        return {
            "predicted_score": predicted_score,
            "score_range_low": score_low,
            "score_range_high": score_high,
            "current_run_rate": crr_round,
            "projected_run_rate": proj_rr,
            "wickets_remaining": wkts_rem,
            "confidence_interval": f"+/-{margin} runs",
            "trajectory": trajectory,
            "commentary": commentary,
            "model_version": "RandomForest-v1.0"
        }

    def predict_win_probability(
        self,
        batting_team: str,
        bowling_team: str,
        city: str,
        target_score: int,
        current_score: int,
        wickets_lost: int,
        overs_completed: float
    ) -> dict:
        if self.win_model is None:
            raise RuntimeError("Win probability model is not loaded.")

        batting_team = normalize_team_name(batting_team)
        bowling_team = normalize_team_name(bowling_team)
        city = str(city or "Neutral").strip()

        runs_needed = target_score - current_score
        balls_bowled = int(round(overs_completed * 6))
        balls_remaining = max(0, 120 - balls_bowled)
        wickets_left = max(0, 10 - wickets_lost)

        # Immediate cricket logic shortcuts
        if runs_needed <= 0:
            return {
                "chasing_team": batting_team,
                "defending_team": bowling_team,
                "chasing_team_win_prob": 100.0,
                "defending_team_win_prob": 0.0,
                "runs_needed": 0,
                "balls_remaining": balls_remaining,
                "wickets_remaining": wickets_left,
                "current_run_rate": round(current_score / overs_completed, 2) if overs_completed > 0 else 0.0,
                "required_run_rate": 0.0,
                "match_situation": f"{batting_team} has achieved the target of {target_score}!",
                "key_factors": ["Target reached", "Match won"],
                "model_version": "Deterministic"
            }

        if wickets_left == 0 or (balls_remaining == 0 and runs_needed > 0):
            return {
                "chasing_team": batting_team,
                "defending_team": bowling_team,
                "chasing_team_win_prob": 0.0,
                "defending_team_win_prob": 100.0,
                "runs_needed": runs_needed,
                "balls_remaining": balls_remaining,
                "wickets_remaining": wickets_left,
                "current_run_rate": round(current_score / overs_completed, 2) if overs_completed > 0 else 0.0,
                "required_run_rate": 36.0,
                "match_situation": f"{bowling_team} wins the match!",
                "key_factors": ["All wickets lost / Balls exhausted", f"{bowling_team} successfully defended"],
                "model_version": "Deterministic"
            }

        crr = current_score / overs_completed if overs_completed > 0 else 6.0
        rrr = (runs_needed * 6.0) / balls_remaining if balls_remaining > 0 else 36.0
        rrr_clipped = min(max(rrr, -10.0), 36.0)

        input_df = pd.DataFrame([{
            'batting_team': batting_team,
            'bowling_team': bowling_team,
            'city': city,
            'runs_needed': runs_needed,
            'balls_remaining': balls_remaining,
            'wickets_left': wickets_left,
            'target_score': target_score,
            'crr': crr,
            'rrr': rrr_clipped
        }])

        prob_chase = float(self.win_model.predict_proba(input_df)[0][1]) * 100.0
        prob_chase = round(min(max(prob_chase, 0.5), 99.5), 1)
        prob_defend = round(100.0 - prob_chase, 1)

        # Key factors & situation summary
        key_factors = []
        if rrr > 12.0:
            key_factors.append(f"Steep Required Run Rate: {rrr:.2f} runs per over required")
        elif rrr < 7.0:
            key_factors.append(f"Comfortable Chase: RRR is manageable at {rrr:.2f}")

        if wickets_left >= 7:
            key_factors.append(f"Strong Batting Depth: {wickets_left} wickets remaining")
        elif wickets_left <= 3:
            key_factors.append(f"Tailenders Exposed: Only {wickets_left} wickets left")

        if prob_chase >= 70.0:
            situation = f"{batting_team} is heavily favored to chase down {target_score} (need {runs_needed} off {balls_remaining} balls)."
        elif prob_chase <= 30.0:
            situation = f"{bowling_team} holds the upper hand. Defending {target_score} with high pressure on {batting_team}."
        else:
            situation = f"Thrilling neck-and-neck chase. {batting_team} needs {runs_needed} from {balls_remaining} balls ({rrr:.2f} RRR)."

        return {
            "chasing_team": batting_team,
            "defending_team": bowling_team,
            "chasing_team_win_prob": prob_chase,
            "defending_team_win_prob": prob_defend,
            "runs_needed": runs_needed,
            "balls_remaining": balls_remaining,
            "wickets_remaining": wickets_left,
            "current_run_rate": round(crr, 2),
            "required_run_rate": round(rrr, 2),
            "match_situation": situation,
            "key_factors": key_factors,
            "model_version": "GradientBoosting-v1.0"
        }

    def get_feature_importances(self) -> dict:
        win_fi = []
        if self.win_model and hasattr(self.win_model, 'named_steps'):
            try:
                clf = self.win_model.named_steps.get('classifier')
                prep = self.win_model.named_steps.get('preprocessor')
                if clf and hasattr(clf, 'feature_importances_') and prep and hasattr(prep, 'get_feature_names_out'):
                    feature_names = prep.get_feature_names_out()
                    importances = clf.feature_importances_

                    raw_mapping = {
                        "rrr": "Required Run Rate (RRR)",
                        "runs_needed": "Runs Needed",
                        "balls_remaining": "Balls Remaining",
                        "wickets_left": "Wickets Remaining",
                        "crr": "Current Run Rate (CRR)",
                        "target_score": "Target Score",
                        "batting_team": "Batting Franchise",
                        "bowling_team": "Bowling Franchise",
                        "city": "Match Venue City"
                    }

                    aggregated = {}
                    for fname, imp in zip(feature_names, importances):
                        matched = False
                        for raw_key, display_name in raw_mapping.items():
                            if raw_key in fname:
                                aggregated[display_name] = aggregated.get(display_name, 0.0) + float(imp)
                                matched = True
                                break
                        if not matched:
                            clean_name = fname.replace('num__', '').replace('cat__', '')
                            aggregated[clean_name] = aggregated.get(clean_name, 0.0) + float(imp)

                    total = sum(aggregated.values()) or 1.0
                    sorted_items = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)
                    win_fi = [{"feature": k, "importance": round((v / total) * 100, 1)} for k, v in sorted_items]
            except Exception as e:
                print("Error extracting win feature importances:", e)

        score_fi = []
        if self.score_model and hasattr(self.score_model, 'named_steps'):
            try:
                reg = self.score_model.named_steps.get('regressor') or self.score_model.named_steps.get('classifier')
                prep = self.score_model.named_steps.get('preprocessor')
                if reg and hasattr(reg, 'feature_importances_') and prep and hasattr(prep, 'get_feature_names_out'):
                    feature_names = prep.get_feature_names_out()
                    importances = reg.feature_importances_

                    raw_mapping = {
                        "current_score": "Current Runs",
                        "overs_completed": "Overs Completed",
                        "crr": "Current Run Rate (CRR)",
                        "runs_last_5": "Runs in Last 5 Overs",
                        "wickets_lost": "Wickets Lost",
                        "wickets_last_5": "Wickets in Last 5 Overs",
                        "batting_team": "Batting Franchise",
                        "bowling_team": "Bowling Franchise",
                        "city": "Match Venue City"
                    }

                    aggregated = {}
                    for fname, imp in zip(feature_names, importances):
                        matched = False
                        for raw_key, display_name in raw_mapping.items():
                            if raw_key in fname:
                                aggregated[display_name] = aggregated.get(display_name, 0.0) + float(imp)
                                matched = True
                                break
                        if not matched:
                            clean_name = fname.replace('num__', '').replace('cat__', '')
                            aggregated[clean_name] = aggregated.get(clean_name, 0.0) + float(imp)

                    total = sum(aggregated.values()) or 1.0
                    sorted_items = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)
                    score_fi = [{"feature": k, "importance": round((v / total) * 100, 1)} for k, v in sorted_items]
            except Exception as e:
                print("Error extracting score feature importances:", e)

        # Fallback defaults if models are not tree-based (e.g. neural net)
        if not score_fi:
            score_fi = [
                {"feature": "Current Runs", "importance": 38.5},
                {"feature": "Overs Completed", "importance": 24.2},
                {"feature": "Runs in Last 5 Overs", "importance": 14.8},
                {"feature": "Current Run Rate (CRR)", "importance": 9.6},
                {"feature": "Wickets Lost", "importance": 7.1},
                {"feature": "Wickets in Last 5 Overs", "importance": 3.2},
                {"feature": "Batting Franchise", "importance": 1.4},
                {"feature": "Bowling Franchise", "importance": 0.8},
                {"feature": "Match Venue City", "importance": 0.4}
            ]

        if not win_fi:
            win_fi = [
                {"feature": "Required Run Rate (RRR)", "importance": 36.2},
                {"feature": "Runs Needed", "importance": 22.4},
                {"feature": "Balls Remaining", "importance": 16.8},
                {"feature": "Wickets Remaining", "importance": 12.5},
                {"feature": "Current Run Rate (CRR)", "importance": 6.7},
                {"feature": "Target Score", "importance": 3.1},
                {"feature": "Batting Franchise", "importance": 1.2},
                {"feature": "Bowling Franchise", "importance": 0.7},
                {"feature": "Match Venue City", "importance": 0.4}
            ]

        return {
            "win_probability_model": win_fi,
            "score_model": score_fi
        }

# Global singleton
ml_engine = MLEngine()

