/** En-tête de page : titre, compteur d'éléments et actions à droite. */
export default function PageHeader({ titre, description, compteur, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">{titre}</h1>
          {compteur !== undefined && (
            <span className="tabular rounded-md bg-stone-200/70 px-2 py-0.5 text-xs font-semibold text-stone-600">
              {compteur}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
