import Spinner from './Spinner.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * Tableau piloté par une description de colonnes :
 *   { cle, titre, align, className, rendu: (ligne) => ReactNode }
 * Gère seul les états chargement / vide / erreur pour que les pages n'aient
 * pas à les réécrire.
 */
export default function Table({
  colonnes,
  donnees,
  cleLigne = (ligne) => ligne.id,
  chargement = false,
  erreur = null,
  vide,
  onLigneClic,
}) {
  if (chargement) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (erreur) {
    return (
      <EmptyState
        ton="erreur"
        titre="Chargement impossible"
        description={erreur}
      />
    );
  }

  if (!donnees?.length) {
    return vide ?? <EmptyState titre="Aucun résultat" description="La liste est vide." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/80">
            {colonnes.map((colonne) => (
              <th
                key={colonne.cle}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500
                            ${colonne.align === 'right' ? 'text-right' : colonne.align === 'center' ? 'text-center' : 'text-left'}
                            ${colonne.classNameEntete ?? ''}`}
              >
                {colonne.titre}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-stone-100">
          {donnees.map((ligne) => (
            <tr
              key={cleLigne(ligne)}
              onClick={onLigneClic ? () => onLigneClic(ligne) : undefined}
              className={`transition-colors hover:bg-stone-50 ${onLigneClic ? 'cursor-pointer' : ''}`}
            >
              {colonnes.map((colonne) => (
                <td
                  key={colonne.cle}
                  className={`px-4 py-3 text-stone-700
                              ${colonne.align === 'right' ? 'text-right' : colonne.align === 'center' ? 'text-center' : ''}
                              ${colonne.className ?? ''}`}
                >
                  {colonne.rendu ? colonne.rendu(ligne) : ligne[colonne.cle]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
