"""
Backend Prediction Service.
Connects trained ML pipelines with SQLite persistence and structured responses.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import os
import json
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ml.predict import prediction_service as ml_service
from backend.models.prediction import PredictionLog
from backend.models.team import Team
from backend.models.venue import Venue
from backend.utils.logger import logger
from backend.utils.aliases import normalize_team_name

class BackendPredictionService:
    @staticmethod
    def predict_first_innings_score(
        payload: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes 1st innings score forecast, logs to database, and returns structured response.
        """
        batting_team = payload.get("batting_team")
        bowling_team = payload.get("bowling_team")
        runs = payload.get("runs", 0)
        wickets = payload.get("wickets", 0)
        overs = payload.get("overs", 10.0)
        runs_last_5 = payload.get("runs_last_5")
        wickets_last_5 = payload.get("wickets_last_5")
        city = payload.get("city", "Mumbai")

        ml_res = ml_service.predict_score(
            batting_team=batting_team,
            bowling_team=bowling_team,
            city=city,
            current_score=runs,
            wickets_lost=wickets,
            overs_completed=overs,
            runs_last_5=runs_last_5,
            wickets_last_5=wickets_last_5
        )

        pred_score = ml_res["predicted_score"]
        lower = ml_res["lower_bound"]
        upper = ml_res["upper_bound"]
        model_name = ml_res["model"]

        overs_left = max(0.1, 20.0 - overs)
        runs_to_add = max(0, pred_score - runs)
        projected_rr = round(runs_to_add / overs_left, 2)
        current_rr = ml_res["current_run_rate"]

        ts = datetime.now(timezone.utc).isoformat()
        input_summary = {
            "batting_team": batting_team,
            "bowling_team": bowling_team,
            "runs": runs,
            "wickets": wickets,
            "overs": overs,
            "runs_last_5": runs_last_5,
            "wickets_last_5": wickets_last_5,
            "city": city
        }

        output_data = {
            "prediction": {
                "predicted_score": pred_score,
                "lower_bound": lower,
                "upper_bound": upper
            },
            "model_used": model_name,
            "timestamp": ts,
            "input_summary": input_summary,
            "confidence": "±8 runs (95% CI based on validation RMSE)",
            "current_run_rate": current_rr,
            "projected_run_rate": projected_rr
        }

        # Log to SQLite
        try:
            log_record = PredictionLog(
                prediction_type="score",
                created_at=datetime.now(timezone.utc),
                batting_team=batting_team,
                bowling_team=bowling_team,
                venue=city,
                input_state=input_summary,
                prediction_output=output_data
            )
            db.add(log_record)
            db.commit()
            db.refresh(log_record)
            logger.info(f"Logged score prediction ID {log_record.id} for {batting_team} vs {bowling_team}")
        except Exception as e:
            logger.warning(f"Failed to record prediction log: {e}")

        return output_data

    @staticmethod
    def predict_win_probability(
        payload: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes 2nd innings chase win probability calculation and logs to database.
        """
        batting_team = payload.get("batting_team")
        bowling_team = payload.get("bowling_team")
        target_score = payload.get("target_score", 180)
        runs = payload.get("runs", 0)
        wickets = payload.get("wickets", 0)
        overs = payload.get("overs", 10.0)
        city = payload.get("city", "Kolkata")

        ml_res = ml_service.predict_win_probability(
            batting_team=batting_team,
            bowling_team=bowling_team,
            city=city,
            target_score=target_score,
            current_score=runs,
            wickets_lost=wickets,
            overs_completed=overs
        )

        ts = datetime.now(timezone.utc).isoformat()
        input_summary = {
            "chasing_team": batting_team,
            "defending_team": bowling_team,
            "target_score": target_score,
            "current_score": runs,
            "wickets_lost": wickets,
            "overs_completed": overs,
            "city": city
        }

        output_data = {
            "prediction": {
                "team_a_probability": ml_res.get("team_a_probability", 0.5),
                "team_b_probability": ml_res.get("team_b_probability", 0.5),
                "chasing_team": ml_res.get("chasing_team", batting_team),
                "defending_team": ml_res.get("defending_team", bowling_team)
            },
            "model_used": ml_res.get("model", "Gradient Boosting Classifier"),
            "timestamp": ts,
            "input_summary": input_summary,
            "runs_needed": ml_res.get("runs_needed", 0),
            "balls_remaining": ml_res.get("balls_remaining", 0),
            "current_run_rate": ml_res.get("current_run_rate", 0.0),
            "required_run_rate": ml_res.get("required_run_rate", 0.0)
        }

        # Log to SQLite
        try:
            log_record = PredictionLog(
                prediction_type="win",
                created_at=datetime.now(timezone.utc),
                batting_team=batting_team,
                bowling_team=bowling_team,
                venue=city,
                input_state=input_summary,
                prediction_output=output_data
            )
            db.add(log_record)
            db.commit()
            db.refresh(log_record)
            logger.info(f"Logged win prediction ID {log_record.id} for {batting_team} vs {bowling_team}")
        except Exception as e:
            logger.warning(f"Failed to record win prediction log: {e}")

        return output_data

    @staticmethod
    def predict_full_match(
        payload: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """
        Pre-game full match forecast combining score projections, win probability, and venue stats.
        """
        team1 = normalize_team_name(payload.get("team1"))
        team2 = normalize_team_name(payload.get("team2"))
        venue_name = payload.get("venue", "Wankhede Stadium")
        city = payload.get("city", "Mumbai")

        # Baseline 1st innings projection at halfway (10.0 overs at 8.0 rpo)
        score_est = ml_service.predict_score(
            batting_team=team1,
            bowling_team=team2,
            city=city,
            current_score=80,
            wickets_lost=2,
            overs_completed=10.0
        )

        # Baseline chase probability at par
        win_est = ml_service.predict_win_probability(
            batting_team=team2,
            bowling_team=team1,
            city=city,
            target_score=score_est["predicted_score"] + 1,
            current_score=80,
            wickets_lost=2,
            overs_completed=10.0
        )

        t1_obj = db.query(Team).filter(Team.name == team1).first()
        t2_obj = db.query(Team).filter(Team.name == team2).first()

        ts = datetime.now(timezone.utc).isoformat()
        res = {
            "matchup": f"{team1} vs {team2}",
            "venue": venue_name,
            "model_used": "Ensemble (Score Regressor + Win Classifier)",
            "timestamp": ts,
            "projected_first_innings_score": {
                "batting_first_team": team1,
                "projected_score": score_est["predicted_score"],
                "range": f"{score_est['lower_bound']} - {score_est['upper_bound']}"
            },
            "projected_win_probabilities": {
                team1: round(win_est["team_b_probability"] * 100, 1),
                team2: round(win_est["team_a_probability"] * 100, 1)
            },
            "head_to_head_summary": {
                f"{team1}_titles": t1_obj.titles if t1_obj else 0,
                f"{team2}_titles": t2_obj.titles if t2_obj else 0,
                f"{team1}_all_time_win_pct": t1_obj.win_percentage if t1_obj else 50.0,
                f"{team2}_all_time_win_pct": t2_obj.win_percentage if t2_obj else 50.0
            }
        }

        # Log
        try:
            log_record = PredictionLog(
                prediction_type="match",
                created_at=datetime.now(timezone.utc),
                batting_team=team1,
                bowling_team=team2,
                venue=venue_name,
                input_state=payload,
                prediction_output=res
            )
            db.add(log_record)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to record match prediction log: {e}")

        return res

    @staticmethod
    def get_predictions(
        db: Session,
        prediction_type: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[PredictionLog]:
        query = db.query(PredictionLog)
        if prediction_type and prediction_type != "all":
            query = query.filter(PredictionLog.prediction_type == prediction_type)
        return query.order_by(desc(PredictionLog.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def get_prediction_by_id(
        db: Session,
        prediction_id: int
    ) -> Optional[PredictionLog]:
        return db.query(PredictionLog).filter(PredictionLog.id == prediction_id).first()

    @staticmethod
    def clear_predictions(db: Session) -> int:
        count = db.query(PredictionLog).delete()
        db.commit()
        return count
