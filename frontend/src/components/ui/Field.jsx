import { useId } from 'react';

/**
 * Habillage commun des champs de formulaire : libellé, message d'erreur et
 * liaison ARIA. `Input`, `Select` et `Textarea` s'appuient dessus.
 */
function Enveloppe({ label, erreur, aide, obligatoire, htmlFor, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {obligatoire && <span className="text-emerald-600 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {erreur ? (
        <p className="mt-1 text-xs text-red-600">{erreur}</p>
      ) : (
        aide && <p className="mt-1 text-xs text-stone-500">{aide}</p>
      )}
    </div>
  );
}

export function Input({ label, erreur, aide, obligatoire, className, mono, ...props }) {
  const id = useId();
  return (
    <Enveloppe
      label={label}
      erreur={erreur}
      aide={aide}
      obligatoire={obligatoire}
      htmlFor={id}
      className={className}
    >
      <input
        id={id}
        aria-invalid={Boolean(erreur)}
        className={`field ${mono ? 'tabular' : ''} ${erreur ? 'field-error' : ''}`}
        {...props}
      />
    </Enveloppe>
  );
}

export function Select({ label, erreur, aide, obligatoire, className, children, ...props }) {
  const id = useId();
  return (
    <Enveloppe
      label={label}
      erreur={erreur}
      aide={aide}
      obligatoire={obligatoire}
      htmlFor={id}
      className={className}
    >
      <select
        id={id}
        aria-invalid={Boolean(erreur)}
        className={`field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2378716c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9 ${erreur ? 'field-error' : ''}`}
        {...props}
      >
        {children}
      </select>
    </Enveloppe>
  );
}

export function Textarea({ label, erreur, aide, obligatoire, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <Enveloppe
      label={label}
      erreur={erreur}
      aide={aide}
      obligatoire={obligatoire}
      htmlFor={id}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(erreur)}
        className={`field resize-y ${erreur ? 'field-error' : ''}`}
        {...props}
      />
    </Enveloppe>
  );
}
