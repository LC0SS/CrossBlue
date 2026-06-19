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
    const countryFilterContainer = document.getElementById('countryFilterContainer');
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const hidePastFilter = document.getElementById('hidePastFilter');

    // Fonction déclenchée au changement de région (gère l'affichage du sous-filtre pays)
    const handleRegionChange = () => {
        const selectedRegion = regionFilter.value;

        if (selectedRegion === 'all') {
            // Si "Toutes les régions", on cache le filtre pays et on le remet à "all"
            if (countryFilterContainer) countryFilterContainer.style.display = 'none';
            if (countryFilter) countryFilter.value = 'all';
        } else {
            // Sinon, on affiche le filtre pays
            if (countryFilterContainer) countryFilterContainer.style.display = 'flex';
            // Et on met à jour la liste des pays disponibles pour cette région
            updateCountryOptions(selectedRegion, countryFilter);
        }

        // On applique les filtres globaux
        handleFilterChange();
    };

    // Fonction déclenchée à chaque changement de filtre pour rafraîchir l'affichage
    const handleFilterChange = () => {
        const countryValue = countryFilter ? countryFilter.value : 'all';
        applyFilters(regionFilter.value, countryValue, typeFilter.value, hidePastFilter.checked);
    };

    // Attribution des écouteurs d'événements
    if (regionFilter) regionFilter.addEventListener('change', handleRegionChange);
    if (countryFilter) countryFilter.addEventListener('change', handleFilterChange);
    if (typeFilter) typeFilter.addEventListener('change', handleFilterChange);
    if (hidePastFilter) hidePastFilter.addEventListener('change', handleFilterChange);

    // Premier affichage au chargement de la page
    handleRegionChange();
}

/**
 * Met à jour dynamiquement les balises <option> du select Pays
 * en fonction de la région sélectionnée, à partir des données déjà chargées.
 */
function updateCountryOptions(selectedRegion, countryFilterElement) {
    if (!countryFilterElement) return;

    // 1. On filtre nos tournois locaux pour ne garder que ceux de la région choisie
    const tournamentsInRegion = allTournaments.filter(t => t.region === selectedRegion);

    // 2. On extrait les pays uniques et valides (on vire les "Inconnu" ou vides)
    const uniqueCountries = [...new Set(tournamentsInRegion.map(t => t.country))]
        .filter(country => country && country !== 'Inconnu')
        .sort(); // Tri par ordre alphabétique

    // 3. On reconstruit les options du select
    countryFilterElement.innerHTML = '<option value="all">Tous les pays</option>';
    uniqueCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilterElement.appendChild(option);
    });
}

/**
 * Fonction utilitaire qui traduit les chaînes de dates Bandai (ex: "March 28-29, 2026")
 * en un objet Date JavaScript comparable.
 */
function parseTournamentDate(dateStr) {
    if (!dateStr || dateStr === "Inconnue") return new Date(1970, 0, 1); 

    try {
        let cleanedDate = dateStr.replace(/-[0-9]+/g, '');
        
        const timestamp = Date.parse(cleanedDate);
        if (!isNaN(timestamp)) {
            return new Date(timestamp);
        }
    } catch (e) {
        console.warn("Impossible de parser la date :", dateStr);
    }
    return new Date(); 
}

// Fonction de filtrage combiné (Région + Pays + Type + Date)
function applyFilters(selectedRegion, selectedCountry, selectedType, shouldHidePast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredList = allTournaments.filter(t => {
        // 1. Condition Région
        const matchRegion = (selectedRegion === 'all') || (t.region === selectedRegion);
        
        // 2. Condition Pays (uniquement si une région spécifique est sélectionnée)
        const matchCountry = (selectedRegion === 'all') || (selectedCountry === 'all') || (t.country === selectedCountry);
        
        // 3. Condition Type
        const matchType = (selectedType === 'all') || (t.type === selectedType);
        
        // 4. Condition Date Passée
        let matchDate = true;
        if (shouldHidePast) {
            const tournamentDate = parseTournamentDate(t.date);
            matchDate = tournamentDate >= today;
        }
        
        return matchRegion && matchCountry && matchType && matchDate;
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