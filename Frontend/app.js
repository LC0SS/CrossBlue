const SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co";
const SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF";

let allTournaments = [];

window.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase === 'undefined') {
        console.error("❌ Erreur : Le SDK Supabase n'est pas chargé.");
        return;
    }
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    initApp(client);
});

async function initApp(client) {
    const { data: tournaments, error } = await client
        .from('Tournaments')
        .select('*');

    if (error) {
        console.error("❌ Erreur Supabase :", error);
        return;
    }

    allTournaments = tournaments || [];

    // Récupération des éléments HTML des filtres
    const regionFilter = document.getElementById('regionFilter');
    const typeFilter = document.getElementById('typeFilter');
    const hidePastFilter = document.getElementById('hidePastFilter');

    // Fonction déclenchée à chaque changement de filtre
    const handleFilterChange = () => {
        applyFilters(regionFilter.value, typeFilter.value, hidePastFilter.checked);
    };

    if (regionFilter) regionFilter.addEventListener('change', handleFilterChange);
    if (typeFilter) typeFilter.addEventListener('change', handleFilterChange);
    if (hidePastFilter) hidePastFilter.addEventListener('change', handleFilterChange);

    // Premier affichage au chargement de la page
    applyFilters(regionFilter.value, typeFilter.value, hidePastFilter.checked);
}

/**
 * Fonction utilitaire qui traduit les chaînes de dates Bandai (ex: "March 28-29, 2026")
 * en un objet Date JavaScript comparable.
 */
function parseTournamentDate(dateStr) {
    if (!dateStr || dateStr === "Inconnue") return new Date(1970, 0, 1); // Date lointaine si inconnue

    try {
        // Supprime les intervalles de jours (ex: "March 28-29, 2026" devient "March 28, 2026")
        let cleanedDate = dateStr.replace(/-[0-9]+/g, '');
        
        const timestamp = Date.parse(cleanedDate);
        if (!isNaN(timestamp)) {
            return new Date(timestamp);
        }
    } catch (e) {
        console.warn("Impossible de parser la date :", dateStr);
    }
    return new Date(); // Retourne la date du jour par défaut en cas d'échec
}

// Fonction de filtrage combiné (Région + Type + Date)
function applyFilters(selectedRegion, selectedType, shouldHidePast) {
    const today = new Date();
    // On remet l'heure à minuit pour comparer uniquement les jours
    today.setHours(0, 0, 0, 0);

    const filteredList = allTournaments.filter(t => {
        // 1. Condition Région
        const matchRegion = (selectedRegion === 'all') || (t.region === selectedRegion);
        
        // 2. Condition Type
        const matchType = (selectedType === 'all') || (t.type === selectedType);
        
        // 3. Condition Date Passée
        let matchDate = true;
        if (shouldHidePast) {
            const tournamentDate = parseTournamentDate(t.date);
            // Le tournoi est valide s'il est aujourd'hui ou dans le futur
            matchDate = tournamentDate >= today;
        }
        
        return matchRegion && matchType && matchDate;
    });

    displayTournaments(filteredList);
}

function displayTournaments(tournamentsList) {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;

    calendarContainer.innerHTML = ""; 

    if (tournamentsList.length === 0) {
        calendarContainer.innerHTML = `
            <p style="text-align: center; width: 100%; color: #888; grid-column: 1 / -1; margin-top: 2rem;">
                Aucun tournoi ne correspond à ces critères de recherche.
            </p>`;
        return;
    }

    tournamentsList.forEach(t => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Exemple de modification dans ton app.js pour l'affichage :
        card.innerHTML = `
            <h3>👥 ${t.organizer || 'Organisateur inconnu'}</h3>
            <p>📅 <strong>Date :</strong> ${t.date || 'Non spécifiée'}</p>
            <p>🌍 <strong>Pays :</strong> ${t.country}</p>
            <p>🏢 <strong>Ville :</strong> ${t.city}</p>
            <p>📍 <strong>Lieu :</strong> ${t.venue_name}</p>
            <a href="${t.link || '#'}" target="_blank" class="btn">S'inscrire / Détails</a>
        `;
        
        calendarContainer.appendChild(card);
    });
}