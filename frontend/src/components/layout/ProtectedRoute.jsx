import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../ui/Spinner.jsx';

/**
 * Barrière d'authentification. Tant que le jeton stocké n'a pas été revalidé,
 * on affiche un écran d'attente : rediriger tout de suite renverrait à la
 * connexion un utilisateur en réalité authentifié.
 */
export default function ProtectedRoute({ children }) {
  const { estConnecte, chargement } = useAuth();
  const emplacement = useLocation();

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <Spinner taille={28} />
      </div>
    );
  }

  if (!estConnecte) {
    // `state` permet de revenir sur la page demandée après connexion.
    return <Navigate to="/connexion" replace state={{ from: emplacement }} />;
  }

  return children;
}
