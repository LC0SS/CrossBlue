import requests
from bs4 import BeautifulSoup

def scrape_optcg_exact():
    url = "https://en.onepiece-cardgame.com/events/regional-season1-26-27.html"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Erreur d'accès : {response.status_code}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # On cible toujours le conteneur principal de chaque tournoi
    text_areas = soup.find_all(class_="text-area")
    
    tournaments = []
    
    for area in text_areas:
        # 1. Récupération de l'organisateur (TO) depuis le conteneur global 'area'
        # On cherche d'abord s'il y a un <h5> directement dans la text-area
        h5_tag = area.find('h5')
        
        if h5_tag and h5_tag.text.strip():
            organizer = h5_tag.text.strip()
        else:
            # Fallback : si pas de <h5>, on cherche dans le <dt> au cas où
            dt_tag = area.find('dt')
            organizer = dt_tag.text.strip() if dt_tag else "Inconnu"
            
        # 2. Récupération du bloc de description <dl>
        dl = area.find('dl')
        if not dl:
            continue
        
        # Initialisation des variables pour les détails
        date = "Inconnue"
        venue = "Inconnu"
        link = "Pas de lien"
        
        # 3. Extraction du contenu des balises <dd> à l'intérieur du <dl>
        dds = dl.find_all('dd')
        
        for dd in dds:
            text = dd.text.replace('"', '').strip()
            
            # Gestion du lien d'inscription
            a_tag = dd.find('a')
            if a_tag and 'href' in a_tag.attrs:
                link = a_tag['href']
                continue
            
            # Gestion du cas où Date et Venue sont séparés ou ensemble
            if "Date:" in text and "Venue:" in text:
                parts = text.split("Venue:")
                date = parts[0].replace("Date:", "").strip()
                venue = parts[1].strip()
            elif "Date:" in text:
                date = text.replace("Date:", "").strip()
            elif "Venue:" in text:
                venue = text.replace("Venue:", "").strip()
        
        # Nettoyage des caractères parasites
        date = date.replace("&ZeroWidthSpace;", "").replace("\u200b", "").strip()
        
        tournaments.append({
            "organizer": organizer,
            "date": date,
            "venue": venue,
            "link": link
        })

    # Affichage des résultats
    print(f"--- {len(tournaments)} TOURNOIS TROUVÉS ---")
    for t in tournaments:
        print(f"🏆 Organisateur : {t['organizer']}")
        print(f"📅 Date         : {t['date']}")
        print(f"📍 Lieu         : {t['venue']}")
        print(f"🔗 Inscription  : {t['link']}")
        print("-" * 40)

if __name__ == "__main__":
    scrape_optcg_exact()