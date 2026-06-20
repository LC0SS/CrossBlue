// js/auth.js

const Auth = {
    // 1. INSCRIPTION CLASSIQUE + CRÉATION DE PROFIL
    signUp: async (email, password, username, region) => {
        try {
            // Création de l'utilisateur dans auth.users
            const { data: authData, error: authError } = await _supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData?.user) {
                // Création du profil lié dans public.profiles
                const { error: profileError } = await _supabase
                    .from('profiles')
                    .insert([
                        {
                            id: authData.user.id, // Même UUID que le compte technique
                            username: username,
                            display_name: username,
                            region: region
                        }
                    ]);

                if (profileError) throw profileError;
                alert("Inscription réussie !");
            }
        } catch (error) {
            console.error("Erreur d'inscription :", error.message);
            alert("Erreur d'inscription : " + error.message);
        }
    },

    // 2. CONNEXION CLASSIQUE
    signIn: async (email, password) => {
        const { error } = await _supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            console.error("Erreur de connexion :", error.message);
            alert("Erreur de connexion : " + error.message);
        }
    },

    // 3. CONNEXION INVITÉ (ANONYME)
    signInAsGuest: async () => {
        const { error } = await _supabase.auth.signInAnonymously();
        if (error) {
            console.error("Erreur mode invité :", error.message);
            alert("Erreur mode invité : " + error.message);
        }
    },

    // 4. DÉCONNEXION
    signOut: async () => {
        const { error } = await _supabase.auth.signOut();
        if (error) console.error("Erreur déconnexion :", error.message);
    }
};