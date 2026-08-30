from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.player import PlayerDetailOut
from backend.services.player_service import PlayerService

router = APIRouter(prefix="/players", tags=["Players"])

@router.get("")
def get_players(
    search: Optional[str] = Query(None, description="Search player by name"),
    country: Optional[str] = Query(None, description="Filter by nationality"),
    batting_hand: Optional[str] = Query(None, description="Filter by batting hand"),
    bowling_skill: Optional[str] = Query(None, description="Filter by bowling skill"),
    sort_by: str = Query("runs", pattern="^(runs|wickets|strike_rate|average|economy|matches)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Returns paginated, searchable, and sortable list of players with authentic career statistics."""
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
def get_player_by_id(player_id: int, db: Session = Depends(get_db)):
    """Returns detailed player card including 6-axis performance radar data."""
    detail = PlayerService.get_player_by_id(db, player_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found")
    return detail
