"""
Cricket domain calculations and notation utilities.
"""

def cricket_overs_to_balls(overs_notation: float) -> int:
    """
    Converts cricket notation (e.g. 10.5) to total legal deliveries bowled.
    10.5 overs = 10 full overs + 5 balls = 65 balls.
    """
    completed_overs = int(overs_notation)
    partial_balls = round((overs_notation - completed_overs) * 10)
    return (completed_overs * 6) + partial_balls

def balls_to_decimal_overs(total_balls: int) -> float:
    """
    Converts total deliveries to mathematical decimal overs.
    65 balls = 65 / 6 = 10.8333... overs.
    """
    return round(total_balls / 6.0, 4)

def calculate_crr(current_runs: int, overs_notation: float) -> float:
    """
    Calculates exact Current Run Rate from cricket notation.
    """
    total_balls = cricket_overs_to_balls(overs_notation)
    if total_balls <= 0:
        return 0.0
    decimal_overs = total_balls / 6.0
    return round(current_runs / decimal_overs, 2)

def calculate_rrr(runs_needed: int, balls_remaining: int) -> float:
    """
    Calculates Required Run Rate per 6 balls.
    """
    if balls_remaining <= 0:
        return 36.0 if runs_needed > 0 else 0.0
    return round((runs_needed * 6.0) / balls_remaining, 2)
