"""
Data Ingestion and Database Seeding Script.
Parses Players.xlsx, matches.csv, deliveries.csv and populates the SQLite database.
Computes genuine player, team, and venue career statistics.
"""

import os
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Team, Player, Venue, Match
from backend.app.utils.aliases import normalize_team_name, CANONICAL_TEAMS, TEAM_METADATA

def ingest_all():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Clear existing data
        db.query(Match).delete()
        db.query(Player).delete()
        db.query(Team).delete()
        db.query(Venue).delete()
        db.commit()

        # 2. Ingest Matches
        print("Ingesting matches dataset...")
        matches_df = pd.read_csv("data/matches.csv")
        match_records = []
        for _, row in matches_df.iterrows():
            m = Match(
                id=int(row['id']),
                season=int(row['season']),
                city=str(row['city']) if pd.notnull(row['city']) else None,
                date=str(row['date']) if pd.notnull(row['date']) else None,
                team1=normalize_team_name(str(row['team1'])),
                team2=normalize_team_name(str(row['team2'])),
                toss_winner=normalize_team_name(str(row['toss_winner'])) if pd.notnull(row['toss_winner']) else None,
                toss_decision=str(row['toss_decision']) if pd.notnull(row['toss_decision']) else None,
                result=str(row['result']) if pd.notnull(row['result']) else None,
                dl_applied=int(row['dl_applied']) if pd.notnull(row['dl_applied']) else 0,
                winner=normalize_team_name(str(row['winner'])) if pd.notnull(row['winner']) else None,
                win_by_runs=int(row['win_by_runs']) if pd.notnull(row['win_by_runs']) else 0,
                win_by_wickets=int(row['win_by_wickets']) if pd.notnull(row['win_by_wickets']) else 0,
                player_of_match=str(row['player_of_match']) if pd.notnull(row['player_of_match']) else None,
                venue=str(row['venue']) if pd.notnull(row['venue']) else None
            )
            match_records.append(m)
        db.bulk_save_objects(match_records)
        db.commit()
        print(f"Saved {len(match_records)} matches.")

        # 3. Compute Player stats from deliveries.csv and combine with Players.xlsx
        print("Aggregating player performance statistics from deliveries...")
        deliv_df = pd.read_csv("data/deliveries.csv")
        
        # Batting stats
        batsman_grouped = deliv_df.groupby(['match_id', 'batsman'])
        match_bat = batsman_grouped['batsman_runs'].sum().reset_index()
        
        bat_agg = deliv_df.groupby('batsman').agg(
            total_runs=('batsman_runs', 'sum'),
            balls_faced=('ball', 'count'),
            fours=('batsman_runs', lambda x: (x == 4).sum()),
            sixes=('batsman_runs', lambda x: (x == 6).sum())
        ).reset_index()

        # Innings & highest score
        bat_meta = match_bat.groupby('batsman').agg(
            innings=('match_id', 'count'),
            highest_score=('batsman_runs', 'max'),
            fifties=('batsman_runs', lambda x: ((x >= 50) & (x < 100)).sum()),
            hundreds=('batsman_runs', lambda x: (x >= 100).sum())
        ).reset_index()

        bat_full = bat_agg.merge(bat_meta, on='batsman', how='left')
        
        # Count dismissals for average
        dismissals = deliv_df[deliv_df['player_dismissed'].notnull()].groupby('player_dismissed')['match_id'].count().to_dict()
        
        # Bowling stats
        deliv_df['is_bowler_wicket'] = deliv_df['dismissal_kind'].apply(
            lambda x: 1 if x in ['bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'] else 0
        )
        # Legal deliveries
        deliv_df['is_legal_ball'] = deliv_df['wide_runs'].fillna(0).eq(0) & deliv_df['noball_runs'].fillna(0).eq(0)
        
        bowl_agg = deliv_df.groupby('bowler').agg(
            balls_bowled=('is_legal_ball', 'sum'),
            runs_conceded=('total_runs', 'sum'),
            wickets=('is_bowler_wicket', 'sum')
        ).reset_index()

        match_bowl = deliv_df.groupby(['match_id', 'bowler'])['is_bowler_wicket'].sum().reset_index()
        bowl_meta = match_bowl.groupby('bowler').agg(
            innings_bowled=('match_id', 'count'),
            four_wickets=('is_bowler_wicket', lambda x: (x >= 4).sum())
        ).reset_index()

        bowl_full = bowl_agg.merge(bowl_meta, on='bowler', how='left')

        # Read Players.xlsx
        print("Reading Players.xlsx registry...")
        players_xl = pd.read_excel("data/Players.xlsx")
        
        player_dict = {}
        for _, row in players_xl.iterrows():
            pname = str(row['Player_Name']).strip()
            player_dict[pname] = {
                "dob": str(row['DOB'])[:10] if pd.notnull(row['DOB']) else None,
                "batting_hand": str(row['Batting_Hand']) if pd.notnull(row['Batting_Hand']) else "Unknown",
                "bowling_skill": str(row['Bowling_Skill']) if pd.notnull(row['Bowling_Skill']) else "Unknown",
                "country": str(row['Country']) if pd.notnull(row['Country']) else "Unknown"
            }

        # Convert batting & bowling tables to dictionary
        bat_records = bat_full.set_index('batsman').to_dict('index')
        bowl_records = bowl_full.set_index('bowler').to_dict('index')

        # Union of all known player names
        all_player_names = set(player_dict.keys()) | set(bat_records.keys()) | set(bowl_records.keys())
        
        player_entities = []
        for name in sorted(all_player_names):
            p_info = player_dict.get(name, {
                "dob": None, "batting_hand": "Unknown", "bowling_skill": "Unknown", "country": "Unknown"
            })
            b_info = bat_records.get(name, {})
            bw_info = bowl_records.get(name, {})

            runs = int(b_info.get('total_runs', 0))
            balls = int(b_info.get('balls_faced', 0))
            inn_bat = int(b_info.get('innings', 0))
            highest = int(b_info.get('highest_score', 0))
            fifties = int(b_info.get('fifties', 0))
            hundreds = int(b_info.get('hundreds', 0))
            fours = int(b_info.get('fours', 0))
            sixes = int(b_info.get('sixes', 0))
            out_count = dismissals.get(name, 0)

            sr = round((runs / balls) * 100, 2) if balls > 0 else 0.0
            avg = round(runs / out_count, 2) if out_count > 0 else float(runs)

            # Bowling
            b_balls = int(bw_info.get('balls_bowled', 0))
            b_runs = int(bw_info.get('runs_conceded', 0))
            b_wkts = int(bw_info.get('wickets', 0))
            b_inn = int(bw_info.get('innings_bowled', 0))
            b_4w = int(bw_info.get('four_wickets', 0))

            overs_b = b_balls / 6.0
            econ = round(b_runs / overs_b, 2) if overs_b > 0 else 0.0
            bowl_avg = round(b_runs / b_wkts, 2) if b_wkts > 0 else 0.0

            matches_p = max(inn_bat, b_inn)

            p_obj = Player(
                name=name,
                dob=p_info.get('dob'),
                batting_hand=p_info.get('batting_hand'),
                bowling_skill=p_info.get('bowling_skill'),
                country=p_info.get('country'),
                matches=matches_p,
                innings_batted=inn_bat,
                total_runs=runs,
                highest_score=highest,
                batting_average=avg,
                strike_rate=sr,
                fifties=fifties,
                hundreds=hundreds,
                fours=fours,
                sixes=sixes,
                innings_bowled=b_inn,
                balls_bowled=b_balls,
                runs_conceded=b_runs,
                wickets=b_wkts,
                bowling_average=bowl_avg,
                economy=econ,
                four_wickets=b_4w
            )
            player_entities.append(p_obj)

        db.bulk_save_objects(player_entities)
        db.commit()
        print(f"Saved {len(player_entities)} player profiles.")

        # 4. Ingest Teams
        print("Computing and saving team metadata & records...")
        team_entities = []
        for tname in CANONICAL_TEAMS:
            meta = TEAM_METADATA.get(tname, {})
            # Compute match stats
            played = len(matches_df[
                (matches_df['team1'].apply(normalize_team_name) == tname) |
                (matches_df['team2'].apply(normalize_team_name) == tname)
            ])
            won = len(matches_df[matches_df['winner'].apply(normalize_team_name) == tname])
            win_pct = round((won / played) * 100, 2) if played > 0 else 0.0

            # Avg 1st innings score
            team_delivs = deliv_df[deliv_df['batting_team'].apply(normalize_team_name) == tname]
            match_scores = team_delivs.groupby('match_id')['total_runs'].sum()
            avg_sc = round(float(match_scores.mean()), 1) if len(match_scores) > 0 else 160.0

            t_obj = Team(
                name=tname,
                short_name=meta.get("short_name", tname[:3].upper()),
                primary_color=meta.get("primary_color", "#1E40AF"),
                secondary_color=meta.get("secondary_color", "#F59E0B"),
                badge_bg=meta.get("badge_bg", "from-slate-700 to-slate-900"),
                text_color=meta.get("text_color", "text-blue-400"),
                titles=meta.get("titles", 0),
                home_ground=meta.get("home_ground", "Home Stadium"),
                captain=meta.get("captain", "Captain"),
                matches_played=played,
                matches_won=won,
                win_percentage=win_pct,
                avg_score=avg_sc
            )
            team_entities.append(t_obj)

        db.bulk_save_objects(team_entities)
        db.commit()
        print(f"Saved {len(team_entities)} canonical teams.")

        # 5. Ingest Venues
        print("Aggregating venue statistics...")
        venue_records = []
        for venue_name, v_group in matches_df.groupby('venue'):
            v_name = str(venue_name)
            city = str(v_group['city'].dropna().iloc[0]) if len(v_group['city'].dropna()) > 0 else "Neutral"
            m_hosted = len(v_group)
            
            # Innings scores
            v_match_ids = set(v_group['id'])
            v_deliv = deliv_df[deliv_df['match_id'].isin(v_match_ids)]
            
            inn1_scores = v_deliv[v_deliv['inning'] == 1].groupby('match_id')['total_runs'].sum()
            inn2_scores = v_deliv[v_deliv['inning'] == 2].groupby('match_id')['total_runs'].sum()

            avg1 = round(float(inn1_scores.mean()), 1) if len(inn1_scores) > 0 else 160.0
            avg2 = round(float(inn2_scores.mean()), 1) if len(inn2_scores) > 0 else 145.0
            high_sc = int(inn1_scores.max()) if len(inn1_scores) > 0 else 200
            low_sc = int(inn1_scores.min()) if len(inn1_scores) > 0 else 100

            bat_first_wins = (v_group['win_by_runs'] > 0).sum()
            chase_wins = (v_group['win_by_wickets'] > 0).sum()
            total_decisive = bat_first_wins + chase_wins
            
            bf_pct = round((bat_first_wins / total_decisive) * 100, 1) if total_decisive > 0 else 50.0
            chase_pct = round((chase_wins / total_decisive) * 100, 1) if total_decisive > 0 else 50.0

            v_obj = Venue(
                name=v_name,
                city=city,
                matches_hosted=m_hosted,
                avg_first_innings_score=avg1,
                avg_second_innings_score=avg2,
                highest_score=high_sc,
                lowest_score=low_sc,
                bat_first_win_pct=bf_pct,
                chase_win_pct=chase_pct
            )
            venue_records.append(v_obj)

        db.bulk_save_objects(venue_records)
        db.commit()
        print(f"Saved {len(venue_records)} venues.")

        print("\nAll database seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_all()
