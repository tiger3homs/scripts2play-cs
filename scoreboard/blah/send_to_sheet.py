import csv
import requests
import json

SHEETDB_API_URL = 'https://sheetdb.io/api/v1/ns7qvap70vf6g'

data_to_send = []
with open('scoreboard/blah/match_data.csv', mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for row in csv_reader:
        data_to_send.append(row)

# SheetDB API expects a 'data' key with a list of objects
payload = {'data': data_to_send}

response = requests.post(SHEETDB_API_URL, json=payload)

if response.status_code == 201:
    print(f"Successfully sent {len(data_to_send)} rows to the sheet.")
else:
    print(f"Error sending data. Status code: {response.status_code}")
    print("Response content:")
    print(response.text)
