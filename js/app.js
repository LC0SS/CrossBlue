// js/app.js

const SUPABASE_URL = "https://cuwgepcdfhyzqvsqkluy.supabase.co";
const SUPABASE_KEY = "sb_publishable_GhxhQFBF23fqxoMTlMCTwg_C5iJ2osF"; // Clé publique OK

// Initialisation globale de Supabase
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const appContainer = document.getElementById('app');

// 🔄 1. LE CHEF D'ORCHESTRE : Écoute l'état de la session (Connecté / Déconnecté)
_supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        const user = session.user;
        
        // Est-ce un utilisateur Anonyme (Invité) ?
        if (user.is_anonymous) {
            initCalendarView("Invité", null);
        } else {
            // C'est un compte enregistré : on va chercher son profil
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
        // Aucun utilisateur : on affiche l'écran de Login
        initLoginView();
    }
});

// 🔓 2. AFFICHAGE DE L'ÉCRAN DE LOGIN / ROUTAGE INTERNE
function initLoginView() {
    appContainer.innerHTML = Components.loginView();
    
    // Événements boutons
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

// 📅 4. CHARGEMENT ET FILTRAGE AUTOMATIQUE DU CALENDRIER
function initCalendarView(displayName, preferredRegion) {
    appContainer.innerHTML = Components.calendarView(displayName);
    
    document.getElementById('btnLogout').addEventListener('click', Auth.signOut);

    // Initialisation de tes filtres d'origine
    const regionFilter = document.getElementById('regionFilter');
    
    // 🎯 APPLICATION DIRECTE DE LA RÉGION DE L'UTILISATEUR
    if (preferredRegion) {
        regionFilter.value = preferredRegion;
    } else {
        regionFilter.value = "all"; // Pas de filtre automatique pour les invités
    }

    // --- REPRENDS ICI TOUTE TA LOGIQUE INITIALE DE FETCH ET DE RENDU DES TOURNOIS ---
    // Tu as juste à recoller tes fonctions fetchTournaments(), updateCountryFilter() 
    // et les addEventListener('change') sur les selects que tu avais codé dans ton ancien app.js
    
    console.log(`Données chargées pour la région : ${regionFilter.value}`);
    // fetchTournaments(); // Lance ta fonction d'affichage
}