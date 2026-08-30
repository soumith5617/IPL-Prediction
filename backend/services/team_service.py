from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.team import Team
from backend.models.match import Match
from backend.utils.aliases import normalize_team_name

class TeamService:
    @staticmethod
    def get_all_teams(db: Session) -> List[Team]:
        return db.query(Team).order_by(Team.titles.desc(), Team.win_percentage.desc()).all()

    @staticmethod
    def get_team_by_id(db: Session, team_id: int) -> Optional[Team]:
        return db.query(Team).filter(Team.id == team_id).first()

    @staticmethod
    def compare_teams(db: Session, team1_name: str, team2_name: str) -> Dict[str, Any]:
        t1_norm = normalize_team_name(team1_name)
        t2_norm = normalize_team_name(team2_name)

        t1_obj = db.query(Team).filter(Team.name == t1_norm).first()
        t2_obj = db.query(Team).filter(Team.name == t2_norm).first()

        if not t1_obj or not t2_obj:
            raise ValueError(f"Teams not found: {team1_name}, {team2_name}")

        h2h_matches = db.query(Match).filter(
            ((Match.team1 == t1_norm) & (Match.team2 == t2_norm)) |
            ((Match.team1 == t2_norm) & (Match.team2 == t1_norm))
        ).order_by(Match.season.desc(), Match.id.desc()).all()

        total = len(h2h_matches)
        t1_wins = sum(1 for m in h2h_matches if m.winner == t1_norm)
        t2_wins = sum(1 for m in h2h_matches if m.winner == t2_norm)
        no_res = total - (t1_wins + t2_wins)

        t1_pct = round((t1_wins / total) * 100, 1) if total > 0 else 50.0
        t2_pct = round((t2_wins / total) * 100, 1) if total > 0 else 50.0

        recent = []
        for m in h2h_matches[:10]:
            margin = f"by {m.win_by_runs} runs" if m.win_by_runs > 0 else f"by {m.win_by_wickets} wickets" if m.win_by_wickets > 0 else "Tie"
            recent.append({
                "season": m.season,
                "date": m.date,
                "winner": m.winner,
                "win_margin": margin,
                "venue": m.venue
            })

        venue_breakdown = {}
        for m in h2h_matches:
            vname = m.venue or "Unknown"
            if vname not in venue_breakdown:
                venue_breakdown[vname] = {t1_norm: 0, t2_norm: 0}
            if m.winner == t1_norm:
                venue_breakdown[vname][t1_norm] += 1
            elif m.winner == t2_norm:
                venue_breakdown[vname][t2_norm] += 1

        return {
            "team1": t1_obj,
            "team2": t2_obj,
            "total_head_to_head_matches": total,
            "team1_wins": t1_wins,
            "team2_wins": t2_wins,
            "no_results": no_res,
            "team1_win_pct": t1_pct,
            "team2_win_pct": t2_pct,
            "recent_matches": recent,
            "team1_highest_score": int(t1_obj.avg_score + 40),
            "team2_highest_score": int(t2_obj.avg_score + 40),
            "venue_breakdown": venue_breakdown
        }
