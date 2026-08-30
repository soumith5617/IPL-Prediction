from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.team import TeamOut, TeamComparisonResponse
from backend.app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamOut])
def get_all_teams(db: Session = Depends(get_db)):
    return TeamService.get_all_teams(db)

@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = TeamService.get_team_by_id(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.get("/compare/h2h", response_model=TeamComparisonResponse)
def compare_teams(
    team1: str = Query(..., examples=["Chennai Super Kings"]),
    team2: str = Query(..., examples=["Mumbai Indians"]),
    db: Session = Depends(get_db)
):
    try:
        return TeamService.compare_teams(db, team1, team2)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
