from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.team import TeamOut, TeamComparisonOut
from backend.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamOut])
def get_teams(db: Session = Depends(get_db)):
    """Returns the list of all canonical IPL franchises and their historical performance."""
    return TeamService.get_all_teams(db)

@router.get("/{team_id}", response_model=TeamOut)
def get_team_by_id(team_id: int, db: Session = Depends(get_db)):
    """Returns single franchise record by ID."""
    team = TeamService.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found")
    return team

@router.get("/compare/h2h", response_model=TeamComparisonOut)
def compare_teams_h2h(
    team1: str = Query(..., examples=["Chennai Super Kings"]),
    team2: str = Query(..., examples=["Mumbai Indians"]),
    db: Session = Depends(get_db)
):
    """Returns head-to-head records and recent match history between two franchises."""
    try:
        return TeamService.compare_teams(db, team1, team2)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
