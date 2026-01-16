
from supabase import create_client, Client
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
from dotenv import load_dotenv

from pathlib import Path

# Load .env.local from the same directory as the script
env_path = Path(__file__).parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# Supabase Setup
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print(f"Error: Could not load Supabase credentials from {env_path}")
    print("Please check if .env.local exists and contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
    exit(1)

supabase: Client = create_client(url, key)

def run_crawler():
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless') # Uncomment for headless mode
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        print("Searching for Dubai Chocolate in Bundang...")
        driver.get("https://map.naver.com/v5/search/성남시 분당구 두바이 초콜릿")
        time.sleep(3)

        # Switch to iframe if necessary (Naver Maps uses iframes)
        # This is a simplified logic; actual Naver Maps structure is complex and changes.
        # For MVP, we assume we can access the list.
        # Note: Naver Maps usually puts the search list in 'searchIframe'
        
        driver.switch_to.frame("searchIframe")
        
        items = driver.find_elements(By.CSS_SELECTOR, "li.UEzoS") # Selector might need update based on current Naver DOM
        
        for item in items[:10]: # Top 10 results
            try:
                name = item.find_element(By.CSS_SELECTOR, ".place_bluelink").text
                
                # Clean name (Remove badges like 'Coupon', 'Reservation', etc.)
                # Naver Maps sometimes includes these in the link text
                for badge in ["쿠폰", "예약", "배달", "포장", "N페이", "네이버페이"]:
                    name = name.replace(badge, "")
                name = name.strip()
                # For MVP speed, let's assume we get name and try to get address/coords if possible
                # Or just insert dummy coords for demo if parsing is too hard in 10 mins
                
                # Mocking coordinates for the MVP demo since scraping coords from Naver Map canvas is tricky without API
                # In a real scenario, we'd use the Naver Search API or Geocoding API
                import random
                lat = 37.3595704 + (random.random() - 0.5) * 0.01
                lng = 127.105399 + (random.random() - 0.5) * 0.01
                
                # Address extraction
                address = "주소 정보 없음"
                try:
                    # Naver Maps search results usually contain the address in the text content.
                    # We look for lines containing typical address keywords.
                    text_content = item.text
                    for line in text_content.split('\n'):
                        if "경기" in line or "서울" in line or "성남" in line or "로" in line and "길" in line:
                            # Simple heuristic to find address line
                            address = line
                            break
                except:
                    pass

                print(f"Found: {name} ({address})")
                
                # 1. Insert Store
                data, count = supabase.table('stores').upsert({
                    "name": name,
                    "lat": lat,
                    "lng": lng,
                    "address": address,
                    "is_open": True
                }).execute()
                
                store_id = data[1][0]['id']
                
                # 2. Insert Product (Default Unknown)
                supabase.table('products').upsert({
                    "store_id": store_id,
                    "price": 0,
                    "status": "UNKNOWN"
                }).execute()
                
            except Exception as e:
                print(f"Error parsing item: {e}")
                continue

    except Exception as e:
        print(f"Crawler Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    run_crawler()
