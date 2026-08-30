from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.models.player import Player

class PlayerService:
    @staticmethod
    def get_players(
        db: Session,
        search: Optional[str] = None,
        country: Optional[str] = None,
        batting_hand: Optional[str] = None,
        bowling_skill: Optional[str] = None,
        sort_by: str = "runs",
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        query = db.query(Player)

        if search:
            query = query.filter(Player.name.ilike(f"%{search.strip()}%"))
        if country and country != "All":
            query = query.filter(Player.country == country)
        if batting_hand and batting_hand != "All":
            query = query.filter(Player.batting_hand == batting_hand)
        if bowling_skill and bowling_skill != "All":
            query = query.filter(Player.bowling_skill.ilike(f"%{bowling_skill}%"))

        if sort_by == "runs":
            query = query.order_by(desc(Player.total_runs))
        elif sort_by == "wickets":
            query = query.order_by(desc(Player.wickets))
        elif sort_by == "strike_rate":
            query = query.filter(Player.total_runs >= 150).order_by(desc(Player.strike_rate))
        elif sort_by == "average":
            query = query.filter(Player.total_runs >= 150).order_by(desc(Player.batting_average))
        elif sort_by == "economy":
            query = query.filter(Player.balls_bowled >= 120).order_by(Player.economy.asc())
        elif sort_by == "matches":
            query = query.order_by(desc(Player.matches))
        else:
            query = query.order_by(desc(Player.total_runs))

        total_count = query.count()
        players = query.offset(skip).limit(limit).all()

        return {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "players": players
        }

    @staticmethod
    def get_player_by_id(db: Session, player_id: int) -> Optional[Dict[str, Any]]:
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            return None

        sr_score = min(100.0, (player.strike_rate / 170.0) * 100.0)
        avg_score = min(100.0, (player.batting_average / 45.0) * 100.0)
        boundary_pct = min(100.0, (((player.fours * 4 + player.sixes * 6) / max(1, player.total_runs)) / 0.8) * 100.0) if player.total_runs > 0 else 0.0
        wkt_score = min(100.0, (player.wickets / 150.0) * 100.0)
        econ_score = max(0.0, min(100.0, ((11.0 - player.economy) / 5.0) * 100.0)) if player.economy > 0 else 0.0
        exp_score = min(100.0, (player.matches / 150.0) * 100.0)

        radar = [
            {"metric": "Strike Rate", "value": round(sr_score, 1), "fullMark": 100},
            {"metric": "Batting Avg", "value": round(avg_score, 1), "fullMark": 100},
            {"metric": "Boundary Power", "value": round(boundary_pct, 1), "fullMark": 100},
            {"metric": "Wickets Impact", "value": round(wkt_score, 1), "fullMark": 100},
            {"metric": "Economy Control", "value": round(econ_score, 1), "fullMark": 100},
            {"metric": "Experience", "value": round(exp_score, 1), "fullMark": 100},
        ]

        summary = f"{player.name} ({player.country}) - {player.matches} IPL matches, {player.total_runs} runs (HS: {player.highest_score}, SR: {player.strike_rate}) and {player.wickets} wickets (Econ: {player.economy})."

        return {
            "player": player,
            "radar_chart": radar,
            "career_summary": summary
        }
