import csv
import json
import os
import re

def clean_player_name(name):
    """
    Removes clan tags from a player name.
    Clan tags are identified as anything within square brackets.
    """
    return re.sub(r'\[.*?\]', '', name).strip()

def build_flag_map(rows, players_json_index):
    """
    Builds a map of player names to their most common flag.
    """
    flag_map = {}
    for row in rows:
        if not row:
            continue
        try:
            players_json_str = row[players_json_index]
            players = json.loads(players_json_str)
            for player in players:
                if 'name' in player and 'flag' in player and player['flag'] != '🏳️':
                    clean_name = clean_player_name(player['name'])
                    if clean_name not in flag_map:
                        flag_map[clean_name] = player['flag']
        except (json.JSONDecodeError, IndexError):
            continue
    return flag_map

input_file = 'match_data.csv'
output_file = 'match_data_cleaned.csv'

header = []
rows = []

with open(input_file, 'r', newline='', encoding='utf-8') as infile:
    reader = csv.reader(infile)
    header = next(reader)
    for row in reader:
        rows.append(row)

try:
    players_json_index = header.index('Players JSON')
except ValueError:
    # Column not found, nothing to do.
    # In a real script, you might log an error and exit.
    # For this environment, we'll just write the original content back.
    players_json_index = -1

if players_json_index != -1:
    flag_map = build_flag_map(rows, players_json_index)
    
    cleaned_rows = []
    for row in rows:
        if not row:
            continue
        
        try:
            players_json_str = row[players_json_index]
            players = json.loads(players_json_str)
            
            cleaned_players = []
            for player in players:
                if 'name' in player:
                    clean_name = clean_player_name(player['name'])
                    player['name'] = clean_name
                    if player.get('flag') == '🏳️' and clean_name in flag_map:
                        player['flag'] = flag_map[clean_name]
                cleaned_players.append(player)
            
            row[players_json_index] = json.dumps(cleaned_players, ensure_ascii=False)
            cleaned_rows.append(row)

        except (json.JSONDecodeError, IndexError):
            # Keep row as is if it cannot be processed
            cleaned_rows.append(row)
    rows = cleaned_rows

with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
    writer = csv.writer(outfile)
    writer.writerow(header)
    writer.writerows(rows)

# Replace old file with new file
os.replace(output_file, input_file)
