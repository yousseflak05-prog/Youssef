import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import Toasts from '../components/ui/Toasts.jsx';

const ToastContext = createContext(null);

const DUREE = 4000;

export function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const compteur = useRef(0);

  const fermer = useCallback((id) => {
    setMessages((actuels) => actuels.filter((m) => m.id !== id));
  }, []);

  const notifier = useCallback(
    (texte, ton = 'succes') => {
      const id = ++compteur.current;
      setMessages((actuels) => [...actuels, { id, texte, ton }]);
      setTimeout(() => fermer(id), DUREE);
    },
    [fermer]
  );

  const valeur = useMemo(
    () => ({
      succes: (texte) => notifier(texte, 'succes'),
      erreur: (texte) => notifier(texte, 'erreur'),
      info: (texte) => notifier(texte, 'info'),
    }),
    [notifier]
  );

  return (
    <ToastContext.Provider value={valeur}>
      {children}
      <Toasts messages={messages} onFermer={fermer} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexte = useContext(ToastContext);
  if (!contexte) throw new Error('useToast doit être utilisé dans un <ToastProvider>');
  return contexte;
}
