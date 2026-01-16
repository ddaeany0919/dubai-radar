
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

try:
    print("Attempting to select 'stock_count' from 'products'...")
    # Try to select just the stock_count column to see if it exists
    response = supabase.table('products').select('stock_count').limit(1).execute()
    print("Success! Column exists.")
    print(response)
except Exception as e:
    print(f"Error: {e}")
