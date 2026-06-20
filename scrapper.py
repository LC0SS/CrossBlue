import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
import hashlib
from geopy.geocoders import Nominatim
import re

SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co"

# 🔏 SÉCURITÉ : On cherche la clé secrète "service_role" dans l'environnement de ta machine.
# Si elle n'est pas trouvée, on met la clé publique par défaut (qui sera bridée par le RLS).
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF")

# Initialisation du client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialisation du géocodeur (on lui donne un nom d'application unique)
geolocator = Nominatim(user_agent="one_piece_tournament_hub")

def get_clean_location(address_str):
    if not address_str or address_str.strip() in ["Inconnu", "Inconnue", "Pas de lieu"]:
        return "Inconnu", "Inconnu", "Inconnu"
    
    # Nettoyage initial des espaces et liens parasites
    address_clean = re.sub(r'Link:.*$', '', address_str, flags=re.IGNORECASE).strip(" .,")
    address_lower = address_clean.lower()

    # =========================================================================
    # 1. BASE DE CONNAISSANCES : Dictionnaire des salles récurrentes (Hard Mapping)
    # Si l'adresse contient un de ces mots-clés, on renvoie une donnée parfaite à 100%
    # =========================================================================
    knowledge_base = {
        "brisbane convention": ("Brisbane Convention and Exhibition Centre", "Brisbane", "Australie"),
        "marvel stadium": ("Marvel Stadium (Victory Room)", "Melbourne", "Australie"),
        "alt events": ("Alt Events Centre", "Hurstville", "Australie"),
        "perth convention": ("Perth Convention and Exhibition Centre", "Perth", "Australie"),
        "aotea centre": ("Aotea Centre", "Auckland", "Nouvelle-Zélande"),
        "kameha grand": ("Kameha Grand", "Bonn", "Allemagne"),
        "stadthalle bielefeld": ("Stadthalle Bielefeld", "Bielefeld", "Allemagne"),
        "pva expo praha": ("PVA EXPO PRAHA", "Prague", "République Tchèque"),
        "dezerland mall": ("Dezerland Mall", "Orlando", "USA"),
        "1700 rodeo dr": ("Mesquite Arena & Convention Center", "Mesquite", "USA"),
        "sheraton centre toronto": ("Sheraton Centre Toronto Hotel", "Toronto", "Canada"),
        "expo reforma": ("Expo Reforma", "Mexico", "Mexique"),
        "yucatan siglo xxi": ("Yucatan Siglo XXI Convention Center", "Mérida", "Mexique"),
        "wtc mexiquense": ("WTC Mexiquense", "Naucalpan de Juárez", "Mexique"),
        "centro expositor puebla": ("Centro Expositor Puebla", "Puebla", "Mexique"),
        "gran palace": ("Hotel Gran Palace", "Santiago", "Chili"),
        "estación mapocho": ("Centro Cultural Estación Mapocho", "Santiago", "Chili"),
        "rebouças": ("Centro de Convenções Rebouças", "São Paulo", "Brésil"),
        "são luís": ("Centro de Eventos São Luís", "São Paulo", "Brésil"),
        "bobrowiecka 9": ("Centrum Konferencyjno Szkoleniowe", "Varsovie", "Pologne"),
        "venezia terminal": ("Venezia Terminal Passeggeri", "Venise", "Italie"),
    }

    for key, geo_data in knowledge_base.items():
        if key in address_lower:
            return geo_data  # Retourne immédiatement le triplet parfait

    # =========================================================================
    # 2. ALGORITHME DE SECOURS (Si la salle est nouvelle ou non répertoriée)
    # =========================================================================
    parts = [p.strip() for p in address_clean.split(",")]
    venue_name = parts[0] if len(parts) > 0 else "Inconnu"
    
    country_mapping = {
        "usa": "USA", "uk": "Royaume-Uni", "united kingdom": "Royaume-Uni",
        "france": "France", "germany": "Allemagne", "spain": "Espagne",
        "italy": "Italie", "netherlands": "Pays-Bas", "bulgaria": "Bulgarie",
        "poland": "Pologne", "australia": "Australie", "chile": "Chili",
        "mexico": "Mexique", "brazil": "Brésil", "croatia": "Croatie",
        "sweden": "Suède", "greece": "Grèce", "czechia": "République Tchèque",
        "new zealand": "Nouvelle-Zélande", "canada": "Canada"
    }

    # Détection intelligente du Pays
    country = "Inconnu"
    for key, value in country_mapping.items():
        if key in address_lower:
            country = value
            break
            
    if country == "Inconnu" and len(parts) > 1:
        last_part = parts[-1]
        if any(char.isdigit() for char in last_part):
            country = "USA"
        else:
            country = last_part

    # Détection de la Ville
    city = "Inconnu"
    if len(parts) > 1:
        potential_city = parts[-2]
        # Gestion des états US / Provinces (ex: TX 75149, ON, QLD)
        if len(parts) > 2 and (re.search(r'\b[A-Z]{2,3}\b', potential_city) or any(char.isdigit() for char in potential_city)):
            city = parts[-3]
        else:
            city = potential_city

    # Nettoyage des acronymes de provinces/états résiduels dans la ville
    city = re.sub(r'\b(QLD|NSW|VIC|ACT|WA|SA|TAS|ON|QC|BC|AB|SP|PR|RJ|DF)\b', '', city, flags=re.IGNORECASE)
    city = re.sub(r'\d+', '', city)
    city = city.split('-')[0].strip() # Sépare les "São Paulo - SP"
    city = city.replace("Metropolitan City of", "").strip()

    if city == "Inconnu" and len(parts) == 1:
        city = venue_name

    return venue_name, city, country


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
            h5_lower = h5_text.lower().replace(" ", "").replace("-", "")
            for key, value in regions_mapping.items():
                if key.replace(" ", "") in h5_lower:
                    current_region = value
            continue
            
        organizer = h5_text if h5_text else "Inconnu"
        date = "Inconnue"
        venue = "Inconnu"
        link = "Pas de lien"
        
        dds = dl.find_all('dd')
        for dd in dds:
            text = dd.text.replace('"', '').strip()
            
            a_tag = dd.find('a')
            if a_tag and 'href' in a_tag.attrs:
                link = a_tag['href']
                # On ne met plus "continue" ici pour laisser le reste du script s'exécuter
            
            if "Date:" in text and "Venue:" in text:
                parts = text.split("Venue:")
                date = parts[0].replace("Date:", "").strip()
                venue = parts[1].strip()
            elif "Date:" in text:
                date = text.replace("Date:", "").strip()
            elif "Venue:" in text:
                venue = text.replace("Venue:", "").strip()
        
        date = date.replace("&ZeroWidthSpace;", "").replace("\u200b", "").strip()
        
        # Sécurité anti-placeholder
        if date == "Inconnue" and venue == "Inconnu" and link == "Pas de lien":
            continue
            
        # --- TRAITEMENT EFFICACE DU LIEU ---
        venue_name, city, country = get_clean_location(venue)
            
        # Clé unique : Date + Venue (Adresse brute) + Type
        raw_string = f"{date}||{venue}||{tournament_type}"
        custom_id = hashlib.md5(raw_string.encode('utf-8')).hexdigest()
        
        page_tournaments.append({
            "id": custom_id,
            "organizer": organizer,
            "date": date,
            "venue": venue,           
            "venue_name": venue_name, 
            "city": city,             
            "country": country,       
            "region": current_region,
            "type": tournament_type,
            "link": link              # 👈 AJOUTÉ ICI ! Ton lien va enfin monter dans Supabase
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
    
    print("Début du scraping global avec traitement géographique...")
    for target in urls_to_scrape:
        print(f"Scraping des {target['type']}...")
        data = scrape_page(target['url'], target['type'])
        print(f"-> {len(data)} tournois trouvés.")
        all_scraped_data.extend(data)
        
    print(f"\n--- TOTAL : {len(all_scraped_data)} TOURNOIS TROUVÉS ---")
    
    if all_scraped_data:
        try:
            # L'upsert va cibler la colonne "id" (qui doit être PRIMARY KEY ou UNIQUE dans Supabase)
            data = supabase.table("Tournaments").upsert(
                all_scraped_data, 
                on_conflict="id" 
            ).execute()
            print("🚀 Base de données synchronisée et enrichie avec succès !")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi vers Supabase : {e}")