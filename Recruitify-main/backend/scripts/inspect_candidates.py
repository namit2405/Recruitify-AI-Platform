# backend/scripts/inspect_candidates.py

import os
import sqlite3
import json

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(BASE_DIR, 'db.sqlite3')

print("Using DB:", DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def fetch_all(query):
    try:
        cur.execute(query)
        return [dict(row) for row in cur.fetchall()]
    except Exception as e:
        return {"error": str(e)}

print("\n=== USERS ===")
users = fetch_all("SELECT id, email, user_type FROM accounts_user")
print(json.dumps(users, indent=2))

print("\n=== CANDIDATES ===")
candidates = fetch_all("SELECT id, name, email, user_id, resume_path FROM accounts_candidate")
print(json.dumps(candidates, indent=2))

print("\n=== ORGANIZATIONS ===")
orgs = fetch_all("SELECT id, name, user_id FROM accounts_organization")
print(json.dumps(orgs, indent=2))

conn.close()
