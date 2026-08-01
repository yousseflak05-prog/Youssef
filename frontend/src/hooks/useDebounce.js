import { useEffect, useState } from 'react';

/** Diffère une valeur (saisie de recherche) pour ne pas interroger l'API à chaque frappe. */
export default function useDebounce(valeur, delai = 300) {
  const [differee, setDifferee] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => setDifferee(valeur), delai);
    return () => clearTimeout(minuteur);
  }, [valeur, delai]);

  return differee;
}
