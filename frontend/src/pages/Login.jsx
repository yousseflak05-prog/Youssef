import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';

export default function Login() {
  const { connexion, estConnecte, chargement } = useAuth();
  const naviguer = useNavigate();
  const emplacement = useLocation();

  const [identifiants, setIdentifiants] = useState({ username: '', password: '' });
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  // Déjà connecté : on retourne d'où l'on venait.
  if (!chargement && estConnecte) {
    return <Navigate to={emplacement.state?.from?.pathname ?? '/'} replace />;
  }

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    try {
      await connexion(identifiants.username.trim(), identifiants.password);
      naviguer(emplacement.state?.from?.pathname ?? '/', { replace: true });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  };

  const modifier = (champ) => (e) =>
    setIdentifiants((actuels) => ({ ...actuels, [champ]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 px-4 py-10">
      {/* Halo discret dans le vert de la marque */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(5,150,105,0.18) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-pop">
            <BookOpen size={22} />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Registre</h1>
          <p className="mt-1 text-sm text-stone-400">Gestion commerciale · Connexion</p>
        </div>

        <form onSubmit={soumettre} className="card space-y-4 p-6">
          {erreur && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {erreur}
            </div>
          )}

          <Input
            label="Identifiant"
            name="username"
            autoComplete="username"
            autoFocus
            required
            value={identifiants.username}
            onChange={modifier('username')}
            placeholder="admin"
          />

          <div className="relative">
            <Input
              label="Mot de passe"
              name="password"
              type={motDePasseVisible ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={identifiants.password}
              onChange={modifier('password')}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setMotDePasseVisible((v) => !v)}
              aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-2.5 top-[30px] rounded p-1.5 text-stone-400 transition hover:text-stone-600"
            >
              {motDePasseVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button type="submit" taille="lg" chargement={enCours} className="w-full justify-center">
            Se connecter
          </Button>

          <p className="border-t border-stone-100 pt-4 text-center text-xs text-stone-500">
            Compte de démonstration : <span className="tabular font-semibold">admin</span> /{' '}
            <span className="tabular font-semibold">admin123</span>
          </p>
        </form>
      </div>
    </div>
  );
}
