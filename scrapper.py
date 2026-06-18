# import requests
# from bs4 import BeautifulSoup
# from supabase import create_client, Client # Importations regroupées en haut

# # Configuration Supabase
# SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co"
# SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF"

# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# def scrape_optcg_exact():
#     url = "https://en.onepiece-cardgame.com/events/regional-season1-26-27.html"
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
#     }
    
#     response = requests.get(url, headers=headers)
#     if response.status_code != 200:
#         print(f"Erreur d'accès : {response.status_code}")
#         return [] # On renvoie une liste vide en cas d'erreur

#     soup = BeautifulSoup(response.text, 'html.parser')
#     text_areas = soup.find_all(class_="text-area")
#     tournaments = []
    
#     for area in text_areas:
#         h5_tag = area.find('h5')
#         if h5_tag and h5_tag.text.strip():
#             organizer = h5_tag.text.strip()
#         else:
#             dt_tag = area.find('dt')
#             organizer = dt_tag.text.strip() if dt_tag else "Inconnu"
            
#         dl = area.find('dl')
#         if not dl:
#             continue
        
#         date = "Inconnue"
#         venue = "Inconnu"
#         link = "Pas de lien"
        
#         dds = dl.find_all('dd')
#         for dd in dds:
#             text = dd.text.replace('"', '').strip()
            
#             a_tag = dd.find('a')
#             if a_tag and 'href' in a_tag.attrs:
#                 link = a_tag['href']
#                 continue
            
#             if "Date:" in text and "Venue:" in text:
#                 parts = text.split("Venue:")
#                 date = parts[0].replace("Date:", "").strip()
#                 venue = parts[1].strip()
#             elif "Date:" in text:
#                 date = text.replace("Date:", "").strip()
#             elif "Venue:" in text:
#                 venue = text.replace("Venue:", "").strip()
        
#         date = date.replace("&ZeroWidthSpace;", "").replace("\u200b", "").strip()
        
#         tournaments.append({
#             "organizer": organizer,
#             "date": date,
#             "venue": venue,
#             "link": link
#         })

#     return tournaments

# if __name__ == "__main__":
#     print("Début du scraping...")
#     liste_tournois = scrape_optcg_exact()
    
#     print(f"--- {len(liste_tournois)} TOURNOIS TROUVÉS ---")
    
#     if liste_tournois:
#         try:
#             # On envoie la liste de dictionnaires
#             data = supabase.table("Tournaments").insert(liste_tournois).execute()
#             print("🚀 Données envoyées avec succès sur Supabase !")
#         except Exception as e:
#             print(f"❌ Erreur lors de l'envoi vers Supabase : {e}")

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co"
SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_optcg_exact():
    url = "https://en.onepiece-cardgame.com/events/regional-season1-26-27.html"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Erreur d'accès : {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # On récupère tous les blocs de texte dans l'ordre exact de la page
    text_areas = soup.find_all(class_="text-area")
    
    tournaments = []
    current_region = "Europe" # Région par défaut par sécurité
    
    # Liste des régions textuelles à détecter pour le changement d'état
    regions_mapping = {
        "north america": "NorthAmerica",
        "europe": "Europe",
        "oceania": "Oceania",
        "latin america": "LatinAmerica"
    }
    
    for area in text_areas:
        h5_tag = area.find('h5')
        h5_text = h5_tag.text.strip() if h5_tag else ""
        
        # Vérification : Est-ce que ce bloc est un indicateur de région ?
        # Sur ton screen, les blocs de région n'ont pas de bloc <dl> (description de tournoi)
        dl = area.find('dl')
        
        if not dl:
            # Si pas de <dl>, c'est potentiellement un titre de région
            h5_lower = h5_text.lower()
            for key, value in regions_mapping.items():
                if key in h5_lower:
                    current_region = value
                    print(f"📍 Changement de région détecté : {current_region}")
            continue # On passe au bloc suivant, ce n'est pas un tournoi
            
        # Si on arrive ici, c'est qu'il y a un <dl>, donc c'est une carte de tournoi !
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
                continue
            
            if "Date:" in text and "Venue:" in text:
                parts = text.split("Venue:")
                date = parts[0].replace("Date:", "").strip()
                venue = parts[1].strip()
            elif "Date:" in text:
                date = text.replace("Date:", "").strip()
            elif "Venue:" in text:
                venue = text.replace("Venue:", "").strip()
        
        date = date.replace("&ZeroWidthSpace;", "").replace("\u200b", "").strip()
        
        # On associe le tournoi à la dernière région enregistrée lors du parcours
        tournaments.append({
            "organizer": organizer,
            "date": date,
            "venue": venue,
            "link": link,
            "region": current_region
        })

    return tournaments

if __name__ == "__main__":
    print("Début du scraping séquentiel...")
    liste_tournois = scrape_optcg_exact()
    
    print(f"--- {len(liste_tournois)} TOURNOIS TROUVÉS ---")
    
    if liste_tournois:
        try:
            # Nettoyage de la table avant réinsertion pour éviter les conflits de clé unique (id)
            supabase.table("Tournaments").delete().neq("id", 0).execute()
            
            data = supabase.table("Tournaments").insert(liste_tournois).execute()
            print("🚀 Base de données synchronisée proprement avec les régions !")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi vers Supabase : {e}")