const SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co";
const SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF";

// Variable globale pour stocker les tournois en mémoire locale
let allTournaments = [];

window.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined') {
        console.error("❌ Erreur : Le SDK Supabase n'est pas chargé. Vérifie ta connexion internet ou le lien dans index.html");
        return;
    }

    // Initialisation du client Supabase
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    initApp(client);
});

async function initApp(client) {
    console.log("Connexion à Supabase et récupération des tournois...");
    
    // Récupération de toutes les colonnes (y compris la nouvelle colonne 'region')
    const { data: tournaments, error } = await client
        .from('Tournaments')
        .select('*');

    if (error) {
        console.error("❌ Erreur Supabase lors de la récupération :", error);
        return;
    }

    // On sauvegarde les données dans notre variable globale
    allTournaments = tournaments || [];
    console.log(`${allTournaments.length} tournois chargés avec succès.`);

    // Premier affichage : on montre tout par défaut
    displayTournaments(allTournaments);

    // Mise en place de l'écouteur sur le menu déroulant HTML
    const filterSelect = document.getElementById('regionFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (event) => {
            const selectedRegion = event.target.value;
            filterAndDisplay(selectedRegion);
        });
    }
}

// Logique de filtrage optimisée pour la nouvelle structure de la BDD
function filterAndDisplay(criterion) {
    let filteredList = [];

    if (criterion === 'all') {
        // Si l'utilisateur veut tout voir
        filteredList = allTournaments;
    } else {
        // Filtrage direct et strict sur le champ 'region' de ta table
        filteredList = allTournaments.filter(t => t.region === criterion);
    }

    // Rafraîchissement de l'affichage avec la liste filtrée
    displayTournaments(filteredList);
}

// Fonction responsable de la génération des cartes HTML dans la page
function displayTournaments(tournamentsList) {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;

    // On vide le conteneur avant d'ajouter les cartes filtrées
    calendarContainer.innerHTML = ""; 

    // Si le filtre ne retourne aucun résultat
    if (tournamentsList.length === 0) {
        calendarContainer.innerHTML = `
            <p style="text-align: center; width: 100%; color: var(--text-muted); grid-column: 1 / -1; margin-top: 2rem;">
                Aucun tournoi planifié pour cette région pour le moment.
            </p>`;
        return;
    }

    // Génération dynamique des cartes de tournois
    tournamentsList.forEach(t => {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <h3>🏆 ${t.organizer || 'Organisateur inconnu'}</h3>
            <p>📅 <strong>Date :</strong> ${t.date || 'Non spécifiée'}</p>
            <p>📍 <strong>Lieu :</strong> ${t.venue || 'Non spécifié'}</p>
            <a href="${t.link || '#'}" target="_blank" class="btn">S'inscrire / Détails</a>
        `;
        
        calendarContainer.appendChild(card);
    });
}