"""
Data Loader Module for IPL Prediction System.
Provides safe dataset loading, column schema validation, and missing value handling.
"""

import os
from typing import Tuple, Optional
import pandas as pd

REQUIRED_MATCHES_COLUMNS = [
    'id', 'season', 'city', 'date', 'team1', 'team2', 
    'toss_winner', 'toss_decision', 'result', 'winner', 'venue'
]

REQUIRED_DELIVERIES_COLUMNS = [
    'match_id', 'inning', 'batting_team', 'bowling_team',
    'over', 'ball', 'batsman', 'bowler', 'total_runs'
]

REQUIRED_PLAYERS_COLUMNS = [
    'Player_Name', 'DOB', 'Batting_Hand', 'Bowling_Skill', 'Country'
]

def load_matches_data(filepath: str = "data/matches.csv") -> pd.DataFrame:
    """Safely loads and validates matches.csv."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Matches dataset not found at '{filepath}'")

    df = pd.read_csv(filepath)
    missing_cols = [c for c in REQUIRED_MATCHES_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Matches dataset is missing required columns: {missing_cols}")

    # Clean string columns
    str_cols = ['city', 'team1', 'team2', 'toss_winner', 'toss_decision', 'result', 'winner', 'venue']
    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().replace({'nan': None, '': None})

    # Fill missing city with venue or 'Neutral'
    df['city'] = df['city'].fillna(df['venue']).fillna('Neutral')
    return df

def load_deliveries_data(filepath: str = "data/deliveries.csv") -> pd.DataFrame:
    """Safely loads and validates deliveries.csv."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Deliveries dataset not found at '{filepath}'")

    df = pd.read_csv(filepath)
    missing_cols = [c for c in REQUIRED_DELIVERIES_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Deliveries dataset is missing required columns: {missing_cols}")

    # Ensure numeric columns
    numeric_cols = ['match_id', 'inning', 'over', 'ball', 'total_runs']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Clean string columns
    for col in ['batting_team', 'bowling_team', 'batsman', 'bowler']:
        df[col] = df[col].astype(str).str.strip()

    return df

def load_players_data(filepath: str = "data/Players.xlsx") -> pd.DataFrame:
    """Safely loads and validates Players.xlsx."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Players dataset not found at '{filepath}'")

    df = pd.read_excel(filepath)
    missing_cols = [c for c in REQUIRED_PLAYERS_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Players dataset is missing required columns: {missing_cols}")

    # Clean Batting Hand inconsistencies
    df['Batting_Hand'] = df['Batting_Hand'].astype(str).str.title().replace({'Nan': 'Unknown'})
    df['Bowling_Skill'] = df['Bowling_Skill'].astype(str).replace({'nan': 'Unknown'})
    df['Country'] = df['Country'].astype(str).replace({'nan': 'Unknown'})
    df['DOB'] = pd.to_datetime(df['DOB'], errors='coerce')

    return df

def load_raw_ipl_datasets(
    matches_path: str = "data/matches.csv",
    deliveries_path: str = "data/deliveries.csv"
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Loads and returns validated matches and deliveries DataFrames."""
    matches = load_matches_data(matches_path)
    deliveries = load_deliveries_data(deliveries_path)
    return matches, deliveries
