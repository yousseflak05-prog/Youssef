import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import api, { tokenStore, setUnauthorizedHandler } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  // `chargement` couvre la revalidation du jeton au démarrage : sans lui, un
  // rafraîchissement de page renverrait brièvement vers l'écran de connexion.
  const [chargement, setChargement] = useState(true);

  const deconnexion = useCallback(() => {
    tokenStore.clear();
    setUtilisateur(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUtilisateur(null));
  }, []);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setChargement(false);
      return;
    }

    api
      .get('/auth/me')
      .then(setUtilisateur)
      .catch(() => tokenStore.clear())
      .finally(() => setChargement(false));
  }, []);

  const connexion = useCallback(async (username, password) => {
    const { token, user } = await api.post('/auth/login', { username, password });
    tokenStore.set(token);
    setUtilisateur(user);
    return user;
  }, []);

  const valeur = useMemo(
    () => ({ utilisateur, chargement, connexion, deconnexion, estConnecte: Boolean(utilisateur) }),
    [utilisateur, chargement, connexion, deconnexion]
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexte = useContext(AuthContext);
  if (!contexte) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return contexte;
}
