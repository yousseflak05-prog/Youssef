import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Charge une ressource de l'API et expose { donnees, chargement, erreur, recharger }.
 *
 * `dependances` déclenche un rechargement quand un filtre change ; la réponse
 * d'une requête devenue obsolète (filtre modifié entre-temps) est ignorée pour
 * éviter que l'ancienne écrase la nouvelle.
 */
export default function useFetch(chargeur, dependances = [], { immediat = true } = {}) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(immediat);
  const [erreur, setErreur] = useState(null);

  const chargeurRef = useRef(chargeur);
  chargeurRef.current = chargeur;

  const requeteCourante = useRef(0);

  const recharger = useCallback(async () => {
    const requete = ++requeteCourante.current;
    setChargement(true);
    setErreur(null);

    try {
      const resultat = await chargeurRef.current();
      if (requete === requeteCourante.current) setDonnees(resultat);
      return resultat;
    } catch (e) {
      if (requete === requeteCourante.current) setErreur(e.message ?? 'Erreur inconnue');
      return null;
    } finally {
      if (requete === requeteCourante.current) setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (immediat) recharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);

  return { donnees, chargement, erreur, recharger, setDonnees };
}
