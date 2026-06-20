// js/components.js

const Components = {
    // Écran de connexion
    loginView: () => `
        <header>
            <h1>🏴‍☠️ OPTCG Tournament Hub</h1>
            <p class="subtitle">Connectez-vous pour gérer vos tournois</p>
        </header>
        <div class="auth-container">
            <div class="form-group">
                <label for="loginEmail">Adresse Email</label>
                <input type="email" id="loginEmail" placeholder="nom@exemple.com">
            </div>
            <div class="form-group">
                <label for="loginPassword">Mot de passe</label>
                <input type="password" id="loginPassword" placeholder="••••••••">
            </div>
            <button id="btnSubmitLogin" class="btn">Se connecter</button>
            <button id="btnGuestLogin" class="btn btn-secondary">Continuer en tant qu'invité</button>
            
            <div class="auth-links">
                Pas encore de compte ? <a href="#" id="linkToRegister">Créer un compte</a>
            </div>
        </div>
    `,

    // Écran d'inscription
    registerView: () => `
        <header>
            <h1>🏴‍☠️ Rejoindre le Hub</h1>
            <p class="subtitle">Créez votre profil compétitif</p>
        </header>
        <div class="auth-container">
            <div class="form-group">
                <label for="regEmail">Adresse Email</label>
                <input type="email" id="regEmail" placeholder="nom@exemple.com">
            </div>
            <div class="form-group">
                <label for="regPassword">Mot de passe</label>
                <input type="password" id="regPassword" placeholder="••••••••">
            </div>
            <div class="form-group">
                <label for="regUsername">Nom d'utilisateur (@pseudo)</label>
                <input type="text" id="regUsername" placeholder="Luffy34">
            </div>
            <div class="form-group">
                <label for="regRegion">Votre région principale :</label>
                <select id="regRegion">
                    <option value="Europe">Europe</option>
                    <option value="NorthAmerica">North America</option>
                    <option value="Oceania">Oceania</option>
                    <option value="LatinAmerica">Latin America</option>
                </select>
            </div>
            <button id="btnSubmitRegister" class="btn">Créer mon compte</button>
            
            <div class="auth-links">
                Déjà inscrit ? <a href="#" id="linkToLogin">Se connecter</a>
            </div>
        </div>
    `,

    // Écran du calendrier principal (ton ancien HTML de base)
    calendarView: (username) => `
        <header>
            <h1>🏴‍☠️ OPTCG Regional Hub</h1>
            <p class="subtitle">Ravi de vous revoir, <strong>${username}</strong> !</p>
            <button id="btnLogout" class="btn btn-secondary" style="margin: 1rem auto 0 auto; max-width: 150px; padding: 0.4rem;">Déconnexion</button>
        </header>

        <div class="filter-container">
            <label for="regionFilter">Filtrer par Région :</label>
            <select id="regionFilter">
                <option value="all">Toutes les régions</option>
                <option value="NorthAmerica">North America</option>
                <option value="Europe">Europe</option>
                <option value="Oceania">Oceania</option>
                <option value="LatinAmerica">Latin America</option>
            </select>

            <div id="countryFilterContainer" style="display: none; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                <label for="countryFilter">Filtrer par Pays :</label>
                <select id="countryFilter">
                    <option value="all">Tous les pays</option>
                </select>
            </div>

            <label for="typeFilter" style="margin-top: 0.5rem;">Type de Tournoi :</label>
            <select id="typeFilter">
                <option value="all">Tous les types</option>
                <option value="Regional">🏆 Regionals</option>
                <option value="TreasureCup">💰 Treasure Cups</option>
            </select>
        </div>

        <div class="filter-container">
            <label class="checkbox-label" style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="hidePastFilter" checked>
                Masquer les tournois passés
            </label>
        </div>

        <div class="grid" id="calendar"></div>
    `
};