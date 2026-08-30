"""
IPL Franchise Aliases, Modern Team Mappings, and Team Metadata.
"""

from ml.preprocessing import TEAM_ALIASES, CANONICAL_TEAMS, normalize_team_name

TEAM_METADATA = {
    "Chennai Super Kings": {
        "short_name": "CSK",
        "primary_color": "#FFFF3C",
        "secondary_color": "#0081E9",
        "titles": 5,
        "home_ground": "MA Chidambaram Stadium, Chepauk, Chennai",
        "captain": "Ruturaj Gaikwad",
    },
    "Mumbai Indians": {
        "short_name": "MI",
        "primary_color": "#004BA0",
        "secondary_color": "#D1AB3E",
        "titles": 5,
        "home_ground": "Wankhede Stadium, Mumbai",
        "captain": "Hardik Pandya",
    },
    "Kolkata Knight Riders": {
        "short_name": "KKR",
        "primary_color": "#3A225D",
        "secondary_color": "#F7D54E",
        "titles": 3,
        "home_ground": "Eden Gardens, Kolkata",
        "captain": "Shreyas Iyer",
    },
    "Royal Challengers Bengaluru": {
        "short_name": "RCB",
        "primary_color": "#EC1C24",
        "secondary_color": "#000000",
        "titles": 0,
        "home_ground": "M. Chinnaswamy Stadium, Bengaluru",
        "captain": "Faf du Plessis",
    },
    "Rajasthan Royals": {
        "short_name": "RR",
        "primary_color": "#EA1A85",
        "secondary_color": "#004B8C",
        "titles": 1,
        "home_ground": "Sawai Mansingh Stadium, Jaipur",
        "captain": "Sanju Samson",
    },
    "Sunrisers Hyderabad": {
        "short_name": "SRH",
        "primary_color": "#F7A721",
        "secondary_color": "#000000",
        "titles": 1,
        "home_ground": "Rajiv Gandhi International Stadium, Hyderabad",
        "captain": "Pat Cummins",
    },
    "Delhi Capitals": {
        "short_name": "DC",
        "primary_color": "#0078BC",
        "secondary_color": "#DC3545",
        "titles": 0,
        "home_ground": "Arun Jaitley Stadium, Delhi",
        "captain": "Rishabh Pant",
    },
    "Punjab Kings": {
        "short_name": "PBKS",
        "primary_color": "#ED1B24",
        "secondary_color": "#DCDDDF",
        "titles": 0,
        "home_ground": "IS Bindra Stadium, Mohali",
        "captain": "Shikhar Dhawan",
    },
    "Gujarat Titans": {
        "short_name": "GT",
        "primary_color": "#1C3C6D",
        "secondary_color": "#E5A823",
        "titles": 1,
        "home_ground": "Narendra Modi Stadium, Ahmedabad",
        "captain": "Shubman Gill",
    },
    "Lucknow Super Giants": {
        "short_name": "LSG",
        "primary_color": "#00B4D8",
        "secondary_color": "#FF6B6B",
        "titles": 0,
        "home_ground": "BRSABV Ekana Cricket Stadium, Lucknow",
        "captain": "KL Rahul",
    },
}

__all__ = [
    "TEAM_ALIASES",
    "CANONICAL_TEAMS",
    "normalize_team_name",
    "TEAM_METADATA"
]
