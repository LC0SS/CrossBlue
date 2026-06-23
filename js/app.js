// js/app.js

const SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co";
const SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF"; // Ta clé publique

// Initialisation globale du client Supabase pour l'application
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const appContainer = document.getElementById('app');

// 🔄 1. LE CHEF D'ORCHESTRE : Écoute l'état de la session (Connecté / Déconnecté)
_supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        const user = session.user;
        
        // Cas A : L'utilisateur est un Invité (Session anonyme)
        if (user.is_anonymous) {
            initCalendarView("Invité", null);
        } else {
            // Cas B : Compte enregistré ➡️ On récupère son profil (pseudo + région)
            const { data: profile, error } = await _supabase
                .from('profiles')
                .select('username, region')
                .eq('id', user.id)
                .single();

            if (error || !profile) {
                initCalendarView(user.email, null);
            } else {
                initCalendarView(profile.username, profile.region);
            }
        }
    } else {
        // Cas C : Aucun utilisateur connecté ➡️ Écran de Login
        initLoginView();
    }
});

// 🔓 2. AFFICHAGE DE L'ÉCRAN DE LOGIN
function initLoginView() {
    appContainer.innerHTML = Components.loginView();
    
    document.getElementById('btnSubmitLogin').addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        Auth.signIn(email, password);
    });

    document.getElementById('btnGuestLogin').addEventListener('click', () => {
        Auth.signInAsGuest();
    });

    document.getElementById('linkToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        initRegisterView();
    });
}

// 📝 3. AFFICHAGE DE L'ÉCRAN D'INSCRIPTION
function initRegisterView() {
    appContainer.innerHTML = Components.registerView();

    document.getElementById('btnSubmitRegister').addEventListener('click', () => {
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const username = document.getElementById('regUsername').value;
        const region = document.getElementById('regRegion').value;
        Auth.signUp(email, password, username, region);
    });

    document.getElementById('linkToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        initLoginView();
    });
}

