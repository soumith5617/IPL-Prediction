import pytest
from backend.app.services.ml_engine import ml_engine

def test_models_loaded():
    assert ml_engine.score_model is not None, "Score prediction model should be loaded"
    assert ml_engine.win_model is not None, "Win probability model should be loaded"

def test_score_prediction_valid():
    res = ml_engine.predict_score(
        batting_team="Chennai Super Kings",
        bowling_team="Mumbai Indians",
        city="Mumbai",
        current_score=95,
        wickets_lost=2,
        overs_completed=11.0,
        runs_last_5=48,
        wickets_last_5=0
    )
    assert "predicted_score" in res
    assert res["predicted_score"] >= 95
    assert res["score_range_low"] <= res["predicted_score"] <= res["score_range_high"]
    assert len(res["trajectory"]) > 0
    assert "commentary" in res

def test_win_probability_valid():
    res = ml_engine.predict_win_probability(
        batting_team="Kolkata Knight Riders",
        bowling_team="Royal Challengers Bengaluru",
        city="Kolkata",
        target_score=175,
        current_score=120,
        wickets_lost=3,
        overs_completed=14.0
    )
    assert "chasing_team_win_prob" in res
    assert "defending_team_win_prob" in res
    assert round(res["chasing_team_win_prob"] + res["defending_team_win_prob"], 1) == 100.0
    assert res["runs_needed"] == 55
    assert res["balls_remaining"] == 36

def test_win_probability_target_achieved():
    res = ml_engine.predict_win_probability(
        batting_team="Rajasthan Royals",
        bowling_team="Punjab Kings",
        city="Jaipur",
        target_score=150,
        current_score=152,
        wickets_lost=4,
        overs_completed=18.2
    )
    assert res["chasing_team_win_prob"] == 100.0
    assert res["defending_team_win_prob"] == 0.0

def test_win_probability_all_out():
    res = ml_engine.predict_win_probability(
        batting_team="Delhi Capitals",
        bowling_team="Sunrisers Hyderabad",
        city="Delhi",
        target_score=200,
        current_score=140,
        wickets_lost=10,
        overs_completed=16.0
    )
    assert res["chasing_team_win_prob"] == 0.0
    assert res["defending_team_win_prob"] == 100.0
