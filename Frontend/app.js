const SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co";
const SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF";

// On attend que la page ET le script Supabase soient bien présents
window.addEventListener('DOMContentLoaded', () => {
    console.log("1. La page est chargée, initialisation de Supabase...");
    
    if (typeof supabase === 'undefined') {
        console.error("❌ Erreur : Le SDK Supabase n'est pas chargé. Vérifie ta connexion internet ou le lien dans index.html");
        return;
    }

    const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    loadTournaments(client);
});

async function loadTournaments(client) {
    console.log("2. Appel de la base de données...");
    
    const { data: tournaments, error } = await client
        .from('Tournaments')
        .select('*');

    if (error) {
        console.error("❌ Erreur Supabase lors de la récupération :", error);
        return;
    }

    console.log("3. Données reçues ! Nombre de tournois :", tournaments ? tournaments.length : 0);
    console.log("Contenu des données :", tournaments);

    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) {
        console.error("❌ Erreur : Impossible de trouver l'élément HTML avec l'id 'calendar'");
        return;
    }

    calendarContainer.innerHTML = ""; 

    if (!tournaments || tournaments.length === 0) {
        calendarContainer.innerHTML = "<p>Aucun tournoi trouvé dans la base de données.</p>";
        return;
    }

    tournaments.forEach((t, index) => {
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
    console.log("4. Injection dans le HTML terminée !");
}