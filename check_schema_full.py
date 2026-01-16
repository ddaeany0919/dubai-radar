
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Supabase credentials not found in .env.local")
    exit(1)

supabase: Client = create_client(url, key)

columns_to_check = ['stock_count', 'last_check_time', 'owner_id', 'status']

for col in columns_to_check:
    try:
        print(f"Checking column '{col}'...")
        supabase.table('products').select(col).limit(1).execute()
        print(f"Column '{col}' exists.")
    except Exception as e:
        print(f"Column '{col}' MISSING or Error: {e}")
