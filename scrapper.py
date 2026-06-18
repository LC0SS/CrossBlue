import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client # Importations regroupées en haut

# Configuration Supabase
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
        return [] # On renvoie une liste vide en cas d'erreur

    soup = BeautifulSoup(response.text, 'html.parser')
    text_areas = soup.find_all(class_="text-area")
    tournaments = []
    
    for area in text_areas:
        h5_tag = area.find('h5')
        if h5_tag and h5_tag.text.strip():
            organizer = h5_tag.text.strip()
        else:
            dt_tag = area.find('dt')
            organizer = dt_tag.text.strip() if dt_tag else "Inconnu"
            
        dl = area.find('dl')
        if not dl:
            continue
        
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
        
        tournaments.append({
            "organizer": organizer,
            "date": date,
            "venue": venue,
            "link": link
        })

    return tournaments

if __name__ == "__main__":
    print("Début du scraping...")
    liste_tournois = scrape_optcg_exact()
    
    print(f"--- {len(liste_tournois)} TOURNOIS TROUVÉS ---")
    
    if liste_tournois:
        try:
            # On envoie la liste de dictionnaires
            data = supabase.table("Tournaments").insert(liste_tournois).execute()
            print("🚀 Données envoyées avec succès sur Supabase !")
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi vers Supabase : {e}")