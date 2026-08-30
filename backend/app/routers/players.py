from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.player import PlayerDetailOut
from backend.app.services.player_service import PlayerService

router = APIRouter(prefix="/players", tags=["Players"])

@router.get("")
def list_players(
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    batting_hand: Optional[str] = Query(None),
    bowling_skill: Optional[str] = Query(None),
    sort_by: str = Query("runs", pattern="^(runs|wickets|strike_rate|average|economy|matches)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    result = PlayerService.get_players(
        db=db,
        search=search,
        country=country,
        batting_hand=batting_hand,
        bowling_skill=bowling_skill,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )
    return {
        "page": page,
        "limit": limit,
        "total": result["total"],
        "players": [p for p in result["players"]]
    }

@router.get("/{player_id}", response_model=PlayerDetailOut)
def get_player_profile(player_id: int, db: Session = Depends(get_db)):
    detail = PlayerService.get_player_by_id(db, player_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Player not found")
    return detail
