import re
import json
import pandas as pd
from datetime import datetime

def parse_match_data(data):
    matches = []
    # Regex to find match blocks, including those without a clear "Scoreboard APP" start
    match_blocks = re.split(r'Scoreboard\nAPP\n — \d{2}/\d{2}/\d{4}, \d{2}:\d{2}\n|T3H  •  \d{2}/\d{2}/\d{4}\nForwarded\n|T3H  •  [A-Za-z]+(?: at \d{2}:\d{2})?\nForwarded\n', data)
    match_blocks = [block.strip() for block in match_blocks if block.strip()]

    for block in match_blocks:
        try:
            lines = block.split('\n')
            map_name = lines[0]
            score_line = lines[1]
            score_match = re.search(r'Score: 🔵 (\d+) — 🔴 (\d+)', score_line)
            ct_score, tr_score = (score_match.groups() if score_match else (None, None))

            half_info_line = lines[-1]
            half_match = re.search(r'(First Half|Second Half) \| (\d{2}/\d{2}/\d{4})', half_info_line)
            half, date_str = (half_match.groups() if half_match else (None, None))

            # Convert date to YYYY-MM-DD
            date_obj = datetime.strptime(date_str, '%m/%d/%Y')
            formatted_date = date_obj.strftime('%Y-%m-%d')

            players = []
            team = None
            for line in lines[2:-1]:
                if line.strip() in ['CT', 'TR']:
                    team = line.strip()
                    continue
                
                player_match = re.search(r'([^\s]+)\s(.*)\s—\s(\d+)/(\d+)', line)
                if player_match:
                    flag, name, kills, deaths = player_match.groups()
                    players.append({
                        "name": name.strip(),
                        "kills": int(kills),
                        "deaths": int(deaths),
                        "flag": flag,
                        "team": team
                    })

            if map_name and ct_score is not None and half:
                matches.append({
                    "Map": map_name,
                    "Half": half,
                    "CT Score": int(ct_score),
                    "TR Score": int(tr_score),
                    "Players JSON": json.dumps(players),
                    "Date": formatted_date
                })
        except Exception as e:
            print(f"Skipping block due to parsing error: {e}\nBlock content:\n{block}\n")
            continue
    return matches

def get_last_match_id(csv_path):
    try:
        df = pd.read_csv(csv_path)
        if not df.empty and 'Match ID' in df.columns:
            return df['Match ID'].max()
    except FileNotFoundError:
        return 102  # Start from 102 if file doesn't exist, new file will start at 103
    return 102

# Read the discord data
with open('scoreboard/blah/match_data_discord', 'r') as f:
    discord_data = f.read()

# Parse the data
parsed_matches = parse_match_data(discord_data)

# Get the last match ID from the CSV
last_match_id = get_last_match_id('scoreboard/blah/match_data.csv')
next_match_id = last_match_id + 1

# Create a DataFrame and assign match IDs
df = pd.DataFrame(parsed_matches)
df['Match ID'] = [next_match_id + i // 2 for i in range(len(df))]

# Append to the CSV file
df.to_csv('scoreboard/blah/match_data.csv', mode='a', header=False, index=False)

print(f"Successfully added {len(df)} new entries to match_data.csv")