// 📅 4. GESTION DU CALENDRIER ET DES FILTRES
function initCalendarView(displayName, preferredRegion) {
    // Injection du squelette du calendrier avec le pseudo
    appContainer.innerHTML = Components.calendarView(displayName);
    
    // Liaison du bouton Déconnexion
    document.getElementById('btnLogout').addEventListener('click', Auth.signOut);

    // Récupération des éléments HTML des filtres
    const regionFilter = document.getElementById('regionFilter');
    const countryFilterContainer = document.getElementById('countryFilterContainer');
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const hidePastFilter = document.getElementById('hidePastFilter');
    const calendarGrid = document.getElementById('calendar');

    let allTournaments = []; // Stockage local des tournois pour filtrer côté client

    // 🎯 Application de la région préférée ou des filtres mémorisés
    if (localStorage.getItem('filter_region')) {
        regionFilter.value = localStorage.getItem('filter_region');
    } else if (preferredRegion) {
        regionFilter.value = preferredRegion;
    } else {
        regionFilter.value = "all";
    }

    // Récupération des autres filtres sauvegardés
    typeFilter.value = localStorage.getItem('filter_type') || "all";
    hidePastFilter.checked = localStorage.getItem('filter_hidePast') === "true";

    // Écouteurs d'événements pour mettre à jour l'affichage et sauvegarder l'état
    regionFilter.addEventListener('change', () => {
        localStorage.setItem('filter_region', regionFilter.value);
        localStorage.removeItem('filter_country'); // Reset le pays si la région change
        updateCountryOptions();
        applyFilters();
    });

    countryFilter.addEventListener('change', () => {
        localStorage.setItem('filter_country', countryFilter.value);
        applyFilters();
    });

    typeFilter.addEventListener('change', () => {
        localStorage.setItem('filter_type', typeFilter.value);
        applyFilters();
    });

    hidePastFilter.addEventListener('change', () => {
        localStorage.setItem('filter_hidePast', hidePastFilter.checked);
        applyFilters();
    });

    // Chargement initial des données depuis Supabase
    fetchTournaments();

    async function fetchTournaments() {
        try {
            calendarGrid.innerHTML = "<p style='text-align:center;'>Chargement des tournois...</p>";
            
            const { data, error } = await _supabase
                .from('Tournaments')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;

            allTournaments = data || [];
            
            // Initialise la liste des pays selon la région par défaut et filtre
            updateCountryOptions();
            applyFilters();

        } catch (error) {
            console.error("Erreur lors de la récupération du calendrier :", error.message);
            calendarGrid.innerHTML = `<p style='color:var(--danger-color); text-align:center;'>Impossible de charger les données : ${error.message}</p>`;
        }
    }

    // Dynamise le second filtre (Pays) en fonction de la Région sélectionnée
    function updateCountryOptions() {
        const selectedRegion = regionFilter.value;
        
        if (selectedRegion === 'all') {
            countryFilterContainer.style.display = 'none';
            countryFilter.value = 'all';
            return;
        }

        // On extrait proprement la liste unique des pays présents dans cette région
        const countries = [...new Set(allTournaments
            .filter(t => t.region === selectedRegion && t.country)
            .map(t => t.country)
        )].sort();

        // Reconstruction des options du sélecteur de pays
        countryFilter.innerHTML = '<option value="all">Tous les pays</option>';
        countries.forEach(country => {
            countryFilter.innerHTML += `<option value="${country}">${country}</option>`;
        });

        countryFilterContainer.style.display = countries.length > 0 ? 'flex' : 'none';
        
        // 🔄 Restauration du filtre pays sauvegardé si toujours cohérent avec la région
        const savedCountry = localStorage.getItem('filter_country');
        if (savedCountry && countries.includes(savedCountry)) {
            countryFilter.value = savedCountry;
        } else {
            countryFilter.value = 'all';
        }
    }

    // Algorithme de filtrage et rendu des cartes
    function applyFilters() {
        console.log("Tournois reçus de la BDD :", allTournaments);
        const selectedRegion = regionFilter.value;
        const selectedCountry = countryFilter.value;
        const selectedType = typeFilter.value;
        const shouldHidePast = hidePastFilter.checked;
        const today = new Date().toISOString().split('T')[0];

        // Application des filtres sur le tableau
        const filtered = allTournaments.filter(t => {
            if (selectedRegion !== 'all' && t.region !== selectedRegion) return false;
            if (selectedCountry !== 'all' && t.country !== selectedCountry) return false;
            if (selectedType !== 'all' && t.type !== selectedType) return false;
            if (shouldHidePast && t.date < today) return false;
            return true;
        });

        // Rendu graphique
        if (filtered.length === 0) {
            calendarGrid.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color:var(--text-muted);'>Aucun tournoi ne correspond à vos critères.</p>";
            return;
        }

        calendarGrid.innerHTML = filtered.map(t => {
            // 🧹 Extraction propre du premier jour et de l'année
            const dateParts = (t.date || '').split(' ');
            
            let formattedDate = t.date; // Fallback si la structure est inconnue

            if (dateParts.length >= 3) {
                const month = dateParts[0];
                const day = dateParts[1].split('-')[0];
                const year = dateParts[2];

                // On reconstruit un format standardisé "Month DD, YYYY"
                const standardDate = new Date(`${month} ${day}, ${year}`);
                
                if (!isNaN(standardDate)) {
                    formattedDate = standardDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                }
            }

            return `
                <div class="card">
                    <div>
                        <h3>👥 ${t.organizer || 'Organisateur inconnu'}</h3>
                        <p>📅 <strong>Date :</strong> ${formattedDate}</p>
                        <p>🌍 <strong>Pays :</strong> ${t.country || 'Non spécifié'}</p>
                        <p>🏢 <strong>Ville :</strong> ${t.city || 'Non spécifiée'}</p>
                        <p>📍 <strong>Lieu :</strong> ${t.venue_name || 'Non spécifié'}</p>
                    </div>
                    ${t.link ? `<a href="${t.link}" target="_blank" class="btn">S'inscrire / Détails</a>` : ''}
                </div>
            `;
        }).join('');
    }
}