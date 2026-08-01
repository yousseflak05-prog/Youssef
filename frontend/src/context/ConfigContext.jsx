import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import api from '../lib/api.js';

// Valeurs de repli tant que /api/config n'a pas répondu (et si l'API est
// injoignable) : l'interface affiche des totaux cohérents dès le premier rendu.
const DEFAUT = { currency: 'MAD', tvaRate: 0.2, company: { name: 'Registre' } };

const ConfigContext = createContext(DEFAUT);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAUT);

  useEffect(() => {
    api
      .get('/config')
      .then((valeurs) => setConfig({ ...DEFAUT, ...valeurs }))
      .catch(() => {});
  }, []);

  const valeur = useMemo(() => config, [config]);
  return <ConfigContext.Provider value={valeur}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
