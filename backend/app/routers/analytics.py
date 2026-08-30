from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Venue, Match, Team, Player
from backend.app.services.ml_engine import ml_engine

router = APIRouter(prefix="/analytics", tags=["Analytics & Venues"])

@router.get("/venues")
def get_all_venues(db: Session = Depends(get_db)):
    return db.query(Venue).order_by(Venue.matches_hosted.desc()).all()

@router.get("/model-metrics")
def get_model_evaluation_metrics():
    return {
        "score_model": ml_engine.score_metrics,
        "win_probability_model": ml_engine.win_metrics,
        "feature_importances": ml_engine.get_feature_importances()
    }


@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_matches = db.query(Match).count()
    total_players = db.query(Player).count()
    total_teams = db.query(Team).count()
    total_venues = db.query(Venue).count()

    top_run_scorers = db.query(Player).order_by(Player.total_runs.desc()).limit(5).all()
    top_wicket_takers = db.query(Player).order_by(Player.wickets.desc()).limit(5).all()
    top_teams = db.query(Team).order_by(Team.titles.desc(), Team.win_percentage.desc()).limit(5).all()

    return {
        "total_matches": total_matches,
        "total_players": total_players,
        "total_teams": total_teams,
        "total_venues": total_venues,
        "top_run_scorers": top_run_scorers,
        "top_wicket_takers": top_wicket_takers,
        "top_teams": top_teams
    }
