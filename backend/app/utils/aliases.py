"""
IPL Franchise Aliases, Modern Team Mappings, and Team Metadata.
Handles franchise renames across IPL history (2008-2024+).
"""

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

TEAM_METADATA = {
    "Chennai Super Kings": {
        "short_name": "CSK",
        "primary_color": "#FFFF3C",
        "secondary_color": "#0081E9",
        "badge_bg": "from-yellow-500 to-yellow-600",
        "text_color": "text-yellow-400",
        "titles": 5,
        "home_ground": "MA Chidambaram Stadium, Chepauk, Chennai",
        "captain": "Ruturaj Gaikwad",
    },
    "Mumbai Indians": {
        "short_name": "MI",
        "primary_color": "#004BA0",
        "secondary_color": "#D1AB3E",
        "badge_bg": "from-blue-600 to-blue-800",
        "text_color": "text-blue-400",
        "titles": 5,
        "home_ground": "Wankhede Stadium, Mumbai",
        "captain": "Hardik Pandya",
    },
    "Kolkata Knight Riders": {
        "short_name": "KKR",
        "primary_color": "#3A225D",
        "secondary_color": "#F7D54E",
        "badge_bg": "from-purple-700 to-indigo-900",
        "text_color": "text-purple-400",
        "titles": 3,
        "home_ground": "Eden Gardens, Kolkata",
        "captain": "Shreyas Iyer",
    },
    "Royal Challengers Bengaluru": {
        "short_name": "RCB",
        "primary_color": "#EC1C24",
        "secondary_color": "#000000",
        "badge_bg": "from-red-600 to-black",
        "text_color": "text-red-400",
        "titles": 0,
        "home_ground": "M. Chinnaswamy Stadium, Bengaluru",
        "captain": "Faf du Plessis",
    },
    "Rajasthan Royals": {
        "short_name": "RR",
        "primary_color": "#EA1A85",
        "secondary_color": "#004B8C",
        "badge_bg": "from-pink-600 to-blue-700",
        "text_color": "text-pink-400",
        "titles": 1,
        "home_ground": "Sawai Mansingh Stadium, Jaipur",
        "captain": "Sanju Samson",
    },
    "Sunrisers Hyderabad": {
        "short_name": "SRH",
        "primary_color": "#F7A721",
        "secondary_color": "#000000",
        "badge_bg": "from-orange-500 to-amber-700",
        "text_color": "text-orange-400",
        "titles": 1,
        "home_ground": "Rajiv Gandhi International Stadium, Hyderabad",
        "captain": "Pat Cummins",
    },
    "Delhi Capitals": {
        "short_name": "DC",
        "primary_color": "#0078BC",
        "secondary_color": "#DC3545",
        "badge_bg": "from-sky-600 to-blue-800",
        "text_color": "text-sky-400",
        "titles": 0,
        "home_ground": "Arun Jaitley Stadium, Delhi",
        "captain": "Rishabh Pant",
    },
    "Punjab Kings": {
        "short_name": "PBKS",
        "primary_color": "#ED1B24",
        "secondary_color": "#DCDDDF",
        "badge_bg": "from-red-600 to-rose-800",
        "text_color": "text-rose-400",
        "titles": 0,
        "home_ground": "IS Bindra Stadium, Mohali",
        "captain": "Shikhar Dhawan",
    },
    "Gujarat Titans": {
        "short_name": "GT",
        "primary_color": "#1C3C6D",
        "secondary_color": "#E5A823",
        "badge_bg": "from-slate-800 to-sky-900",
        "text_color": "text-teal-400",
        "titles": 1,
        "home_ground": "Narendra Modi Stadium, Ahmedabad",
        "captain": "Shubman Gill",
    },
    "Lucknow Super Giants": {
        "short_name": "LSG",
        "primary_color": "#00B4D8",
        "secondary_color": "#FF6B6B",
        "badge_bg": "from-cyan-600 to-blue-700",
        "text_color": "text-cyan-400",
        "titles": 0,
        "home_ground": "BRSABV Ekana Cricket Stadium, Lucknow",
        "captain": "KL Rahul",
    },
}

def normalize_team_name(name: str) -> str:
    """Normalize historical franchise names to current canonical name."""
    if not name:
        return ""
    name_clean = str(name).strip()
    return TEAM_ALIASES.get(name_clean, name_clean)

CITY_VENUES = {
    "Mumbai": ["Wankhede Stadium", "Brabourne Stadium", "Dr DY Patil Sports Academy"],
    "Kolkata": ["Eden Gardens"],
    "Chennai": ["MA Chidambaram Stadium, Chepauk", "MA Chidambaram Stadium"],
    "Bengaluru": ["M Chinnaswamy Stadium", "M. Chinnaswamy Stadium"],
    "Delhi": ["Arun Jaitley Stadium", "Feroz Shah Kotla"],
    "Jaipur": ["Sawai Mansingh Stadium"],
    "Hyderabad": ["Rajiv Gandhi International Stadium, Uppal", "Rajiv Gandhi International Stadium"],
    "Chandigarh": ["Punjab Cricket Association Stadium, Mohali", "Punjab Cricket Association IS Bindra Stadium, Mohali"],
    "Ahmedabad": ["Narendra Modi Stadium", "Sardar Patel Stadium, Motera"],
    "Lucknow": ["Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium"],
    "Dharamsala": ["Himachal Pradesh Cricket Association Stadium"],
    "Pune": ["Maharashtra Cricket Association Stadium", "Subrata Roy Sahara Stadium"],
}
