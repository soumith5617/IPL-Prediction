"""
Feature Engineering Module for IPL Prediction System.
Extracts strictly causal point-in-time features for score regression and chase win classification.
"""

from typing import Tuple
import numpy as np
import pandas as pd
from ml.preprocessing import normalize_team_name, CANONICAL_TEAMS

def create_score_features(
    matches: pd.DataFrame,
    deliveries: pd.DataFrame,
    min_over: float = 3.0
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extracts causal match-state features for First-Innings Score Prediction.
    
    Target: final_score (1st innings total runs)
    Features: batting_team, bowling_team, city, current_score, wickets_lost, 
              overs_completed, runs_last_5, wickets_last_5, crr
    """
    valid_matches = matches[matches['result'] != 'no result'].copy()
    match_meta = valid_matches[['id', 'city', 'venue']].rename(columns={'id': 'match_id'})
    
    deliv = deliveries[deliveries['match_id'].isin(valid_matches['id'])].copy()
    deliv = deliv.merge(match_meta, on='match_id', how='left')

    deliv['batting_team'] = deliv['batting_team'].apply(normalize_team_name)
    deliv['bowling_team'] = deliv['bowling_team'].apply(normalize_team_name)

    # Filter to canonical franchises
    deliv = deliv[
        deliv['batting_team'].isin(CANONICAL_TEAMS) &
        deliv['bowling_team'].isin(CANONICAL_TEAMS)
    ].copy()

    # 1st innings only
    first_inn = deliv[deliv['inning'] == 1].sort_values(['match_id', 'over', 'ball']).reset_index(drop=True)

    # Cumulative calculations
    first_inn['is_wicket'] = first_inn['player_dismissed'].notnull().astype(int)
    first_inn['current_score'] = first_inn.groupby('match_id')['total_runs'].cumsum()
    first_inn['wickets_lost'] = first_inn.groupby('match_id')['is_wicket'].cumsum()
    first_inn['overs_completed'] = (first_inn['over'] - 1) + (first_inn['ball'] / 6.0)

    # Total innings target score per match
    total_scores = first_inn.groupby('match_id')['total_runs'].sum().reset_index().rename(columns={'total_runs': 'final_score'})
    first_inn = first_inn.merge(total_scores, on='match_id', how='left')

    # Rolling 30-ball window for last 5 overs
    first_inn['runs_last_5'] = (
        first_inn.groupby('match_id')['total_runs']
        .rolling(window=30, min_periods=6)
        .sum()
        .reset_index(level=0, drop=True)
    ).fillna(first_inn['current_score'])

    first_inn['wickets_last_5'] = (
        first_inn.groupby('match_id')['is_wicket']
        .rolling(window=30, min_periods=6)
        .sum()
        .reset_index(level=0, drop=True)
    ).fillna(first_inn['wickets_lost'])

    # Filter early overs
    df_train = first_inn[first_inn['overs_completed'] >= min_over].copy()
    df_train['crr'] = df_train['current_score'] / df_train['overs_completed']
    df_train['city'] = df_train['city'].fillna(df_train['venue']).fillna('Neutral')

    feature_cols = [
        'batting_team',
        'bowling_team',
        'city',
        'current_score',
        'wickets_lost',
        'overs_completed',
        'runs_last_5',
        'wickets_last_5',
        'crr'
    ]

    X = df_train[feature_cols]
    y = df_train['final_score']

    return X, y

def create_win_features(
    matches: pd.DataFrame,
    deliveries: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Extracts causal match-state features for Second-Innings Win Probability Prediction.
    
    Target: is_winner (1 if chasing batting team wins, else 0)
    Features: batting_team, bowling_team, city, runs_needed, balls_remaining,
              wickets_left, target_score, crr, rrr
    """
    valid_matches = matches[matches['winner'].notnull() & (matches['result'] != 'no result')].copy()
    valid_matches['team1'] = valid_matches['team1'].apply(normalize_team_name)
    valid_matches['team2'] = valid_matches['team2'].apply(normalize_team_name)
    valid_matches['winner'] = valid_matches['winner'].apply(normalize_team_name)

    valid_matches = valid_matches[
        valid_matches['team1'].isin(CANONICAL_TEAMS) &
        valid_matches['team2'].isin(CANONICAL_TEAMS) &
        valid_matches['winner'].isin(CANONICAL_TEAMS)
    ]

    # Calculate 1st innings total to derive target
    first_inn = deliveries[deliveries['inning'] == 1].groupby('match_id')['total_runs'].sum().reset_index()
    first_inn['target_score'] = first_inn['total_runs'] + 1
    first_inn = first_inn.drop(columns=['total_runs'])

    match_df = valid_matches.merge(first_inn, left_on='id', right_on='match_id', how='inner')

    # Second innings deliveries
    second_inn = deliveries[deliveries['inning'] == 2].copy()
    second_inn = second_inn.merge(
        match_df[['id', 'city', 'venue', 'winner', 'target_score']], 
        left_on='match_id', 
        right_on='id', 
        how='inner'
    )

    second_inn['batting_team'] = second_inn['batting_team'].apply(normalize_team_name)
    second_inn['bowling_team'] = second_inn['bowling_team'].apply(normalize_team_name)

    second_inn = second_inn[
        second_inn['batting_team'].isin(CANONICAL_TEAMS) &
        second_inn['bowling_team'].isin(CANONICAL_TEAMS)
    ].sort_values(['match_id', 'over', 'ball']).reset_index(drop=True)

    # Cumulative calculations
    second_inn['is_wicket'] = second_inn['player_dismissed'].notnull().astype(int)
    second_inn['current_score'] = second_inn.groupby('match_id')['total_runs'].cumsum()
    second_inn['wickets_lost'] = second_inn.groupby('match_id')['is_wicket'].cumsum()
    second_inn['balls_bowled'] = (second_inn['over'] - 1) * 6 + second_inn['ball']

    second_inn['runs_needed'] = second_inn['target_score'] - second_inn['current_score']
    second_inn['balls_remaining'] = 120 - second_inn['balls_bowled']
    second_inn['wickets_left'] = 10 - second_inn['wickets_lost']

    # Filter active chase states (after 1st over)
    chase_df = second_inn[
        (second_inn['balls_remaining'] >= 0) &
        (second_inn['balls_bowled'] >= 6) &
        (second_inn['wickets_left'] >= 0)
    ].copy()

    chase_df['overs_completed'] = chase_df['balls_bowled'] / 6.0
    chase_df['crr'] = chase_df['current_score'] / chase_df['overs_completed']

    # Compute RRR
    chase_df['rrr'] = np.where(
        chase_df['balls_remaining'] > 0,
        (chase_df['runs_needed'] * 6.0) / chase_df['balls_remaining'],
        chase_df['runs_needed']
    )
    chase_df['rrr'] = chase_df['rrr'].clip(lower=-10, upper=36)

    # Target
    chase_df['is_winner'] = (chase_df['batting_team'] == chase_df['winner']).astype(int)
    chase_df['city'] = chase_df['city'].fillna(chase_df['venue']).fillna('Neutral')

    feature_cols = [
        'batting_team',
        'bowling_team',
        'city',
        'runs_needed',
        'balls_remaining',
        'wickets_left',
        'target_score',
        'crr',
        'rrr'
    ]

    X = chase_df[feature_cols]
    y = chase_df['is_winner']

    return X, y
