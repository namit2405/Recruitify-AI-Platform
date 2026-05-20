# backend/scripts/fetch_profile.py

import sys
import json
import urllib.request
import urllib.error

if len(sys.argv) < 2:
    print("Usage: python fetch_profile.py <ACCESS_TOKEN>")
    sys.exit(1)

TOKEN = sys.argv[1]

url = "http://127.0.0.1:8000/api/auth/profile/"
req = urllib.request.Request(url)
req.add_header("Authorization", f"Bearer {TOKEN}")

try:
    with urllib.request.urlopen(req) as res:
        body = res.read().decode("utf-8")
        data = json.loads(body)
        print(json.dumps(data, indent=2))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()}")
except urllib.error.URLError as e:
    print(f"Connection Error: {e.reason}")
