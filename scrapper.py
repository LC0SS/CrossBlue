import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
import hashlib

SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co"
SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_page(url, tournament_type):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Erreur d'accès à {url} : {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    text_areas = soup.find_all(class_="text-area")
    
    page_tournaments = []
    current_region = "Europe"
    
    regions_mapping = {
        "north america": "NorthAmerica",
        "europe": "Europe",
        "oceania": "Oceania",
        "latin america": "LatinAmerica"
    }
    
    for index, area in enumerate(text_areas):
        h5_tag = area.find('h5')
        h5_text = h5_tag.text.strip() if h5_tag else ""
        dl = area.find('dl')
        
        # Détection du changement de région
        if not dl:
            h5_lower = h5_text.lower()
            for key, value in regions_mapping.items():
                if key in h5_lower:
                    current_region = value
            continue
            
        # Initialisation par défaut des variables pour CHAQUE tournoi
        organizer = h5_text if h5_text else "Inconnu"
        date = "Inconnue"
        venue = "Inconnu"
        link = "Pas de lien"
        
        # Extraction propre des données du bloc <dl>
        dds = dl.find_all('dd')
        for dd in dds:
            text = dd.text.replace('"', '').strip()
            
            a_tag = dd.find('a')
            if a_tag and 'href' in a_tag.attrs:
                link = a_tag['href']
                continue
            
            if "Date:" in text and "Venue:" in text:
                parts = text.split("Venue:")
                date = parts[0].replace("Date:", "").strip()
                venue = parts[1].strip()
            elif "Date:" in text:
                date = text.replace("Date:", "").strip()
            elif "Venue:" in text:
                venue = text.replace("Venue:", "").strip()
        
        # Nettoyage des caractères invisibles spécifiques à Bandai
        date = date.replace("&ZeroWidthSpace;", "").replace("\u200b", "").strip()
        
        # Génération du Hash MD5 unique incluant l'index de position
        raw_string = f"{organizer}||{date}||{venue}||{link}||{tournament_type}||{index}"
        custom_id = hashlib.md5(raw_string.encode('utf-8')).hexdigest()
        
        page_tournaments.append({
            "id": custom_id,
            "organizer": organizer,
            "date": date,
            "venue": venue,
            "link": link,
            "region": current_region,
            "type": tournament_type
        })

    return page_tournaments

if __name__ == "__main__":
    urls_to_scrape = [
        {"url": "https://en.onepiece-cardgame.com/events/regional-season1-26-27.html", "type": "Regional"},
        {"url": "https://en.onepiece-cardgame.com/events/regional-season2-26-27.html", "type": "Regional"},
        {"url": "https://en.onepiece-cardgame.com/events/treasure-cup-may-2026.html", "type": "TreasureCup"},
        {"url": "https://en.onepiece-cardgame.com/events/treasure-cup-august-2026.html", "type": "TreasureCup"}
    ]
    
    all_scraped_data = []
    
    print("Début du scraping global avec IDs personnalisés...")
    for target in urls_to_scrape:
        print(f"Scraping des {target['type']}...")
        data = scrape_page(target['url'], target['type'])
        print(f"-> {len(data)} tournois trouvés.")
        all_scraped_data.extend(data)
        
    print(f"\n--- TOTAL : {len(all_scraped_data)} TOURNOIS TROUVÉS ---")
    
    if all_scraped_data:
        try:
            # Upsert intelligent basé sur la clé primaire textuelle contrôlée par Python
            data = supabase.table("Tournaments").upsert(
                all_scraped_data, 
                on_conflict="id" 
            ).execute()
            print("🚀 Base de données synchronisée parfaitement via Upsert sur ID personnalisé !")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi vers Supabase : {e}")