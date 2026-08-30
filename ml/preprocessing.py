"""
Preprocessing Module for IPL Prediction System.
Handles franchise canonical mappings and builds reusable Scikit-Learn ColumnTransformer preprocessors.
"""

from typing import List
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Canonical Franchise Aliases
TEAM_ALIASES = {
    "Delhi Daredevils": "Delhi Capitals",
    "Kings XI Punjab": "Punjab Kings",
    "Deccan Chargers": "Sunrisers Hyderabad",
    "Rising Pune Supergiants": "Rising Pune Supergiant",
    "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
}

CANONICAL_TEAMS = [
    "Chennai Super Kings",
    "Delhi Capitals",
    "Gujarat Titans",
    "Kolkata Knight Riders",
    "Lucknow Super Giants",
    "Mumbai Indians",
    "Punjab Kings",
    "Rajasthan Royals",
    "Royal Challengers Bengaluru",
    "Sunrisers Hyderabad",
]

def normalize_team_name(name: str) -> str:
    """Standardizes historical franchise names to current canonical name."""
    if not name:
        return ""
    name_clean = str(name).strip()
    return TEAM_ALIASES.get(name_clean, name_clean)

def build_score_preprocessor(
    categorical_cols: List[str] = None,
    numerical_cols: List[str] = None
) -> ColumnTransformer:
    """Builds a reusable Scikit-Learn ColumnTransformer for score regression."""
    if categorical_cols is None:
        categorical_cols = ['batting_team', 'bowling_team', 'city']
    if numerical_cols is None:
        numerical_cols = ['current_score', 'wickets_lost', 'overs_completed', 'runs_last_5', 'wickets_last_5', 'crr']

    return ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols),
            ('num', StandardScaler(), numerical_cols)
        ],
        remainder='drop'
    )

def build_win_preprocessor(
    categorical_cols: List[str] = None,
    numerical_cols: List[str] = None
) -> ColumnTransformer:
    """Builds a reusable Scikit-Learn ColumnTransformer for win probability classification."""
    if categorical_cols is None:
        categorical_cols = ['batting_team', 'bowling_team', 'city']
    if numerical_cols is None:
        numerical_cols = ['runs_needed', 'balls_remaining', 'wickets_left', 'target_score', 'crr', 'rrr']

    return ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols),
            ('num', StandardScaler(), numerical_cols)
        ],
        remainder='drop'
    )
