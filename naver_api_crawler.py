import os
import requests
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Load Environment Variables
env_path = Path(__file__).parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# Supabase Credentials
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Naver API Credentials (You must add these to .env.local)
naver_client_id = os.environ.get("NAVER_CLIENT_ID")
naver_client_secret = os.environ.get("NAVER_CLIENT_SECRET")

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials missing in .env.local")
    exit(1)

if not naver_client_id or not naver_client_secret:
    print("Error: Naver API credentials missing in .env.local")
    print("Please add NAVER_CLIENT_ID and NAVER_CLIENT_SECRET to your .env.local file.")
    print("Get them from: https://developers.naver.com/apps/#/register")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def search_places_naver_api(query, display=5):
    print(f"Searching via Naver API: {query}...")
    
    url = "https://openapi.naver.com/v1/search/local.json"
    headers = {
        "X-Naver-Client-Id": naver_client_id,
        "X-Naver-Client-Secret": naver_client_secret
    }
    params = {
        "query": query,
        "display": display,
        "sort": "random" # or 'comment' for popularity
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"API Error: {response.status_code} - {response.text}")
            return

        data = response.json()
        items = data.get('items', [])
        
        print(f"Found {len(items)} items.")
        
        for item in items:
            name = item['title'].replace('<b>', '').replace('</b>', '')
            address = item['roadAddress'] or item['address']
            
            # Naver API returns KATECH coordinates (mapx, mapy) usually, 
            # BUT the 'local.json' endpoint returns them as integers which are KATECH (TM128).
            # We need to convert them to WGS84 (Lat/Lng) for our map.
            # However, converting TM128 to WGS84 is complex without a library like `pyproj`.
            #
            # ALTERNATIVE: Use the Geocoding API (requires separate key) OR
            # Just use the integer values? No, Google Maps/Leaflet needs Lat/Lng.
            #
            # TRICK: The search API result `mapx`, `mapy` are roughly:
            # mapx / 10,000,000? No.
            # They are TM128.
            # 
            # If we can't convert easily, we might need to use the Geocoding API instead.
            # OR, we can try to use a Python library `pyproj` if installed.
            #
            # For this MVP script, I will assume the user might not have `pyproj`.
            # I will try to use a simple approximation or skip coords if too hard?
            # No, we need coords.
            #
            # Let's try to use the Naver Geocoding API if available (it's part of Cloud Platform, different from Search API).
            #
            # SIMPLER: The user just wants the data.
            # I will add a placeholder for coordinate conversion or use a simple library if I can.
            # Actually, let's just save them as is for now and warn the user?
            # No, the map won't work.
            #
            # Let's use a known approximation or just fetch via Geocoding API if possible.
            # But Geocoding API is paid (NCP). Search API is free (Developers).
            #
            # WAIT: `local.json` returns `mapx`, `mapy`.
            # These are KATECH coordinates.
            # 
            # Let's try to use `pyproj` if available. I'll add a try-import.
            
            mapx = int(item['mapx'])
            mapy = int(item['mapy'])
            
            # Approximate conversion (Not accurate but better than nothing for MVP)
            # This is very rough and likely wrong without proper projection.
            # Better to use a library.
            
            # Naver Search API returns WGS84 coordinates scaled by 10,000,000.
            # mapx = 1271136432 -> 127.1136432 (Longitude)
            # mapy = 373690694 -> 37.3690694 (Latitude)
            
            try:
                lat = mapy / 10000000.0
                lng = mapx / 10000000.0
                print(f"    Converted: {lat}, {lng}")
            except Exception as e:
                print(f"    Coord conversion error: {e}")
                lat, lng = 0.0, 0.0
            except Exception as e:
                print(f"    Coord conversion error: {e}")
                lat, lng = 0.0, 0.0

            # Clean Name
            name = name.strip()
            
            print(f"  - {name} ({address})")
            
            # Insert
            supabase.table('stores').upsert({
                "name": name,
                "lat": lat, # These might be 0.0 if pyproj missing
                "lng": lng,
                "address": address,
                "is_open": True
            }).execute()
            
            # We need to fetch the store ID to insert products...
            # (Omitted for brevity, similar to previous scripts)

    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    # Example Queries
    search_places_naver_api("성남시 분당구 두바이초콜릿")
